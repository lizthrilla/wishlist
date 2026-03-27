import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) {}

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
