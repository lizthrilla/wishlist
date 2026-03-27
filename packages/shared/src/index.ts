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
  isClaimed: boolean;
  isClaimedByMe: boolean;
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

export type AuthUser = {
  id: number;
  email: string;
  name: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type WishlistSummary = {
  id: number;
  title: string;
  userId: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateWishlistItemInput = {
  name?: string;
  url?: string | null;
  price?: number | null;
};

export type UserSearchResult = {
  id: number;
  name: string;
  email: string;
};
