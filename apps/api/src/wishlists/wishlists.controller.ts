import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('wishlists')
@UseGuards(AuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  createWishlist(
    @Body() dto: CreateWishlistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.createWishlist(dto, user.id);
  }

  @Get('mine')
  listMyWishlists(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistsService.listMyWishlists(user.id);
  }

  @Post(':wishlistId/items')
  createWishlistItem(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @Body() dto: CreateWishlistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.createWishlistItem(wishlistId, dto, user.id);
  }
}
