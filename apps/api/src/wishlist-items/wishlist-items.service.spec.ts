/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { FamiliesService } from '../families/families.service';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistItemsService } from './wishlist-items.service';

describe('WishlistItemsService', () => {
  let service: WishlistItemsService;
  const prismaMock = {
    wishlistItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
  const familiesServiceMock = {
    assertSharedFamily: jest.fn(),
  } as unknown as FamiliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistItemsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: FamiliesService, useValue: familiesServiceMock },
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
        claim: null,
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

    const result = await service.getWishlistItems(7, 2, 5);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { wishlist: { is: { userId: 7 } } },
            {
              wishlist: {
                is: {
                  user: {
                    is: {
                      memberships: {
                        some: {
                          family: {
                            memberships: {
                              some: {
                                userId: 7,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      }),
    );
    expect(prismaMock.wishlistItem.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { wishlist: { is: { userId: 7 } } },
          {
            wishlist: {
              is: {
                user: {
                  is: {
                    memberships: {
                      some: {
                        family: {
                          memberships: {
                            some: {
                              userId: 7,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });
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
          isClaimed: false,
          isClaimedByMe: false,
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

    await service.getWishlistItems(7, 1, 5);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 5,
      }),
    );
    const result = await service.getWishlistItems(7, 2, 5);

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
    familiesServiceMock.assertSharedFamily = jest
      .fn()
      .mockResolvedValue(undefined);

    await service.getWishlistItems(7, 1, 10, 42);

    expect(familiesServiceMock.assertSharedFamily).toHaveBeenCalledWith(7, 42);
    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { wishlist: { is: { userId: 42 } } },
        skip: 0,
        take: 10,
      }),
    );
    expect(prismaMock.wishlistItem.count).toHaveBeenCalledWith({
      where: { wishlist: { is: { userId: 42 } } },
    });
  });

  it('limits general results to the current user and shared-family members', async () => {
    prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue([]);
    prismaMock.wishlistItem.count = jest.fn().mockResolvedValue(0);

    await service.getWishlistItems(7, 1, 10);

    expect(prismaMock.wishlistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { wishlist: { is: { userId: 7 } } },
            {
              wishlist: {
                is: {
                  user: {
                    is: {
                      memberships: {
                        some: {
                          family: {
                            memberships: {
                              some: {
                                userId: 7,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    );
  });

  it('does not require a shared family check for the current user', async () => {
    prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue([]);
    prismaMock.wishlistItem.count = jest.fn().mockResolvedValue(0);

    await service.getWishlistItems(7, 1, 10, 7);

    expect(familiesServiceMock.assertSharedFamily).not.toHaveBeenCalled();
  });

  it('surfaces shared-family authorization failures', async () => {
    familiesServiceMock.assertSharedFamily = jest
      .fn()
      .mockRejectedValue(
        new ForbiddenException(
          'You can only view wishlists for members of your families',
        ),
      );

    await expect(service.getWishlistItems(1, 1, 10, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes a wishlist item successfully', async () => {
    prismaMock.wishlistItem.delete = jest.fn().mockResolvedValue(undefined);

    prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
      id: 5,
      wishlist: { userId: 7 },
    });

    await expect(service.deleteWishlistItem(5, 7)).resolves.toBeUndefined();

    expect(prismaMock.wishlistItem.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true, wishlist: { select: { userId: true } } },
    });
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
    prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
      id: 999,
      wishlist: { userId: 7 },
    });
    prismaMock.wishlistItem.delete = jest.fn().mockRejectedValue(prismaError);

    await expect(service.deleteWishlistItem(999, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
