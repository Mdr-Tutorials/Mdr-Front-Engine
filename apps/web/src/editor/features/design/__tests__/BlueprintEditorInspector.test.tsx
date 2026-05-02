import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorInspector } from '@/editor/features/design/BlueprintEditorInspector';
import { resetInspectorExpansionPersistence } from '@/editor/features/design/BlueprintEditorInspector.controller';
import { resetLayoutPanelExpansionPersistence } from '@/editor/features/design/inspector/panels/LayoutPanel';
import {
  resetExternalRuntimeMetaStore,
  setExternalRuntimeMeta,
} from '@/editor/features/design/blueprint/external/runtime/metaStore';
import {
  DEFAULT_BLUEPRINT_STATE,
  useEditorStore,
} from '@/editor/store/useEditorStore';
import { createMirDoc, resetEditorStore } from '@/test-utils/editorStore';

const PROJECT_ID = 'project-1';

vi.mock('react-router', () => ({
  useParams: () => ({ projectId: PROJECT_ID }),
  useNavigate: () => vi.fn(),
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

vi.mock('@uiw/react-codemirror', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="mounted-css-codemirror"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

beforeEach(() => {
  resetInspectorExpansionPersistence();
  resetLayoutPanelExpansionPersistence();
  resetEditorStore();
  resetExternalRuntimeMetaStore();
});

const getSelectedId = () =>
  useEditorStore.getState().blueprintStateByProject[PROJECT_ID]?.selectedId;

const openDataTab = () => {
  fireEvent.click(screen.getByTestId('inspector-tab-data'));
};

const openStyleTab = () => {
  fireEvent.click(screen.getByTestId('inspector-tab-style'));
};

const openCodeTab = () => {
  fireEvent.click(screen.getByTestId('inspector-tab-code'));
};

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

  it('creates and deletes a trigger entry', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        { id: 'child-1', type: 'MdrButton', text: 'Button' },
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

    openCodeTab();
    const addButton = screen.getByTestId('inspector-add-trigger');
    fireEvent.click(addButton);

    const created = screen.getByTestId('inspector-trigger-trigger-1');
    expect(created).toBeTruthy();

    const deleteButton = screen.getByTestId(
      'inspector-delete-trigger-trigger-1'
    );
    fireEvent.click(deleteButton);

    expect(screen.queryByTestId('inspector-trigger-trigger-1')).toBeNull();
  });

  it('shows mounted css action and opens mounted css modal', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'card-1',
          type: 'MdrCard',
          props: {
            className: 'card',
            mountedCss: [
              {
                id: 'css-1',
                path: 'src/styles/card.css',
                classes: ['card'],
              },
            ],
          },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'card-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    openStyleTab();
    fireEvent.click(screen.getByTestId('inspector-style-open-mounted-css'));
    expect(screen.getByTestId('mounted-css-modal')).toBeTruthy();
  });

  it('keeps style code button visible even without mounted css', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'card-1',
          type: 'MdrCard',
          props: { className: 'card' },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'card-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    openStyleTab();
    fireEvent.click(screen.getByTestId('inspector-style-open-mounted-css'));
    expect(screen.getByTestId('mounted-css-modal')).toBeTruthy();
  });
});
