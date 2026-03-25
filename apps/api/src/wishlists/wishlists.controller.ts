import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('wishlists')
@UseGuards(AuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}
  @Post(':wishlistId/items')
  createWishlistItem(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @Body() dto: CreateWishlistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.createWishlistItem(wishlistId, dto, user.id);
  }
}
