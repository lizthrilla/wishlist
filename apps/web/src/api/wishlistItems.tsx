import type { PaginatedWishlistItems, UpdateWishlistItemInput, WishlistItem } from '@wishlist/shared';
import { apiRequest } from './auth';

const BASE_URL = 'http://localhost:3000';

export async function getWishlistItems(
  page: number,
  limit: number,
  userId?: number,
): Promise<PaginatedWishlistItems> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (userId) {
    params.append(`userId`, String(userId));
  }

  const response = await fetch(`${BASE_URL}/api/wishlist-items?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    throw new Error(data?.message ?? data?.error ?? 'Failed to fetch wishlist items');
  }
  return response.json() as Promise<PaginatedWishlistItems>;
}

export async function deleteWishListItem(itemId: number) {
  const response = await fetch(`${BASE_URL}/api/wishlist-items/${itemId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    throw new Error(data?.message ?? data?.error ?? `Failed to delete itemId: ${itemId}`);
  }
}

export function updateWishlistItem(id: number, data: UpdateWishlistItemInput) {
  return apiRequest<WishlistItem>(`/api/wishlist-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
