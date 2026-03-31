import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistItemDto } from '../wishlist-items/dto/create-wishlist-item.dto';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
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

  // POST /wishlists/reorder must appear before :wishlistId routes
  @Post('reorder')
  @HttpCode(200)
  reorderWishlists(
    @Body() body: { orderedIds: number[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.reorderWishlists(user.id, body.orderedIds);
  }

  @Get(':wishlistId/share-token')
  getWishlistShareToken(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.getWishlistShareToken(wishlistId, user.id);
  }

  @Get(':wishlistId/items')
  getWishlistItems(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.getWishlistItemsForWishlist(user.id, wishlistId);
  }

  @Post(':wishlistId/items')
  createWishlistItem(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @Body() dto: CreateWishlistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.createWishlistItem(wishlistId, dto, user.id);
  }

  @Patch(':wishlistId')
  updateWishlist(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @Body() dto: UpdateWishlistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.updateWishlist(wishlistId, dto, user.id);
  }

  @Delete(':wishlistId')
  @HttpCode(204)
  deleteWishlist(
    @Param('wishlistId', ParseIntPipe) wishlistId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.deleteWishlist(wishlistId, user.id);
  }
}
