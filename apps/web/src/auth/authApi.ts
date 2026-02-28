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

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    description?: string;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  login: async (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  me: async (token: string) =>
    request<{ user: PublicUser }>('/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }),
  logout: async (token: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }),
  updateProfile: async (
    token: string,
    data: { name?: string; description?: string }
  ) =>
    request<{ user: PublicUser }>('/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),
};
