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
      findFirst: jest.fn(),
      updateMany: jest.fn(),
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

  it('returns a reset token even in production so the flow remains usable', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    prismaMock.user.findUnique = jest.fn().mockResolvedValue({ id: 3 });
    prismaMock.passwordResetToken.deleteMany = jest.fn().mockResolvedValue({
      count: 0,
    });
    prismaMock.passwordResetToken.create = jest.fn().mockResolvedValue({
      id: 1,
      expiresAt: new Date('2026-03-25T12:00:00.000Z'),
    });

    try {
      const result = await service.forgotPassword({
        email: 'alice@example.com',
      });

      expect(result).toEqual(
        expect.objectContaining({
          resetToken: expect.any(String),
          expiresAt: new Date('2026-03-25T12:00:00.000Z'),
        }),
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('resets the password and invalidates sessions for a valid token', async () => {
    const token = 'raw-reset-token';
    prismaMock.passwordResetToken.findFirst = jest.fn().mockResolvedValue({
      id: 10,
      userId: 7,
    });
    prismaMock.user.update = jest.fn().mockResolvedValue(undefined);
    prismaMock.passwordResetToken.updateMany = jest
      .fn()
      .mockResolvedValue({ count: 1 });
    prismaMock.passwordResetToken.deleteMany = jest.fn().mockResolvedValue({
      count: 0,
    });
    prismaMock.session.deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );

    const result = await service.resetPassword({
      token,
      password: 'new-password-123',
    });

    expect(prismaMock.passwordResetToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tokenHash: hashSessionToken(token),
          usedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      }),
    );
    expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 10,
          usedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        data: {
          usedAt: expect.any(Date),
        },
      }),
    );
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Password reset successfully.',
    });
  });

  it('rejects an expired or invalid reset token', async () => {
    prismaMock.passwordResetToken.findFirst = jest.fn().mockResolvedValue(null);
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );

    await expect(
      service.resetPassword({
        token: 'bad-token',
        password: 'new-password-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a reset token that loses the atomic consume race', async () => {
    prismaMock.passwordResetToken.findFirst = jest.fn().mockResolvedValue({
      id: 10,
      userId: 7,
    });
    prismaMock.passwordResetToken.updateMany = jest
      .fn()
      .mockResolvedValue({ count: 0 });
    prismaMock.$transaction = jest
      .fn()
      .mockImplementation(
        async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
          callback(prismaMock),
      );

    await expect(
      service.resetPassword({
        token: 'bad-token',
        password: 'new-password-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
