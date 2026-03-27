import { useState, type FormEvent } from 'react';
import type { FamilySummary, UserSearchResult } from '../types/wishlist';
import { searchUsers } from '../api/users';

interface UserSearchPanelProps {
  families: FamilySummary[];
  onAddMember: (familyId: number, userId: number) => Promise<void>;
  addMemberLoading: boolean;
  addMemberError: string | null;
}

export default function UserSearchPanel({
  families,
  onAddMember,
  addMemberLoading,
  addMemberError,
}: UserSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<Record<number, number>>({});
  const [addedUserIds, setAddedUserIds] = useState<Set<number>>(new Set());

  const adminFamilies = families.filter((f) => f.currentUserRole === 'admin');

  if (adminFamilies.length === 0) {
    return null;
  }

  const defaultFamilyId = adminFamilies[0]?.id;

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const data = await searchUsers(query.trim());
      setResults(data);
      if (data.length === 0) setSearchError('No users found.');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId: number) => {
    const familyId = selectedFamilyId[userId] ?? defaultFamilyId;
    if (!familyId) return;
    await onAddMember(familyId, userId);
    setAddedUserIds((prev) => new Set(prev).add(userId));
  };

  return (
    <div className="user-search-panel">
      <h3>Find people</h3>
      <p className="subtle">Search for other users to add directly to one of your families.</p>
      <form
        className="user-search-form"
        onSubmit={(event) => {
          void handleSearch(event);
        }}
      >
        <input
          type="text"
          placeholder="Search by name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={searching}
        />
        <button type="submit" className="secondary-action" disabled={searching || !query.trim()}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>
      {searchError && <p className="subtle" style={{ marginTop: '0.5rem' }}>{searchError}</p>}
      {addMemberError && <p className="form-error">{addMemberError}</p>}
      {results.length > 0 && (
        <ul className="user-search-results">
          {results.map((user) => {
            const wasAdded = addedUserIds.has(user.id);
            return (
              <li key={user.id} className="user-search-result-row">
                <div>
                  <strong>{user.name}</strong>
                  <span className="subtle"> {user.email}</span>
                </div>
                {wasAdded ? (
                  <span className="pill">Added</span>
                ) : (
                  <div className="user-search-result-actions">
                    {adminFamilies.length > 1 && (
                      <select
                        value={selectedFamilyId[user.id] ?? defaultFamilyId}
                        onChange={(event) =>
                          setSelectedFamilyId((prev) => ({
                            ...prev,
                            [user.id]: Number(event.target.value),
                          }))
                        }
                        disabled={addMemberLoading}
                      >
                        {adminFamilies.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      className="secondary-action"
                      onClick={() => void handleAdd(user.id)}
                      disabled={addMemberLoading}
                    >
                      {addMemberLoading ? 'Adding...' : `Add to ${adminFamilies.length === 1 ? adminFamilies[0].name : 'family'}`}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
