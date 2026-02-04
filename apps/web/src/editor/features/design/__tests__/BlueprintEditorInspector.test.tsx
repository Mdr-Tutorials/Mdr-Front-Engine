import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorInspector } from '../BlueprintEditorInspector';
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
    dataAttributes,
    onChange,
    onBlur,
    onKeyDown,
  }: {
    value: string;
    dataAttributes?: Record<string, string>;
    onChange: (value: string) => void;
    onBlur: () => void;
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  }) => (
    <input
      data-testid={dataAttributes?.['data-testid'] ?? 'mdr-input'}
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
  resetEditorStore();
});

const getSelectedId = () =>
  useEditorStore.getState().blueprintStateByProject[PROJECT_ID]?.selectedId;

describe('BlueprintEditorInspector', () => {
  it('renders placeholder when nothing is selected', () => {
    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    expect(screen.getByText('inspector.placeholder')).toBeTruthy();
  });

  it('renames the selected node on blur', async () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Text' }]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'child-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const input = screen.getByTestId('inspector-id-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'child-2' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(getSelectedId()).toBe('child-2');
    });

    const rootChildren =
      useEditorStore.getState().mirDoc.ui.root.children ?? [];
    expect(rootChildren[0]?.id).toBe('child-2');
  });

  it('blocks rename when the id already exists', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        { id: 'child-1', type: 'MdrText', text: 'Text' },
        { id: 'child-2', type: 'MdrText', text: 'Text 2' },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'child-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const input = screen.getByTestId('inspector-id-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'child-2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByRole('alert')).toBeTruthy();
    const rootChildren =
      useEditorStore.getState().mirDoc.ui.root.children ?? [];
    expect(rootChildren[0]?.id).toBe('child-1');
    expect(getSelectedId()).toBe('child-1');
  });

  it('restores the original id when pressing Escape', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrText', text: 'Text' }]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'child-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const input = screen.getByTestId('inspector-id-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'draft-id' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value).toBe('child-1');
  });
});
