import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from './api/auth';
import {
  acceptFamilyInvite,
  createFamily,
  createFamilyInvite,
  deleteFamily,
  getFamilies,
  getFamilyInvites,
  revokeFamilyInvite,
} from './api/families';
import { claimWishlistItem, deleteWishListItem, getWishlistItems, moveWishlistItem, unclaimWishlistItem, updateWishlistItem } from './api/wishlistItems';
import { createWishlist, createWishlistItem, deleteWishlist, getMyWishlists, getWishlistShareToken, reorderWishlists, updateWishlist } from './api/wishlists';
import { addFamilyMember } from './api/users';
import AddItemForm from './components/AddItemForm';
import AppHeader from './components/AppHeader';
import BottomTabs from './components/BottomTabs';
import type { AppTab } from './components/BottomTabs';
import CreateWishlistForm from './components/CreateWishlistForm';
import FamiliesPanel from './components/FamiliesPanel';
import WishlistRow from './components/WishlistRow';
import FollowUserRow from './components/FollowUserRow';
import WishlistDrilldown from './components/WishlistDrilldown';
import SharedWishlistPage from './components/SharedWishlistPage';
import StatsRow from './components/StatsRow';
import WishlistItemCard from './components/WishlistItemCard';
import { DropDown, PaginationButtons, UserSearch } from './components/index';
import type {
  AuthUser,
  FamilyInviteSummary,
  FamilySummary,
  PaginationMeta,
  UpdateWishlistItemInput,
  WishlistItemResponse,
  WishlistSummary,
} from './types/wishlist';

const DEFAULT_LIMIT = 10;

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

