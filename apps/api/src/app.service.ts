import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async getDebugItems() {
    return this.prisma.wishlistItem.findMany({
      take: 10,
      orderBy: { createdAt: 'desc'},
      include: {
        wishlist: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
