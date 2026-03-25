/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
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
    familyMembership: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
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

  it('creates a family and adds the creator as a member', async () => {
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
          name: 'Smith Family',
          memberships: {
            create: {
              userId: 7,
            },
          },
        }),
      }),
    );
    expect(result.memberCount).toBe(1);
  });

  it('joins a family by join code', async () => {
    prismaMock.family.findUnique = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Smith Family',
      joinCode: 'ABCD1234',
      creatorId: 7,
      memberships: [
        {
          userId: 7,
          user: {
            id: 7,
            name: 'Alice',
            email: 'alice@example.com',
          },
        },
      ],
    });
    prismaMock.familyMembership.create = jest.fn().mockResolvedValue({
      family: {
        id: 1,
        name: 'Smith Family',
        joinCode: 'ABCD1234',
        creatorId: 7,
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        updatedAt: new Date('2026-03-25T10:05:00.000Z'),
        memberships: [
          {
            user: {
              id: 7,
              name: 'Alice',
              email: 'alice@example.com',
            },
          },
          {
            user: {
              id: 9,
              name: 'Bob',
              email: 'bob@example.com',
            },
          },
        ],
      },
    });

    const result = await service.joinFamily(9, { joinCode: 'abcd1234' });

    expect(prismaMock.family.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { joinCode: 'ABCD1234' },
      }),
    );
    expect(prismaMock.familyMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 9, familyId: 1 },
      }),
    );
    expect(result.memberCount).toBe(2);
  });

  it('maps unique-constraint races on family join to ConflictException', async () => {
    prismaMock.family.findUnique = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Smith Family',
      joinCode: 'ABCD1234',
      creatorId: 7,
      memberships: [],
    });
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

  it('rejects duplicate family joins', async () => {
    prismaMock.family.findUnique = jest.fn().mockResolvedValue({
      id: 1,
      name: 'Smith Family',
      joinCode: 'ABCD1234',
      creatorId: 7,
      memberships: [
        {
          userId: 9,
          user: { id: 9, name: 'Bob', email: 'bob@example.com' },
        },
      ],
    });

    await expect(
      service.joinFamily(9, { joinCode: 'ABCD1234' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unknown family join codes', async () => {
    prismaMock.family.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.joinFamily(9, { joinCode: 'MISSING' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a shared family for cross-user wishlist reads', async () => {
    prismaMock.familyMembership.findFirst = jest.fn().mockResolvedValue(null);

    await expect(service.assertSharedFamily(7, 9)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
