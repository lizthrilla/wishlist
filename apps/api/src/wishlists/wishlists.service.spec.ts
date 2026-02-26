/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistsService } from './wishlists.service';

describe('WishlistsService', () => {
  let service: WishlistsService;
  const prismaMock = {
    wishlist: {
      findUnique: jest.fn(),
    },
    wishlistItem: {
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
    jest.clearAllMocks();
  });

  it('creates a wishlist item when the wishlist exists', async () => {
    prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ id: 1 });
    const createdItem = { id: 10, name: 'Book', wishlistId: 1 };
    prismaMock.wishlistItem.create = jest.fn().mockResolvedValue(createdItem);

    const dto = { name: 'Book', url: 'https://example.com', price: 25 };
    const result = await service.createWishlistItem(1, dto);

    expect(prismaMock.wishlist.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith({
      data: {
        name: 'Book',
        url: 'https://example.com',
        price: 25,
        wishlistId: 1,
      },
      include: { wishlist: { include: { user: true } } },
    });
    expect(result).toEqual(createdItem);
  });

  it('trims the name before creating the item', async () => {
    prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ id: 2 });
    prismaMock.wishlistItem.create = jest.fn().mockResolvedValue({ id: 11 });

    const dto = { name: '   New Shoes   ' };
    await service.createWishlistItem(2, dto);

    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'New Shoes' }),
      }),
    );
  });

  it('throws NotFoundException when wishlist does not exist', async () => {
    prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.createWishlistItem(99, { name: 'Gift' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.wishlistItem.create).not.toHaveBeenCalled();
  });
});
