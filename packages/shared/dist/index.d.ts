export type CreateWishlistItemInput = {
    name: string;
    url?: string;
    price?: number;
    note?: string;
    priority?: number;
    quantity?: number;
    imageUrl?: string;
    category?: string;
    store?: string;
    variant?: string;
};
export type WishlistItem = CreateWishlistItemInput & {
    id: number;
    wishlistId: number;
    createdAt: string;
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
    isArchived: boolean;
    sortOrder: number | null;
    createdAt: string;
    updatedAt: string;
};
export type SharedWishlistItem = {
    id: number;
    name: string;
    url: string | null;
    price: number | null;
    note: string | null;
    priority: number | null;
    quantity: number | null;
    imageUrl: string | null;
    category: string | null;
    store: string | null;
    variant: string | null;
    isClaimed: boolean;
};
export type SharedWishlistResponse = {
    title: string;
    ownerName: string;
    items: SharedWishlistItem[];
};
export type UpdateWishlistItemInput = {
    name?: string;
    url?: string | null;
    price?: number | null;
    note?: string | null;
    priority?: number | null;
    quantity?: number | null;
    imageUrl?: string | null;
    category?: string | null;
    store?: string | null;
    variant?: string | null;
};
export type UpdateWishlistInput = {
    title?: string;
    isArchived?: boolean;
    sortOrder?: number | null;
};
export type MoveWishlistItemInput = {
    wishlistId: number;
};
export type UserSearchResult = {
    id: number;
    name: string;
    email: string;
};
