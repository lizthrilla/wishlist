import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) {}
  async createWishlistItem(wishlistId: number, dto: CreateWishlistItemDto) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
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
