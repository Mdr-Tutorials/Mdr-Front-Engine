import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MdrAiSettings } from '@mdr/ai';
import { createDefaultMdrAiSettings } from '@mdr/ai';

type AiSettingsStore = {
  settings: MdrAiSettings;
  setSettings: (settings: MdrAiSettings) => void;
  resetSettings: () => void;
};

export const useAiSettingsStore = create<AiSettingsStore>()(
  persist(
    (set) => ({
      settings: createDefaultMdrAiSettings(),
      setSettings: (settings) => set({ settings }),
      resetSettings: () => set({ settings: createDefaultMdrAiSettings() }),
    }),
    {
      name: 'mdr-ai-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
