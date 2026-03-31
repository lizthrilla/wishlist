import { useState } from 'react';
import type { WishlistSummary } from '../types/wishlist';

interface CopyState { id: number; status: 'copied' | 'error' }

interface WishlistRowProps {
  wishlist: WishlistSummary;
  copyState: CopyState | null;
  isFirst: boolean;
  isLast: boolean;
  onCopyLink: (wishlistId: number) => void;
  onRename: (wishlistId: number, title: string) => Promise<void>;
  onArchive: (wishlistId: number, isArchived: boolean) => Promise<void>;
  onDelete: (wishlistId: number) => Promise<void>;
  onMoveUp: (wishlistId: number) => void;
  onMoveDown: (wishlistId: number) => void;
}

export default function WishlistRow({
  wishlist,
  copyState,
  isFirst,
  isLast,
  onCopyLink,
  onRename,
  onArchive,
  onDelete,
  onMoveUp,
  onMoveDown,
}: WishlistRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(wishlist.title);
  const [saving, setSaving] = useState(false);

  const handleRenameSave = async () => {
    if (!renameTitle.trim()) return;
    setSaving(true);
    try {
      await onRename(wishlist.id, renameTitle.trim());
      setIsRenaming(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRenameCancel = () => {
    setRenameTitle(wishlist.title);
    setIsRenaming(false);
  };

  return (
    <div className="wishlist-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        {isRenaming ? (
          <>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              disabled={saving}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              className="primary-action"
              onClick={() => void handleRenameSave()}
              disabled={saving || !renameTitle.trim()}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="secondary-action" onClick={handleRenameCancel} disabled={saving}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <strong style={{ opacity: wishlist.isArchived ? 0.5 : 1 }}>
              {wishlist.title}
            </strong>
            <span className="pill">{wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'}</span>
            {wishlist.isArchived && <span className="pill">Archived</span>}
          </>
        )}
      </div>
      {!isRenaming && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="secondary-action"
            onClick={() => onCopyLink(wishlist.id)}
          >
            {copyState?.id === wishlist.id && copyState.status === 'copied' ? 'Copied!' :
             copyState?.id === wishlist.id && copyState.status === 'error' ? 'Copy failed' :
             'Copy link'}
          </button>
          <button className="secondary-action" onClick={() => { setRenameTitle(wishlist.title); setIsRenaming(true); }}>
            Rename
          </button>
          <button
            className="secondary-action"
            onClick={() => void onArchive(wishlist.id, !wishlist.isArchived)}
          >
            {wishlist.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            className="secondary-action"
            onClick={() => onMoveUp(wishlist.id)}
            disabled={isFirst}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            className="secondary-action"
            onClick={() => onMoveDown(wishlist.id)}
            disabled={isLast}
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            className="secondary-action"
            onClick={() => void onDelete(wishlist.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
