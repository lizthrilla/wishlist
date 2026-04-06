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
import { MoveWishlistItemDto } from './dto/move-wishlist-item.dto';

const ITEM_FIELDS_SELECT = {
  id: true,
  name: true,
  url: true,
  price: true,
  note: true,
  priority: true,
  quantity: true,
  imageUrl: true,
  category: true,
  store: true,
  variant: true,
  createdAt: true,
  updatedAt: true,
  wishlistId: true,
} as const;

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
    const skip = (page - 1) * limit;
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
          ...ITEM_FIELDS_SELECT,
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
      note: item.note,
      priority: item.priority,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      category: item.category,
      store: item.store,
      variant: item.variant,
      createdAt: item.createdAt,
      wishlistId: item.wishlistId,
      wishlistTitle: item.wishlist.title,
      ownerId: item.wishlist.user.id,
      ownerName: item.wishlist.user.name,
      isClaimed: item.claim !== null,
      isClaimedByMe: item.claim?.claimedByUserId === currentUserId,
    }));
    const totalPages = Math.ceil(total / limit);
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

    const updated = await this.prisma.wishlistItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.store !== undefined && { store: dto.store }),
        ...(dto.variant !== undefined && { variant: dto.variant }),
      },
      select: {
        ...ITEM_FIELDS_SELECT,
        wishlist: {
          select: {
            title: true,
            userId: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      url: updated.url,
      price: updated.price,
      note: updated.note,
      priority: updated.priority,
      quantity: updated.quantity,
      imageUrl: updated.imageUrl,
      category: updated.category,
      store: updated.store,
      variant: updated.variant,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      wishlistId: updated.wishlistId,
      wishlistTitle: updated.wishlist.title,
      ownerId: updated.wishlist.userId,
      ownerName: updated.wishlist.user.name,
    };
  }

  async moveWishlistItem(
    itemId: number,
    dto: MoveWishlistItemDto,
    currentUserId: number,
  ) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
      select: { id: true, wishlist: { select: { userId: true } } },
    });

    if (!item) throw new NotFoundException(`WishlistItem ${itemId} not found`);
    if (item.wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only move items from your own wishlists',
      );
    }

    const destination = await this.prisma.wishlist.findUnique({
      where: { id: dto.wishlistId },
      select: { userId: true },
    });
    if (!destination)
      throw new NotFoundException('Destination wishlist not found');
    if (destination.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only move items to your own wishlists',
      );
    }

    return this.prisma.wishlistItem.update({
      where: { id: itemId },
      data: { wishlistId: dto.wishlistId },
      select: ITEM_FIELDS_SELECT,
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

    await this.familiesService.assertSharedFamily(
      currentUserId,
      item.wishlist.userId,
    );

    if (item.claim) {
      if (item.claim.claimedByUserId === currentUserId) {
        return {
          id: item.claim.id,
          wishlistItemId: itemId,
          claimedAt: item.claim.claimedAt,
        };
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.wishlistItemClaim.findUnique({
          where: { wishlistItemId: itemId },
          select: {
            id: true,
            wishlistItemId: true,
            claimedByUserId: true,
            claimedAt: true,
          },
        });
        if (!existing) throw err;
        if (existing.claimedByUserId === currentUserId) {
          return {
            id: existing.id,
            wishlistItemId: itemId,
            claimedAt: existing.claimedAt,
          };
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
      throw new ForbiddenException(
        'You can only unclaim items you have claimed',
      );
    }

    try {
      await this.prisma.wishlistItemClaim.delete({
        where: { id: item.claim.id },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        return;
      }
      throw err;
    }
  }

  async deleteWishlistItem(id: number, currentUserId: number) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id },
      select: {
        id: true,
        wishlist: { select: { userId: true } },
      },
    });

    if (!item) throw new NotFoundException(`WishlistItem ${id} not found`);

    if (item.wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only delete items from your own wishlist',
      );
    }

    await this.prisma.wishlistItem.delete({ where: { id } });
  }
}
