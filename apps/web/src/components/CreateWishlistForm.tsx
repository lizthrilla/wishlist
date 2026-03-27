import { useState, type FormEvent } from 'react';

interface CreateWishlistFormProps {
  onSubmit: (title: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function CreateWishlistForm({ onSubmit, loading, error }: CreateWishlistFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setTitle('');
  };

  return (
    <form
      className="stacked-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label htmlFor="create-wishlist-title">Create wishlist</label>
      <input
        id="create-wishlist-title"
        type="text"
        placeholder="Wishlist name"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={loading}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="primary-action" disabled={loading || !title.trim()}>
        {loading ? 'Creating...' : 'Create wishlist'}
      </button>
    </form>
  );
}
