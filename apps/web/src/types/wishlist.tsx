import type {
  PaginatedWishlistItems,
  PaginationMeta,
  WishlistItemResponse,
} from '@wishlist/shared';

export type { WishlistItemResponse, PaginationMeta, PaginatedWishlistItems };

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface FamilyMember {
  id: number;
  email: string;
  name: string;
}

export type FamilyRole = 'admin' | 'member';

export interface FamilySummary {
  id: number;
  name: string;
  creatorId: number;
  currentUserRole: FamilyRole;
  memberCount: number;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyInviteSummary {
  id: number;
  familyId: number;
  createdByUser: FamilyMember;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedFamilyInvite extends FamilyInviteSummary {
  inviteUrl: string;
}

export interface CardProps extends WishlistItemResponse {
  onDelete: (id: number) => void;
}
