import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { WishlistItemsService } from './wishlist-items.service';

@Controller('wishlist-items')
export class WishlistItemsController {
  constructor(private readonly wishlistItemsService: WishlistItemsService) {}

  /// `api/wishlist-items/` if i put something in @Get it adds that to make it `/api/wishlist-items/wishlist/items
  @Get()
  getWishlistItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    // ?page=2&limit=2 however querys are always strings because it's the url so i need to translate it
    const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    // moved the safety check to these constants and ensured there is no weird behavior
    const limitNum = Math.min(
      Math.max(parseInt(limit ?? '10', 10) || 10, 1),
      100,
    );
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    if (userId !== undefined && Number.isNaN(userIdNum)) {
      throw new BadRequestException('userId must be a number');
    }

    return this.wishlistItemsService.getWishlistItems(
      pageNum,
      limitNum,
      userIdNum,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  deleteWishlistItem(@Param('id', ParseIntPipe) id: number) {
    return this.wishlistItemsService.deleteWishlistItem(id);
  }
}
