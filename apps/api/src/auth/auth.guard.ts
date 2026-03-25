import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_COOKIE_NAME } from './auth.constants';
import type { AuthenticatedRequest } from './auth.types';
import { hashSessionToken, parseCookieHeader } from './auth.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & Request>();
    const cookies = parseCookieHeader(request.headers.cookie);
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = session.user;
    return true;
  }
}
