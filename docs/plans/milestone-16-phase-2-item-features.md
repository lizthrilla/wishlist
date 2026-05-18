# Milestone 16 — Phase 2: Item Feature Additions

> **Note:** Several of these features are partially implemented. The frontend `WishlistItemCard` already renders `imageUrl`, `category`, `priority`, `store`, `variant`, and `quantity` — with display and edit support. Backend verification is required before adding UI enhancements.

---

## #88 – Add Item Images

**Problem:** Items are text-only. Images make wishlists more visually engaging and help gift-givers identify the right product.

**Current state:** `WishlistItemCard` already renders an `<img>` from `imageUrl` and includes an `imageUrl` edit field. Need to confirm backend support and consider auto-fetching.

### Tasks

1. **Backend — verify DTOs**: Confirm `imageUrl` is accepted in the create and update DTOs for `WishlistItem`. Confirm Prisma schema has `imageUrl String?`. If missing, add field + migration.
2. **Backend — scrape endpoint (stretch)**: Add `GET /api/wishlist-items/og-image?url=<url>` that fetches the Open Graph `og:image` meta tag from a given URL and returns it. Use a lightweight HTTP fetch (no headless browser needed for most product pages).
3. **Frontend — `AddItemForm`**: Confirm `imageUrl` input is present. If not, add it. Add an "Auto-fetch" button next to the URL field that calls the scrape endpoint and populates `imageUrl` automatically.
4. **Frontend — `WishlistItemCard`**: Confirm image renders correctly. Ensure it only renders when `imageUrl` is set (already the case per code review).

---

## #91 – Add Item Categories/Tags

**Problem:** Users can't filter their wishlist by type of item (books, clothing, electronics, etc.).

**Current state:** `WishlistItemCard` already displays a `category` pill and has an edit input. Need to confirm backend support and add filter UI.

### Tasks

1. **Backend — verify DTOs**: Confirm `category` is accepted in create/update DTOs and stored in Prisma. If missing, add field + migration.
2. **Backend — filter support**: Confirm `GET /api/wishlist-items` accepts an optional `?category=` query param and filters results. If not, add the filter.
3. **Frontend — `AddItemForm`**: Confirm `category` input is present. Consider changing it from a free-text input to a `<select>` or combo input with common suggestions (Books, Clothing, Electronics, Home, Toys, Other).
4. **Frontend — filter UI**: Add a category filter control above the item list (a pill-toggle row or `<select>` dropdown). Derive available options from unique categories present in the current item list. Filtering should be client-side when the full list is loaded, or trigger a new API call with `?category=` when paginating.

---

## #89 – Add Item Priority & Drag-and-Drop Ordering

**Problem:** Gift-givers can't tell which items the wishlist owner wants most. Manual up/down buttons exist for wishlists but not items.

**Current state:** `WishlistItemCard` already displays a priority badge (High/Medium/Low) and has a priority `<select>` in edit mode. The `WishlistRow` already uses ↑/↓ buttons for wishlist reordering via `reorderWishlists`. Need to apply the same pattern to items, then upgrade to drag-and-drop.

### Tasks

1. **Backend — verify DTOs**: Confirm `priority` (integer 1–3) is accepted in create/update DTOs and stored in Prisma. Confirm a `sortOrder` field (or equivalent) exists for item ordering. If missing, add fields + migration.
2. **Backend — reorder endpoint**: Add or confirm `PATCH /api/wishlists/:id/items/reorder` that accepts an ordered array of item IDs and updates `sortOrder` for each.
3. **Frontend — priority display**: Priority badge already renders in `WishlistItemCard`. Confirm it shows correct label (High/Medium/Low) and is color-coded (e.g., red/yellow/green pill).
4. **Frontend — drag-and-drop**: Install `@dnd-kit/core` and `@dnd-kit/sortable` in `apps/web`. Wrap the item list in a `<SortableContext>`. Each `WishlistItemCard` becomes a `<SortableItem>`. On drag end, call the reorder endpoint and update local state optimistically.
5. **Fallback**: Keep the ability to set priority via the edit form for users who prefer not to drag.
