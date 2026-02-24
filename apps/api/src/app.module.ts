import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WishlistItemsModule } from './wishlist-items/wishlist-items.module';
import { WishlistsModule } from './wishlists/wishlists.module';

@Module({
  imports: [PrismaModule, WishlistItemsModule, WishlistsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
