/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns [] immediately for an empty query without hitting the DB', async () => {
    const result = await service.searchUsers(1, '');
    expect(result).toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('returns [] immediately for a whitespace-only query without hitting the DB', async () => {
    const result = await service.searchUsers(1, '   ');
    expect(result).toEqual([]);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('passes trimmed query and excludes currentUserId', async () => {
    const users = [{ id: 2, name: 'Alice', email: 'alice@example.com' }];
    prismaMock.user.findMany = jest.fn().mockResolvedValue(users);

    const result = await service.searchUsers(1, '  alice  ');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 1 },
          OR: [
            { name: { contains: 'alice' } },
            { email: { contains: 'alice' } },
          ],
        }),
      }),
    );
    expect(result).toEqual(users);
  });

  it('caps results at 10', async () => {
    prismaMock.user.findMany = jest.fn().mockResolvedValue([]);
    await service.searchUsers(1, 'test');
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});
