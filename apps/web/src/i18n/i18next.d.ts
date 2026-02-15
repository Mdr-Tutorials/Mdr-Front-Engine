import type { I18nResources, defaultNS } from '@mdr/i18n';
import type en from './resources/en.json';

type AppResources = typeof en;
type CombinedResources = I18nResources['en'] & AppResources;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: CombinedResources;
  }
}

export {};
