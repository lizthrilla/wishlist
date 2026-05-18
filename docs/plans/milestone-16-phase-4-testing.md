# Milestone 16 — Phase 4: Testing

Phase 4 should be started after Phase 1 and 2 are complete so that tests cover the stabilized feature set.

---

## #83 – Add Frontend Tests (React Testing Library)

**Problem:** No frontend tests currently exist. The codebase has no `vitest.config.ts`, no test files, and no testing dependencies in `apps/web/package.json`.

**Scope:** Wishlist list rendering, item CRUD interactions, and the claim flow.

### Setup Tasks

1. Install in `apps/web`:
   - `vitest`
   - `@testing-library/react`
   - `@testing-library/user-event`
   - `@testing-library/jest-dom`
   - `jsdom`
   - `@vitejs/plugin-react` (already present as a dev dep)

2. Create `apps/web/vitest.config.ts`:
   ```ts
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: './src/test-setup.ts',
     },
   });
   ```

3. Create `apps/web/src/test-setup.ts`:
   ```ts
   import '@testing-library/jest-dom';
   ```

4. Add `"test": "vitest"` to the `scripts` block in `apps/web/package.json`.

---

### Test Cases

#### Wishlist List Rendering (`WishlistRow`)

- Renders wishlist title and item count.
- Shows "Archived" pill when `isArchived` is true.
- Disables ↑ button when `isFirst` is true.
- Disables ↓ button when `isLast` is true.
- Calls `onCopyLink` when "Copy link" is clicked.
- Enters rename mode when "Rename" is clicked; saves on confirm; cancels on cancel.

#### Item CRUD (`WishlistItemCard`)

- Renders item name, price, note, and priority badge.
- Shows image when `imageUrl` is set; hides when absent.
- Shows category/store/variant pills when set.
- Enters edit mode when "Edit" is clicked.
- Calls `onEdit` with correct payload when "Save" is clicked.
- Calls `onDelete` when "Delete" is clicked.
- Does not render edit/delete actions when `isOwner` is false.

#### Claim Flow (`WishlistItemCard`)

- Shows "Claim" button when `isClaimed` is false and `isOwner` is false.
- Calls `onClaim` when "Claim" is clicked.
- Shows "Claimed" pill (not "Claim" button) when `isClaimed` is true and `isClaimedByMe` is false.
- Shows "Unclaim" button when `isClaimedByMe` is true.
- Calls `onUnclaim` when "Unclaim" is clicked.
- Disables buttons while claiming is in progress.

#### Loading Skeletons

- `SkeletonCard` renders without crashing.
- `SkeletonRow` renders without crashing.
- Feed shows skeleton cards while `loading` is true.

#### Toast Integration (smoke tests)

- After item is deleted, `toast.success` is called with `'Item deleted'`.
- After a failed claim, `toast.error` is called with the error message.
