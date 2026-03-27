import type { WishlistSummary, WishlistItemResponse } from '../types/wishlist';
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

export function createWishlistItem(
  wishlistId: number,
  data: { name: string; url?: string; price?: number },
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
