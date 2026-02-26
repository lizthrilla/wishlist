/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WishlistItemsController } from './wishlist-items.controller';
import { WishlistItemsService } from './wishlist-items.service';

describe('WishlistItemsController', () => {
  let controller: WishlistItemsController;
  const serviceMock = {
    getWishlistItems: jest.fn(),
    deleteWishlistItem: jest.fn(),
  } as unknown as WishlistItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistItemsController],
      providers: [{ provide: WishlistItemsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<WishlistItemsController>(WishlistItemsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates deletion to the service and returns void', async () => {
    serviceMock.deleteWishlistItem = jest.fn().mockResolvedValue(undefined);

    const result = await controller.deleteWishlistItem(42);

    expect(serviceMock.deleteWishlistItem).toHaveBeenCalledWith(42);
    expect(result).toBeUndefined();
  });
});
