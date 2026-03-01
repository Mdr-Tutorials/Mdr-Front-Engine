import { apiRequest, type ApiErrorPayload, ApiError } from '@/infra/api';

export { ApiError, type ApiErrorPayload };

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  description?: string;
  createdAt: string;
};

export type AuthResponse = {
  user: PublicUser;
  token: string;
  expiresAt: string;
};

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => apiRequest<T>(path, options);

const mergeHeaders = (...sources: Array<HeadersInit | undefined>): Headers => {
  const headers = new Headers();
  sources.forEach((source) => {
    if (!source) return;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  });
  return headers;
};

export const authApi = {
  register: async (
    data: {
      email: string;
      password: string;
      name: string;
      description?: string;
    },
    options: RequestInit = {}
  ) =>
    request<AuthResponse>('/auth/register', {
      ...options,
      method: 'POST',
      headers: mergeHeaders(
        { 'Content-Type': 'application/json' },
        options.headers
      ),
      body: JSON.stringify(data),
    }),
  login: async (
    data: { email: string; password: string },
    options: RequestInit = {}
  ) =>
    request<AuthResponse>('/auth/login', {
      ...options,
      method: 'POST',
      headers: mergeHeaders(
        { 'Content-Type': 'application/json' },
        options.headers
      ),
      body: JSON.stringify(data),
    }),
  me: async (token: string, options: RequestInit = {}) =>
    request<{ user: PublicUser }>('/auth/me', {
      ...options,
      headers: mergeHeaders(
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        options.headers
      ),
    }),
  logout: async (token: string, options: RequestInit = {}) =>
    request<void>('/auth/logout', {
      ...options,
      method: 'POST',
      headers: mergeHeaders(
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        options.headers
      ),
    }),
  updateProfile: async (
    token: string,
    data: { name?: string; description?: string },
    options: RequestInit = {}
  ) =>
    request<{ user: PublicUser }>('/users/me', {
      ...options,
      method: 'PATCH',
      headers: mergeHeaders(
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        options.headers
      ),
      body: JSON.stringify(data),
    }),
};
