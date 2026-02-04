import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrHeading, MdrParagraph } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';

export const EditorSettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('editor');

  return (
    <div className="mx-auto flex min-h-screen max-w-350 flex-col px-6 text-(--color-10)">
      <header className="flex items-center justify-between gap-4 border-b border-b-[rgba(0,0,0,0.06)] px-6 py-4 backdrop-blur-[10px] in-data-[theme='dark']:border-b-[rgba(255,255,255,0.08)]">
        <div>
          <MdrHeading level={2}>{t('settings.editorPage.title')}</MdrHeading>
          <MdrParagraph size="Small" color="Muted">
            {t('settings.editorPage.subtitle')}
          </MdrParagraph>
        </div>
        <div className="flex gap-2.5">
          <MdrButton
            text={t('settings.actions.exit')}
            size="Small"
            category="Secondary"
            onClick={() => navigate('/editor')}
          />
        </div>
      </header>
      <main className="flex flex-col gap-4.5 px-6 pb-8 pt-4 max-[1100px]:px-4.5 max-[1100px]:pb-6 max-[1100px]:pt-3.5">
        <GlobalSettingsContent mode="global" />
      </main>
    </div>
  );
};
