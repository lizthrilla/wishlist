export interface WishlistItemType {
    id: number
    name: string
    url: string
    price: number
    createdAt: string
    wishlistId: number
    wishlistTitle: string
    ownerId: number
    ownerName: string
}

export interface CardProps {
    id: number
    name: string
    url?: string
    price?: number
    createdAt: string
    wishlistId: number
    wishlistTitle: string
    ownerId: number
    ownerName: string
    onDelete: (id: number) => void
}

export interface MetaDataType {
  limit: number
  page: number
  total: number
  totalPages: number
}
