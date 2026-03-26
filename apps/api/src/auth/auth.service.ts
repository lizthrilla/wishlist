import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PASSWORD_RESET_DURATION_MS,
  SESSION_DURATION_MS,
} from './auth.constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  createResetToken,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './auth.utils';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (existingUser) {
      if (!existingUser.passwordHash) {
        const passwordHash = await hashPassword(dto.password);

        return this.prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            name: dto.name.trim(),
            passwordHash,
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });
      }

      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash,
          wishlists: {
            create: {
              title: `${dto.name.trim()}'s Wishlist`,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with that email already exists',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const rawToken = createSessionToken();
    const session = await this.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    return {
      token: rawToken,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async getCurrentUser(rawToken?: string) {
    if (!rawToken) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: {
        tokenHash: hashSessionToken(rawToken),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    return session.user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!user) {
      return {
        message:
          'If an account exists for that email, a reset token has been generated.',
      };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const rawToken = createResetToken();
    const resetToken = await this.prisma.passwordResetToken.create({
      data: {
        tokenHash: hashSessionToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_DURATION_MS),
      },
    });

    return {
      message:
        'If an account exists for that email, a reset token has been generated.',
      resetToken: rawToken,
      expiresAt: resetToken.expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashSessionToken(dto.token);
    const now = new Date();
    const passwordHash = await hashPassword(dto.password);

    await this.prisma.$transaction(async (tx) => {
      const passwordResetToken = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!passwordResetToken) {
        throw new BadRequestException('Reset token is invalid or expired');
      }

      const consumeResult = await tx.passwordResetToken.updateMany({
        where: {
          id: passwordResetToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (consumeResult.count !== 1) {
        throw new BadRequestException('Reset token is invalid or expired');
      }

      await tx.user.update({
        where: {
          id: passwordResetToken.userId,
        },
        data: {
          passwordHash,
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: passwordResetToken.userId,
          id: {
            not: passwordResetToken.id,
          },
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: passwordResetToken.userId,
        },
      });
    });

    return {
      message: 'Password reset successfully.',
    };
  }

  async logout(rawToken?: string) {
    if (!rawToken) {
      return;
    }

    await this.prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(rawToken),
      },
    });
  }
}
