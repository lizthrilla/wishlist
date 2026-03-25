import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createJoinCode } from '../auth/auth.utils';
import { CreateFamilyDto } from './dto/create-family.dto';
import { JoinFamilyDto } from './dto/join-family.dto';

type FamilySummaryRecord = {
  id: number;
  name: string;
  joinCode: string;
  creatorId: number;
  memberships: Array<{
    user: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueJoinCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const joinCode = createJoinCode();
      const existingFamily = await this.prisma.family.findUnique({
        where: { joinCode },
        select: { id: true },
      });

      if (!existingFamily) {
        return joinCode;
      }
    }

    throw new ConflictException('Unable to generate a unique join code');
  }

  async listFamilies(currentUserId: number) {
    const memberships = await this.prisma.familyMembership.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'asc' },
      include: {
        family: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    return memberships.map(({ family }) => ({
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      creatorId: family.creatorId,
      memberCount: family.memberships.length,
      members: family.memberships.map((membership) => membership.user),
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    }));
  }

  async createFamily(currentUserId: number, dto: CreateFamilyDto) {
    const joinCode = await this.generateUniqueJoinCode();

    const family = await this.prisma.family.create({
      data: {
        name: dto.name.trim(),
        joinCode,
        creatorId: currentUserId,
        memberships: {
          create: {
            userId: currentUserId,
          },
        },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      creatorId: family.creatorId,
      memberCount: family.memberships.length,
      members: family.memberships.map((membership) => membership.user),
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };
  }

  async joinFamily(currentUserId: number, dto: JoinFamilyDto) {
    const joinCode = dto.joinCode.trim().toUpperCase();
    const family = await this.prisma.family.findUnique({
      where: { joinCode },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const existingMembership = family.memberships.find(
      (membership) => membership.userId === currentUserId,
    );
    if (existingMembership) {
      throw new ConflictException('You are already a member of this family');
    }

    let membershipFamily: FamilySummaryRecord;
    try {
      const membership = await this.prisma.familyMembership.create({
        data: {
          userId: currentUserId,
          familyId: family.id,
        },
        include: {
          family: {
            include: {
              memberships: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      membershipFamily = membership.family as FamilySummaryRecord;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You are already a member of this family');
      }

      throw error;
    }

    return {
      id: membershipFamily.id,
      name: membershipFamily.name,
      joinCode: membershipFamily.joinCode,
      creatorId: membershipFamily.creatorId,
      memberCount: membershipFamily.memberships.length,
      members: membershipFamily.memberships.map(
        (familyMembership) => familyMembership.user,
      ),
      createdAt: membershipFamily.createdAt,
      updatedAt: membershipFamily.updatedAt,
    };
  }

  async assertSharedFamily(currentUserId: number, ownerId: number) {
    if (currentUserId === ownerId) {
      return;
    }

    const sharedMembership = await this.prisma.familyMembership.findFirst({
      where: {
        userId: currentUserId,
        family: {
          memberships: {
            some: {
              userId: ownerId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (!sharedMembership) {
      throw new ForbiddenException(
        'You can only view wishlists for members of your families',
      );
    }
  }
}
