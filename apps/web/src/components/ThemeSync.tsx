import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import {
  applyThemePreference,
  getStoredThemePreference,
  normalizeThemePreference,
  watchSystemThemePreference,
} from '@/theme/themeRuntime';

export function ThemeSync() {
  const theme = useSettingsStore((state) => state.global.theme);
  const setGlobalValue = useSettingsStore((state) => state.setGlobalValue);
  const hasLoadedStoredThemeRef = useRef(false);

  useEffect(() => {
    let preference = normalizeThemePreference(theme) ?? 'home';

    if (!hasLoadedStoredThemeRef.current) {
      hasLoadedStoredThemeRef.current = true;
      const storedTheme = getStoredThemePreference();

      if (storedTheme && storedTheme !== preference) {
        setGlobalValue('theme', storedTheme);
        return;
      }

      preference = storedTheme ?? preference;
    }

    applyThemePreference(preference);

    if (preference !== 'home') {
      return;
    }

    return watchSystemThemePreference(() => applyThemePreference(preference));
  }, [setGlobalValue, theme]);

  return null;
}
