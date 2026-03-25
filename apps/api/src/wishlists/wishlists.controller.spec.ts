import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';

describe('WishlistsController', () => {
  let controller: WishlistsController;
  const serviceMock = {
    createWishlistItem: jest.fn(),
  } as unknown as WishlistsService;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [{ provide: WishlistsService, useValue: serviceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<WishlistsController>(WishlistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