function App() {
  const [shareToken] = useState(() => new URLSearchParams(window.location.search).get('share'));

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    resetToken: '',
    newPassword: '',
  });
  const [devResetToken, setDevResetToken] = useState<{
    token: string;
    expiresAt?: string;
  } | null>(null);

  // Feed state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>([]);
  const [inputUserName, setInputUserName] = useState('');
  const [searchUserName, setSearchUserName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  // My items (fetched independently from the shared feed)
  const [myItems, setMyItems] = useState<WishlistItemResponse[]>([]);

  // My wishlists state
  const [myWishlists, setMyWishlists] = useState<WishlistSummary[]>([]);
  const [createWishlistLoading, setCreateWishlistLoading] = useState(false);
  const [createWishlistError, setCreateWishlistError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<{ id: number; status: 'copied' | 'error' } | null>(null);
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // Family state
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [familyInvites, setFamilyInvites] = useState<Record<number, FamilyInviteSummary[]>>({});
  const [latestInviteLinks, setLatestInviteLinks] = useState<Record<number, string>>({});
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familyNotice, setFamilyNotice] = useState<string | null>(null);
  const [familyForm, setFamilyForm] = useState({ createName: '' });
  const [inviteActionFamilyId, setInviteActionFamilyId] = useState<number | null>(null);

  // Invite acceptance state
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('inviteToken');
  });
  const [inviteAcceptanceLoading, setInviteAcceptanceLoading] = useState(false);

  // Add member state
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<AppTab>('feed');

  // Drill-down navigation (viewing a family member's wishlists)
  const [viewingUser, setViewingUser] = useState<{ id: number; name: string } | null>(null);

  const clearInviteTokenFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

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

  const fetchFamilyInvites = useCallback(async (familyList: FamilySummary[]) => {
    const adminFamilies = familyList.filter((family) => family.currentUserRole === 'admin');
    if (adminFamilies.length === 0) {
      setFamilyInvites({});
      return;
    }
    const entries = await Promise.all(
      adminFamilies.map(async (family) => {
        const invites = await getFamilyInvites(family.id);
        return [family.id, invites] as const;
      }),
    );
    setFamilyInvites(Object.fromEntries(entries));
  }, []);

  const fetchFamilies = useCallback(async () => {
    if (!currentUser) {
      setFamilies([]);
      setFamilyInvites({});
      return;
    }
    setFamilyLoading(true);
    try {
      const response = await getFamilies();
      setFamilies(response);
      await fetchFamilyInvites(response);
      setFamilyError(null);
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to load families');
    } finally {
      setFamilyLoading(false);
    }
  }, [currentUser, fetchFamilyInvites]);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getWishlistItems(currentPage, limit);
      setWishlistItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setWishlistItems([]);
      setMeta(undefined);
      setError(err instanceof Error ? err.message : 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentUser, limit]);

  const fetchMyItems = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await getWishlistItems(1, 100, currentUser.id);
      setMyItems(res.data);
    } catch {
      // non-critical — My Wishlist tab shows empty list
    }
  }, [currentUser]);

  const fetchMyWishlists = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getMyWishlists();
      setMyWishlists(data);
    } catch {
      // non-critical — user sees empty list
    }
  }, [currentUser]);

  useEffect(() => {
    void bootstrapUser();
  }, [bootstrapUser]);

  useEffect(() => {
    if (!currentUser) return;
    void fetchData();
    void fetchFamilies();
    void fetchMyWishlists();
    void fetchMyItems();
  }, [currentUser, fetchData, fetchFamilies, fetchMyWishlists, fetchMyItems]);

  useEffect(() => {
    if (!pendingInviteToken) return;
    if (!currentUser) {
      setAuthNotice('Sign in to accept your family invite link.');
      setAuthMode('login');
      return;
    }
    if (inviteAcceptanceLoading) return;

    const acceptInvite = async () => {
      setInviteAcceptanceLoading(true);
      setFamilyError(null);
      try {
        const family = await acceptFamilyInvite(pendingInviteToken);
        setFamilyNotice(`You joined ${family.name}.`);
        clearInviteTokenFromUrl();
        setPendingInviteToken(null);
        await Promise.all([fetchFamilies(), fetchData()]);
      } catch (err) {
        setFamilyError(err instanceof Error ? err.message : 'Failed to accept family invite');
        clearInviteTokenFromUrl();
        setPendingInviteToken(null);
      } finally {
        setInviteAcceptanceLoading(false);
      }
    };

    void acceptInvite();
  }, [
    clearInviteTokenFromUrl,
    currentUser,
    fetchData,
    fetchFamilies,
    inviteAcceptanceLoading,
    pendingInviteToken,
  ]);

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
        await Promise.all([fetchData(), fetchMyItems()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete wishlist item');
      }
    },
    [fetchData, fetchMyItems],
  );

  const handleEditItem = useCallback(
    async (id: number, data: UpdateWishlistItemInput) => {
      try {
        await updateWishlistItem(id, data);
        await Promise.all([fetchData(), fetchMyItems()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update wishlist item');
      }
    },
    [fetchData, fetchMyItems],
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

  const resetAuthFeedback = () => {
    setAuthError(null);
    setAuthNotice(null);
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    resetAuthFeedback();
    if (mode !== 'reset') setDevResetToken(null);
    setAuthMode(mode);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAuthFeedback();

    try {
      const normalizedEmail = authForm.email.trim().toLowerCase();

      if (authMode === 'register') {
        await register({ name: authForm.name.trim(), email: normalizedEmail, password: authForm.password });
        const response = await login({ email: normalizedEmail, password: authForm.password });
        setCurrentUser(response.user);
        setAuthForm({ name: '', email: '', password: '', resetToken: '', newPassword: '' });
        setCurrentPage(1);
        setError(null);
        return;
      }

      if (authMode === 'login') {
        const response = await login({ email: normalizedEmail, password: authForm.password });
        setCurrentUser(response.user);
        setAuthForm({ name: '', email: '', password: '', resetToken: '', newPassword: '' });
        setCurrentPage(1);
        setError(null);
        return;
      }

      if (authMode === 'forgot') {
        const response = await forgotPassword(normalizedEmail);
        setAuthNotice(response.message);
        if (response._devOnlyResetToken) {
          setDevResetToken({ token: response._devOnlyResetToken, expiresAt: response.expiresAt });
          setAuthForm((current) => ({ ...current, resetToken: response._devOnlyResetToken ?? '' }));
        }
        return;
      }

      const response = await resetPassword({ token: authForm.resetToken.trim(), password: authForm.newPassword });
      setAuthNotice(response.message);
      setAuthForm((current) => ({ ...current, password: '', resetToken: '', newPassword: '' }));
      setDevResetToken(null);
      setAuthMode('login');
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
      setMyItems([]);
      setMeta(undefined);
      setMyWishlists([]);
      setFamilies([]);
      setFamilyInvites({});
      setLatestInviteLinks({});
      setError(null);
      setAuthError(null);
      setAuthNotice(null);
      setFamilyError(null);
      setFamilyNotice(null);
      setAddMemberLoading(false);
      setAddMemberError(null);
      setViewingUser(null);
    }
  };

  const handleCreateFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFamilyError(null);
    setFamilyNotice(null);
    try {
      const family = await createFamily(familyForm.createName.trim());
      setFamilyForm({ createName: '' });
      setFamilyNotice(`Created ${family.name}.`);
      await Promise.all([fetchFamilies(), fetchData()]);
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to create family');
    }
  };

  const handleCreateInvite = async (familyId: number) => {
    setFamilyError(null);
    setFamilyNotice(null);
    setInviteActionFamilyId(familyId);
    try {
      const invite = await createFamilyInvite(familyId);
      setLatestInviteLinks((current) => ({ ...current, [familyId]: invite.inviteUrl }));
      setFamilyInvites((current) => ({
        ...current,
        [familyId]: [
          { id: invite.id, familyId: invite.familyId, createdByUser: invite.createdByUser, expiresAt: invite.expiresAt, usedAt: invite.usedAt, revokedAt: invite.revokedAt, createdAt: invite.createdAt, updatedAt: invite.updatedAt },
          ...(current[familyId] ?? []),
        ],
      }));
      setFamilyNotice('Invite link created. Share the link below.');
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to create invite link');
    } finally {
      setInviteActionFamilyId(null);
    }
  };

  const handleRevokeInvite = async (familyId: number, inviteId: number) => {
    setFamilyError(null);
    setFamilyNotice(null);
    setInviteActionFamilyId(familyId);
    try {
      await revokeFamilyInvite(inviteId);
      setFamilyInvites((current) => ({
        ...current,
        [familyId]: (current[familyId] ?? []).filter((invite) => invite.id !== inviteId),
      }));
      setFamilyNotice('Invite revoked.');
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to revoke invite');
    } finally {
      setInviteActionFamilyId(null);
    }
  };

  const handleAddMember = useCallback(
    async (familyId: number, userId: number) => {
      setAddMemberLoading(true);
      setAddMemberError(null);
      try {
        await addFamilyMember(familyId, userId);
        setFamilyNotice('Member added successfully.');
        await Promise.all([fetchFamilies(), fetchData()]);
      } catch (err) {
        setAddMemberError(err instanceof Error ? err.message : 'Failed to add member');
      } finally {
        setAddMemberLoading(false);
      }
    },
    [fetchFamilies, fetchData],
  );

  const handleCopyLink = useCallback(async (wishlistId: number) => {
    try {
      const { shareToken } = await getWishlistShareToken(wishlistId);
      const url = `${window.location.origin}/?share=${shareToken}`;
      await navigator.clipboard.writeText(url);
      setCopyState({ id: wishlistId, status: 'copied' });
      setTimeout(() => setCopyState(null), 2000);
    } catch {
      setCopyState({ id: wishlistId, status: 'error' });
      setTimeout(() => setCopyState(null), 3000);
    }
  }, []);

  const handleDeleteWishlist = useCallback(async (wishlistId: number) => {
    if (!window.confirm('Delete this wishlist? All items will be permanently removed.')) return;
    try {
      await deleteWishlist(wishlistId);
      setMyWishlists((prev) => prev.filter((wl) => wl.id !== wishlistId));
      await Promise.all([fetchData(), fetchMyItems()]);
    } catch (err) {
      setCreateWishlistError(err instanceof Error ? err.message : 'Failed to delete wishlist');
    }
  }, [fetchData, fetchMyItems]);

  const handleRenameWishlist = useCallback(async (wishlistId: number, title: string) => {
    try {
      const updated = await updateWishlist(wishlistId, { title });
      setMyWishlists((prev) => prev.map((wl) => wl.id === wishlistId ? { ...wl, title: updated.title } : wl));
    } catch (err) {
      setCreateWishlistError(err instanceof Error ? err.message : 'Failed to rename wishlist');
    }
  }, []);

  const handleArchiveWishlist = useCallback(async (wishlistId: number, isArchived: boolean) => {
    try {
      const updated = await updateWishlist(wishlistId, { isArchived });
      setMyWishlists((prev) => prev.map((wl) => wl.id === wishlistId ? { ...wl, isArchived: updated.isArchived } : wl));
    } catch (err) {
      setCreateWishlistError(err instanceof Error ? err.message : 'Failed to archive wishlist');
    }
  }, []);

  const handleReorderWishlist = useCallback(async (wishlistId: number, direction: 'up' | 'down') => {
    setMyWishlists((prev) => {
      const idx = prev.findIndex((wl) => wl.id === wishlistId);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const newOrder = [...prev];
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      void reorderWishlists(newOrder.map((wl) => wl.id)).catch(() => {
        // rollback on error is handled by re-fetching
        void fetchMyWishlists();
      });
      return newOrder;
    });
  }, [fetchMyWishlists]);

  const handleMoveItem = useCallback(async (itemId: number, wishlistId: number) => {
    try {
      await moveWishlistItem(itemId, wishlistId);
      await Promise.all([fetchData(), fetchMyItems(), fetchMyWishlists()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item');
    }
  }, [fetchData, fetchMyItems, fetchMyWishlists]);

  const handleDeleteFamily = useCallback(async (familyId: number) => {
    if (!window.confirm('Delete this family? All members will lose access. This cannot be undone.')) return;
    try {
      await deleteFamily(familyId);
      setFamilies((prev) => prev.filter((f) => f.id !== familyId));
      setFamilyInvites((prev) => { const copy = { ...prev }; delete copy[familyId]; return copy; });
      setLatestInviteLinks((prev) => { const copy = { ...prev }; delete copy[familyId]; return copy; });
      await fetchData();
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to delete family');
    }
  }, [fetchData]);

  const handleCreateWishlist = async (title: string) => {
    setCreateWishlistLoading(true);
    setCreateWishlistError(null);
    try {
      const wishlist = await createWishlist(title);
      setMyWishlists((prev) => [wishlist, ...prev]);
    } catch (err) {
      setCreateWishlistError(err instanceof Error ? err.message : 'Failed to create wishlist');
    } finally {
      setCreateWishlistLoading(false);
    }
  };

  const handleAddItem = async (
    wishlistId: number | null,
    data: { name: string; url?: string; price?: number; note?: string; priority?: number; quantity?: number; imageUrl?: string; category?: string; store?: string; variant?: string },
  ) => {
    setAddItemLoading(true);
    setAddItemError(null);
    try {
      let resolvedId = wishlistId;
      if (resolvedId === null) {
        const newWishlist = await createWishlist('My Wishlist');
        setMyWishlists((prev) => [newWishlist, ...prev]);
        resolvedId = newWishlist.id;
      }
      await createWishlistItem(resolvedId, data);
      await Promise.all([fetchData(), fetchMyWishlists(), fetchMyItems()]);
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setAddItemLoading(false);
    }
  };

  const handleClaim = useCallback(async (itemId: number) => {
    try {
      await claimWishlistItem(itemId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim item');
    }
  }, [fetchData]);

  const handleUnclaim = useCallback(async (itemId: number) => {
    try {
      await unclaimWishlistItem(itemId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unclaim item');
    }
  }, [fetchData]);

  const handleCloseDrilldown = useCallback(() => setViewingUser(null), []);

  const handleViewUserWishlist = (userId: number) => {
    const member = families.flatMap((f) => f.members).find((m) => m.id === userId);
    if (member) setViewingUser({ id: member.id, name: member.name });
    setActiveTab('feed');
  };

  // --- Rendering ---

  if (shareToken) {
    return <SharedWishlistPage token={shareToken} />;
  }

  if (authLoading) {
    return <div className="app-shell">Checking your session...</div>;
  }

  if (!currentUser) {
    const showPasswordField = authMode === 'login' || authMode === 'register';
    const showNameField = authMode === 'register';
    const showForgotField = authMode === 'forgot';
    const showResetFields = authMode === 'reset';

    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Wishlist</p>
          <h1>
            {authMode === 'login' && 'Sign in'}
            {authMode === 'register' && 'Create account'}
            {authMode === 'forgot' && 'Forgot password'}
            {authMode === 'reset' && 'Reset password'}
          </h1>
          <p className="subtle">
            {authMode === 'login' && 'Sign in to browse family wishlists and manage your own items.'}
            {authMode === 'register' && 'Create an account, then sign in immediately.'}
            {authMode === 'forgot' && 'Request a short-lived reset token for your account.'}
            {authMode === 'reset' && 'Use your reset token to choose a new password.'}
          </p>
          <form
            className="auth-form"
            onSubmit={(event) => {
              void handleAuthSubmit(event);
            }}
          >
            {showNameField && (
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
              />
            )}
            {(showPasswordField || showForgotField) && (
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
              />
            )}
            {showPasswordField && (
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              />
            )}
            {showResetFields && (
              <>
                <input
                  type="text"
                  placeholder="Reset token"
                  value={authForm.resetToken}
                  onChange={(event) => setAuthForm((current) => ({ ...current, resetToken: event.target.value }))}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={authForm.newPassword}
                  onChange={(event) => setAuthForm((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </>
            )}
            {authError && <p className="form-error">{authError}</p>}
            {authNotice && <p className="form-notice">{authNotice}</p>}
            {devResetToken && (
              <div className="info-panel">
                <strong>Development reset token</strong>
                <p>{devResetToken.token}</p>
                {devResetToken.expiresAt && <p>Expires: {devResetToken.expiresAt}</p>}
              </div>
            )}
            <button type="submit" className="primary-action">
              {authMode === 'login' && 'Sign in'}
              {authMode === 'register' && 'Register and sign in'}
              {authMode === 'forgot' && 'Generate reset token'}
              {authMode === 'reset' && 'Update password'}
            </button>
          </form>
          <div className="auth-links">
            {authMode !== 'login' && (
              <button className="secondary-action" onClick={() => handleAuthModeChange('login')}>
                Back to sign in
              </button>
            )}
            {authMode === 'login' && (
              <>
                <button className="secondary-action" onClick={() => handleAuthModeChange('register')}>
                  Need an account? Register
                </button>
                <button className="secondary-action" onClick={() => handleAuthModeChange('forgot')}>
                  Forgot password?
                </button>
              </>
            )}
            {authMode === 'forgot' && (
              <button className="secondary-action" onClick={() => handleAuthModeChange('reset')}>
                Already have a token? Reset password
              </button>
            )}
            {authMode === 'reset' && (
              <button className="secondary-action" onClick={() => handleAuthModeChange('forgot')}>
                Need a token first?
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Collect all unique family members (excluding current user) with their family name
  const familyMembers = families.flatMap((family) =>
    family.members
      .filter((member) => member.id !== currentUser.id)
      .map((member) => ({ member, familyName: family.name })),
  );

  return (
    <div className="app-shell">
      <AppHeader userName={currentUser.name} onSignOut={() => void handleLogout()} />
      <StatsRow
        myItemCount={myItems.length}
        myWishlistCount={myWishlists.length}
        familyCount={families.length}
      />
      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'wishlist' && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>My Wishlist</h2>
                <p className="subtle">Create wishlists and manage your items.</p>
              </div>
            </div>

            <CreateWishlistForm
              onSubmit={handleCreateWishlist}
              loading={createWishlistLoading}
              error={createWishlistError}
            />

            {myWishlists.length > 0 && (
              <div className="wishlist-list">
                {myWishlists.map((wl, idx) => (
                  <WishlistRow
                    key={wl.id}
                    wishlist={wl}
                    copyState={copyState}
                    isFirst={idx === 0}
                    isLast={idx === myWishlists.length - 1}
                    onCopyLink={(id) => void handleCopyLink(id)}
                    onRename={handleRenameWishlist}
                    onArchive={handleArchiveWishlist}
                    onDelete={handleDeleteWishlist}
                    onMoveUp={(id) => void handleReorderWishlist(id, 'up')}
                    onMoveDown={(id) => void handleReorderWishlist(id, 'down')}
                  />
                ))}
              </div>
            )}

            <AddItemForm
              wishlists={myWishlists}
              onSubmit={handleAddItem}
              loading={addItemLoading}
              error={addItemError}
            />

            {familyMembers.length > 0 && (
              <div className="follow-users-section">
                <h3>Family members</h3>
                <p className="subtle">Jump to a family member's items in the feed.</p>
                {familyMembers.map(({ member, familyName }) => (
                  <FollowUserRow
                    key={`${familyName}-${member.id}`}
                    member={member}
                    familyName={familyName}
                    onViewWishlist={handleViewUserWishlist}
                  />
                ))}
              </div>
            )}

            {myItems.length > 0 && (
              <div className="panel-header" style={{ marginTop: '1.5rem' }}>
                <h2>My items</h2>
              </div>
            )}
            {myItems.length === 0 ? (
              <div className="empty-state">
                <h3>No items yet</h3>
                <p>Add items to your wishlist above.</p>
              </div>
            ) : (
              <div className="wishlist-stack">
                {myItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    {...item}
                    isOwner={true}
                    onDelete={(id) => void onDeleteItem(id)}
                    onEdit={handleEditItem}
                    onMove={handleMoveItem}
                    wishlists={myWishlists}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <section className="panel">
            {viewingUser ? (
              <WishlistDrilldown
                viewingUser={viewingUser}
                onBack={handleCloseDrilldown}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
              />
            ) : (
              <>
                <div className="panel-header">
                  <div>
                    <h2>Shared wishlist feed</h2>
                    <p className="subtle">
                      The feed shows your own items plus wishlists from users who share a family with you.
                    </p>
                  </div>
                </div>
                <UserSearch
                  onSubmit={handleSearchSubmit}
                  value={inputUserName}
                  onChange={setInputUserName}
                />
                {loading && <h2>Loading...</h2>}
                {error ? (
                  <div className="empty-state">
                    <h3>{error}</h3>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="empty-state">
                    <h3>No visible wishlist items</h3>
                    <p>
                      {families.length === 0
                        ? 'You can only see your own items until you create or join a family.'
                        : 'No items match your current family access and search filters.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="wishlist-stack">
                      {filteredItems.map((item) => (
                        <WishlistItemCard
                          key={item.id}
                          {...item}
                          isOwner={item.ownerId === currentUser.id}
                          onDelete={(id) => void onDeleteItem(id)}
                          onEdit={handleEditItem}
                          onClaim={item.ownerId !== currentUser.id ? handleClaim : undefined}
                          onUnclaim={item.ownerId !== currentUser.id ? handleUnclaim : undefined}
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
                  </>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'families' && (
          <FamiliesPanel
            families={families}
            familyInvites={familyInvites}
            latestInviteLinks={latestInviteLinks}
            familyLoading={familyLoading}
            inviteAcceptanceLoading={inviteAcceptanceLoading}
            inviteActionFamilyId={inviteActionFamilyId}
            familyError={familyError}
            familyNotice={familyNotice}
            familyForm={familyForm}
            onCreateFamilyFormChange={(value) => setFamilyForm({ createName: value })}
            onCreateFamily={(event) => void handleCreateFamily(event)}
            onCreateInvite={(familyId) => void handleCreateInvite(familyId)}
            onRevokeInvite={(familyId, inviteId) => void handleRevokeInvite(familyId, inviteId)}
            onDeleteFamily={(familyId) => void handleDeleteFamily(familyId)}
            onAddMember={handleAddMember}
            addMemberLoading={addMemberLoading}
            addMemberError={addMemberError}
          />
        )}
      </div>
    </div>
  );
}

export default App;
