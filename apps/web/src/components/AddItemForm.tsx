import { useState, type FormEvent } from 'react';
import type { WishlistSummary } from '../types/wishlist';

interface AddItemFormProps {
  wishlists: WishlistSummary[];
  onSubmit: (wishlistId: number | null, data: {
    name: string; url?: string; price?: number;
    note?: string; priority?: number; quantity?: number;
    imageUrl?: string; category?: string; store?: string; variant?: string;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function AddItemForm({ wishlists, onSubmit, loading, error }: AddItemFormProps) {
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [store, setStore] = useState('');
  const [variant, setVariant] = useState('');

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
      note: note.trim() || undefined,
      priority: priority ? parseInt(priority, 10) : undefined,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      category: category.trim() || undefined,
      store: store.trim() || undefined,
      variant: variant.trim() || undefined,
    });
    setName('');
    setUrl('');
    setPrice('');
    setNote('');
    setPriority('');
    setQuantity('');
    setImageUrl('');
    setCategory('');
    setStore('');
    setVariant('');
    setShowAdvanced(false);
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

      <button
        type="button"
        className="secondary-action"
        onClick={() => setShowAdvanced((v) => !v)}
        style={{ alignSelf: 'flex-start', fontSize: '0.85em' }}
      >
        {showAdvanced ? 'Hide advanced options' : 'Advanced options'}
      </button>

      {showAdvanced && (
        <>
          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            disabled={loading}
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            disabled={loading}
          >
            <option value="">Priority (optional)</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
          <input
            type="number"
            placeholder="Quantity (optional)"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={loading}
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Store (optional)"
            value={store}
            onChange={(event) => setStore(event.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Size/Color/Variant (optional)"
            value={variant}
            onChange={(event) => setVariant(event.target.value)}
            disabled={loading}
          />
        </>
      )}

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
