import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FamiliesService } from '../families/families.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';

@Injectable()
export class WishlistItemsService {
  constructor(
    private prisma: PrismaService,
    private readonly familiesService: FamiliesService,
  ) {}

  async getWishlistItems(
    currentUserId: number,
    page: number,
    limit: number,
    userId?: number,
  ) {
    // need to include queries here and they are numbers because the controller transformed it
    const skip = (page - 1) * limit;
    // implementing offset Pagination using limit and offset.  Skip maps to offset and takes maps to Limit
    // ORDER BY created_at DESC
    // LIMIT 5
    // OFFSET 10;
    // Page 1 = entries 1 - 5 => limit 5 offset 0
    // Page 2 = 6 - 10 => limit 5 offset 5 (skip first 5)
    if (userId && userId !== currentUserId) {
      await this.familiesService.assertSharedFamily(currentUserId, userId);
    }

    const where: Prisma.WishlistItemWhereInput = userId
      ? { wishlist: { is: { userId } } }
      : {
          OR: [
            { wishlist: { is: { userId: currentUserId } } },
            {
              wishlist: {
                is: {
                  user: {
                    is: {
                      memberships: {
                        some: {
                          family: {
                            memberships: {
                              some: {
                                userId: currentUserId,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        };
    const [data, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          url: true,
          price: true,
          createdAt: true,
          wishlistId: true,
          claim: { select: { claimedByUserId: true } },
          wishlist: {
            select: {
              id: true,
              title: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.wishlistItem.count({ where }),
    ]);
    const flatData = data.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      price: item.price,
      createdAt: item.createdAt,
      wishlistId: item.wishlistId,
      wishlistTitle: item.wishlist.title,
      ownerId: item.wishlist.user.id,
      ownerName: item.wishlist.user.name,
      isClaimed: item.claim !== null,
      isClaimedByMe: item.claim?.claimedByUserId === currentUserId,
    }));
    const totalPages = Math.ceil(total / limit);
    // adding meta data to easily parse the page, limit, total and total pages for later use
    return {
      data: flatData,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateWishlistItem(
    id: number,
    dto: UpdateWishlistItemDto,
    currentUserId: number,
  ) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id },
      select: { id: true, wishlist: { select: { userId: true } } },
    });

    if (!item) {
      throw new NotFoundException(`WishlistItem ${id} not found`);
    }

    if (item.wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only edit items in your own wishlist',
      );
    }

    return this.prisma.wishlistItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.price !== undefined && { price: dto.price }),
      },
      select: {
        id: true,
        name: true,
        url: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        wishlistId: true,
      },
    });
  }

  async claimItem(itemId: number, currentUserId: number) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        wishlist: { select: { userId: true } },
        claim: { select: { id: true, claimedByUserId: true, claimedAt: true } },
      },
    });

    if (!item) throw new NotFoundException(`WishlistItem ${itemId} not found`);

    if (item.wishlist.userId === currentUserId) {
      throw new ForbiddenException('You cannot claim your own wishlist item');
    }

    await this.familiesService.assertSharedFamily(currentUserId, item.wishlist.userId);

    if (item.claim) {
      if (item.claim.claimedByUserId === currentUserId) {
        return { id: item.claim.id, wishlistItemId: itemId, claimedAt: item.claim.claimedAt };
      }
      throw new ConflictException('This item has already been claimed');
    }

    try {
      const claim = await this.prisma.wishlistItemClaim.create({
        data: { wishlistItemId: itemId, claimedByUserId: currentUserId },
        select: { id: true, wishlistItemId: true, claimedAt: true },
      });
      return claim;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Race: another request won the insert — re-fetch to determine correct response
        const existing = await this.prisma.wishlistItemClaim.findUnique({
          where: { wishlistItemId: itemId },
          select: { id: true, wishlistItemId: true, claimedByUserId: true, claimedAt: true },
        });
        if (!existing) throw err;
        if (existing.claimedByUserId === currentUserId) {
          return { id: existing.id, wishlistItemId: itemId, claimedAt: existing.claimedAt };
        }
        throw new ConflictException('This item has already been claimed');
      }
      throw err;
    }
  }

  async unclaimItem(itemId: number, currentUserId: number) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        claim: { select: { id: true, claimedByUserId: true } },
      },
    });

    if (!item) throw new NotFoundException(`WishlistItem ${itemId} not found`);
    if (!item.claim) return;

    if (item.claim.claimedByUserId !== currentUserId) {
      throw new ForbiddenException('You can only unclaim items you have claimed');
    }

    try {
      await this.prisma.wishlistItemClaim.delete({ where: { id: item.claim.id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return; // already deleted by a concurrent request — idempotent
      }
      throw err;
    }
  }

  async deleteWishlistItem(id: number, currentUserId: number) {
    try {
      const item = await this.prisma.wishlistItem.findUnique({
        where: { id },
        select: {
          id: true,
          wishlist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundException(`WishlistItem ${id} not found`);
      }

      if (item.wishlist.userId !== currentUserId) {
        throw new ForbiddenException(
          'You can only delete items from your own wishlist',
        );
      }

      await this.prisma.wishlistItem.delete({ where: { id } });
      return;
    } catch (err: any) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException(`WishlistItem ${id} not found`);
      }

      throw err;
    }
  }
}
