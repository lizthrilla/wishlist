/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FamiliesService } from '../families/families.service';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistsService } from './wishlists.service';

describe('WishlistsService', () => {
  let service: WishlistsService;
  const prismaMock = {
    wishlist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    wishlistItem: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const familiesServiceMock = {
    assertSharedFamily: jest.fn(),
  } as unknown as FamiliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: FamiliesService, useValue: familiesServiceMock },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
    jest.clearAllMocks();
  });

  it('creates a wishlist item when the wishlist exists', async () => {
    prismaMock.wishlist.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 1, userId: 3 });
    const createdItem = { id: 10, name: 'Book', wishlistId: 1 };
    prismaMock.wishlistItem.create = jest.fn().mockResolvedValue(createdItem);

    const dto = { name: 'Book', url: 'https://example.com', price: 25 };
    const result = await service.createWishlistItem(1, dto, 3);

    expect(prismaMock.wishlist.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, userId: true },
    });
    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Book',
          url: 'https://example.com',
          price: 25,
          wishlistId: 1,
        }),
      }),
    );
    expect(result).toEqual(createdItem);
  });

  it('trims the name before creating the item', async () => {
    prismaMock.wishlist.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 2, userId: 8 });
    prismaMock.wishlistItem.create = jest.fn().mockResolvedValue({ id: 11 });

    const dto = { name: '   New Shoes   ' };
    await service.createWishlistItem(2, dto, 8);

    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'New Shoes' }),
      }),
    );
  });

  it('throws NotFoundException when wishlist does not exist', async () => {
    prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.createWishlistItem(99, { name: 'Gift' }, 3),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.wishlistItem.create).not.toHaveBeenCalled();
  });

  describe('getWishlistShareToken', () => {
    it('returns shareToken for the wishlist owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ shareToken: 'abc-uuid', userId: 3 });

      const result = await service.getWishlistShareToken(1, 3);

      expect(result).toEqual({ shareToken: 'abc-uuid' });
      expect(prismaMock.wishlist.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { shareToken: true, userId: true },
      });
    });

    it('throws NotFoundException for an unknown wishlist', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getWishlistShareToken(999, 3)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when caller is not the owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ shareToken: 'abc-uuid', userId: 5 });

      await expect(service.getWishlistShareToken(1, 3)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getSharedWishlist', () => {
    it('returns title, ownerName, and items with isClaimed only', async () => {
      const baseItem = { note: null, priority: null, quantity: 1, imageUrl: null, category: null, store: null, variant: null };
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({
        title: 'Birthday',
        user: { name: 'Alice' },
        items: [
          { id: 1, name: 'Book', url: 'https://example.com', price: 20, ...baseItem, claim: null },
          { id: 2, name: 'Shoes', url: null, price: null, ...baseItem, claim: { id: 5 } },
        ],
      });

      const result = await service.getSharedWishlist('some-token');

      expect(result).toEqual({
        title: 'Birthday',
        ownerName: 'Alice',
        items: [
          { id: 1, name: 'Book', url: 'https://example.com', price: 20, ...baseItem, isClaimed: false },
          { id: 2, name: 'Shoes', url: null, price: null, ...baseItem, isClaimed: true },
        ],
      });
      expect(prismaMock.wishlist.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'some-token' },
        select: expect.objectContaining({ title: true, user: expect.anything(), items: expect.anything() }),
      });
    });

    it('does not expose claimedByUserId in the response', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({
        title: 'My List',
        user: { name: 'Bob' },
        items: [{ id: 1, name: 'Camera', url: null, price: 300, claim: { id: 9 } }],
      });

      const result = await service.getSharedWishlist('abc');

      result.items.forEach((item) => expect(item).not.toHaveProperty('claimedByUserId'));
    });

    it('throws NotFoundException for an unknown token', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getSharedWishlist('bad-token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns an empty items array when the wishlist has no items', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({
        title: 'Empty List',
        user: { name: 'Carol' },
        items: [],
      });

      const result = await service.getSharedWishlist('token');

      expect(result.items).toEqual([]);
    });
  });

  describe('getWishlistItemsForWishlist', () => {
    const createdAt = new Date('2025-05-01');
    const wishlist = {
      id: 3,
      title: 'Birthday',
      userId: 5,
      user: { name: 'Alice' },
    };
    const extraFields = { note: null, priority: null, quantity: 1, imageUrl: null, category: null, store: null, variant: null };

    it('returns items mapped with isClaimed and isClaimedByMe, without claimedByUserId', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(wishlist);
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockResolvedValue(undefined);
      prismaMock.wishlistItem.findMany = jest.fn().mockResolvedValue([
        { id: 1, name: 'Shoes', url: null, price: 50, ...extraFields, createdAt, wishlistId: 3, claim: null },
        { id: 2, name: 'Bag', url: null, price: 80, ...extraFields, createdAt, wishlistId: 3, claim: { claimedByUserId: 7 } },
        { id: 3, name: 'Hat', url: null, price: 30, ...extraFields, createdAt, wishlistId: 3, claim: { claimedByUserId: 99 } },
      ]);

      const result = await service.getWishlistItemsForWishlist(7, 3);

      expect(result).toEqual([
        { id: 1, name: 'Shoes', url: null, price: 50, ...extraFields, createdAt, wishlistId: 3, wishlistTitle: 'Birthday', ownerId: 5, ownerName: 'Alice', isClaimed: false, isClaimedByMe: false },
        { id: 2, name: 'Bag', url: null, price: 80, ...extraFields, createdAt, wishlistId: 3, wishlistTitle: 'Birthday', ownerId: 5, ownerName: 'Alice', isClaimed: true, isClaimedByMe: true },
        { id: 3, name: 'Hat', url: null, price: 30, ...extraFields, createdAt, wishlistId: 3, wishlistTitle: 'Birthday', ownerId: 5, ownerName: 'Alice', isClaimed: true, isClaimedByMe: false },
      ]);
      result.forEach((item) => expect(item).not.toHaveProperty('claimedByUserId'));
    });

    it('throws NotFoundException when wishlist does not exist', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getWishlistItemsForWishlist(7, 999)).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.wishlistItem.findMany).not.toHaveBeenCalled();
    });

    it('propagates ForbiddenException from assertSharedFamily', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(wishlist);
      (familiesServiceMock.assertSharedFamily as jest.Mock).mockRejectedValue(
        new ForbiddenException('No shared family'),
      );

      await expect(service.getWishlistItemsForWishlist(7, 3)).rejects.toBeInstanceOf(ForbiddenException);

      expect(prismaMock.wishlistItem.findMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteWishlist', () => {
    it('deletes the wishlist when the caller is the owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ userId: 3 });
      prismaMock.wishlist.delete = jest.fn().mockResolvedValue({});

      await service.deleteWishlist(1, 3);

      expect(prismaMock.wishlist.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws NotFoundException when wishlist does not exist', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteWishlist(999, 3)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.wishlist.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when caller is not the owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ userId: 5 });

      await expect(service.deleteWishlist(1, 3)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prismaMock.wishlist.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateWishlist', () => {
    it('renames the wishlist when caller is the owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ userId: 3 });
      prismaMock.wishlist.update = jest.fn().mockResolvedValue({
        id: 1, title: 'Renamed', userId: 3, isArchived: false, sortOrder: null,
        createdAt: new Date(), updatedAt: new Date(), _count: { items: 2 },
      });

      const result = await service.updateWishlist(1, { title: 'Renamed' }, 3);

      expect(prismaMock.wishlist.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: 'Renamed' }) }),
      );
      expect(result.itemCount).toBe(2);
    });

    it('throws NotFoundException when wishlist does not exist', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateWishlist(999, { title: 'X' }, 3)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when caller is not the owner', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ userId: 5 });

      await expect(service.updateWishlist(1, { title: 'X' }, 3)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('archives the wishlist', async () => {
      prismaMock.wishlist.findUnique = jest.fn().mockResolvedValue({ userId: 3 });
      prismaMock.wishlist.update = jest.fn().mockResolvedValue({
        id: 1, title: 'My List', userId: 3, isArchived: true, sortOrder: null,
        createdAt: new Date(), updatedAt: new Date(), _count: { items: 0 },
      });

      const result = await service.updateWishlist(1, { isArchived: true }, 3);

      expect(prismaMock.wishlist.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isArchived: true }) }),
      );
      expect(result.isArchived).toBe(true);
    });
  });

  describe('reorderWishlists', () => {
    it('calls $transaction with updateMany for each id in order', async () => {
      prismaMock.wishlist.updateMany = jest.fn().mockReturnValue({});
      (prismaMock.$transaction as jest.Mock).mockResolvedValue([]);

      await service.reorderWishlists(3, [10, 20, 30]);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.wishlist.updateMany).toHaveBeenCalledTimes(3);
      expect(prismaMock.wishlist.updateMany).toHaveBeenCalledWith({ where: { id: 10, userId: 3 }, data: { sortOrder: 0 } });
      expect(prismaMock.wishlist.updateMany).toHaveBeenCalledWith({ where: { id: 20, userId: 3 }, data: { sortOrder: 1 } });
      expect(prismaMock.wishlist.updateMany).toHaveBeenCalledWith({ where: { id: 30, userId: 3 }, data: { sortOrder: 2 } });
    });
  });
});
