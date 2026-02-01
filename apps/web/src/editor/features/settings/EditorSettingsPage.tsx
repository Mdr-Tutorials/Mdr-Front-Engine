import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrHeading, MdrParagraph } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';

export const EditorSettingsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('editor');

    return (
        <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-[24px] text-[var(--color-10)]">
            <header className="flex items-center justify-between gap-[16px] border-b border-b-[rgba(0,0,0,0.06)] px-[24px] py-[16px] backdrop-blur-[10px] [[data-theme='dark']_&]:border-b-[rgba(255,255,255,0.08)]">
                <div>
                    <MdrHeading level={2}>{t('settings.editorPage.title')}</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        {t('settings.editorPage.subtitle')}
                    </MdrParagraph>
                </div>
                <div className="flex gap-[10px]">
                    <MdrButton
                        text={t('settings.actions.exit')}
                        size="Small"
                        category="Secondary"
                        onClick={() => navigate('/editor')}
                    />
                </div>
            </header>
            <main className="flex flex-col gap-[18px] px-[24px] pb-[32px] pt-[16px] max-[1100px]:px-[18px] max-[1100px]:pb-[24px] max-[1100px]:pt-[14px]">
                <GlobalSettingsContent mode="global" />
            </main>
        </div>
    );
};
