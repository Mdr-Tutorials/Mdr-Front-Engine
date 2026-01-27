import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrHeading, MdrParagraph } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';
import './SettingsPage.scss';

export const EditorSettingsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('editor');

    return (
        <div className="SettingsPage">
            <header className="SettingsPageHeader">
                <div>
                    <MdrHeading level={2}>{t('settings.editorPage.title')}</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        {t('settings.editorPage.subtitle')}
                    </MdrParagraph>
                </div>
                <div className="SettingsPageActions">
                    <MdrButton
                        text={t('settings.actions.exit')}
                        size="Small"
                        category="Secondary"
                        onClick={() => navigate('/editor')}
                    />
                </div>
            </header>
            <main className="SettingsPageBody">
                <GlobalSettingsContent mode="global" />
            </main>
        </div>
    );
};
