import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedWishlistController } from './shared-wishlist.controller';
import { WishlistsService } from './wishlists.service';

describe('SharedWishlistController', () => {
  let controller: SharedWishlistController;
  const serviceMock = {
    getSharedWishlist: jest.fn(),
  } as unknown as WishlistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedWishlistController],
      providers: [{ provide: WishlistsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SharedWishlistController>(SharedWishlistController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to WishlistsService.getSharedWishlist and returns the result', async () => {
    const response = {
      title: 'Birthday',
      ownerName: 'Alice',
      items: [{ id: 1, name: 'Book', url: null, price: null, isClaimed: false }],
    };
    (serviceMock.getSharedWishlist as jest.Mock).mockResolvedValue(response);

    const result = await controller.getSharedWishlist('abc-token');

    expect(serviceMock.getSharedWishlist).toHaveBeenCalledWith('abc-token');
    expect(result).toEqual(response);
  });

  it('propagates NotFoundException from the service for unknown tokens', async () => {
    (serviceMock.getSharedWishlist as jest.Mock).mockRejectedValue(
      new NotFoundException('Wishlist not found'),
    );

    await expect(controller.getSharedWishlist('bad-token')).rejects.toBeInstanceOf(NotFoundException);
  });
});
