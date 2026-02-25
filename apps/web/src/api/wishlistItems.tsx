const BASE_URL = 'http://localhost:3000'

export async function getWishlistItems(
    page: number,
    limit: number,
    userId?: number,
) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    })

    if (userId) {
        params.append(`userId`, String(userId));
    }

    const response = await fetch(
        `${BASE_URL}/api/wishlist-items?${params.toString()}`
    )

    if (!response.ok) {
        throw new Error('Failed to fetch wishlist items')
    }
    return response.json()
}

export async function deleteWishListItem(itemId: number) {

    const response = await fetch(
        `${BASE_URL}/api/wishlist-items/${itemId}`,
        { method: 'DELETE'}
    )

    if (!response.ok) {
        throw new Error(`Failed to delete itemId: ${itemId}`)
    }
    return response.json()
}