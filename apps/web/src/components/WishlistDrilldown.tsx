import { useCallback, useEffect, useState } from 'react';
import { getUserWishlists, getWishlistItemsForWishlist } from '../api/wishlists';
import type { WishlistItemResponse, WishlistSummary } from '../types/wishlist';
import WishlistItemCard from './WishlistItemCard';

interface WishlistDrilldownProps {
  viewingUser: { id: number; name: string };
  onBack: () => void;
  onClaim: (itemId: number) => Promise<void>;
  onUnclaim: (itemId: number) => Promise<void>;
}

export default function WishlistDrilldown({
  viewingUser,
  onBack,
  onClaim,
  onUnclaim,
}: WishlistDrilldownProps) {
  const [wishlists, setWishlists] = useState<WishlistSummary[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<WishlistSummary | null>(null);
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedWishlist(null);
    setItems([]);
    setError(null);
    setLoading(true);
    getUserWishlists(viewingUser.id)
      .then(setWishlists)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load wishlists'))
      .finally(() => setLoading(false));
  }, [viewingUser.id]);

  const fetchItems = useCallback(async (wishlistId: number) => {
    setItems([]);
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlistItemsForWishlist(wishlistId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectWishlist = async (wl: WishlistSummary) => {
    setSelectedWishlist(wl);
    await fetchItems(wl.id);
  };

  const handleBackToWishlists = () => {
    setSelectedWishlist(null);
  };

  const handleClaim = async (itemId: number) => {
    await onClaim(itemId);
    if (selectedWishlist) await fetchItems(selectedWishlist.id);
  };

  const handleUnclaim = async (itemId: number) => {
    await onUnclaim(itemId);
    if (selectedWishlist) await fetchItems(selectedWishlist.id);
  };

  if (selectedWishlist) {
    return (
      <>
        <div className="panel-header">
          <div>
            <button className="secondary-action" onClick={handleBackToWishlists} style={{ marginBottom: '0.5rem' }}>
              ← Back to {viewingUser.name}'s wishlists
            </button>
            <h2>{selectedWishlist.title}</h2>
            <p className="subtle">{viewingUser.name}'s wishlist</p>
          </div>
        </div>

        {loading && <p className="subtle">Loading...</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="empty-state">
            <h3>No items</h3>
            <p>This wishlist has no items yet.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="wishlist-stack">
            {items.map((item) => (
              <WishlistItemCard
                key={item.id}
                {...item}
                isOwner={false}
                onDelete={() => undefined}
                onEdit={async () => undefined}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="panel-header">
        <div>
          <button className="secondary-action" onClick={onBack} style={{ marginBottom: '0.5rem' }}>
            ← Back to feed
          </button>
          <h2>{viewingUser.name}'s wishlists</h2>
        </div>
      </div>

      {loading && <p className="subtle">Loading...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && wishlists.length === 0 && (
        <div className="empty-state">
          <h3>No wishlists</h3>
          <p>{viewingUser.name} hasn't created any wishlists yet.</p>
        </div>
      )}

      {wishlists.length > 0 && (
        <div className="wishlist-list">
          {wishlists.map((wl) => (
            <button
              key={wl.id}
              className="wishlist-row-btn"
              onClick={() => void handleSelectWishlist(wl)}
            >
              <strong>{wl.title}</strong>
              <span className="pill">
                {wl.itemCount} {wl.itemCount === 1 ? 'item' : 'items'}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
