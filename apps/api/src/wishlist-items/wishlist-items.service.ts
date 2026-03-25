import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FamiliesService } from '../families/families.service';
import { PrismaService } from '../prisma/prisma.service';

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
