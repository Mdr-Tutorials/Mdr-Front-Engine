import type { i18n } from 'i18next';

declare module 'react-i18next' {
  export function useTranslation(
    ns?: string | string[],
    options?: Record<string, unknown>
  ): {
    t: (
      key: string,
      defaultValueOrOptions?: unknown,
      options?: Record<string, unknown>
    ) => string;
    i18n: i18n;
    ready: boolean;
  };
}
