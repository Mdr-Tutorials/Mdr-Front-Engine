import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

export const SettingsEffects = () => {
    const { i18n } = useTranslation();
    const { projectId } = useParams();
    const language = useSettingsStore((state) => {
        const projectSettings = projectId
            ? state.projectGlobalById[projectId]
            : undefined;
        return projectSettings?.overrides.language
            ? projectSettings.values.language
            : state.global.language;
    });
    const theme = useSettingsStore((state) => {
        const projectSettings = projectId
            ? state.projectGlobalById[projectId]
            : undefined;
        return projectSettings?.overrides.theme
            ? projectSettings.values.theme
            : state.global.theme;
    });
    const density = useSettingsStore((state) => {
        const projectSettings = projectId
            ? state.projectGlobalById[projectId]
            : undefined;
        return projectSettings?.overrides.density
            ? projectSettings.values.density
            : state.global.density;
    });
    const fontScale = useSettingsStore((state) => {
        const projectSettings = projectId
            ? state.projectGlobalById[projectId]
            : undefined;
        return projectSettings?.overrides.fontScale
            ? projectSettings.values.fontScale
            : state.global.fontScale;
    });
    const ensureProjectGlobal = useSettingsStore(
        (state) => state.ensureProjectGlobal
    );

    useEffect(() => {
        if (!projectId) return;
        ensureProjectGlobal(projectId);
    }, [ensureProjectGlobal, projectId]);

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
            if (storedTheme === 'light' || storedTheme === 'dark')
                return storedTheme;
            if (typeof window !== 'undefined' && window.matchMedia) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
            }
            return 'light';
        };

        applyTheme(resolveHomeTheme());

        const observer = new MutationObserver((mutations) => {
            if (
                !mutations.some(
                    (mutation) => mutation.attributeName === 'data-theme'
                )
            )
                return;
            const nextTheme = resolveHomeTheme();
            applyTheme(nextTheme);
        });

        observer.observe(root, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
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
        document.documentElement.style.setProperty(
            '--app-font-scale',
            String(scale)
        );
    }, [fontScale]);

    return null;
};
