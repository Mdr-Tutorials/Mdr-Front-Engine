import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrHeading, MdrParagraph, MdrTabs } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';
import { ProjectSettingsContent } from './ProjectSettingsContent';
import { type OverrideState, createGlobalDefaults } from './SettingsDefaults';
import './SettingsPage.scss';

const createOverrideDefaults = (): OverrideState => {
    const defaults = createGlobalDefaults();
    return Object.keys(defaults).reduce<OverrideState>((acc, key) => {
        acc[key] = false;
        return acc;
    }, {});
};

export const ProjectSettingsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('editor');
    const { projectId } = useParams();
    const [overrides, setOverrides] = useState<OverrideState>(createOverrideDefaults);

    const handleToggleOverride = (key: keyof typeof overrides) => {
        setOverrides((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const basePath = projectId ? `/editor/project/${projectId}` : '/editor';

    const tabs = [
        {
            key: 'project',
            label: t('settings.projectPage.tabs.project'),
            content: <ProjectSettingsContent />,
        },
        {
            key: 'global',
            label: t('settings.projectPage.tabs.global'),
            content: (
                <div className="SettingsGlobalOverrides">
                    <div className="SettingsNotice">
                        <span className="SettingsNoticeTitle">
                            {t('settings.projectPage.overrides.title')}
                        </span>
                        <span className="SettingsNoticeBody">
                            {t('settings.projectPage.overrides.body')}
                        </span>
                    </div>
                    <GlobalSettingsContent
                        mode="project"
                        overrides={overrides}
                        onToggleOverride={handleToggleOverride}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="SettingsPage">
            <header className="SettingsPageHeader">
                <div>
                    <MdrHeading level={2}>{t('settings.projectPage.title')}</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        {t('settings.projectPage.subtitle')}
                    </MdrParagraph>
                </div>
                <div className="SettingsPageActions">
                    <MdrButton
                        text={t('settings.actions.exit')}
                        size="Small"
                        category="Secondary"
                        onClick={() => navigate(basePath)}
                    />
                </div>
            </header>
            <main className="SettingsPageBody">
                <MdrTabs items={tabs} />
            </main>
        </div>
    );
};
