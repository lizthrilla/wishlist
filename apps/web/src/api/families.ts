import type { FamilySummary } from '../types/wishlist';
import { apiRequest } from './auth';

export function getFamilies() {
  return apiRequest<FamilySummary[]>('/api/families');
}

export function createFamily(name: string) {
  return apiRequest<FamilySummary>('/api/families', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function joinFamily(joinCode: string) {
  return apiRequest<FamilySummary>('/api/families/join', {
    method: 'POST',
    body: JSON.stringify({ joinCode }),
  });
}
