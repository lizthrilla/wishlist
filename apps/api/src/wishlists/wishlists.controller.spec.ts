import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';

describe('WishlistsController', () => {
  let controller: WishlistsController;
  const serviceMock = {
    createWishlistItem: jest.fn(),
  } as unknown as WishlistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [{ provide: WishlistsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<WishlistsController>(WishlistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
