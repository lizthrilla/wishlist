export type CreateWishlistItemInput = {
    name: string;
    url?: string;
    price?: number;
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
