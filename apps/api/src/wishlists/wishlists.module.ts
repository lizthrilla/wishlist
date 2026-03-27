import { Module } from '@nestjs/common';
import { FamiliesModule } from '../families/families.module';
import { SharedWishlistController } from './shared-wishlist.controller';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';

@Module({
  imports: [FamiliesModule],
  controllers: [WishlistsController, SharedWishlistController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
