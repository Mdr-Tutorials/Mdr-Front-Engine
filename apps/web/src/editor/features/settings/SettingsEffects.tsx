import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

export const SettingsEffects = () => {
    const { i18n } = useTranslation();
    const { language, theme, density, fontScale } = useSettingsStore((state) => state.global);

    useEffect(() => {
        if (!language) return;
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        const applyTheme = (value: 'light' | 'dark') => {
            if (root.getAttribute('data-theme') === value) return;
            root.setAttribute('data-theme', value);
        };

        if (theme === 'light' || theme === 'dark') {
            applyTheme(theme);
            return;
        }

        if (theme !== 'home') return;

        const resolveHomeTheme = () => {
            const storedTheme = root.getAttribute('data-theme');
            if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return 'light';
        };

        applyTheme(resolveHomeTheme());

        const observer = new MutationObserver((mutations) => {
            if (!mutations.some((mutation) => mutation.attributeName === 'data-theme')) return;
            const nextTheme = resolveHomeTheme();
            applyTheme(nextTheme);
        });

        observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, [theme]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (density === 'comfortable') {
            delete document.body.dataset.density;
            return;
        }
        document.body.dataset.density = density;
    }, [density]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const scale = Number(fontScale) ? Number(fontScale) / 100 : 1;
        document.documentElement.style.setProperty('--app-font-scale', String(scale));
    }, [fontScale]);

    return null;
};
