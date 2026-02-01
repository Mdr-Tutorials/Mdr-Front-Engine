import { render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SettingsEffects } from "../SettingsEffects"
import { resetSettingsStore } from "@/test-utils/editorStore"

const getChangeLanguage = () =>
  (globalThis as { __i18nChangeLanguage?: ReturnType<typeof vi.fn> }).__i18nChangeLanguage

describe("SettingsEffects", () => {
  beforeEach(() => {
    getChangeLanguage()?.mockClear()
    resetSettingsStore({
      language: "zh-CN",
      theme: "light",
      density: "compact",
      fontScale: 120,
    })
  })

  it("syncs document attributes with settings", async () => {
    render(<SettingsEffects />)

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("zh-CN")
      expect(getChangeLanguage()).toHaveBeenCalledWith("zh-CN")
      expect(document.documentElement.getAttribute("data-theme")).toBe("light")
      expect(document.body.dataset.density).toBe("compact")
      expect(document.documentElement.style.getPropertyValue("--app-font-scale")).toBe("1.2")
    })
  })
})
