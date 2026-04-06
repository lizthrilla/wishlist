import type { PaginatedWishlistItems, UpdateWishlistItemInput, WishlistItem } from '@wishlist/shared';
import { apiRequest } from './auth';

export function getWishlistItems(page: number, limit: number, userId?: number): Promise<PaginatedWishlistItems> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (userId) {
    params.append('userId', String(userId));
  }

  return apiRequest<PaginatedWishlistItems>(`/api/wishlist-items?${params.toString()}`);
}

export function deleteWishListItem(itemId: number) {
  return apiRequest<void>(`/api/wishlist-items/${itemId}`, { method: 'DELETE' });
}

export function updateWishlistItem(id: number, data: UpdateWishlistItemInput) {
  return apiRequest<WishlistItem>(`/api/wishlist-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function moveWishlistItem(itemId: number, wishlistId: number) {
  return apiRequest<WishlistItem>(`/api/wishlist-items/${itemId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ wishlistId }),
  });
}

export function claimWishlistItem(id: number) {
  return apiRequest<{ id: number; wishlistItemId: number; claimedAt: string }>(
    `/api/wishlist-items/${id}/claim`,
    { method: 'POST' },
  );
}

export function unclaimWishlistItem(id: number) {
  return apiRequest<void>(`/api/wishlist-items/${id}/unclaim`, { method: 'POST' });
}
