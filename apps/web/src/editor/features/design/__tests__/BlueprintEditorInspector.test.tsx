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

  it('creates navigate trigger with _blank as default target', () => {
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

    fireEvent.click(screen.getByTestId('inspector-add-trigger'));

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'child-1');
    const params = node?.events?.['trigger-1']?.params;
    expect(params?.target).toBe('_blank');
  });

  it('resets action params when switching trigger action type', () => {
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

    fireEvent.click(screen.getByTestId('inspector-add-trigger'));
    const triggerCard = screen.getByTestId('inspector-trigger-trigger-1');
    const selects = triggerCard.querySelectorAll('select');
    fireEvent.change(selects[1] as HTMLSelectElement, {
      target: { value: 'executeGraph' },
    });

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'child-1');
    const params = node?.events?.['trigger-1']?.params;
    expect(params?.graphMode).toBe('new');
    expect(params?.graphName).toBe('');
    expect(params?.graphId).toBe('');
    expect(params?.target).toBeUndefined();
  });

  it('updates iconRef after selecting icon from picker', async () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'icon-1',
          type: 'MdrIcon',
          props: {
            iconRef: { provider: 'lucide', name: 'Circle' },
            size: 20,
          },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'icon-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    fireEvent.click(screen.getByTestId('inspector-open-icon-picker'));
    fireEvent.change(screen.getByTestId('icon-picker-search'), {
      target: { value: 'sparkles' },
    });
    fireEvent.click(screen.getByTestId('icon-picker-option-Sparkles'));
    fireEvent.click(screen.getByTestId('icon-picker-apply'));

    await waitFor(() => {
      const node = useEditorStore
        .getState()
        .mirDoc.ui.root.children?.find((item) => item.id === 'icon-1');
      expect(node?.props?.iconRef).toEqual({
        provider: 'lucide',
        name: 'Sparkles',
      });
    });
  });

  it('updates className through class protocol editor', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'card-1',
          type: 'MdrCard',
          props: {},
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

    const input = screen.getByTestId(
      'inspector-classname-input'
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { value: 'p-4 flex items-center gap-2' },
    });

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'card-1');
    expect(node?.props?.className).toBe('p-4 flex items-center gap-2');
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

    fireEvent.click(screen.getByTestId('inspector-style-open-mounted-css'));
    expect(screen.getByTestId('mounted-css-modal')).toBeTruthy();
  });

  it('saves mounted css content into node props', () => {
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

    fireEvent.click(screen.getByTestId('inspector-style-open-mounted-css'));
    fireEvent.change(screen.getByTestId('mounted-css-codemirror'), {
      target: { value: '.card { color: red; }' },
    });
    fireEvent.click(screen.getByTestId('mounted-css-save'));

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'card-1');
    const mountedCss = (node?.props?.mountedCss ?? []) as Array<
      Record<string, unknown>
    >;
    expect(mountedCss.length).toBe(1);
    expect(mountedCss[0]?.path).toBe('src/styles/mounted/card-1.css');
    expect(mountedCss[0]?.content).toContain('.card');
    expect(mountedCss[0]?.classes).toContain('card');
  });
});
