import { useEffect } from 'react';
import { useSettingsStore } from '../editor/store/useSettingsStore';

export function ThemeSync() {
    const theme = useSettingsStore((state) => state.global.theme);
    const setGlobalValue = useSettingsStore((state) => state.setGlobalValue);

    // 1. Initialize on mount
    useEffect(() => {
        // Priority: LocalStorage > System > Default (Light)
        let resolvedTheme: 'light' | 'dark' = 'light';
        const storedTheme =
            typeof localStorage !== 'undefined'
                ? localStorage.getItem('theme')
                : null;

        if (storedTheme === 'light' || storedTheme === 'dark') {
            resolvedTheme = storedTheme;
        } else if (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
            resolvedTheme = 'dark';
        }

        // Only update if different or if current is 'home' default
        if (theme === 'home' || theme !== resolvedTheme) {
            setGlobalValue('theme', resolvedTheme);
        }
    }, []);

    // 2. Sync to DOM and LocalStorage whenever theme changes
    useEffect(() => {
        if (theme === 'light' || theme === 'dark') {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    return null;
}
