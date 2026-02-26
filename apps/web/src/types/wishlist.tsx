import type {
  PaginatedWishlistItems,
  PaginationMeta,
  WishlistItemResponse,
} from '@wishlist/shared';

export type { WishlistItemResponse, PaginationMeta, PaginatedWishlistItems };

export interface CardProps extends WishlistItemResponse {
  onDelete: (id: number) => void;
}
