export type CreateWishlistItemInput = {
  name: string; // required, trimmed
  url?: string; // optional, valid URL
  price?: number; // optional, number
};

export type WishlistItem = CreateWishlistItemInput & {
  id: number;
  wishlistId: number;
  createdAt: string; // ISO string returned by API
};

export type WishlistItemResponse = WishlistItem & {
  wishlistTitle: string;
  ownerId: number;
  ownerName: string;
};

export type PaginationMeta = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type PaginatedWishlistItems = {
  data: WishlistItemResponse[];
  meta: PaginationMeta;
};
