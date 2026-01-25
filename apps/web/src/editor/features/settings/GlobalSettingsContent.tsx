import { useState } from 'react';
import {
    MdrCheckList,
    MdrInput,
    MdrRadioGroup,
    MdrSelect,
    MdrSlider,
    MdrTextarea,
} from '@mdr/ui';
import {
    createProjectDefaults,
    type GlobalSettingsState,
    type OverrideState,
    type SettingsMode,
} from './SettingsDefaults';
import { SettingsPanel, SettingsRow, formatValue, withDisabled } from './SettingsShared';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

export type GlobalSettingsContentProps = {
    mode?: SettingsMode;
    overrides?: OverrideState;
    onToggleOverride?: (key: keyof GlobalSettingsState) => void;
};

export const GlobalSettingsContent = ({
    mode = 'global',
    overrides = {},
    onToggleOverride,
}: GlobalSettingsContentProps) => {
    const globalValues = useSettingsStore((state) => state.global);
    const setGlobalValue = useSettingsStore((state) => state.setGlobalValue);
    const [projectValues, setProjectValues] = useState(createProjectDefaults);

    const isProjectMode = mode === 'project';

    const isOverrideEnabled = (key: keyof GlobalSettingsState) =>
        isProjectMode ? Boolean(overrides[key]) : true;

    const resolveValue = (key: keyof GlobalSettingsState) => {
        if (!isProjectMode) return globalValues[key];
        return isOverrideEnabled(key) ? projectValues[key] : globalValues[key];
    };

    const updateValue = <K extends keyof GlobalSettingsState>(key: K, value: GlobalSettingsState[K]) => {
        if (isProjectMode) {
            if (!isOverrideEnabled(key)) return;
            setProjectValues((prev) => ({ ...prev, [key]: value }));
            return;
        }
        setGlobalValue(key, value);
    };

    const renderMeta = (key: keyof GlobalSettingsState) => {
        if (!isProjectMode) return undefined;
        const enabled = isOverrideEnabled(key);
        const globalValue = formatValue(globalValues[key]);
        const effectiveValue = formatValue(resolveValue(key));
        return (
            <>
                <button
                    type="button"
                    className={`SettingsOverrideToggle ${enabled ? 'On' : ''}`}
                    aria-pressed={enabled}
                    onClick={() => onToggleOverride?.(key)}
                >
                    {enabled ? 'Project override' : 'Use global'}
                </button>
                <span className="SettingsRowMetaLabel">Global: {globalValue}</span>
                <span className="SettingsRowMetaLabel">Effective: {effectiveValue}</span>
            </>
        );
    };

    return (
        <div className="SettingsSectionGroup">
            <SettingsPanel
                title="Appearance & Language"
                description="Defaults that shape the editor look and feel for every workspace."
            >
                <SettingsRow
                    label="Interface language"
                    description="Primary locale for menus, panels, and tooltips."
                    meta={renderMeta('language')}
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'English', value: 'en' },
                                { label: '简体中文', value: 'zh-CN' },
                            ]}
                            value={String(resolveValue('language'))}
                            onChange={(value) => updateValue('language', value)}
                            disabled={!isOverrideEnabled('language')}
                        />
                    }
                />
                <SettingsRow
                    label="Theme preference"
                    description="Pick the default color mode for the editor."
                    meta={renderMeta('theme')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Follow system', value: 'system' },
                                { label: 'Light', value: 'light' },
                                { label: 'Dark', value: 'dark' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('theme'),
                            }))}
                            value={String(resolveValue('theme'))}
                            onChange={(value) => updateValue('theme', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Density"
                    description="Control spacing and compactness for the workspace."
                    meta={renderMeta('density')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Comfortable', value: 'comfortable' },
                                { label: 'Compact', value: 'compact' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('density'),
                            }))}
                            value={String(resolveValue('density'))}
                            onChange={(value) => updateValue('density', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Font scale"
                    description="Scale typography across the editor UI."
                    meta={renderMeta('fontScale')}
                    control={
                        <MdrSlider
                            min={90}
                            max={120}
                            step={1}
                            value={resolveValue('fontScale') as number}
                            onChange={(value) => updateValue('fontScale', value)}
                            showValue
                            size="Small"
                            disabled={!isOverrideEnabled('fontScale')}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Editor behavior"
                description="How the editor saves, confirms, and manages your work."
            >
                <SettingsRow
                    label="Auto-save interval (sec)"
                    description="Interval to persist changes automatically."
                    meta={renderMeta('autosaveInterval')}
                    control={
                        <MdrSlider
                            min={5}
                            max={60}
                            step={5}
                            value={resolveValue('autosaveInterval') as number}
                            onChange={(value) => updateValue('autosaveInterval', value)}
                            size="Small"
                            disabled={!isOverrideEnabled('autosaveInterval')}
                        />
                    }
                />
                <SettingsRow
                    label="Undo steps"
                    description="Maximum steps stored in the undo stack."
                    meta={renderMeta('undoSteps')}
                    control={
                        <MdrInput
                            size="Small"
                            value={String(resolveValue('undoSteps'))}
                            onChange={(value) => updateValue('undoSteps', value)}
                            disabled={!isOverrideEnabled('undoSteps')}
                        />
                    }
                />
                <SettingsRow
                    label="Confirm prompts"
                    description="When to show confirmation dialogs."
                    meta={renderMeta('confirmPrompts')}
                    control={
                        <MdrCheckList
                            items={withDisabled(
                                [
                                    { label: 'Delete', value: 'delete' },
                                    { label: 'Reset', value: 'reset' },
                                    { label: 'Leave', value: 'leave' },
                                ],
                                !isOverrideEnabled('confirmPrompts')
                            )}
                            value={resolveValue('confirmPrompts') as string[]}
                            onChange={(values) => updateValue('confirmPrompts', values)}
                        />
                    }
                />
                <SettingsRow
                    label="Default panel layout"
                    description="Choose the baseline layout for editor panels."
                    meta={renderMeta('panelLayout')}
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'Balanced', value: 'balanced' },
                                { label: 'Focus', value: 'focus' },
                                { label: 'Wide', value: 'wide' },
                            ]}
                            value={String(resolveValue('panelLayout'))}
                            onChange={(value) => updateValue('panelLayout', value)}
                            disabled={!isOverrideEnabled('panelLayout')}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Blueprint defaults"
                description="Defaults applied when creating or opening a new blueprint."
            >
                <SettingsRow
                    label="Viewport size"
                    description="Default artboard size for new pages."
                    meta={renderMeta('viewportWidth')}
                    control={
                        <div className="SettingsInputGroup">
                            <MdrInput
                                size="Small"
                                value={String(resolveValue('viewportWidth'))}
                                onChange={(value) => updateValue('viewportWidth', value)}
                                disabled={!isOverrideEnabled('viewportWidth')}
                            />
                            <span>×</span>
                            <MdrInput
                                size="Small"
                                value={String(resolveValue('viewportHeight'))}
                                onChange={(value) => updateValue('viewportHeight', value)}
                                disabled={!isOverrideEnabled('viewportHeight')}
                            />
                        </div>
                    }
                />
                <SettingsRow
                    label="Zoom step"
                    description="Zoom increment when scrolling or pressing shortcuts."
                    meta={renderMeta('zoomStep')}
                    control={
                        <MdrSlider
                            min={1}
                            max={20}
                            step={1}
                            value={resolveValue('zoomStep') as number}
                            onChange={(value) => updateValue('zoomStep', value)}
                            size="Small"
                            disabled={!isOverrideEnabled('zoomStep')}
                        />
                    }
                />
                <SettingsRow
                    label="Assist overlays"
                    description="Grid, guides, and snapping defaults."
                    meta={renderMeta('assist')}
                    control={
                        <MdrCheckList
                            items={withDisabled(
                                [
                                    { label: 'Grid', value: 'grid' },
                                    { label: 'Alignment', value: 'align' },
                                    { label: 'Snap', value: 'snap' },
                                ],
                                !isOverrideEnabled('assist')
                            )}
                            value={resolveValue('assist') as string[]}
                            onChange={(values) => updateValue('assist', values)}
                        />
                    }
                />
                <SettingsRow
                    label="Pan inertia"
                    description="Momentum applied after dragging the canvas."
                    meta={renderMeta('panInertia')}
                    control={
                        <MdrSlider
                            min={0}
                            max={100}
                            step={5}
                            value={resolveValue('panInertia') as number}
                            onChange={(value) => updateValue('panInertia', value)}
                            size="Small"
                            disabled={!isOverrideEnabled('panInertia')}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Components & rendering"
                description="Control how MIR resolves and renders components."
            >
                <SettingsRow
                    label="Resolver order"
                    description="Lookup priority when multiple registries exist."
                    meta={renderMeta('resolverOrder')}
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'Custom → MDR → Native', value: 'custom>mdr>native' },
                                { label: 'MDR → Native', value: 'mdr>native' },
                                { label: 'Native only', value: 'native' },
                            ]}
                            value={String(resolveValue('resolverOrder'))}
                            onChange={(value) => updateValue('resolverOrder', value)}
                            disabled={!isOverrideEnabled('resolverOrder')}
                        />
                    }
                />
                <SettingsRow
                    label="Custom namespaces"
                    description="Allowed namespaces for project components."
                    meta={renderMeta('customNamespaces')}
                    control={
                        <MdrTextarea
                            size="Small"
                            rows={3}
                            value={String(resolveValue('customNamespaces'))}
                            onChange={(value) => updateValue('customNamespaces', value)}
                            disabled={!isOverrideEnabled('customNamespaces')}
                        />
                    }
                />
                <SettingsRow
                    label="Render mode"
                    description="Choose strict validation or tolerant rendering."
                    meta={renderMeta('renderMode')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Strict', value: 'strict' },
                                { label: 'Tolerant', value: 'tolerant' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('renderMode'),
                            }))}
                            value={String(resolveValue('renderMode'))}
                            onChange={(value) => updateValue('renderMode', value)}
                        />
                    }
                />
                <SettingsRow
                    label="External props"
                    description="Allow runtime props injection for previews."
                    meta={renderMeta('allowExternalProps')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Allow', value: 'enabled' },
                                { label: 'Disable', value: 'disabled' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('allowExternalProps'),
                            }))}
                            value={String(resolveValue('allowExternalProps'))}
                            onChange={(value) => updateValue('allowExternalProps', value)}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Code generation"
                description="Defaults for exported code and artifacts."
            >
                <SettingsRow
                    label="Default framework"
                    description="Primary target for generated UI code."
                    meta={renderMeta('defaultFramework')}
                    control={
                        <MdrSelect
                            size="Small"
                            options={[
                                { label: 'React', value: 'react' },
                                { label: 'Vue', value: 'vue' },
                                { label: 'HTML', value: 'html' },
                            ]}
                            value={String(resolveValue('defaultFramework'))}
                            onChange={(value) => updateValue('defaultFramework', value)}
                            disabled={!isOverrideEnabled('defaultFramework')}
                        />
                    }
                />
                <SettingsRow
                    label="Formatting"
                    description="Code style and formatting preferences."
                    meta={renderMeta('formatting')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Prettier', value: 'prettier' },
                                { label: 'None', value: 'none' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('formatting'),
                            }))}
                            value={String(resolveValue('formatting'))}
                            onChange={(value) => updateValue('formatting', value)}
                        />
                    }
                />
                <SettingsRow
                    label="Output path"
                    description="Where generated code is stored."
                    meta={renderMeta('outputPath')}
                    control={
                        <MdrInput
                            size="Small"
                            value={String(resolveValue('outputPath'))}
                            onChange={(value) => updateValue('outputPath', value)}
                            disabled={!isOverrideEnabled('outputPath')}
                        />
                    }
                />
                <SettingsRow
                    label="Import style"
                    description="How generated imports are organized."
                    meta={renderMeta('importStyle')}
                    control={
                        <MdrSelect
                            size="Small"
                            options={[
                                { label: 'Auto', value: 'auto' },
                                { label: 'Grouped', value: 'grouped' },
                                { label: 'Single', value: 'single' },
                            ]}
                            value={String(resolveValue('importStyle'))}
                            onChange={(value) => updateValue('importStyle', value)}
                            disabled={!isOverrideEnabled('importStyle')}
                        />
                    }
                />
                <SettingsRow
                    label="Metadata comments"
                    description="Include MIR metadata annotations in output."
                    meta={renderMeta('metadata')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Include metadata', value: 'enabled' },
                                { label: 'Skip metadata', value: 'disabled' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('metadata'),
                            }))}
                            value={String(resolveValue('metadata'))}
                            onChange={(value) => updateValue('metadata', value)}
                        />
                    }
                />
            </SettingsPanel>
            <SettingsPanel
                title="Shortcuts & diagnostics"
                description="Productivity settings and debug overlays."
            >
                <SettingsRow
                    label="Shortcut preset"
                    description="Default keyboard shortcut profile."
                    meta={renderMeta('shortcutPreset')}
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'Default', value: 'default' },
                                { label: 'Vim-style', value: 'vim' },
                                { label: 'VS Code', value: 'vscode' },
                            ]}
                            value={String(resolveValue('shortcutPreset'))}
                            onChange={(value) => updateValue('shortcutPreset', value)}
                            disabled={!isOverrideEnabled('shortcutPreset')}
                        />
                    }
                />
                <SettingsRow
                    label="Diagnostics overlay"
                    description="Show visual debugging cues on the canvas."
                    meta={renderMeta('diagnostics')}
                    control={
                        <MdrCheckList
                            items={withDisabled(
                                [
                                    { label: 'Selection bounds', value: 'selection' },
                                    { label: 'Perf hints', value: 'performance' },
                                    { label: 'Events log', value: 'events' },
                                ],
                                !isOverrideEnabled('diagnostics')
                            )}
                            value={resolveValue('diagnostics') as string[]}
                            onChange={(values) => updateValue('diagnostics', values)}
                        />
                    }
                />
                <SettingsRow
                    label="Log level"
                    description="Controls verbosity for debug logs."
                    meta={renderMeta('logLevel')}
                    control={
                        <MdrSelect size="Small"
                            options={[
                                { label: 'Error', value: 'error' },
                                { label: 'Warn', value: 'warn' },
                                { label: 'Info', value: 'info' },
                            ]}
                            value={String(resolveValue('logLevel'))}
                            onChange={(value) => updateValue('logLevel', value)}
                            disabled={!isOverrideEnabled('logLevel')}
                        />
                    }
                />
                <SettingsRow
                    label="Telemetry"
                    description="Share anonymous usage metrics."
                    meta={renderMeta('telemetry')}
                    control={
                        <MdrRadioGroup
                            options={[
                                { label: 'Allow', value: 'on' },
                                { label: 'Disable', value: 'off' },
                            ].map((option) => ({
                                ...option,
                                disabled: !isOverrideEnabled('telemetry'),
                            }))}
                            value={String(resolveValue('telemetry'))}
                            onChange={(value) => updateValue('telemetry', value)}
                        />
                    }
                />
            </SettingsPanel>
        </div>
    );
};
