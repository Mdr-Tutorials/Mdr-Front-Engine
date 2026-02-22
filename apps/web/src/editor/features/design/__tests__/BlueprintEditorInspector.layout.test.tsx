import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorInspector } from '../BlueprintEditorInspector';
import { resetInspectorExpansionPersistence } from '../BlueprintEditorInspector.controller';
import { resetLayoutPanelExpansionPersistence } from '../inspector/panels/LayoutPanel';
import {
  DEFAULT_BLUEPRINT_STATE,
  useEditorStore,
} from '@/editor/store/useEditorStore';
import { createMirDoc, resetEditorStore } from '@/test-utils/editorStore';

const PROJECT_ID = 'project-1';

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: PROJECT_ID }),
}));

vi.mock('@mdr/ui', () => ({
  MdrInput: ({
    value,
    onChange,
    onBlur,
    onKeyDown,
  }: {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  }) => (
    <input
      data-testid="mdr-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  ),
  MdrSelect: ({
    value,
    options,
    onChange,
  }: {
    value?: string;
    options: { label: string; value: string }[];
    onChange?: (value: string) => void;
  }) => (
    <select
      data-testid="mdr-select"
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => {
  resetInspectorExpansionPersistence();
  resetLayoutPanelExpansionPersistence();
  resetEditorStore();
});

const ensureLayoutGroupButton = async (groupName: 'Grid' | 'Spacing') => {
  if (!screen.queryByRole('button', { name: 'Layout' })) {
    const styleToggle = await screen.findByRole('button', { name: 'Style' });
    fireEvent.click(styleToggle);
  }
  if (!screen.queryByRole('button', { name: groupName })) {
    fireEvent.click(await screen.findByRole('button', { name: 'Layout' }));
  }
  return await screen.findByRole('button', { name: groupName });
};

describe('BlueprintEditorInspector layout panel', () => {
  it('updates gap for a Flex node', async () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'flex-1',
          type: 'MdrDiv',
          props: { display: 'Flex', gap: 10 },
          children: [],
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'flex-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    fireEvent.change(await screen.findByPlaceholderText('8'), {
      target: { value: '24' },
    });

    const child = useEditorStore.getState().mirDoc.ui.root.children?.[0];
    expect(child?.props?.gap).toBe(24);
  });

  it('updates gridTemplateColumns for a Grid node', async () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'grid-1',
          type: 'MdrDiv',
          props: { display: 'Grid', gap: '10px' },
          style: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          children: [],
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'grid-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    fireEvent.click(await ensureLayoutGroupButton('Grid'));
    await waitFor(() => {
      expect(screen.getAllByTestId('mdr-input').length).toBeGreaterThanOrEqual(
        2
      );
    });
    const inputs = screen.getAllByTestId('mdr-input') as HTMLInputElement[];
    // [0] id, [1] columns (gap uses editor-only UnitInput)
    fireEvent.change(inputs[1], { target: { value: '3' } });

    await waitFor(() => {
      const child = useEditorStore.getState().mirDoc.ui.root.children?.[0];
      expect(child?.style?.gridTemplateColumns).toBe(
        'repeat(3, minmax(0, 1fr))'
      );
    });
  });

  it('keeps margin shorthand and per-side inputs in sync', async () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'layout-1',
          type: 'MdrDiv',
          children: [],
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'layout-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    fireEvent.click(await ensureLayoutGroupButton('Spacing'));

    const shorthandInput = (await screen.findByTestId(
      'inspector-margin-shorthand'
    )) as HTMLInputElement;
    fireEvent.change(shorthandInput, { target: { value: '10px 20px' } });

    fireEvent.click(await screen.findByTestId('inspector-margin-toggle'));

    const topInput = (
      await screen.findByTestId('inspector-margin-top')
    ).querySelector('input') as HTMLInputElement;
    const rightInput = (
      await screen.findByTestId('inspector-margin-right')
    ).querySelector('input') as HTMLInputElement;
    const bottomInput = (
      await screen.findByTestId('inspector-margin-bottom')
    ).querySelector('input') as HTMLInputElement;
    const leftInput = (
      await screen.findByTestId('inspector-margin-left')
    ).querySelector('input') as HTMLInputElement;

    expect(topInput.value).toBe('10');
    expect(rightInput.value).toBe('20');
    expect(bottomInput.value).toBe('10');
    expect(leftInput.value).toBe('20');

    fireEvent.change(leftInput, {
      target: { value: '30' },
    });

    expect(
      (screen.getByTestId('inspector-margin-shorthand') as HTMLInputElement)
        .value
    ).toBe('10px 20px 10px 30px');

    const child = useEditorStore.getState().mirDoc.ui.root.children?.[0];
    expect(child?.props?.margin).toBe('10px 20px 10px 30px');
  });
});
