import { useTranslation } from 'react-i18next';
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
import {
  SettingsPanel,
  SettingsRow,
  formatValue,
  withDisabled,
} from './SettingsShared';
import { useSettingsStore } from '@/editor/store/useSettingsStore';

export type GlobalSettingsContentProps = {
  mode?: SettingsMode;
  overrides?: OverrideState;
  onToggleOverride?: (key: keyof GlobalSettingsState) => void;
  projectId?: string;
};

export const GlobalSettingsContent = ({
  mode = 'global',
  overrides = {},
  onToggleOverride,
  projectId,
}: GlobalSettingsContentProps) => {
  const { t } = useTranslation('editor');
  const globalValues = useSettingsStore((state) => state.global);
  const setGlobalValue = useSettingsStore((state) => state.setGlobalValue);
  const setProjectGlobalValue = useSettingsStore(
    (state) => state.setProjectGlobalValue
  );
  const projectValues = useSettingsStore((state) =>
    projectId ? state.projectGlobalById[projectId]?.values : undefined
  );
  const projectFallback = createProjectDefaults();

  const isProjectMode = mode === 'project';

  const isOverrideEnabled = (key: keyof GlobalSettingsState) =>
    isProjectMode ? Boolean(overrides[key]) : true;

  const resolveValue = (key: keyof GlobalSettingsState) => {
    if (!isProjectMode) return globalValues[key];
    const projectValue = projectValues?.[key] ?? projectFallback[key];
    return isOverrideEnabled(key) ? projectValue : globalValues[key];
  };

  const updateValue = <K extends keyof GlobalSettingsState>(
    key: K,
    value: GlobalSettingsState[K]
  ) => {
    if (isProjectMode) {
      if (!projectId || !isOverrideEnabled(key)) return;
      setProjectGlobalValue(projectId, key, value);
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
          className={`rounded-full border px-2.5 py-1 text-[11px] transition-all duration-150 ease-[ease] ${
            enabled
              ? 'border-transparent bg-(--color-9) text-(--color-0)'
              : "border-[rgba(0,0,0,0.12)] bg-(--color-1) text-(--color-7) hover:border-[rgba(0,0,0,0.2)] hover:text-(--color-9) in-data-[theme='dark']:border-[rgba(255,255,255,0.16)] in-data-[theme='dark']:bg-[rgba(255,255,255,0.08)]"
          }`}
          aria-pressed={enabled}
          onClick={() => onToggleOverride?.(key)}
        >
          {enabled
            ? t('settings.overrides.toggle.on')
            : t('settings.overrides.toggle.off')}
        </button>
        <span className="leading-[1.2]">
          {t('settings.overrides.labels.global', {
            value: globalValue,
          })}
        </span>
        <span className="leading-[1.2]">
          {t('settings.overrides.labels.effective', {
            value: effectiveValue,
          })}
        </span>
      </>
    );
  };

  return (
    <div className="grid gap-4.5">
      <SettingsPanel
        title={t('settings.global.panels.appearance.title')}
        description={t('settings.global.panels.appearance.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.language.label')}
          description={t('settings.global.rows.language.description')}
          meta={renderMeta('language')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t('settings.global.rows.language.options.en'),
                  value: 'en',
                },
                {
                  label: t('settings.global.rows.language.options.zhCN'),
                  value: 'zh-CN',
                },
              ]}
              value={String(resolveValue('language'))}
              onChange={(value) => updateValue('language', value)}
              disabled={!isOverrideEnabled('language')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.theme.label')}
          description={t('settings.global.rows.theme.description')}
          meta={renderMeta('theme')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.theme.options.home'),
                  value: 'home',
                },
                {
                  label: t('settings.global.rows.theme.options.light'),
                  value: 'light',
                },
                {
                  label: t('settings.global.rows.theme.options.dark'),
                  value: 'dark',
                },
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
          label={t('settings.global.rows.density.label')}
          description={t('settings.global.rows.density.description')}
          meta={renderMeta('density')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.density.options.comfortable'),
                  value: 'comfortable',
                },
                {
                  label: t('settings.global.rows.density.options.compact'),
                  value: 'compact',
                },
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
          label={t('settings.global.rows.fontScale.label')}
          description={t('settings.global.rows.fontScale.description')}
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
        title={t('settings.global.panels.behavior.title')}
        description={t('settings.global.panels.behavior.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.autosaveInterval.label')}
          description={t('settings.global.rows.autosaveInterval.description')}
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
          label={t('settings.global.rows.undoSteps.label')}
          description={t('settings.global.rows.undoSteps.description')}
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
          label={t('settings.global.rows.confirmPrompts.label')}
          description={t('settings.global.rows.confirmPrompts.description')}
          meta={renderMeta('confirmPrompts')}
          control={
            <MdrCheckList
              items={withDisabled(
                [
                  {
                    label: t(
                      'settings.global.rows.confirmPrompts.options.delete'
                    ),
                    value: 'delete',
                  },
                  {
                    label: t(
                      'settings.global.rows.confirmPrompts.options.reset'
                    ),
                    value: 'reset',
                  },
                  {
                    label: t(
                      'settings.global.rows.confirmPrompts.options.leave'
                    ),
                    value: 'leave',
                  },
                ],
                !isOverrideEnabled('confirmPrompts')
              )}
              value={resolveValue('confirmPrompts') as string[]}
              onChange={(values) => updateValue('confirmPrompts', values)}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.panelLayout.label')}
          description={t('settings.global.rows.panelLayout.description')}
          meta={renderMeta('panelLayout')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t('settings.global.rows.panelLayout.options.balanced'),
                  value: 'balanced',
                },
                {
                  label: t('settings.global.rows.panelLayout.options.focus'),
                  value: 'focus',
                },
                {
                  label: t('settings.global.rows.panelLayout.options.wide'),
                  value: 'wide',
                },
              ]}
              value={String(resolveValue('panelLayout'))}
              onChange={(value) => updateValue('panelLayout', value)}
              disabled={!isOverrideEnabled('panelLayout')}
            />
          }
        />
      </SettingsPanel>
      <SettingsPanel
        title={t('settings.global.panels.blueprint.title')}
        description={t('settings.global.panels.blueprint.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.viewportSize.label')}
          description={t('settings.global.rows.viewportSize.description')}
          meta={renderMeta('viewportWidth')}
          control={
            <div className="inline-flex items-center gap-1.5">
              <MdrInput
                size="Small"
                value={String(resolveValue('viewportWidth'))}
                onChange={(value) => updateValue('viewportWidth', value)}
                disabled={!isOverrideEnabled('viewportWidth')}
              />
              <span className="text-[12px] text-(--color-6)">×</span>
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
          label={t('settings.global.rows.zoomStep.label')}
          description={t('settings.global.rows.zoomStep.description')}
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
          label={t('settings.global.rows.assist.label')}
          description={t('settings.global.rows.assist.description')}
          meta={renderMeta('assist')}
          control={
            <MdrCheckList
              items={withDisabled(
                [
                  {
                    label: t('settings.global.rows.assist.options.grid'),
                    value: 'grid',
                  },
                  {
                    label: t('settings.global.rows.assist.options.alignment'),
                    value: 'align',
                  },
                  {
                    label: t('settings.global.rows.assist.options.snap'),
                    value: 'snap',
                  },
                ],
                !isOverrideEnabled('assist')
              )}
              value={resolveValue('assist') as string[]}
              onChange={(values) => updateValue('assist', values)}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.panInertia.label')}
          description={t('settings.global.rows.panInertia.description')}
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
        title={t('settings.global.panels.components.title')}
        description={t('settings.global.panels.components.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.resolverOrder.label')}
          description={t('settings.global.rows.resolverOrder.description')}
          meta={renderMeta('resolverOrder')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t(
                    'settings.global.rows.resolverOrder.options.customMdrNative'
                  ),
                  value: 'custom>mdr>native',
                },
                {
                  label: t(
                    'settings.global.rows.resolverOrder.options.mdrNative'
                  ),
                  value: 'mdr>native',
                },
                {
                  label: t(
                    'settings.global.rows.resolverOrder.options.nativeOnly'
                  ),
                  value: 'native',
                },
              ]}
              value={String(resolveValue('resolverOrder'))}
              onChange={(value) => updateValue('resolverOrder', value)}
              disabled={!isOverrideEnabled('resolverOrder')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.customNamespaces.label')}
          description={t('settings.global.rows.customNamespaces.description')}
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
          label={t('settings.global.rows.renderMode.label')}
          description={t('settings.global.rows.renderMode.description')}
          meta={renderMeta('renderMode')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.renderMode.options.strict'),
                  value: 'strict',
                },
                {
                  label: t('settings.global.rows.renderMode.options.tolerant'),
                  value: 'tolerant',
                },
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
          label={t('settings.global.rows.externalProps.label')}
          description={t('settings.global.rows.externalProps.description')}
          meta={renderMeta('allowExternalProps')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.externalProps.options.allow'),
                  value: 'enabled',
                },
                {
                  label: t(
                    'settings.global.rows.externalProps.options.disable'
                  ),
                  value: 'disabled',
                },
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
        title={t('settings.global.panels.codegen.title')}
        description={t('settings.global.panels.codegen.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.defaultFramework.label')}
          description={t('settings.global.rows.defaultFramework.description')}
          meta={renderMeta('defaultFramework')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t(
                    'settings.global.rows.defaultFramework.options.react'
                  ),
                  value: 'react',
                },
                {
                  label: t('settings.global.rows.defaultFramework.options.vue'),
                  value: 'vue',
                },
                {
                  label: t(
                    'settings.global.rows.defaultFramework.options.html'
                  ),
                  value: 'html',
                },
              ]}
              value={String(resolveValue('defaultFramework'))}
              onChange={(value) => updateValue('defaultFramework', value)}
              disabled={!isOverrideEnabled('defaultFramework')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.formatting.label')}
          description={t('settings.global.rows.formatting.description')}
          meta={renderMeta('formatting')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.formatting.options.prettier'),
                  value: 'prettier',
                },
                {
                  label: t('settings.global.rows.formatting.options.none'),
                  value: 'none',
                },
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
          label={t('settings.global.rows.outputPath.label')}
          description={t('settings.global.rows.outputPath.description')}
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
          label={t('settings.global.rows.importStyle.label')}
          description={t('settings.global.rows.importStyle.description')}
          meta={renderMeta('importStyle')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t('settings.global.rows.importStyle.options.auto'),
                  value: 'auto',
                },
                {
                  label: t('settings.global.rows.importStyle.options.grouped'),
                  value: 'grouped',
                },
                {
                  label: t('settings.global.rows.importStyle.options.single'),
                  value: 'single',
                },
              ]}
              value={String(resolveValue('importStyle'))}
              onChange={(value) => updateValue('importStyle', value)}
              disabled={!isOverrideEnabled('importStyle')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.metadata.label')}
          description={t('settings.global.rows.metadata.description')}
          meta={renderMeta('metadata')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.metadata.options.include'),
                  value: 'enabled',
                },
                {
                  label: t('settings.global.rows.metadata.options.skip'),
                  value: 'disabled',
                },
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
        title={t('settings.global.panels.shortcuts.title')}
        description={t('settings.global.panels.shortcuts.description')}
      >
        <SettingsRow
          label={t('settings.global.rows.shortcutPreset.label')}
          description={t('settings.global.rows.shortcutPreset.description')}
          meta={renderMeta('shortcutPreset')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t(
                    'settings.global.rows.shortcutPreset.options.default'
                  ),
                  value: 'default',
                },
                {
                  label: t('settings.global.rows.shortcutPreset.options.vim'),
                  value: 'vim',
                },
                {
                  label: t(
                    'settings.global.rows.shortcutPreset.options.vscode'
                  ),
                  value: 'vscode',
                },
              ]}
              value={String(resolveValue('shortcutPreset'))}
              onChange={(value) => updateValue('shortcutPreset', value)}
              disabled={!isOverrideEnabled('shortcutPreset')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.diagnostics.label')}
          description={t('settings.global.rows.diagnostics.description')}
          meta={renderMeta('diagnostics')}
          control={
            <MdrCheckList
              items={withDisabled(
                [
                  {
                    label: t(
                      'settings.global.rows.diagnostics.options.selectionBounds'
                    ),
                    value: 'selection',
                  },
                  {
                    label: t(
                      'settings.global.rows.diagnostics.options.perfHints'
                    ),
                    value: 'performance',
                  },
                  {
                    label: t(
                      'settings.global.rows.diagnostics.options.eventsLog'
                    ),
                    value: 'events',
                  },
                ],
                !isOverrideEnabled('diagnostics')
              )}
              value={resolveValue('diagnostics') as string[]}
              onChange={(values) => updateValue('diagnostics', values)}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.logLevel.label')}
          description={t('settings.global.rows.logLevel.description')}
          meta={renderMeta('logLevel')}
          control={
            <MdrSelect
              size="Small"
              options={[
                {
                  label: t('settings.global.rows.logLevel.options.error'),
                  value: 'error',
                },
                {
                  label: t('settings.global.rows.logLevel.options.warn'),
                  value: 'warn',
                },
                {
                  label: t('settings.global.rows.logLevel.options.info'),
                  value: 'info',
                },
              ]}
              value={String(resolveValue('logLevel'))}
              onChange={(value) => updateValue('logLevel', value)}
              disabled={!isOverrideEnabled('logLevel')}
            />
          }
        />
        <SettingsRow
          label={t('settings.global.rows.telemetry.label')}
          description={t('settings.global.rows.telemetry.description')}
          meta={renderMeta('telemetry')}
          control={
            <MdrRadioGroup
              options={[
                {
                  label: t('settings.global.rows.telemetry.options.allow'),
                  value: 'on',
                },
                {
                  label: t('settings.global.rows.telemetry.options.disable'),
                  value: 'off',
                },
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
