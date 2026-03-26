import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from './api/auth';
import {
  acceptFamilyInvite,
  createFamily,
  createFamilyInvite,
  getFamilies,
  getFamilyInvites,
  revokeFamilyInvite,
} from './api/families';
import { deleteWishListItem, getWishlistItems } from './api/wishlistItems';
import { Card, DropDown, PaginationButtons, UserSearch } from './components/index';
import type {
  AuthUser,
  FamilyInviteSummary,
  FamilySummary,
  PaginationMeta,
  WishlistItemResponse,
} from './types/wishlist';

const DEFAULT_LIMIT = 10;

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

function App() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemResponse[]>([]);
  const [inputUserName, setInputUserName] = useState('');
  const [searchUserName, setSearchUserName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [familyInvites, setFamilyInvites] = useState<Record<number, FamilyInviteSummary[]>>({});
  const [latestInviteLinks, setLatestInviteLinks] = useState<Record<number, string>>({});
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familyNotice, setFamilyNotice] = useState<string | null>(null);
  const [familyForm, setFamilyForm] = useState({
    createName: '',
  });
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('inviteToken');
  });
  const [inviteAcceptanceLoading, setInviteAcceptanceLoading] = useState(false);
  const [inviteActionFamilyId, setInviteActionFamilyId] = useState<number | null>(null);

  const clearInviteTokenFromUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

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
      setWishlistItems([]);
      setMeta(undefined);
      setError(err instanceof Error ? err.message : 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentUser, limit]);

  useEffect(() => {
    void bootstrapUser();
  }, [bootstrapUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    void fetchData();
    void fetchFamilies();
  }, [currentUser, fetchData, fetchFamilies]);

  useEffect(() => {
    if (!pendingInviteToken) {
      return;
    }

    if (!currentUser) {
      setAuthNotice('Sign in to accept your family invite link.');
      setAuthMode('login');
      return;
    }

    if (inviteAcceptanceLoading) {
      return;
    }

    const acceptInvite = async () => {
      setInviteAcceptanceLoading(true);
      setFamilyError(null);

      try {
        const family = await acceptFamilyInvite(pendingInviteToken);
        setFamilyNotice(`You joined ${family.name}.`);
        clearInviteTokenFromUrl();
        setPendingInviteToken(null);
        await fetchFamilies();
        await fetchData();
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

  const resetAuthFeedback = () => {
    setAuthError(null);
    setAuthNotice(null);
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    resetAuthFeedback();
    if (mode !== 'reset') {
      setDevResetToken(null);
    }
    setAuthMode(mode);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetAuthFeedback();

    try {
      const normalizedEmail = authForm.email.trim().toLowerCase();

      if (authMode === 'register') {
        await register({
          name: authForm.name.trim(),
          email: normalizedEmail,
          password: authForm.password,
        });

        const response = await login({
          email: normalizedEmail,
          password: authForm.password,
        });

        setCurrentUser(response.user);
        setAuthForm({
          name: '',
          email: '',
          password: '',
          resetToken: '',
          newPassword: '',
        });
        setCurrentPage(1);
        setError(null);
        return;
      }

      if (authMode === 'login') {
        const response = await login({
          email: normalizedEmail,
          password: authForm.password,
        });

        setCurrentUser(response.user);
        setAuthForm({
          name: '',
          email: '',
          password: '',
          resetToken: '',
          newPassword: '',
        });
        setCurrentPage(1);
        setError(null);
        return;
      }

      if (authMode === 'forgot') {
        const response = await forgotPassword(normalizedEmail);
        setAuthNotice(response.message);
        if (response.resetToken) {
          setDevResetToken({
            token: response.resetToken,
            expiresAt: response.expiresAt,
          });
          setAuthForm((current) => ({
            ...current,
            resetToken: response.resetToken ?? '',
          }));
        }
        return;
      }

      const response = await resetPassword({
        token: authForm.resetToken.trim(),
        password: authForm.newPassword,
      });
      setAuthNotice(response.message);
      setAuthForm((current) => ({
        ...current,
        password: '',
        resetToken: '',
        newPassword: '',
      }));
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
      setMeta(undefined);
      setFamilies([]);
      setFamilyInvites({});
      setLatestInviteLinks({});
      setError(null);
      setAuthError(null);
      setAuthNotice(null);
      setFamilyError(null);
      setFamilyNotice(null);
    }
  };

  const handleCreateFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFamilyError(null);
    setFamilyNotice(null);

    try {
      const family = await createFamily(familyForm.createName.trim());
      setFamilies((current) => [...current, family]);
      setFamilyForm({ createName: '' });
      setFamilyNotice(`Created ${family.name}.`);
      await fetchFamilies();
      await fetchData();
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
      setLatestInviteLinks((current) => ({
        ...current,
        [familyId]: invite.inviteUrl,
      }));
      setFamilyInvites((current) => ({
        ...current,
        [familyId]: [
          {
            id: invite.id,
            familyId: invite.familyId,
            createdByUser: invite.createdByUser,
            expiresAt: invite.expiresAt,
            usedAt: invite.usedAt,
            revokedAt: invite.revokedAt,
            createdAt: invite.createdAt,
            updatedAt: invite.updatedAt,
          },
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
            {authMode === 'login' &&
              'Sign in to browse family wishlists and manage your own items.'}
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
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            )}
            {(showPasswordField || showForgotField) && (
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
            )}
            {showPasswordField && (
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
            )}
            {showResetFields && (
              <>
                <input
                  type="text"
                  placeholder="Reset token"
                  value={authForm.resetToken}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      resetToken: event.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={authForm.newPassword}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
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
                <button
                  className="secondary-action"
                  onClick={() => handleAuthModeChange('register')}
                >
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

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Your families</h2>
              <p className="subtle">
                Wishlist visibility is limited to people who share at least one family with you.
              </p>
            </div>
            {(familyLoading || inviteAcceptanceLoading) && <span className="pill">Refreshing</span>}
          </div>
          <div className="family-forms family-forms-single">
            <form className="stacked-form" onSubmit={(event) => void handleCreateFamily(event)}>
              <label htmlFor="create-family-name">Create family</label>
              <input
                id="create-family-name"
                type="text"
                placeholder="Family name"
                value={familyForm.createName}
                onChange={(event) =>
                  setFamilyForm((current) => ({
                    ...current,
                    createName: event.target.value,
                  }))
                }
              />
              <button type="submit" className="primary-action">
                Create family
              </button>
            </form>
          </div>
          {familyError && <p className="form-error">{familyError}</p>}
          {familyNotice && <p className="form-notice">{familyNotice}</p>}
          <div className="family-list">
            {families.length === 0 ? (
              <div className="empty-state">
                <h3>No families yet</h3>
                <p>Create one to start sharing invite links with relatives.</p>
              </div>
            ) : (
              families.map((family) => (
                <article className="family-card" key={family.id}>
                  <div className="family-card-header">
                    <div>
                      <h3>{family.name}</h3>
                      <div className="family-card-meta">
                        <span className="pill">{family.memberCount} members</span>
                        <span className="role-pill">{family.currentUserRole}</span>
                      </div>
                    </div>
                  </div>
                  <ul className="family-members">
                    {family.members.map((member) => (
                      <li key={member.id}>
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                      </li>
                    ))}
                  </ul>
                  {family.currentUserRole === 'admin' && (
                    <div className="invite-panel">
                      <div className="invite-panel-header">
                        <h4>Invite links</h4>
                        <button
                          className="secondary-action"
                          onClick={() => void handleCreateInvite(family.id)}
                        >
                          {inviteActionFamilyId === family.id ? 'Working...' : 'Create invite link'}
                        </button>
                      </div>
                      {latestInviteLinks[family.id] && (
                        <div className="invite-link-card">
                          <label htmlFor={`invite-link-${family.id}`}>Latest invite link</label>
                          <input
                            id={`invite-link-${family.id}`}
                            type="text"
                            readOnly
                            value={latestInviteLinks[family.id]}
                          />
                        </div>
                      )}
                      {(familyInvites[family.id] ?? []).length === 0 ? (
                        <p className="subtle">No active invites.</p>
                      ) : (
                        <ul className="invite-list">
                          {(familyInvites[family.id] ?? []).map((invite) => (
                            <li key={invite.id}>
                              <div>
                                <strong>
                                  Expires {new Date(invite.expiresAt).toLocaleString()}
                                </strong>
                                <p className="subtle">Created by {invite.createdByUser.name}</p>
                              </div>
                              <button
                                className="secondary-action"
                                onClick={() => void handleRevokeInvite(family.id, invite.id)}
                              >
                                Revoke
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel">
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
