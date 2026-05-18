# Milestone 16 — Phase 3: Backend-Driven Features

Both issues in this phase require NestJS and Prisma changes. Phase 3 should be started after Phase 1 is complete so the notification and real-time update UX can use the toast system.

---

## #90 – Add Notifications (Claim Events)

**Problem:** When someone claims an item on a user's wishlist, the owner has no way of knowing without refreshing or being told out-of-band. The claimer's identity must never be revealed.

**Constraint:** The notification must say an item was claimed — not who claimed it.

### Tasks

1. **Data model**: Add a `Notification` model to Prisma:
   ```
   Notification {
     id         Int      @id @default(autoincrement())
     userId     Int      // the recipient (wishlist owner)
     message    String   // e.g. "Someone claimed 'Red Sweater' from your wishlist"
     isRead     Boolean  @default(false)
     createdAt  DateTime @default(now())
   }
   ```
   Run migration.

2. **NestJS — claim hook**: In the claim endpoint (`PATCH /api/wishlist-items/:id/claim`), after a successful claim, create a `Notification` row for the wishlist owner. The `message` must not include the claimer's name or any identifying information.

3. **NestJS — notifications endpoints**:
   - `GET /api/notifications` — return the current user's unread notifications (most recent first, paginated).
   - `PATCH /api/notifications/:id/read` — mark a single notification as read.
   - `PATCH /api/notifications/read-all` — mark all as read.

4. **Frontend — notification indicator**: Add an unread notification count badge to `AppHeader`. Poll `GET /api/notifications` on a short interval (e.g., every 30 seconds) or fetch on tab focus.

5. **Frontend — notification list**: Add a notification panel or page (could be a new `AppTab` or a dropdown from the header). Show each notification message and a "Mark read" action. Show a "No notifications" empty state.

6. **Frontend — toast on receive**: When a new notification is detected (unread count increases), show a `toast` with the notification message.

---

## #84 – Add Real-Time Updates (Claims/Items)

**Problem:** Users must manually refresh to see when items are claimed or new items are added to wishlists they follow.

**Solution:** WebSocket gateway in NestJS with a polling fallback.

### Tasks

1. **NestJS — WebSocket gateway**: Install `@nestjs/websockets` and `@nestjs/platform-socket.io` (if not already present). Create a `WishlistGateway` that:
   - Authenticates the connecting user via JWT from the handshake query/header.
   - Places each user in a room named by their `userId`.
   - Emits the following events to the relevant room:
     - `item:claimed` — when an item is claimed (payload: `{ itemId, wishlistId }`)
     - `item:unclaimed` — when an item is unclaimed
     - `item:created` — when a new item is added to a wishlist the user follows
     - `item:deleted` — when an item is deleted

2. **NestJS — emit from service layer**: In `WishlistItemsService`, inject the gateway and call `emit` after each mutation. For `item:claimed`, emit to the wishlist owner's room (not the claimer's).

3. **Frontend — socket connection**: Install `socket.io-client` in `apps/web`. Create a `useWishlistSocket` hook that:
   - Connects with the user's auth token.
   - Subscribes to the events above.
   - On `item:claimed` / `item:unclaimed`: update the relevant item's `isClaimed` state in place.
   - On `item:created`: append the new item to the feed if it would appear there.
   - On `item:deleted`: remove the item from the list.
   - Disconnects on unmount.

4. **Polling fallback**: If the WebSocket connection fails or is unavailable, fall back to re-fetching the current page on a configurable interval (default: 60 seconds). Detect WebSocket availability via the connection error event.

5. **Connection indicator** (optional): Show a subtle "live" indicator in the UI when the WebSocket is connected; show "offline" indicator when on polling fallback.
