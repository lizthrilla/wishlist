import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
    });

    if (existingUser) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
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
      ...(process.env.NODE_ENV !== 'production'
        ? {
            resetToken: rawToken,
            expiresAt: resetToken.expiresAt,
          }
        : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const passwordResetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash: hashSessionToken(dto.token),
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !passwordResetToken ||
      passwordResetToken.usedAt ||
      passwordResetToken.expiresAt <= new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const passwordHash = await hashPassword(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: passwordResetToken.user.id,
        },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: {
          id: passwordResetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: passwordResetToken.user.id,
          id: {
            not: passwordResetToken.id,
          },
        },
      }),
      this.prisma.session.deleteMany({
        where: {
          userId: passwordResetToken.user.id,
        },
      }),
    ]);

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
