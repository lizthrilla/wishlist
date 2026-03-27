import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FamiliesService } from '../families/families.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(
    private prisma: PrismaService,
    private readonly familiesService: FamiliesService,
  ) {}

  async createWishlist(dto: CreateWishlistDto, currentUserId: number) {
    const wishlist = await this.prisma.wishlist.create({
      data: {
        title: dto.title,
        userId: currentUserId,
      },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    });
    return { ...wishlist, itemCount: wishlist._count.items };
  }

  async listMyWishlists(currentUserId: number) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    });
    return wishlists.map((w) => ({ ...w, itemCount: w._count.items }));
  }
  async listUserWishlists(currentUserId: number, targetUserId: number) {
    await this.familiesService.assertSharedFamily(currentUserId, targetUserId);
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    });
    return wishlists.map((w) => ({ ...w, itemCount: w._count.items }));
  }

  async getWishlistItemsForWishlist(currentUserId: number, wishlistId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: { id: true, title: true, userId: true, user: { select: { name: true } } },
    });

    if (!wishlist) throw new NotFoundException(`Wishlist ${wishlistId} not found`);

    await this.familiesService.assertSharedFamily(currentUserId, wishlist.userId);

    const items = await this.prisma.wishlistItem.findMany({
      where: { wishlistId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        price: true,
        createdAt: true,
        wishlistId: true,
        claim: { select: { claimedByUserId: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      price: item.price,
      createdAt: item.createdAt,
      wishlistId: item.wishlistId,
      wishlistTitle: wishlist.title,
      ownerId: wishlist.userId,
      ownerName: wishlist.user.name,
      isClaimed: item.claim !== null,
      isClaimedByMe: item.claim?.claimedByUserId === currentUserId,
    }));
  }

  async getWishlistShareToken(wishlistId: number, currentUserId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: { shareToken: true, userId: true },
    });
    if (!wishlist) throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException('You can only get the share link for your own wishlists');
    }
    return { shareToken: wishlist.shareToken };
  }

  async getSharedWishlist(token: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { shareToken: token },
      select: {
        title: true,
        user: { select: { name: true } },
        items: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            url: true,
            price: true,
            claim: { select: { id: true } },
          },
        },
      },
    });

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return {
      title: wishlist.title,
      ownerName: wishlist.user.name,
      items: wishlist.items.map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        price: item.price,
        isClaimed: item.claim !== null,
      })),
    };
  }

  async createWishlistItem(
    wishlistId: number,
    dto: CreateWishlistItemDto,
    currentUserId: number,
  ) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    }

    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only add items to your own wishlist',
      );
    }

    return this.prisma.wishlistItem.create({
      data: {
        name: dto.name.trim(),
        url: dto.url,
        price: dto.price,
        wishlistId,
      },
      include: {
        wishlist: {
          include: { user: true },
        },
      },
    });
  }
}
