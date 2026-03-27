import { Controller, Get, Param } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';

@Controller('shared')
export class SharedWishlistController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get(':token')
  getSharedWishlist(@Param('token') token: string) {
    return this.wishlistsService.getSharedWishlist(token);
  }
}
