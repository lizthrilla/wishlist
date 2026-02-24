import { Body, Controller, Post, Param, ParseIntPipe } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistItemDto } from 'src/wishlist-items/dto/create-wishlist-item.dto';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}
  @Post(':wishlistId/items')
  createWishlistItem(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @Body() dto: CreateWishlistItemDto,
  ) {
    return this.wishlistsService.createWishlistItem(wishlistId, dto);
  }
}
