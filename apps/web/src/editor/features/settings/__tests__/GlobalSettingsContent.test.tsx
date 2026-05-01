import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { GlobalSettingsContent } from '@/editor/features/settings/GlobalSettingsContent';
import { createProjectDefaults } from '@/editor/features/settings/SettingsDefaults';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { resetSettingsStore } from '@/test-utils/editorStore';

vi.mock('@mdr/ui', () => ({
  MdrCheckList: ({
    items,
    value,
    onChange,
  }: {
    items: { label: string; value: string; disabled?: boolean }[];
    value: string[];
    onChange: (value: string[]) => void;
  }) => (
    <div>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange([...value, item.value])}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
  MdrInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <input
      aria-label={value}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  ),
  MdrPanel: ({ title, children }: { title: string; children: ReactNode }) => (
    <section aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  ),
  MdrParagraph: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  MdrRadioGroup: ({
    options,
    onChange,
  }: {
    options: { label: string; value: string; disabled?: boolean }[];
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
  MdrSelect: ({
    options,
    value,
    onChange,
    disabled,
  }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select
      aria-label={value}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  MdrSlider: ({
    value,
    onChange,
    disabled,
  }: {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
  }) => (
    <input
      aria-label={String(value)}
      type="range"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
    />
  ),
  MdrText: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  MdrTextarea: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      aria-label={value}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  ),
}));

describe('GlobalSettingsContent', () => {
  beforeEach(() => {
    resetSettingsStore({
      autosaveMode: 'on-change',
      outputPath: 'src/generated',
    });
    useSettingsStore.getState().ensureProjectGlobal('project-1');
  });

  it('edits global-only settings directly from project settings', () => {
    const overrides =
      useSettingsStore.getState().projectGlobalById['project-1']?.overrides ??
      {};

    render(
      <GlobalSettingsContent
        mode="project"
        projectId="project-1"
        overrides={overrides}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'settings.global.rows.autosaveMode.options.manual',
      })
    );

    const state = useSettingsStore.getState();
    expect(state.global.autosaveMode).toBe('manual');
    expect(state.projectGlobalById['project-1']?.values.autosaveMode).toBe(
      createProjectDefaults().autosaveMode
    );
    const autosaveModeRow = screen.getByText(
      'settings.global.rows.autosaveMode.label'
    ).parentElement?.parentElement;
    expect(autosaveModeRow).toBeTruthy();
    expect(
      within(autosaveModeRow as HTMLElement).queryByRole('button', {
        name: 'settings.overrides.toggle.off',
      })
    ).toBeNull();
    expect(
      within(autosaveModeRow as HTMLElement).getByText(
        'settings.overrides.labels.globalOnly'
      )
    ).toBeTruthy();
  });

  it('keeps project-overridable settings disabled until override is enabled', () => {
    const state = useSettingsStore.getState();
    state.toggleProjectOverride('project-1', 'autosaveMode');
    state.setProjectGlobalValue('project-1', 'autosaveMode', 'manual');
    expect(
      useSettingsStore
        .getState()
        .getEffectiveGlobalValue('project-1', 'autosaveMode')
    ).toBe('on-change');

    render(
      <GlobalSettingsContent
        mode="project"
        projectId="project-1"
        overrides={state.projectGlobalById['project-1']?.overrides ?? {}}
      />
    );

    const outputInput = screen.getByLabelText('src/generated');
    expect(outputInput).toHaveProperty('disabled', true);

    state.toggleProjectOverride('project-1', 'outputPath');
    const overrides =
      useSettingsStore.getState().projectGlobalById['project-1']?.overrides ??
      {};

    render(
      <GlobalSettingsContent
        mode="project"
        projectId="project-1"
        overrides={overrides}
      />
    );

    const projectOutputInput = screen.getByLabelText('apps/web/generated');
    fireEvent.change(projectOutputInput, {
      target: { value: 'packages/site/generated' },
    });

    expect(
      useSettingsStore.getState().projectGlobalById['project-1']?.values
        .outputPath
    ).toBe('packages/site/generated');
    expect(useSettingsStore.getState().global.outputPath).toBe('src/generated');
  });
});
