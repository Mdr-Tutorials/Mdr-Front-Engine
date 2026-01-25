import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

export const SettingsEffects = () => {
    const { i18n } = useTranslation();
    const { language, density, fontScale } = useSettingsStore((state) => state.global);

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
