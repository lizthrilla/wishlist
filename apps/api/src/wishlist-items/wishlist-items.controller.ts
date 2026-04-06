import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { WishlistItemsService } from './wishlist-items.service';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { MoveWishlistItemDto } from './dto/move-wishlist-item.dto';

@Controller('wishlist-items')
@UseGuards(AuthGuard)
export class WishlistItemsController {
  constructor(private readonly wishlistItemsService: WishlistItemsService) {}

  @Get()
  getWishlistItems(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    const pageNum = Math.max(page, 1);
    const limitNum = Math.min(Math.max(limit, 1), 100);
    return this.wishlistItemsService.getWishlistItems(
      user.id,
      pageNum,
      limitNum,
      userId,
    );
  }

  @Patch(':id/move')
  moveWishlistItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveWishlistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistItemsService.moveWishlistItem(id, dto, user.id);
  }

  @Patch(':id')
  updateWishlistItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishlistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistItemsService.updateWishlistItem(id, dto, user.id);
  }

  @Post(':id/claim')
  @HttpCode(200)
  claimItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistItemsService.claimItem(id, user.id);
  }

  @Post(':id/unclaim')
  @HttpCode(204)
  unclaimItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistItemsService.unclaimItem(id, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteWishlistItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistItemsService.deleteWishlistItem(id, user.id);
  }
}
