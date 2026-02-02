import { create } from 'zustand';
import { createGlobalDefaults, type GlobalSettingsState } from '@/editor/features/settings/SettingsDefaults';

type SettingsStore = {
    global: GlobalSettingsState;
    setGlobal: (partial: Partial<GlobalSettingsState>) => void;
    setGlobalValue: <K extends keyof GlobalSettingsState>(key: K, value: GlobalSettingsState[K]) => void;
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
        const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage;
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
    setGlobal: (partial) =>
        set((state) => ({
            global: { ...state.global, ...partial },
        })),
    setGlobalValue: (key, value) =>
        set((state) => ({
            global: { ...state.global, [key]: value },
        })),
}));
