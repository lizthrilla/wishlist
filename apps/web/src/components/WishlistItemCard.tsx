import { useState } from 'react';
import type { CardProps } from '../types/wishlist';

const PRIORITY_LABELS: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' };

export default function WishlistItemCard({
  id,
  name,
  ownerName,
  wishlistTitle,
  url,
  price,
  note,
  priority,
  quantity,
  imageUrl,
  category,
  store,
  variant,
  isClaimed,
  isClaimedByMe,
  isOwner,
  onDelete,
  onEdit,
  onClaim,
  onUnclaim,
  onMove,
  wishlists,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editUrl, setEditUrl] = useState(url ?? '');
  const [editPrice, setEditPrice] = useState(price != null ? String(price) : '');
  const [editNote, setEditNote] = useState(note ?? '');
  const [editPriority, setEditPriority] = useState(priority != null ? String(priority) : '');
  const [editQuantity, setEditQuantity] = useState(quantity != null ? String(quantity) : '');
  const [editImageUrl, setEditImageUrl] = useState(imageUrl ?? '');
  const [editCategory, setEditCategory] = useState(category ?? '');
  const [editStore, setEditStore] = useState(store ?? '');
  const [editVariant, setEditVariant] = useState(variant ?? '');
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<number | ''>('');
  const [moving, setMoving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onEdit(id, {
        name: editName.trim() || name,
        url: editUrl.trim() || null,
        price: editPrice ? parseFloat(editPrice) : null,
        note: editNote.trim() || null,
        priority: editPriority ? parseInt(editPriority, 10) : null,
        quantity: editQuantity ? parseInt(editQuantity, 10) : null,
        imageUrl: editImageUrl.trim() || null,
        category: editCategory.trim() || null,
        store: editStore.trim() || null,
        variant: editVariant.trim() || null,
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
    setEditNote(note ?? '');
    setEditPriority(priority != null ? String(priority) : '');
    setEditQuantity(quantity != null ? String(quantity) : '');
    setEditImageUrl(imageUrl ?? '');
    setEditCategory(category ?? '');
    setEditStore(store ?? '');
    setEditVariant(variant ?? '');
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

  const handleMove = async () => {
    if (!onMove || !moveTargetId) return;
    setMoving(true);
    try {
      await onMove(id, Number(moveTargetId));
      setIsMoving(false);
      setMoveTargetId('');
    } finally {
      setMoving(false);
    }
  };

  const otherWishlists = wishlists?.filter((w) => w.title !== wishlistTitle) ?? [];

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
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Note (optional)"
            rows={2}
            disabled={saving}
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            disabled={saving}
          >
            <option value="">Priority (optional)</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
          <input
            type="number"
            value={editQuantity}
            onChange={(e) => setEditQuantity(e.target.value)}
            placeholder="Quantity (optional)"
            min="1"
            disabled={saving}
          />
          <input
            type="url"
            value={editImageUrl}
            onChange={(e) => setEditImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            disabled={saving}
          />
          <input
            type="text"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            placeholder="Category (optional)"
            disabled={saving}
          />
          <input
            type="text"
            value={editStore}
            onChange={(e) => setEditStore(e.target.value)}
            placeholder="Store (optional)"
            disabled={saving}
          />
          <input
            type="text"
            value={editVariant}
            onChange={(e) => setEditVariant(e.target.value)}
            placeholder="Size/Color/Variant (optional)"
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
        {imageUrl && (
          <img src={imageUrl} alt={name} className="card-image" style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'cover', borderRadius: '4px' }} />
        )}
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
        {note && <p className="subtle" style={{ fontStyle: 'italic' }}>{note}</p>}
        <div className="card-meta" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          {priority != null && (
            <span className="pill">{PRIORITY_LABELS[priority] ?? `Priority ${priority}`}</span>
          )}
          {quantity != null && quantity > 1 && (
            <span className="pill">Qty: {quantity}</span>
          )}
          {category && <span className="pill">{category}</span>}
          {store && <span className="pill">{store}</span>}
          {variant && <span className="pill">{variant}</span>}
        </div>
      </div>

      {isOwner && (
        <div className="card-actions">
          <button className="secondary-action" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          {onMove && otherWishlists.length > 0 && !isMoving && (
            <button className="secondary-action" onClick={() => setIsMoving(true)}>
              Move
            </button>
          )}
          {isMoving && (
            <>
              <select
                value={moveTargetId}
                onChange={(e) => setMoveTargetId(Number(e.target.value))}
                disabled={moving}
              >
                <option value="">Select wishlist</option>
                {otherWishlists.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
              <button
                className="primary-action"
                onClick={() => void handleMove()}
                disabled={moving || !moveTargetId}
              >
                {moving ? 'Moving...' : 'Confirm'}
              </button>
              <button className="secondary-action" onClick={() => { setIsMoving(false); setMoveTargetId(''); }} disabled={moving}>
                Cancel
              </button>
            </>
          )}
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
