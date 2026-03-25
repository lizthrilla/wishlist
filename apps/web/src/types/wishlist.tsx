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

export interface FamilySummary {
  id: number;
  name: string;
  joinCode: string;
  creatorId: number;
  memberCount: number;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CardProps extends WishlistItemResponse {
  onDelete: (id: number) => void;
}
