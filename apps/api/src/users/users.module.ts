import { Module } from '@nestjs/common';
import { WishlistsModule } from '../wishlists/wishlists.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [WishlistsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
