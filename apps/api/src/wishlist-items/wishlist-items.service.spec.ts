/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistItemsService } from './wishlist-items.service';

describe('WishlistItemsService', () => {
  let service: WishlistItemsService;
  const prismaMock = {
    wishlistItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistItemsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WishlistItemsService>(WishlistItemsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns flattened wishlist items with pagination meta', async () => {
    const sampleItems = [
      {
        id: 1,
        name: 'Camera',
        url: 'https://example.com',
        price: 299,
        createdAt: new Date('2025-01-01'),
        wishlistId: 3,
        wishlist: {
          id: 3,
          title: 'Travel',
          userId: 7,
          user: { id: 7, name: 'Alice' },
        },
      },
    ];

    prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue(sampleItems);
    prismaMock.wishlistItem.count = jest.fn().mockResolvedValue(12);

    const result = await service.getWishlistItems(2, 5);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      }),
    );
    expect(prismaMock.wishlistItem.count).toHaveBeenCalledWith({ where: {} });
    expect(result).toEqual({
      data: [
        {
          id: 1,
          name: 'Camera',
          url: 'https://example.com',
          price: 299,
          createdAt: new Date('2025-01-01'),
          wishlistId: 3,
          wishlistTitle: 'Travel',
          ownerId: 7,
          ownerName: 'Alice',
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
      },
    });
  });

  it('calculates totalPages with remainder and skips correctly for first page', async () => {
    prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue([]);
    prismaMock.wishlistItem.count = jest.fn().mockResolvedValue(7);

    await service.getWishlistItems(1, 5);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 5,
      }),
    );
    const result = await service.getWishlistItems(2, 5);

    expect(result.meta.totalPages).toBe(2); // 7 items with limit 5 => ceil(7/5)=2
    expect(prismaMock.wishlistItem.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    );
  });

  it('filters results by userId when provided', async () => {
    prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue([]);
    prismaMock.wishlistItem.count = jest.fn().mockResolvedValue(0);

    await service.getWishlistItems(1, 10, 42);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { wishlist: { userId: 42 } },
        skip: 0,
        take: 10,
      }),
    );
    expect(prismaMock.wishlistItem.count).toHaveBeenCalledWith({
      where: { wishlist: { userId: 42 } },
    });
  });

  it('deletes a wishlist item successfully', async () => {
    prismaMock.wishlistItem.delete = jest.fn().mockResolvedValue(undefined);

    await expect(service.deleteWishlistItem(5)).resolves.toBeUndefined();

    expect(prismaMock.wishlistItem.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
  });

  it('throws NotFoundException when deleting a non-existent item', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
      meta: {},
    });
    prismaMock.wishlistItem.delete = jest.fn().mockRejectedValue(prismaError);

    await expect(service.deleteWishlistItem(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
