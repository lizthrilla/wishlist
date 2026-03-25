import type { AuthUser } from '../types/wishlist';

const BASE_URL = 'http://localhost:3000';

type AuthPayload = {
  email: string;
  password: string;
  name?: string;
};

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getCurrentUser() {
  return apiRequest<AuthResponse>('/api/auth/me');
}

export function register(payload: AuthPayload) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: AuthPayload) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  });
}
type AuthResponse = {
  user: AuthUser;
};
