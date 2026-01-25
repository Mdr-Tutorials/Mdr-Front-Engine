export type ApiErrorPayload = {
  error?: string
  message?: string
}

export type PublicUser = {
  id: string
  email: string
  name: string
  description?: string
  createdAt: string
}

export type AuthResponse = {
  user: PublicUser
  token: string
  expiresAt: string
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

const resolveBaseUrl = () => {
  const base = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE
  if (base && base.trim()) {
    return base.replace(/\/+$/, "")
  }
  return "http://localhost:8080"
}

const API_ROOT = `${resolveBaseUrl()}/api`

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, options)
  if (response.status === 204) {
    return undefined as T
  }
  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const payload = isJson ? await response.json() : await response.text()
  if (!response.ok) {
    const apiPayload = payload as ApiErrorPayload
    const message =
      (typeof apiPayload === "object" && apiPayload?.message) ||
      response.statusText ||
      "Request failed."
    const code = typeof apiPayload === "object" ? apiPayload?.error : undefined
    throw new ApiError(message, response.status, code)
  }
  return payload as T
}

export const authApi = {
  register: async (data: { email: string; password: string; name: string; description?: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  login: async (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  me: async (token: string) =>
    request<{ user: PublicUser }>("/auth/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
  logout: async (token: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
  updateProfile: async (
    token: string,
    data: { name?: string; description?: string }
  ) =>
    request<{ user: PublicUser }>("/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),
}
