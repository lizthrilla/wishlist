/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { WishlistItemsController } from './wishlist-items.controller';
import { WishlistItemsService } from './wishlist-items.service';

describe('WishlistItemsController', () => {
  let controller: WishlistItemsController;
  const serviceMock = {
    getWishlistItems: jest.fn(),
    deleteWishlistItem: jest.fn(),
  } as unknown as WishlistItemsService;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [WishlistItemsController],
      providers: [{ provide: WishlistItemsService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<WishlistItemsController>(WishlistItemsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates deletion to the service and returns void', async () => {
    serviceMock.deleteWishlistItem = jest.fn().mockResolvedValue(undefined);

    const result = await controller.deleteWishlistItem(42, {
      id: 7,
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(serviceMock.deleteWishlistItem).toHaveBeenCalledWith(42, 7);
    expect(result).toBeUndefined();
  });

  it('passes the authenticated user to wishlist reads', async () => {
    serviceMock.getWishlistItems = jest.fn().mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    await controller.getWishlistItems(
      { id: 7, name: 'Alice', email: 'alice@example.com' },
      1,
      10,
      9,
    );

    expect(serviceMock.getWishlistItems).toHaveBeenCalledWith(7, 1, 10, 9);
  });

  describe('pagination clamping', () => {
    beforeEach(() => {
      serviceMock.getWishlistItems = jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    });

    it('clamps negative page to 1', async () => {
      await controller.getWishlistItems(
        { id: 7, name: 'Alice', email: 'alice@example.com' },
        -5,
        10,
        undefined,
      );
      expect(serviceMock.getWishlistItems).toHaveBeenCalledWith(7, 1, 10, undefined);
    });

    it('clamps zero limit to 1', async () => {
      await controller.getWishlistItems(
        { id: 7, name: 'Alice', email: 'alice@example.com' },
        1,
        0,
        undefined,
      );
      expect(serviceMock.getWishlistItems).toHaveBeenCalledWith(7, 1, 1, undefined);
    });

    it('clamps overlarge limit to 100', async () => {
      await controller.getWishlistItems(
        { id: 7, name: 'Alice', email: 'alice@example.com' },
        1,
        999,
        undefined,
      );
      expect(serviceMock.getWishlistItems).toHaveBeenCalledWith(7, 1, 100, undefined);
    });
  });
});
