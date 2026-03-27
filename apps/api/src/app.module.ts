import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FamiliesModule } from './families/families.module';
import { PrismaModule } from './prisma/prisma.module';
import { WishlistItemsModule } from './wishlist-items/wishlist-items.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FamiliesModule,
    WishlistItemsModule,
    WishlistsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
