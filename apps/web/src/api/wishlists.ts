import type { WishlistSummary, WishlistItemResponse, SharedWishlistResponse, UpdateWishlistInput } from '../types/wishlist';
import { apiRequest } from './auth';

export function getMyWishlists() {
  return apiRequest<WishlistSummary[]>('/api/wishlists/mine');
}

export function createWishlist(title: string) {
  return apiRequest<WishlistSummary>('/api/wishlists', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateWishlist(wishlistId: number, data: UpdateWishlistInput) {
  return apiRequest<WishlistSummary>(`/api/wishlists/${wishlistId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteWishlist(wishlistId: number) {
  return apiRequest<void>(`/api/wishlists/${wishlistId}`, { method: 'DELETE' });
}

export function reorderWishlists(orderedIds: number[]) {
  return apiRequest<void>('/api/wishlists/reorder', {
    method: 'POST',
    body: JSON.stringify({ orderedIds }),
  });
}

export function createWishlistItem(
  wishlistId: number,
  data: { name: string; url?: string; price?: number; note?: string; priority?: number; quantity?: number; imageUrl?: string; category?: string; store?: string; variant?: string },
) {
  return apiRequest<WishlistItemResponse>(`/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getUserWishlists(userId: number) {
  return apiRequest<WishlistSummary[]>(`/api/users/${userId}/wishlists`);
}

export function getWishlistItemsForWishlist(wishlistId: number) {
  return apiRequest<WishlistItemResponse[]>(`/api/wishlists/${wishlistId}/items`);
}

export function getSharedWishlist(token: string) {
  return apiRequest<SharedWishlistResponse>(`/api/shared/${token}`);
}

export function getWishlistShareToken(wishlistId: number) {
  return apiRequest<{ shareToken: string }>(`/api/wishlists/${wishlistId}/share-token`);
}
