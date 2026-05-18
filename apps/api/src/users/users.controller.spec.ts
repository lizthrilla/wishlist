/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuthGuard } from '../auth/auth.guard';
import { WishlistsService } from '../wishlists/wishlists.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    searchUsers: jest.fn(),
  } as unknown as UsersService;
  const wishlistsServiceMock = {
    listUserWishlists: jest.fn(),
  } as unknown as WishlistsService;

  const currentUser: AuthenticatedUser = {
    id: 1,
    name: 'Bob',
    email: 'bob@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: WishlistsService, useValue: wishlistsServiceMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchUsers', () => {
    it('delegates to UsersService.searchUsers with user id and query', async () => {
      const users = [{ id: 2, name: 'Alice', email: 'alice@example.com' }];
      (usersServiceMock.searchUsers as jest.Mock).mockResolvedValue(users);

      const result = await controller.searchUsers(currentUser, 'alice');

      expect(usersServiceMock.searchUsers).toHaveBeenCalledWith(1, 'alice');
      expect(result).toEqual(users);
    });

    it('passes empty string when no query provided', async () => {
      (usersServiceMock.searchUsers as jest.Mock).mockResolvedValue([]);

      await controller.searchUsers(currentUser, '');

      expect(usersServiceMock.searchUsers).toHaveBeenCalledWith(1, '');
    });
  });

  describe('listUserWishlists', () => {
    it('delegates to WishlistsService.listUserWishlists with correct ids', async () => {
      const wishlists = [{ id: 10, title: "Alice's Wishlist", itemCount: 3 }];
      (wishlistsServiceMock.listUserWishlists as jest.Mock).mockResolvedValue(
        wishlists,
      );

      const result = await controller.listUserWishlists(2, currentUser);

      expect(wishlistsServiceMock.listUserWishlists).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(wishlists);
    });

    it('propagates ForbiddenException when target user is not in same family', async () => {
      (wishlistsServiceMock.listUserWishlists as jest.Mock).mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(controller.listUserWishlists(99, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
