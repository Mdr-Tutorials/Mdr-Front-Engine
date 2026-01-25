import { createI18nInstance } from "@mdr/i18n"
import { initReactI18next } from "react-i18next"
import en from "./resources/en.json"
import zhCN from "./resources/zh-CN.json"

const appResources = {
  en,
  "zh-CN": zhCN,
} as const

const appNamespaces = Object.keys(en)

export const initI18n = async () => {
  const instance = await createI18nInstance({
    lng: "zh-CN",
    fallbackLng: "en",
    namespaces: appNamespaces,
    plugins: [initReactI18next],
  })

  Object.entries(appResources).forEach(([lng, resource]) => {
    Object.entries(resource).forEach(([namespace, data]) => {
      instance.addResourceBundle(lng, namespace, data, true, true)
    })
  })

  await instance.loadNamespaces(appNamespaces)
  return instance
}
