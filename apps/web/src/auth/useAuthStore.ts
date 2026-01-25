import { create } from "zustand"
import type { PublicUser } from "./authApi"

type AuthState = {
  token: string | null
  expiresAt: string | null
  user: PublicUser | null
  setSession: (token: string, user: PublicUser, expiresAt?: string) => void
  setUser: (user: PublicUser | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  expiresAt: null,
  user: null,
  setSession: (token, user, expiresAt) =>
    set({
      token,
      user,
      expiresAt: expiresAt ?? null,
    }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ token: null, user: null, expiresAt: null }),
}))
