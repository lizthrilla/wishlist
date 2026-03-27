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
        OR: [
          { name: { contains: trimmed } },
          { email: { contains: trimmed } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });
  }
}
