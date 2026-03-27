import { useEffect, useState } from 'react';
import { getSharedWishlist } from '../api/wishlists';
import type { SharedWishlistResponse } from '../types/wishlist';

interface SharedWishlistPageProps {
  token: string;
}

export default function SharedWishlistPage({ token }: SharedWishlistPageProps) {
  const [data, setData] = useState<SharedWishlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSharedWishlist(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load wishlist'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="auth-shell">
      <div style={{ width: 'min(100%, 600px)' }}>
        <p className="eyebrow">Wishlist</p>

        {loading && <p className="subtle">Loading...</p>}
        {error && (
          <div className="empty-state">
            <h3>Not found</h3>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <>
            <h1>{data.title}</h1>
            <p className="subtle">{data.ownerName}'s wishlist</p>

            {data.items.length === 0 ? (
              <div className="empty-state">
                <h3>No items yet</h3>
                <p>This wishlist has no items yet.</p>
              </div>
            ) : (
              <div className="wishlist-stack" style={{ marginTop: '1.5rem' }}>
                {data.items.map((item) => (
                  <div key={item.id} className="card">
                    <div className="card-header">
                      <div>
                        <strong>{item.name}</strong>
                        {item.price != null && (
                          <span className="subtle" style={{ marginLeft: '0.5rem' }}>
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.isClaimed && <span className="pill">Claimed</span>}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="subtle"
                        style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}
                      >
                        {item.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
