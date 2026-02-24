import { Test, TestingModule } from '@nestjs/testing';
import { WishlistItemsService } from './wishlist-items.service';

describe('WishlistItemsService', () => {
  let service: WishlistItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistItemsService],
    }).compile();

    service = module.get<WishlistItemsService>(WishlistItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
