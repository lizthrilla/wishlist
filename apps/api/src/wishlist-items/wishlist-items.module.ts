import { Module } from '@nestjs/common';
import { FamiliesModule } from '../families/families.module';
import { WishlistItemsController } from './wishlist-items.controller';
import { WishlistItemsService } from './wishlist-items.service';

@Module({
  imports: [FamiliesModule],
  controllers: [WishlistItemsController],
  providers: [WishlistItemsService],
})
export class WishlistItemsModule {}
