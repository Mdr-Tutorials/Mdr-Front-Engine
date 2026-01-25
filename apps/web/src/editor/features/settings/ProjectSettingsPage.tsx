import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
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
    const { projectId } = useParams();
    const [overrides, setOverrides] = useState<OverrideState>(createOverrideDefaults);

    const handleToggleOverride = (key: keyof typeof overrides) => {
        setOverrides((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const basePath = projectId ? `/editor/project/${projectId}` : '/editor';

    const tabs = [
        {
            key: 'project',
            label: 'Project settings',
            content: <ProjectSettingsContent />,
        },
        {
            key: 'global',
            label: 'Global defaults',
            content: (
                <div className="SettingsGlobalOverrides">
                    <div className="SettingsNotice">
                        <span className="SettingsNoticeTitle">Overrides</span>
                        <span className="SettingsNoticeBody">
                            Toggle a row to override the global default for this project.
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
                    <MdrHeading level={2}>Project Settings</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        Project-specific configuration with optional global overrides.
                    </MdrParagraph>
                </div>
                <div className="SettingsPageActions">
                    <MdrButton
                        text="Exit settings"
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
