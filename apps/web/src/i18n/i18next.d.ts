import type { I18nResources } from "@mdr/i18n"
import type en from "./resources/en.json"

type AppResources = typeof en

declare module "i18next" {
  interface CustomTypeOptions {
    resources: I18nResources["en"] & AppResources
  }
}
