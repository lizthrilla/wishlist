export const ITEM_FIELDS_SELECT = {
  id: true,
  name: true,
  url: true,
  price: true,
  note: true,
  priority: true,
  quantity: true,
  imageUrl: true,
  category: true,
  store: true,
  variant: true,
  createdAt: true,
  updatedAt: true,
  wishlistId: true,
} as const;

export const WISHLIST_OWNER_SELECT = {
  title: true,
  userId: true,
  user: { select: { name: true } },
} as const;

type ItemWithOwner = {
  id: number;
  name: string;
  url: string | null;
  price: number | null;
  note: string | null;
  priority: number;
  quantity: number;
  imageUrl: string | null;
  category: string | null;
  store: string | null;
  variant: string | null;
  createdAt: Date;
  updatedAt: Date;
  wishlistId: number;
  wishlist: { title: string; userId: number; user: { name: string } };
};

export function toWishlistItemResponse(item: ItemWithOwner) {
  const { wishlist, ...fields } = item;
  return {
    ...fields,
    wishlistTitle: wishlist.title,
    ownerId: wishlist.userId,
    ownerName: wishlist.user.name,
  };
}
