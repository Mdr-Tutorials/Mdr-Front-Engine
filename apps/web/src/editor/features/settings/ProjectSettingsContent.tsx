import { useState } from 'react';
import { MdrCheckList, MdrInput, MdrRadioGroup, MdrSelect, MdrSlider, MdrTextarea } from '@mdr/ui';
import { SettingsPanel, SettingsRow } from './SettingsShared';

export const ProjectSettingsContent = () => {
    const [projectValues, setProjectValues] = useState({
        name: 'Marketing Workspace',
        description: 'Landing pages and customer onboarding flows.',
        defaultRoute: '/home',
        timezone: 'UTC+8',
        defaultRole: ['editor'],
        previewAccess: ['restricted'],
        auditRetention: 30,
        notifications: ['mentions', 'builds'],
        themeTokenSet: 'mdr-default',
        componentLibraryVersion: 'v1.4.2',
        assetHost: 'https://assets.example.com',
        fontPack: ['inter', 'source-serif'],
        iconSet: 'lucide',
        apiBase: 'https://api.example.com',
        authMode: ['oauth'],
        envPrefix: 'MDR_',
        deploymentTarget: ['staging'],
        schemaVersion: '1.0',
        strictness: 80,
        customNodes: ['http', 'transform'],
        autoMigrate: ['enabled'],
        buildTarget: ['web'],
        outputDir: 'dist',
        minify: ['enabled'],
        sourceMaps: ['enabled'],
    });

    const updateProjectValue = (key: string, value: string | number | string[]) => {
        setProjectValues((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="SettingsSectionGroup">
            <SettingsPanel
                title="Project basics"
                description="Identity and defaults unique to this project."
            >
                <SettingsRow
                    label="Project name"
                    description="Display name shown in navigation and exports."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.name}
                            onChange={(value) => updateProjectValue('name', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Description"
                    description="High-level summary for collaborators."
                    control={
                        <MdrTextarea
                            size="Small"
                            rows={3}
                            value={projectValues.description}
                            onChange={(value) => updateProjectValue('description', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Default route"
                    description="Landing path when opening the project."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.defaultRoute}
                            onChange={(value) => updateProjectValue('defaultRoute', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Timezone"
                    description="Used for logs, scheduling, and timestamps."
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'UTC', value: 'UTC' },
                                { label: 'UTC-5 (New York)', value: 'UTC-5' },
                                { label: 'UTC+1 (Berlin)', value: 'UTC+1' },
                                { label: 'UTC+8 (Shanghai)', value: 'UTC+8' },
                            ]}
                            value={projectValues.timezone}
                            onChange={(value) => updateProjectValue('timezone', value)}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Collaboration"
                description="Access, permissions, and team workflow defaults."
            >
                <SettingsRow
                    label="Default role"
                    description="Role applied to new collaborators."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Viewer', value: 'viewer' },
                                { label: 'Editor', value: 'editor' },
                                { label: 'Admin', value: 'admin' },
                            ]}
                            value={projectValues.defaultRole[0]}
                            onChange={(value) => updateProjectValue('defaultRole', [value])}
                        />
                    }
                />
                <SettingsRow
                    label="Preview access"
                    description="Who can open preview links."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Restricted', value: 'restricted' },
                                { label: 'Anyone with link', value: 'public' },
                            ]}
                            value={projectValues.previewAccess[0]}
                            onChange={(value) => updateProjectValue('previewAccess', [value])}
                        />
                    }
                />
                <SettingsRow
                    label="Audit retention (days)"
                    description="Duration to retain audit events."
                    control={
                        <MdrSlider
                            min={7}
                            max={120}
                            step={7}
                            value={projectValues.auditRetention as number}
                            onChange={(value) => updateProjectValue('auditRetention', value)}
                            size="Small"
                        />
                    }
                />
                <SettingsRow
                    label="Notifications"
                    description="Default notification channels."
                    control={
                        <MdrCheckList
                            items={[
                                { label: 'Mentions', value: 'mentions' },
                                { label: 'Builds', value: 'builds' },
                                { label: 'Deployments', value: 'deployments' },
                            ]}
                            value={projectValues.notifications}
                            onChange={(values) => updateProjectValue('notifications', values)}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Design system"
                description="Project-specific UI tokens and asset libraries."
            >
                <SettingsRow
                    label="Theme token set"
                    description="Token pack used to render colors and spacing."
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'MDR Default', value: 'mdr-default' },
                                { label: 'MDR Midnight', value: 'mdr-midnight' },
                                { label: 'MDR Sunrise', value: 'mdr-sunrise' },
                            ]}
                            value={projectValues.themeTokenSet}
                            onChange={(value) => updateProjectValue('themeTokenSet', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Component library version"
                    description="Pinned version of shared MDR components."
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'v1.4.2 (stable)', value: 'v1.4.2' },
                                { label: 'v1.5.0 (beta)', value: 'v1.5.0' },
                            ]}
                            value={projectValues.componentLibraryVersion}
                            onChange={(value) => updateProjectValue('componentLibraryVersion', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Asset host"
                    description="Primary CDN or asset bucket URL."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.assetHost}
                            onChange={(value) => updateProjectValue('assetHost', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Font pack"
                    description="Font families available in the design system."
                    control={
                        <MdrCheckList
                            items={[
                                { label: 'Inter', value: 'inter' },
                                { label: 'Source Serif', value: 'source-serif' },
                                { label: 'Noto Sans', value: 'noto' },
                            ]}
                            value={projectValues.fontPack}
                            onChange={(values) => updateProjectValue('fontPack', values)}
                        />
                    }
                />
                <SettingsRow
                    label="Icon set"
                    description="Default icon pack for UI templates."
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'Lucide', value: 'lucide' },
                                { label: 'Remix', value: 'remix' },
                                { label: 'Feather', value: 'feather' },
                            ]}
                            value={projectValues.iconSet}
                            onChange={(value) => updateProjectValue('iconSet', value)}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Integrations & environments"
                description="Data sources, auth, and environment settings."
            >
                <SettingsRow
                    label="API base URL"
                    description="Primary API endpoint for data requests."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.apiBase}
                            onChange={(value) => updateProjectValue('apiBase', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Auth mode"
                    description="Authentication flow used by previews."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'OAuth', value: 'oauth' },
                                { label: 'API key', value: 'api-key' },
                                { label: 'None', value: 'none' },
                            ]}
                            value={projectValues.authMode[0]}
                            onChange={(value) => updateProjectValue('authMode', [value])}
                        />
                    }
                />
                <SettingsRow
                    label="Env prefix"
                    description="Prefix for injected environment variables."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.envPrefix}
                            onChange={(value) => updateProjectValue('envPrefix', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Deployment target"
                    description="Default environment for publishing builds."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Staging', value: 'staging' },
                                { label: 'Production', value: 'production' },
                                { label: 'Preview', value: 'preview' },
                            ]}
                            value={projectValues.deploymentTarget[0]}
                            onChange={(value) => updateProjectValue('deploymentTarget', [value])}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="MIR & validation"
                description="Schema enforcement and node policy."
            >
                <SettingsRow
                    label="Schema version"
                    description="Pinned MIR schema for this project."
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: '1.0 (stable)', value: '1.0' },
                                { label: '1.1 (preview)', value: '1.1' },
                            ]}
                            value={projectValues.schemaVersion}
                            onChange={(value) => updateProjectValue('schemaVersion', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Validation strictness"
                    description="Higher values enforce more rules."
                    control={
                        <MdrSlider
                            min={0}
                            max={100}
                            step={5}
                            value={projectValues.strictness as number}
                            onChange={(value) => updateProjectValue('strictness', value)}
                            size="Small"
                        />
                    }
                />
                <SettingsRow
                    label="Custom nodes"
                    description="Allowed custom node types in graphs."
                    control={
                        <MdrCheckList
                            items={[
                                { label: 'HTTP', value: 'http' },
                                { label: 'Transform', value: 'transform' },
                                { label: 'Condition', value: 'condition' },
                                { label: 'Loop', value: 'loop' },
                            ]}
                            value={projectValues.customNodes}
                            onChange={(values) => updateProjectValue('customNodes', values)}
                        />
                    }
                />
                <SettingsRow
                    label="Auto-migrate"
                    description="Automatically migrate MIR when schema updates."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Enable auto-migrate', value: 'enabled' },
                                { label: 'Disable auto-migrate', value: 'disabled' },
                            ]}
                            value={projectValues.autoMigrate[0]}
                            onChange={(value) => updateProjectValue('autoMigrate', [value])}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Build & export"
                description="Project export configuration and build options."
            >
                <SettingsRow
                    label="Build target"
                    description="Primary runtime output for builds."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Web', value: 'web' },
                                { label: 'Mobile', value: 'mobile' },
                                { label: 'Desktop', value: 'desktop' },
                            ]}
                            value={projectValues.buildTarget[0]}
                            onChange={(value) => updateProjectValue('buildTarget', [value])}
                        />
                    }
                />
                <SettingsRow
                    label="Output directory"
                    description="Default directory for build artifacts."
                    control={
                        <MdrInput
                            size="Small"
                            value={projectValues.outputDir}
                            onChange={(value) => updateProjectValue('outputDir', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Minify"
                    description="Minify assets on export."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Enable minify', value: 'enabled' },
                                { label: 'Disable minify', value: 'disabled' },
                            ]}
                            value={projectValues.minify[0]}
                            onChange={(value) => updateProjectValue('minify', [value])}
                        />
                    }
                />
                <SettingsRow
                    label="Source maps"
                    description="Generate source maps for debugging."
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Emit source maps', value: 'enabled' },
                                { label: 'Disable source maps', value: 'disabled' },
                            ]}
                            value={projectValues.sourceMaps[0]}
                            onChange={(value) => updateProjectValue('sourceMaps', [value])}
                        />
                    }
                />
            </SettingsPanel>
        </div>
    );
};
