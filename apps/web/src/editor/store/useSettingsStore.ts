import { create } from 'zustand';
import { createGlobalDefaults, type GlobalSettingsState } from '@/editor/features/settings/SettingsDefaults';

type SettingsStore = {
    global: GlobalSettingsState;
    setGlobal: (partial: Partial<GlobalSettingsState>) => void;
    setGlobalValue: <K extends keyof GlobalSettingsState>(key: K, value: GlobalSettingsState[K]) => void;
};

export const useSettingsStore = create<SettingsStore>()((set) => ({
    global: createGlobalDefaults(),
    setGlobal: (partial) =>
        set((state) => ({
            global: { ...state.global, ...partial },
        })),
    setGlobalValue: (key, value) =>
        set((state) => ({
            global: { ...state.global, [key]: value },
        })),
}));
