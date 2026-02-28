export const resolveApiBaseUrl = () => {
  const base = (import.meta as ImportMeta & { env?: Record<string, string> })
    .env?.VITE_API_BASE;
  if (base && base.trim()) {
    return base.replace(/\/+$/, '');
  }
  return 'http://localhost:8080';
};

export const API_ROOT = `${resolveApiBaseUrl()}/api`;
