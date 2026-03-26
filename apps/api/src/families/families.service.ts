import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  createInviteToken,
  createJoinCode,
  hashSessionToken,
} from '../auth/auth.utils';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptFamilyInviteDto } from './dto/accept-family-invite.dto';
import { CreateFamilyDto } from './dto/create-family.dto';

const FAMILY_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

const FAMILY_INCLUDE = {
  memberships: {
    include: {
      user: {
        select: FAMILY_MEMBER_SELECT,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.FamilyInclude;

type FamilyWithMemberships = Prisma.FamilyGetPayload<{
  include: typeof FAMILY_INCLUDE;
}>;

type FamilyInviteWithCreator = Prisma.FamilyInviteGetPayload<{
  include: {
    createdByUser: {
      select: typeof FAMILY_MEMBER_SELECT;
    };
  };
}>;

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildInviteUrl(rawToken: string) {
    const baseUrl = process.env.WEB_APP_URL ?? 'http://localhost:5173';
    return `${baseUrl}/?inviteToken=${encodeURIComponent(rawToken)}`;
  }

  private mapFamilySummary(
    family: FamilyWithMemberships,
    currentUserId: number,
  ) {
    const currentMembership = family.memberships.find(
      (membership) => membership.userId === currentUserId,
    );

    if (!currentMembership) {
      throw new ForbiddenException('You are not a member of this family');
    }

    return {
      id: family.id,
      name: family.name,
      creatorId: family.creatorId,
      currentUserRole: currentMembership.role,
      memberCount: family.memberships.length,
      members: family.memberships.map((membership) => membership.user),
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };
  }

  private mapInvite(invite: FamilyInviteWithCreator) {
    return {
      id: invite.id,
      familyId: invite.familyId,
      createdByUser: invite.createdByUser,
      expiresAt: invite.expiresAt,
      usedAt: invite.usedAt,
      revokedAt: invite.revokedAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    };
  }

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

  private async getFamilyForMember(currentUserId: number, familyId: number) {
    const membership = await this.prisma.familyMembership.findUnique({
      where: {
        userId_familyId: {
          userId: currentUserId,
          familyId,
        },
      },
      include: {
        family: {
          include: FAMILY_INCLUDE,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Family not found');
    }

    return {
      family: membership.family,
      membership,
    };
  }

  private async assertFamilyAdmin(currentUserId: number, familyId: number) {
    const { family, membership } = await this.getFamilyForMember(
      currentUserId,
      familyId,
    );

    if (membership.role !== 'admin') {
      throw new ForbiddenException('Only family admins can manage invites');
    }

    return family;
  }

  async listFamilies(currentUserId: number) {
    const memberships = await this.prisma.familyMembership.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'asc' },
      include: {
        family: {
          include: FAMILY_INCLUDE,
        },
      },
    });

    return memberships.map(({ family }) =>
      this.mapFamilySummary(family, currentUserId),
    );
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
            role: 'admin',
          },
        },
      },
      include: FAMILY_INCLUDE,
    });

    return this.mapFamilySummary(family, currentUserId);
  }

  async listInvites(currentUserId: number, familyId: number) {
    await this.assertFamilyAdmin(currentUserId, familyId);

    const invites = await this.prisma.familyInvite.findMany({
      where: {
        familyId,
        revokedAt: null,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdByUser: {
          select: FAMILY_MEMBER_SELECT,
        },
      },
    });

    return invites.map((invite) => this.mapInvite(invite));
  }

  async createInvite(currentUserId: number, familyId: number) {
    await this.assertFamilyAdmin(currentUserId, familyId);

    const rawToken = createInviteToken();
    const invite = await this.prisma.familyInvite.create({
      data: {
        tokenHash: hashSessionToken(rawToken),
        familyId,
        createdByUserId: currentUserId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
      include: {
        createdByUser: {
          select: FAMILY_MEMBER_SELECT,
        },
      },
    });

    return {
      ...this.mapInvite(invite),
      inviteUrl: this.buildInviteUrl(rawToken),
    };
  }

  async acceptInvite(currentUserId: number, dto: AcceptFamilyInviteDto) {
    const tokenHash = hashSessionToken(dto.token.trim());
    const now = new Date();

    const familyId = await this.prisma.$transaction(async (tx) => {
      const invite = await tx.familyInvite.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        select: {
          id: true,
          familyId: true,
        },
      });

      if (!invite) {
        throw new BadRequestException('Invite link is invalid or expired');
      }

      const existingMembership = await tx.familyMembership.findUnique({
        where: {
          userId_familyId: {
            userId: currentUserId,
            familyId: invite.familyId,
          },
        },
        select: { id: true },
      });

      if (existingMembership) {
        throw new ConflictException('You are already a member of this family');
      }

      const consumeResult = await tx.familyInvite.updateMany({
        where: {
          id: invite.id,
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (consumeResult.count !== 1) {
        throw new BadRequestException('Invite link is invalid or expired');
      }

      try {
        await tx.familyMembership.create({
          data: {
            userId: currentUserId,
            familyId: invite.familyId,
            role: 'member',
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'You are already a member of this family',
          );
        }

        throw error;
      }

      return invite.familyId;
    });

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: FAMILY_INCLUDE,
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return this.mapFamilySummary(family, currentUserId);
  }

  async revokeInvite(currentUserId: number, inviteId: number) {
    const invite = await this.prisma.familyInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        familyId: true,
        usedAt: true,
        revokedAt: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.assertFamilyAdmin(currentUserId, invite.familyId);

    if (invite.revokedAt || invite.usedAt) {
      throw new BadRequestException('Invite is no longer active');
    }

    await this.prisma.familyInvite.update({
      where: { id: invite.id },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
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
