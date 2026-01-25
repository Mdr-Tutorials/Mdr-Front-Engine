import i18next, { type i18n, type InitOptions } from "i18next"
import en from "./resources/en.json"
import zhCN from "./resources/zh-CN.json"

export const defaultNS = "common" as const

export const resources = {
  en,
  "zh-CN": zhCN,
} as const

export type I18nResources = typeof resources
export type SupportedLanguage = keyof I18nResources
export type I18nNamespace = keyof I18nResources["en"]

export type CreateI18nOptions = Omit<
  InitOptions,
  "resources" | "defaultNS" | "ns" | "lng" | "fallbackLng"
> & {
  lng?: SupportedLanguage
  fallbackLng?: SupportedLanguage
}

export const supportedLngs: SupportedLanguage[] = ["en", "zh-CN"]

export const createI18nInstance = async (
  options: CreateI18nOptions = {},
): Promise<i18n> => {
  const instance = i18next.createInstance()
  await instance.init({
    resources,
    defaultNS,
    ns: [defaultNS],
    lng: options.lng ?? "en",
    fallbackLng: options.fallbackLng ?? "en",
    interpolation: { escapeValue: false },
    ...options,
  })
  return instance
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: I18nResources["en"]
  }
}
