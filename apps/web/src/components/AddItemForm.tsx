import { useState, type FormEvent } from 'react';
import type { WishlistSummary } from '../types/wishlist';

interface AddItemFormProps {
  wishlists: WishlistSummary[];
  onSubmit: (wishlistId: number, data: { name: string; url?: string; price?: number }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function AddItemForm({ wishlists, onSubmit, loading, error }: AddItemFormProps) {
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWishlistId || !name.trim()) return;
    await onSubmit(selectedWishlistId, {
      name: name.trim(),
      url: url.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
    });
    setName('');
    setUrl('');
    setPrice('');
  };

  if (wishlists.length === 0) {
    return (
      <div className="empty-state">
        <p>Create a wishlist above to start adding items.</p>
      </div>
    );
  }

  return (
    <form
      className="stacked-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label htmlFor="add-item-wishlist">Add item</label>
      <select
        id="add-item-wishlist"
        value={selectedWishlistId}
        onChange={(event) => setSelectedWishlistId(Number(event.target.value))}
        disabled={loading}
      >
        <option value="">Select a wishlist</option>
        {wishlists.map((w) => (
          <option key={w.id} value={w.id}>
            {w.title}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Item name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={loading}
      />
      <input
        type="url"
        placeholder="URL (optional)"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        disabled={loading}
      />
      <input
        type="number"
        placeholder="Price (optional)"
        min="0"
        step="0.01"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        disabled={loading}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="primary-action"
        disabled={loading || !selectedWishlistId || !name.trim()}
      >
        {loading ? 'Adding...' : 'Add item'}
      </button>
    </form>
  );
}
