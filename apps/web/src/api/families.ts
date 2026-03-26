import type { CreatedFamilyInvite, FamilyInviteSummary, FamilySummary } from '../types/wishlist';
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

export function getFamilyInvites(familyId: number) {
  return apiRequest<FamilyInviteSummary[]>(`/api/families/${familyId}/invites`);
}

export function createFamilyInvite(familyId: number) {
  return apiRequest<CreatedFamilyInvite>(`/api/families/${familyId}/invites`, {
    method: 'POST',
  });
}

export function acceptFamilyInvite(token: string) {
  return apiRequest<FamilySummary>('/api/families/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function revokeFamilyInvite(inviteId: number) {
  return apiRequest<{ success: boolean }>(`/api/families/invites/${inviteId}/revoke`, {
    method: 'POST',
  });
}
