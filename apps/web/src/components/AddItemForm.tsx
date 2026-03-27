import { useState, type FormEvent } from 'react';
import type { WishlistSummary } from '../types/wishlist';

interface AddItemFormProps {
  wishlists: WishlistSummary[];
  onSubmit: (wishlistId: number | null, data: { name: string; url?: string; price?: number }) => Promise<void>;
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
    if (!name.trim()) return;

    const wishlistId = wishlists.length === 0
      ? null
      : selectedWishlistId === ''
        ? null
        : selectedWishlistId;

    if (wishlists.length > 0 && wishlistId === null) return;

    await onSubmit(wishlistId, {
      name: name.trim(),
      url: url.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
    });
    setName('');
    setUrl('');
    setPrice('');
  };

  return (
    <form
      className="stacked-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label htmlFor="add-item-name">Add item</label>
      {wishlists.length === 0 ? (
        <p className="subtle">Will be added to your default wishlist "My Wishlist".</p>
      ) : (
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
      )}
      <input
        id="add-item-name"
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
        disabled={loading || !name.trim() || (wishlists.length > 0 && !selectedWishlistId)}
      >
        {loading ? 'Adding...' : 'Add item'}
      </button>
    </form>
  );
}
