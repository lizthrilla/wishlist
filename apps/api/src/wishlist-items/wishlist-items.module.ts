import { Module } from '@nestjs/common';
import { WishlistItemsController } from './wishlist-items.controller';
import { WishlistItemsService } from './wishlist-items.service';

@Module({
  controllers: [WishlistItemsController],
  providers: [WishlistItemsService]
})
export class WishlistItemsModule {}
