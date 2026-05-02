import { useEffect } from 'react';
import { authApi, ApiError } from './authApi';
import { isAuthSessionExpired, useAuthStore } from './useAuthStore';
import { isAbortError } from '@/infra/api';

export const AuthSessionSync = () => {
  const token = useAuthStore((state) => state.token);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || isAuthSessionExpired(expiresAt)) {
      clearSession();
      return;
    }
    let cancelled = false;
    const controller =
      typeof AbortController === 'function' ? new AbortController() : null;
    const requestOptions: RequestInit = controller
      ? { signal: controller.signal }
      : {};

    authApi
      .me(token, requestOptions)
      .then((response) => {
        if (cancelled) return;
        setUser(response.user);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [clearSession, expiresAt, hasHydrated, setUser, token]);

  return null;
};
