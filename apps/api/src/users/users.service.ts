import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(currentUserId: number, query: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        // SQLite is case-insensitive by default; add mode: 'insensitive' when migrating to Postgres
        // See: https://github.com/lizthrilla/wishlist/issues/96
        OR: [{ name: { contains: trimmed } }, { email: { contains: trimmed } }],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });
  }
}
