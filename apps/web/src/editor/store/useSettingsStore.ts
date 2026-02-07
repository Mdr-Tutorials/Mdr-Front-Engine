import { create } from 'zustand';
import {
  createGlobalDefaults,
  createProjectDefaults,
  type GlobalSettingsState,
  type OverrideState,
} from '@/editor/features/settings/SettingsDefaults';

type ProjectGlobalSettingsState = {
  values: GlobalSettingsState;
  overrides: OverrideState;
};

type SettingsStore = {
  global: GlobalSettingsState;
  projectGlobalById: Record<string, ProjectGlobalSettingsState>;
  setGlobal: (partial: Partial<GlobalSettingsState>) => void;
  setGlobalValue: <K extends keyof GlobalSettingsState>(
    key: K,
    value: GlobalSettingsState[K]
  ) => void;
  ensureProjectGlobal: (projectId: string) => void;
  setProjectGlobalValue: <K extends keyof GlobalSettingsState>(
    projectId: string,
    key: K,
    value: GlobalSettingsState[K]
  ) => void;
  toggleProjectOverride: (
    projectId: string,
    key: keyof GlobalSettingsState
  ) => void;
  getEffectiveGlobalValue: <K extends keyof GlobalSettingsState>(
    projectId: string | undefined,
    key: K
  ) => GlobalSettingsState[K];
};

const getInitialLanguage = (): 'en' | 'zh-CN' => {
  // Check localStorage first (i18next stores language here)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('i18nextLng');
    if (stored === 'en' || stored === 'zh-CN') {
      return stored;
    }
  }

  // Detect from browser language
  if (typeof navigator !== 'undefined') {
    const browserLang =
      navigator.language ||
      (navigator as { userLanguage?: string }).userLanguage;
    if (browserLang?.startsWith('zh')) {
      return 'zh-CN';
    }
  }

  // Default to English
  return 'en';
};

export const useSettingsStore = create<SettingsStore>()((set) => ({
  global: {
    ...createGlobalDefaults(),
    language: getInitialLanguage(),
  },
  projectGlobalById: {},
  setGlobal: (partial) =>
    set((state) => ({
      global: { ...state.global, ...partial },
    })),
  setGlobalValue: (key, value) =>
    set((state) => ({
      global: { ...state.global, [key]: value },
    })),
  ensureProjectGlobal: (projectId) =>
    set((state) => {
      if (!projectId || state.projectGlobalById[projectId]) return state;
      const defaults = createGlobalDefaults();
      const overrides = Object.keys(defaults).reduce<OverrideState>((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      return {
        projectGlobalById: {
          ...state.projectGlobalById,
          [projectId]: {
            values: createProjectDefaults(),
            overrides,
          },
        },
      };
    }),
  setProjectGlobalValue: (projectId, key, value) =>
    set((state) => {
      if (!projectId) return state;
      const current = state.projectGlobalById[projectId] ?? {
        values: createProjectDefaults(),
        overrides: Object.keys(createGlobalDefaults()).reduce<OverrideState>(
          (acc, item) => {
            acc[item] = false;
            return acc;
          },
          {}
        ),
      };
      return {
        projectGlobalById: {
          ...state.projectGlobalById,
          [projectId]: {
            ...current,
            values: { ...current.values, [key]: value },
          },
        },
      };
    }),
  toggleProjectOverride: (projectId, key) =>
    set((state) => {
      if (!projectId) return state;
      const current = state.projectGlobalById[projectId] ?? {
        values: createProjectDefaults(),
        overrides: Object.keys(createGlobalDefaults()).reduce<OverrideState>(
          (acc, item) => {
            acc[item] = false;
            return acc;
          },
          {}
        ),
      };
      return {
        projectGlobalById: {
          ...state.projectGlobalById,
          [projectId]: {
            ...current,
            overrides: {
              ...current.overrides,
              [key]: !current.overrides[key],
            },
          },
        },
      };
    }),
  getEffectiveGlobalValue: (projectId, key) => {
    if (!projectId) {
      return useSettingsStore.getState().global[key];
    }
    const state = useSettingsStore.getState();
    const projectSettings = state.projectGlobalById[projectId];
    if (!projectSettings) return state.global[key];
    return projectSettings.overrides[key]
      ? projectSettings.values[key]
      : state.global[key];
  },
}));
