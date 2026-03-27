import { useState } from 'react';
import type { CardProps } from '../types/wishlist';

export default function WishlistItemCard({
  id,
  name,
  ownerName,
  wishlistTitle,
  url,
  price,
  isClaimed,
  isClaimedByMe,
  isOwner,
  onDelete,
  onEdit,
  onClaim,
  onUnclaim,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editUrl, setEditUrl] = useState(url ?? '');
  const [editPrice, setEditPrice] = useState(price != null ? String(price) : '');
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onEdit(id, {
        name: editName.trim() || name,
        url: editUrl.trim() || null,
        price: editPrice ? parseFloat(editPrice) : null,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(name);
    setEditUrl(url ?? '');
    setEditPrice(price != null ? String(price) : '');
    setIsEditing(false);
  };

  const handleClaim = async () => {
    if (!onClaim) return;
    setClaiming(true);
    try { await onClaim(id); } finally { setClaiming(false); }
  };

  const handleUnclaim = async () => {
    if (!onUnclaim) return;
    setClaiming(true);
    try { await onUnclaim(id); } finally { setClaiming(false); }
  };

  if (isEditing) {
    return (
      <div className="card">
        <div className="card-body">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Item name"
            disabled={saving}
          />
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="URL (optional)"
            disabled={saving}
          />
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="Price (optional)"
            min="0"
            step="0.01"
            disabled={saving}
          />
        </div>
        <div className="card-actions">
          <button
            className="primary-action"
            onClick={() => void handleSave()}
            disabled={saving || !editName.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="secondary-action" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        <p className="subtle">
          {ownerName} &mdash; {wishlistTitle}
        </p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="card-link">
            View item
          </a>
        )}
        {price != null && <p className="card-price">${price.toFixed(2)}</p>}
      </div>

      {isOwner && (
        <div className="card-actions">
          <button className="secondary-action" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button className="secondary-action" onClick={() => onDelete(id)}>
            Delete
          </button>
          {isClaimed && <span className="pill">Claimed</span>}
        </div>
      )}

      {!isOwner && (
        <div className="card-actions">
          {isClaimed && !isClaimedByMe && (
            <span className="pill">Claimed</span>
          )}
          {isClaimedByMe && (
            <button
              className="secondary-action"
              onClick={() => void handleUnclaim()}
              disabled={claiming}
            >
              {claiming ? 'Unclaiming...' : 'Unclaim'}
            </button>
          )}
          {!isClaimed && (
            <button
              className="primary-action"
              onClick={() => void handleClaim()}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : 'Claim'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
