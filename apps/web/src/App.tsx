import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { getCurrentUser, login, logout, register } from './api/auth';
import { deleteWishListItem, getWishlistItems } from './api/wishlistItems';
import { Card, DropDown, PaginationButtons, UserSearch } from './components/index';
import type { AuthUser, PaginationMeta, WishlistItemResponse } from './types/wishlist';

const DEFAULT_LIMIT = 10;

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>([]);
  const [inputUserName, setInputUserName] = useState('');
  const [searchUserName, setSearchUserName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const bootstrapUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.user);
      setAuthError(null);
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getWishlistItems(currentPage, limit);
      setWishlistItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentUser, limit]);

  useEffect(() => {
    void bootstrapUser();
  }, [bootstrapUser]);

  useEffect(() => {
    if (currentUser) {
      void fetchData();
    }
  }, [currentUser, fetchData]);

  const handleBackPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => page + 1);
  };

  const onDeleteItem = useCallback(
    async (id: number) => {
      try {
        await deleteWishListItem(id);
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete wishlist item');
      }
    },
    [fetchData],
  );

  const handleSearchSubmit = () => {
    setSearchUserName(inputUserName.trim());
  };

  const filteredItems = wishlistItems.filter((item) =>
    !searchUserName
      ? true
      : item.ownerName.toLowerCase().includes(searchUserName.toLowerCase()) ||
        item.name.toLowerCase().includes(searchUserName.toLowerCase()) ||
        item.wishlistTitle.toLowerCase().includes(searchUserName.toLowerCase()),
  );

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    try {
      const normalizedEmail = authForm.email.trim().toLowerCase();

      if (authMode === 'register') {
        await register({
          name: authForm.name.trim(),
          email: normalizedEmail,
          password: authForm.password,
        });
      }

      const response = await login({
        email: normalizedEmail,
        password: authForm.password,
      });

      setCurrentUser(response.user);
      setAuthForm({ name: '', email: '', password: '' });
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to authenticate right now');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCurrentUser(null);
      setWishlistItems([]);
      setMeta(undefined);
      setError(null);
      setAuthError(null);
    }
  };

  if (authLoading) {
    return <div className="app-shell">Checking your session...</div>;
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Wishlist</p>
          <h1>{authMode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="subtle">Sign in to browse wishlists and manage your own items.</p>
          <form
            className="auth-form"
            onSubmit={(event) => {
              void handleAuthSubmit(event);
            }}
          >
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
            {authError && <p className="form-error">{authError}</p>}
            <button type="submit" className="primary-action">
              {authMode === 'login' ? 'Sign in' : 'Register and sign in'}
            </button>
          </form>
          <button
            className="secondary-action"
            onClick={() => setAuthMode((current) => (current === 'login' ? 'register' : 'login'))}
          >
            {authMode === 'login'
              ? 'Need an account? Register'
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <div>
          <p className="eyebrow">Wishlist</p>
          <h1>Wishlists</h1>
          <p className="subtle">Signed in as {currentUser.name}</p>
        </div>
        <button className="secondary-action" onClick={() => void handleLogout()}>
          Sign out
        </button>
      </div>
      {loading && <h2>Loading...</h2>}
      {error ? (
        <div>
          <h2>{error}</h2>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <UserSearch
            onSubmit={handleSearchSubmit}
            value={inputUserName}
            onChange={setInputUserName}
          />
          <div className="w-full max-w-md space-y-6">
            {filteredItems.map((item) => (
              <Card
                {...item}
                key={item.id}
                onDelete={(id) => {
                  if (item.ownerId !== currentUser.id) {
                    setError('You can only delete items from your own wishlist.');
                    return;
                  }

                  void onDeleteItem(id);
                }}
              />
            ))}
          </div>
          <PaginationButtons
            handleBackPage={handleBackPage}
            handleNextPage={handleNextPage}
            currentPage={currentPage}
            totalPages={meta?.totalPages}
          />
          <DropDown
            limit={limit}
            setLimit={setLimit}
            setCurrentPage={setCurrentPage}
            totalItems={meta?.total}
          />
        </div>
      )}
    </div>
  );
}

export default App;
