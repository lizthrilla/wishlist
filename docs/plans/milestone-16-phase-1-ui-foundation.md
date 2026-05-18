# Milestone 16 — Phase 1: UI Foundation

No backend changes. All work is in `apps/web`.

---

## #86 – Add Toast/Notification System

**Problem:** `App.tsx` manages ~8 separate error/notice state variables (`authError`, `authNotice`, `error`, `createWishlistError`, `addItemError`, `familyError`, `familyNotice`, `addMemberError`). These are rendered as inline `<p>` elements scattered through JSX. Claim, delete, and move actions succeed silently with no user feedback.

**Solution:** Install `react-hot-toast` and replace all inline feedback with toasts.

### Tasks

1. Install `react-hot-toast` in `apps/web`.
2. Add `<Toaster position="top-right" />` to `App.tsx` at the top level (outside all conditionals).
3. Remove the following state variables and their `setState` calls — replace each with a `toast` call at the point of use:
   - `authError` / `setAuthError` → `toast.error(...)`
   - `authNotice` / `setAuthNotice` → `toast.success(...)`
   - `error` / `setError` (feed/item errors) → `toast.error(...)`
   - `createWishlistError` / `setCreateWishlistError` → `toast.error(...)`
   - `addItemError` / `setAddItemError` → `toast.error(...)`
   - `familyError` / `setFamilyError` → `toast.error(...)`
   - `familyNotice` / `setFamilyNotice` → `toast.success(...)`
   - `addMemberError` / `setAddMemberError` → `toast.error(...)`
4. Remove all inline `{error && <p>...</p>}` / `{notice && <p>...</p>}` JSX nodes for the removed states.
5. Add `toast.success` for currently-silent happy paths:
   - Item created → `'Item added'`
   - Item deleted → `'Item deleted'`
   - Item updated → `'Item saved'`
   - Item claimed → `'Item claimed'`
   - Item unclaimed → `'Item unclaimed'`
   - Wishlist created → `'Wishlist created'`
   - Wishlist deleted → `'Wishlist deleted'`
   - Share link copied → `'Link copied!'` (replaces `copyState` feedback)
6. Remove the `copyState` state variable and its JSX since toast handles copy feedback.
7. In `WishlistItemCard.tsx`, `handleSave`, `handleClaim`, `handleUnclaim`, and `handleMove` catch blocks currently swallow errors silently. Pass an `onError` callback prop or import toast directly to surface errors to the user.

---

## #87 – Add Loading Skeletons

**Problem:** The app shows `<h2>Loading...</h2>` during feed fetches and `<p>Loading...</p>` during the initial auth check. There is no skeleton UI anywhere — perceived performance feels slow.

**Solution:** Create reusable skeleton components and apply them to the feed and wishlist list.

### Tasks

1. Create `apps/web/src/components/Skeleton.tsx` with:
   - `<SkeletonLine width? height? className? />` — animated shimmer bar using Tailwind `animate-pulse`.
   - `<SkeletonCard />` — matches the visual shape of `WishlistItemCard`: an image block placeholder, a title line, a subtitle line, and an action row.
   - `<SkeletonRow />` — matches the visual shape of `WishlistRow`: a title line placeholder and a group of button-shaped placeholders.
2. Use Tailwind `animate-pulse` with `bg-slate-200 rounded` blocks for the shimmer effect.
3. Export `SkeletonLine`, `SkeletonCard`, and `SkeletonRow` from `components/index.ts`.
4. In `App.tsx`: replace `{loading && <h2>Loading...</h2>}` in the feed section with 3× `<SkeletonCard />`.
5. In `App.tsx`: replace the auth-check `<p>Loading...</p>` with a centered full-page `<SkeletonLine />` or a simple spinner.
6. In the My Wishlist tab: add a `myWishlistsLoading` boolean state (currently `getMyWishlists()` is called with no loading UI), and show 3× `<SkeletonRow />` while it resolves.

---

## #85 – Improve Mobile Responsiveness

**Problem:** Many components use hardcoded inline `style={{}}` and custom CSS classes. The layout breaks or becomes awkward at 375px viewport width.

Key problem areas identified in code review:
- **`AppHeader`**: `<h1>` is 3.2em — oversized on mobile. No Tailwind classes.
- **`BottomTabs`**: `tab-button` padding is fine but needs 44px tap height and iOS safe-area inset.
- **`WishlistRow`**: Action buttons use `style={{ flexWrap: 'wrap' }}` — on 375px, 6 buttons (copy, rename, archive, ↑, ↓, delete) overflow awkwardly.
- **`WishlistItemCard`**: Multiple hardcoded inline styles; `card-actions` wraps unpredictably; image has hardcoded `maxWidth: 80px`.
- **`AddItemForm`**: Needs audit for full-width inputs.

### Tasks

1. **`AppHeader`**: Convert to Tailwind classes. Use `text-xl` or `text-2xl` instead of the global `h1 { font-size: 3.2em }` rule on mobile. Ensure sign-out button stays right-aligned.
2. **`BottomTabs`**: Ensure each tab is at least 44px tall (`min-h-[44px]`). Use `flex-1` so tabs divide the bar equally. Add `pb-safe` or `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch.
3. **`WishlistRow`**:
   - Replace `style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}` with Tailwind `flex flex-wrap gap-1`.
   - Stack the title and action row vertically on mobile using `flex flex-col sm:flex-row`.
   - Convert the ↑ / ↓ buttons to compact icon-only buttons (`w-8 h-8`) to save horizontal space.
4. **`WishlistItemCard`**:
   - Replace all remaining inline `style={{}}` with Tailwind utility classes.
   - Ensure `card-actions` buttons stack to full-width on mobile.
   - Replace image inline style `{ maxWidth: '80px', maxHeight: '80px', objectFit: 'cover', borderRadius: '4px' }` with `w-20 h-20 object-cover rounded`.
5. **`AddItemForm`**: Audit all form inputs — ensure they use `w-full` on mobile.
6. **CSS audit**: Review `index.css` and `App.css` for any fixed widths or desktop-only layout assumptions. Add responsive overrides as needed.
7. **Verify** all changes at 375px viewport width.
