import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrHeading, MdrParagraph, MdrTabs } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';
import { ProjectSettingsContent } from './ProjectSettingsContent';
import { type OverrideState, createGlobalDefaults } from './SettingsDefaults';

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
                <div className="grid gap-[12px]">
                    <div className="flex items-center gap-[10px] rounded-[12px] bg-[rgba(0,0,0,0.04)] px-[12px] py-[8px] text-[12px] text-[var(--color-7)] [[data-theme='dark']_&]:bg-[rgba(255,255,255,0.08)]">
                        <span className="font-semibold text-[var(--color-9)]">
                            {t('settings.projectPage.overrides.title')}
                        </span>
                        <span className="text-[var(--color-6)]">
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
        <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-[24px] text-[var(--color-10)]">
            <header className="flex items-center justify-between gap-[16px] border-b border-b-[rgba(0,0,0,0.06)] px-[24px] py-[16px] backdrop-blur-[10px] [[data-theme='dark']_&]:border-b-[rgba(255,255,255,0.08)]">
                <div>
                    <MdrHeading level={2}>{t('settings.projectPage.title')}</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        {t('settings.projectPage.subtitle')}
                    </MdrParagraph>
                </div>
                <div className="flex gap-[10px]">
                    <MdrButton
                        text={t('settings.actions.exit')}
                        size="Small"
                        category="Secondary"
                        onClick={() => navigate(basePath)}
                    />
                </div>
            </header>
            <main className="flex flex-col gap-[18px] px-[24px] pb-[32px] pt-[16px] max-[1100px]:px-[18px] max-[1100px]:pb-[24px] max-[1100px]:pt-[14px]">
                <MdrTabs items={tabs} />
            </main>
        </div>
    );
};
