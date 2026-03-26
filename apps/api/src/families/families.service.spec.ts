/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FamiliesService } from './families.service';

describe('FamiliesService', () => {
  let service: FamiliesService;
  const prismaMock = {
    family: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    familyInvite: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    familyMembership: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<FamiliesService>(FamiliesService);
    jest.clearAllMocks();
  });

  it('creates a family and adds the creator as an admin', async () => {
    prismaMock.family.findUnique = jest.fn().mockResolvedValue(null);
    prismaMock.family.create = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Smith Family',
      joinCode: 'ABCD1234',
      creatorId: 7,
      createdAt: new Date('2026-03-25T10:00:00.000Z'),
      updatedAt: new Date('2026-03-25T10:00:00.000Z'),
      memberships: [
        {
          userId: 7,
          role: 'admin',
          user: {
            id: 7,
            name: 'Alice',
            email: 'alice@example.com',
          },
        },
      ],
    });

    const result = await service.createFamily(7, { name: 'Smith Family' });

    expect(prismaMock.family.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: 7,
          memberships: {
            create: {
              userId: 7,
              role: 'admin',
            },
          },
        }),
      }),
    );
    expect(result.currentUserRole).toBe('admin');
  });

  it('returns the caller role in family summaries', async () => {
    prismaMock.familyMembership.findMany = jest.fn().mockResolvedValue([
      {
        family: {
          id: 1,
          name: 'Smith Family',
          joinCode: 'ABCD1234',
          creatorId: 7,
          createdAt: new Date('2026-03-25T10:00:00.000Z'),
          updatedAt: new Date('2026-03-25T10:00:00.000Z'),
          memberships: [
            {
              userId: 7,
              role: 'admin',
              user: {
                id: 7,
                name: 'Alice',
                email: 'alice@example.com',
              },
            },
          ],
        },
      },
    ]);

    const result = await service.listFamilies(7);

    expect(result[0]?.currentUserRole).toBe('admin');
  });

  it('creates invite links for admins', async () => {
    prismaMock.familyMembership.findUnique = jest.fn().mockResolvedValue({
      role: 'admin',
      family: {
        id: 1,
        name: 'Smith Family',
        joinCode: 'ABCD1234',
        creatorId: 7,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        updatedAt: new Date('2026-03-25T10:00:00.000Z'),
        memberships: [
          {
            userId: 7,
            role: 'admin',
            user: {
              id: 7,
              name: 'Alice',
              email: 'alice@example.com',
            },
          },
        ],
      },
    });
    prismaMock.familyInvite.create = jest.fn().mockResolvedValue({
      id: 99,
      familyId: 1,
      createdAt: new Date('2026-03-25T10:00:00.000Z'),
      updatedAt: new Date('2026-03-25T10:00:00.000Z'),
      expiresAt: new Date('2026-04-01T10:00:00.000Z'),
      usedAt: null,
      revokedAt: null,
      createdByUser: {
        id: 7,
        name: 'Alice',
        email: 'alice@example.com',
      },
    });

    const result = await service.createInvite(7, 1);

    expect(result.inviteUrl).toContain('inviteToken=');
  });

  it('blocks invite creation for non-admin members', async () => {
    prismaMock.familyMembership.findUnique = jest.fn().mockResolvedValue({
      role: 'member',
      family: {
        id: 1,
        name: 'Smith Family',
        joinCode: 'ABCD1234',
        creatorId: 7,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        updatedAt: new Date('2026-03-25T10:00:00.000Z'),
        memberships: [],
      },
    });

    await expect(service.createInvite(9, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts an invite and joins as a member', async () => {
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
    prismaMock.familyInvite.findFirst = jest.fn().mockResolvedValue({
      id: 5,
      familyId: 1,
    });
    prismaMock.familyMembership.findUnique = jest.fn().mockResolvedValue(null);
    prismaMock.familyInvite.updateMany = jest
      .fn()
      .mockResolvedValue({ count: 1 });
    prismaMock.familyMembership.create = jest.fn().mockResolvedValue({
      id: 10,
    });
    prismaMock.family.findUnique = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Smith Family',
      joinCode: 'ABCD1234',
      creatorId: 7,
      createdAt: new Date('2026-03-25T10:00:00.000Z'),
      updatedAt: new Date('2026-03-25T10:00:00.000Z'),
      memberships: [
        {
          userId: 7,
          role: 'admin',
          user: {
            id: 7,
            name: 'Alice',
            email: 'alice@example.com',
          },
        },
        {
          userId: 9,
          role: 'member',
          user: {
            id: 9,
            name: 'Bob',
            email: 'bob@example.com',
          },
        },
      ],
    });

    const result = await service.acceptInvite(9, { token: 'invite-token' });

    expect(prismaMock.familyMembership.create).toHaveBeenCalledWith({
      data: {
        userId: 9,
        familyId: 1,
        role: 'member',
      },
    });
    expect(result.currentUserRole).toBe('member');
  });

  it('rejects expired or invalid invite tokens', async () => {
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
    prismaMock.familyInvite.findFirst = jest.fn().mockResolvedValue(null);

    await expect(
      service.acceptInvite(9, { token: 'missing-token' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate invite acceptance for existing members', async () => {
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );
    prismaMock.familyInvite.findFirst = jest.fn().mockResolvedValue({
      id: 5,
      familyId: 1,
    });
    prismaMock.familyMembership.findUnique = jest.fn().mockResolvedValue({
      id: 10,
    });

    await expect(
      service.acceptInvite(9, { token: 'invite-token' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('revokes active invites for admins', async () => {
    prismaMock.familyInvite.findUnique = jest.fn().mockResolvedValue({
      id: 5,
      familyId: 1,
      usedAt: null,
      revokedAt: null,
    });
    prismaMock.familyMembership.findUnique = jest.fn().mockResolvedValue({
      role: 'admin',
      family: {
        id: 1,
        name: 'Smith Family',
        joinCode: 'ABCD1234',
        creatorId: 7,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        updatedAt: new Date('2026-03-25T10:00:00.000Z'),
        memberships: [],
      },
    });
    prismaMock.familyInvite.update = jest.fn().mockResolvedValue({
      id: 5,
    });

    await expect(service.revokeInvite(7, 5)).resolves.toEqual({
      success: true,
    });
  });

  it('maps unique-constraint races on family join to ConflictException', async () => {
    prismaMock.family.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: 1,
        name: 'Smith Family',
        joinCode: 'ABCD1234',
        creatorId: 7,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        updatedAt: new Date('2026-03-25T10:00:00.000Z'),
        memberships: [],
      })
      .mockResolvedValueOnce(null);
    prismaMock.familyMembership.create = jest.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: {},
      }),
    );

    await expect(
      service.joinFamily(9, { joinCode: 'ABCD1234' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a shared family for cross-user wishlist reads', async () => {
    prismaMock.familyMembership.findFirst = jest.fn().mockResolvedValue(null);

    await expect(service.assertSharedFamily(7, 9)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
