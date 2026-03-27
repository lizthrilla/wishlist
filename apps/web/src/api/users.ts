import type { UserSearchResult, FamilySummary } from '../types/wishlist';
import { apiRequest } from './auth';

export function searchUsers(q: string) {
  return apiRequest<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
}

export function addFamilyMember(familyId: number, userId: number) {
  return apiRequest<FamilySummary>(`/api/families/${familyId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
