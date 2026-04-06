/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
      update: jest.fn(),
      delete: jest.fn(),
    },
    wishlistItemClaim: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    wishlist: {
      findUnique: jest.fn(),
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

  describe('updateWishlistItem', () => {
    it('returns a flat response with wishlist owner info', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        wishlist: { userId: 7 },
      });
      prismaMock.wishlistItem.update = jest.fn().mockResolvedValue({
        id: 1,
        name: 'Updated Book',
        url: null,
        price: 20,
        note: null,
        priority: null,
        quantity: 1,
        imageUrl: null,
        category: null,
        store: null,
        variant: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-06-01'),
        wishlistId: 3,
        wishlist: { title: 'Reading List', userId: 7, user: { name: 'Alice' } },
      });

      const result = await service.updateWishlistItem(
        1,
        { name: 'Updated Book', price: 20 },
        7,
      );

      expect(result).toMatchObject({
        id: 1,
        name: 'Updated Book',
        wishlistId: 3,
        wishlistTitle: 'Reading List',
        ownerId: 7,
        ownerName: 'Alice',
      });
      expect(result).not.toHaveProperty('wishlist');
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateWishlistItem(999, { name: 'X' }, 7),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.wishlistItem.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user does not own the item', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        wishlist: { userId: 99 },
      });

      await expect(
        service.updateWishlistItem(1, { name: 'X' }, 7),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.wishlistItem.update).not.toHaveBeenCalled();
    });
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
    prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.deleteWishlistItem(999, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.wishlistItem.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException on concurrent-delete race (P2025 from delete)', async () => {
    prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
      id: 5,
      wishlist: { userId: 7 },
    });
    const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
      meta: {},
    });
    prismaMock.wishlistItem.delete = jest.fn().mockRejectedValue(p2025);

    await expect(service.deleteWishlistItem(5, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('claimItem', () => {
    const claimedAt = new Date('2025-06-01');

    it('creates a claim and returns id, wishlistItemId, claimedAt without claimedByUserId', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: null,
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(
        undefined,
      );
      (prismaMock.wishlistItemClaim.create as jest.Mock).mockResolvedValue({
        id: 1,
        wishlistItemId: 10,
        claimedAt,
      });

      const result = await service.claimItem(10, 7);

      expect(result).toEqual({ id: 1, wishlistItemId: 10, claimedAt });
      expect(result).not.toHaveProperty('claimedByUserId');
      expect(prismaMock.wishlistItemClaim.create).toHaveBeenCalledWith({
        data: { wishlistItemId: 10, claimedByUserId: 7 },
        select: { id: true, wishlistItemId: true, claimedAt: true },
      });
    });

    it('returns existing claim idempotently when already claimed by current user', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: { id: 1, claimedByUserId: 7, claimedAt },
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.claimItem(10, 7);

      expect(result).toEqual({ id: 1, wishlistItemId: 10, claimedAt });
      expect(prismaMock.wishlistItemClaim.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when item is already claimed by a different user', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: { id: 1, claimedByUserId: 99, claimedAt },
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(
        undefined,
      );

      await expect(service.claimItem(10, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws ForbiddenException when item belongs to current user', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 7 },
        claim: null,
      });

      await expect(service.claimItem(10, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(familiesServiceMock.assertSharedFamily).not.toHaveBeenCalled();
    });

    it('propagates ForbiddenException from assertSharedFamily', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: null,
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockRejectedValue(
        new ForbiddenException('No shared family'),
      );

      await expect(service.claimItem(10, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prismaMock.wishlistItemClaim.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.claimItem(999, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('handles concurrent claim race (P2002): returns existing claim if same user won the race', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: null,
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(
        undefined,
      );
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: 'test',
          meta: {},
        },
      );
      (prismaMock.wishlistItemClaim.create as jest.Mock).mockRejectedValue(
        p2002,
      );
      (prismaMock.wishlistItemClaim.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        wishlistItemId: 10,
        claimedByUserId: 7,
        claimedAt,
      });

      const result = await service.claimItem(10, 7);

      expect(result).toEqual({ id: 1, wishlistItemId: 10, claimedAt });
    });

    it('handles concurrent claim race (P2002): throws ConflictException if different user won the race', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        wishlist: { userId: 5 },
        claim: null,
      });
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(
        undefined,
      );
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: 'test',
          meta: {},
        },
      );
      (prismaMock.wishlistItemClaim.create as jest.Mock).mockRejectedValue(
        p2002,
      );
      (prismaMock.wishlistItemClaim.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        wishlistItemId: 10,
        claimedByUserId: 99,
        claimedAt,
      });

      await expect(service.claimItem(10, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('unclaimItem', () => {
    it('deletes the claim and returns void', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        claim: { id: 1, claimedByUserId: 7 },
      });
      (prismaMock.wishlistItemClaim.delete as jest.Mock).mockResolvedValue(
        undefined,
      );

      await expect(service.unclaimItem(10, 7)).resolves.toBeUndefined();

      expect(prismaMock.wishlistItemClaim.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('returns void without calling delete when no claim exists', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        claim: null,
      });

      await expect(service.unclaimItem(10, 7)).resolves.toBeUndefined();

      expect(prismaMock.wishlistItemClaim.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when claim belongs to a different user', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        claim: { id: 1, claimedByUserId: 99 },
      });

      await expect(service.unclaimItem(10, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(prismaMock.wishlistItemClaim.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.unclaimItem(999, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('handles concurrent unclaim race (P2025): returns void idempotently', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 10,
        claim: { id: 1, claimedByUserId: 7 },
      });
      const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: 'test',
        meta: {},
      });
      (prismaMock.wishlistItemClaim.delete as jest.Mock).mockRejectedValue(
        p2025,
      );

      await expect(service.unclaimItem(10, 7)).resolves.toBeUndefined();
    });
  });

  describe('moveWishlistItem', () => {
    it('moves item to destination wishlist when caller owns both', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue({
        id: 5,
        wishlist: { userId: 3 },
      });
      prismaMock.wishlist.findUnique = jest
        .fn()
        .mockResolvedValue({ userId: 3 });
      prismaMock.wishlistItem.update = jest
        .fn()
        .mockResolvedValue({ id: 5, wishlistId: 9 });

      await service.moveWishlistItem(5, { wishlistId: 9 }, 3);

      expect(prismaMock.wishlistItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 5 }, data: { wishlistId: 9 } }),
      );
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaMock.wishlistItem.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.moveWishlistItem(999, { wishlistId: 9 }, 3),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when caller does not own the item', async () => {
      prismaMock.wishlistItem.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 5, wishlist: { userId: 5 } });

      await expect(
        service.moveWishlistItem(5, { wishlistId: 9 }, 3),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when destination wishlist does not exist', async () => {
      prismaMock.wishlistItem.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 5, wishlist: { userId: 3 } });
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.moveWishlistItem(5, { wishlistId: 99 }, 3),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when destination wishlist belongs to another user', async () => {
      prismaMock.wishlistItem.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 5, wishlist: { userId: 3 } });
      prismaMock.wishlist.findUnique = jest
        .fn()
        .mockResolvedValue({ userId: 7 });

      await expect(
        service.moveWishlistItem(5, { wishlistId: 9 }, 3),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
