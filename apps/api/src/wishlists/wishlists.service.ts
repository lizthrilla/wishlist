import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FamiliesService } from '../families/families.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

const WISHLIST_SUMMARY_SELECT = {
  id: true,
  title: true,
  userId: true,
  isArchived: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { items: true } },
} as const;

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
      select: WISHLIST_SUMMARY_SELECT,
    });
    return { ...wishlist, itemCount: wishlist._count.items };
  }

  async listMyWishlists(currentUserId: number) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId: currentUserId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: WISHLIST_SUMMARY_SELECT,
    });
    return wishlists.map((w) => ({ ...w, itemCount: w._count.items }));
  }

  async listUserWishlists(currentUserId: number, targetUserId: number) {
    await this.familiesService.assertSharedFamily(currentUserId, targetUserId);
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId: targetUserId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: WISHLIST_SUMMARY_SELECT,
    });
    return wishlists.map((w) => ({ ...w, itemCount: w._count.items }));
  }

  async getWishlistItemsForWishlist(currentUserId: number, wishlistId: number) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: {
        id: true,
        title: true,
        userId: true,
        user: { select: { name: true } },
      },
    });

    if (!wishlist)
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);

    await this.familiesService.assertSharedFamily(
      currentUserId,
      wishlist.userId,
    );

    const items = await this.prisma.wishlistItem.findMany({
      where: { wishlistId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...ITEM_FIELDS_SELECT,
        claim: { select: { claimedByUserId: true } },
      },
    });

    return items.map((item) => ({
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
    if (!wishlist)
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only get the share link for your own wishlists',
      );
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
            ...ITEM_FIELDS_SELECT,
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
        note: item.note,
        priority: item.priority,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        category: item.category,
        store: item.store,
        variant: item.variant,
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
      select: { id: true, userId: true },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    }

    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only add items to your own wishlist',
      );
    }

    const created = await this.prisma.wishlistItem.create({
      data: {
        name: dto.name.trim(),
        url: dto.url,
        price: dto.price,
        note: dto.note,
        priority: dto.priority,
        quantity: dto.quantity ?? 1,
        imageUrl: dto.imageUrl,
        category: dto.category,
        store: dto.store,
        variant: dto.variant,
        wishlistId,
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
      id: created.id,
      name: created.name,
      url: created.url,
      price: created.price,
      note: created.note,
      priority: created.priority,
      quantity: created.quantity,
      imageUrl: created.imageUrl,
      category: created.category,
      store: created.store,
      variant: created.variant,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      wishlistId: created.wishlistId,
      wishlistTitle: created.wishlist.title,
      ownerId: created.wishlist.userId,
      ownerName: created.wishlist.user.name,
    };
  }

  async deleteWishlist(
    wishlistId: number,
    currentUserId: number,
  ): Promise<void> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: { userId: true },
    });
    if (!wishlist)
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own wishlists');
    }
    await this.prisma.wishlist.delete({ where: { id: wishlistId } });
  }

  async updateWishlist(
    wishlistId: number,
    dto: UpdateWishlistDto,
    currentUserId: number,
  ) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: { userId: true },
    });
    if (!wishlist)
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    if (wishlist.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own wishlists');
    }

    const updated = await this.prisma.wishlist.update({
      where: { id: wishlistId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      select: WISHLIST_SUMMARY_SELECT,
    });
    return { ...updated, itemCount: updated._count.items };
  }

  async reorderWishlists(
    currentUserId: number,
    orderedIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.wishlist.updateMany({
          where: { id, userId: currentUserId },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
