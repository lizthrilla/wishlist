/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashSessionToken } from './auth.utils';

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('returns a generic forgot-password response for unknown emails', async () => {
    prismaMock.user.findUnique = jest.fn().mockResolvedValue(null);

    const result = await service.forgotPassword({
      email: 'missing@example.com',
    });

    expect(result).toEqual({
      message:
        'If an account exists for that email, a reset token has been generated.',
    });
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('returns a development reset token for known emails', async () => {
    prismaMock.user.findUnique = jest.fn().mockResolvedValue({ id: 3 });
    prismaMock.passwordResetToken.deleteMany = jest.fn().mockResolvedValue({
      count: 0,
    });
    prismaMock.passwordResetToken.create = jest.fn().mockResolvedValue({
      id: 1,
      expiresAt: new Date('2026-03-25T12:00:00.000Z'),
    });

    const result = await service.forgotPassword({ email: 'alice@example.com' });

    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 3 },
    });
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 3,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        message:
          'If an account exists for that email, a reset token has been generated.',
        resetToken: expect.any(String),
        expiresAt: new Date('2026-03-25T12:00:00.000Z'),
      }),
    );
  });

  it('resets the password and invalidates sessions for a valid token', async () => {
    const token = 'raw-reset-token';
    const existingToken = {
      id: 10,
      tokenHash: hashSessionToken(token),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 7,
      },
    };

    prismaMock.passwordResetToken.findUnique = jest
      .fn()
      .mockResolvedValue(existingToken);
    prismaMock.user.update = jest.fn().mockResolvedValue(undefined);
    prismaMock.passwordResetToken.update = jest
      .fn()
      .mockResolvedValue(undefined);
    prismaMock.passwordResetToken.deleteMany = jest.fn().mockResolvedValue({
      count: 0,
    });
    prismaMock.session.deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      );

    const result = await service.resetPassword({
      token,
      password: 'new-password-123',
    });

    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: hashSessionToken(token),
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Password reset successfully.',
    });
  });

  it('rejects an expired or invalid reset token', async () => {
    prismaMock.passwordResetToken.findUnique = jest
      .fn()
      .mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'bad-token',
        password: 'new-password-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
