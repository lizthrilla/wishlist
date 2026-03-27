import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UsersService } from './users.service';
import { WishlistsService } from '../wishlists/wishlists.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly wishlistsService: WishlistsService,
  ) {}

  @Get('search')
  searchUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q: string = '',
  ) {
    return this.usersService.searchUsers(user.id, q);
  }

  @Get(':userId/wishlists')
  listUserWishlists(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wishlistsService.listUserWishlists(user.id, userId);
  }
}
