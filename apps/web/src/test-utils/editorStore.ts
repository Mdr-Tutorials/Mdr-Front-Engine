import type { ComponentNode, MIRDocument } from "@/core/types/engine.types"
import { createGlobalDefaults, type GlobalSettingsState } from "@/editor/features/settings/SettingsDefaults"
import { useEditorStore } from "@/editor/store/useEditorStore"
import { useSettingsStore } from "@/editor/store/useSettingsStore"

type EditorState = ReturnType<typeof useEditorStore.getState>

export const createMirDoc = (children: ComponentNode[] = []): MIRDocument => ({
  version: "1.0",
  ui: {
    root: {
      id: "root",
      type: "container",
      ...(children.length ? { children } : {}),
    },
  },
})

export const resetEditorStore = (overrides: Partial<EditorState> = {}) => {
  const state = useEditorStore.getState()
  useEditorStore.setState(
    {
      ...state,
      mirDoc: createMirDoc(),
      generatedCode: "",
      isExportModalOpen: false,
      blueprintStateByProject: {},
      projectsById: {},
      ...overrides,
    },
    true,
  )
}

export const resetSettingsStore = (overrides: Partial<GlobalSettingsState> = {}) => {
  const state = useSettingsStore.getState()
  useSettingsStore.setState(
    {
      ...state,
      global: { ...createGlobalDefaults(), ...overrides },
    },
    true,
  )
}
