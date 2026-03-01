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

  it('persists data model schema, mock json and list array field', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrDiv', text: 'Item' }]),
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

    fireEvent.click(screen.getByTestId('inspector-data-model-enable'));
    fireEvent.change(screen.getByTestId('inspector-data-model-schema'), {
      target: {
        value: JSON.stringify(
          {
            totalCount: 'number',
            items: [{ data: 'string' }],
          },
          null,
          2
        ),
      },
    });
    fireEvent.blur(screen.getByTestId('inspector-data-model-schema'));

    fireEvent.change(screen.getByTestId('inspector-data-model-mock'), {
      target: {
        value: JSON.stringify(
          {
            totalCount: 2,
            items: [{ data: 'mdr' }, { data: 'mar' }],
          },
          null,
          2
        ),
      },
    });
    fireEvent.blur(screen.getByTestId('inspector-data-model-mock'));

    fireEvent.click(screen.getByTestId('inspector-list-template-enable'));
    fireEvent.change(screen.getByTestId('inspector-list-array-field'), {
      target: { value: 'items' },
    });

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'child-1');
    expect(node?.data?.value).toEqual({
      totalCount: 'number',
      items: [{ data: 'string' }],
    });
    expect(node?.data?.mock).toEqual({
      totalCount: 2,
      items: [{ data: 'mdr' }, { data: 'mar' }],
    });
    expect(node?.list?.arrayField).toBe('items');
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

  it('updates external prop option through inspector field', () => {
    setExternalRuntimeMeta('MuiButton', {
      libraryId: 'mui',
      runtimeType: 'MuiButton',
      defaultProps: { variant: 'contained', size: 'medium' },
      propOptions: { variant: ['contained', 'outlined', 'text'] },
    });
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'mui-button-1',
          type: 'MuiButton',
          text: 'Button',
          props: { variant: 'contained', size: 'medium' },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'mui-button-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0] as HTMLSelectElement, {
      target: { value: 'outlined' },
    });

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'mui-button-1');
    expect(node?.props?.variant).toBe('outlined');
  });

  it('shows and updates MdrRoute inspector fields', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'route-1',
          type: 'MdrRoute',
          props: {
            currentPath: '/old',
          },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'route-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const currentPathInput = screen.getByTestId(
      'inspector-route-current-path'
    ) as HTMLInputElement;
    const emptyTextInput = screen.getByTestId(
      'inspector-route-empty-text'
    ) as HTMLInputElement;
    fireEvent.change(currentPathInput, { target: { value: '/about' } });
    fireEvent.change(emptyTextInput, { target: { value: 'No match' } });

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'route-1');
    expect(node?.props?.currentPath).toBe('/about');
    expect(node?.props?.emptyText).toBe('No match');
  });

  it('marks direct route child as index route from inspector', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'route-1',
          type: 'MdrRoute',
          children: [
            {
              id: 'route-child-1',
              type: 'MdrText',
              text: 'Child',
              props: { 'data-route-path': '/about' },
            },
          ],
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'route-child-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    const indexToggle = screen.getByTestId(
      'inspector-route-child-index'
    ) as HTMLInputElement;
    fireEvent.click(indexToggle);

    const routeNode = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'route-1');
    const routeChild = routeNode?.children?.find(
      (item) => item.id === 'route-child-1'
    );
    expect(routeChild?.props?.['data-route-index']).toBe(true);
    expect(routeChild?.props?.['data-route-path']).toBeUndefined();
  });

  it('updates and resets external boolean/number props through inspector fields', async () => {
    setExternalRuntimeMeta('MuiDialog', {
      libraryId: 'mui',
      runtimeType: 'MuiDialog',
      defaultProps: { open: false, maxWidth: 480, title: 'Dialog' },
      propOptions: { maxWidth: ['320', '480', '640'] },
    });
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'mui-dialog-1',
          type: 'MuiDialog',
          props: { open: true, maxWidth: 640, title: 'Confirm' },
        },
      ]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: 'mui-dialog-1',
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    fireEvent.click(screen.getByTestId('inspector-external-prop-open'));
    fireEvent.change(screen.getByTestId('inspector-external-prop-maxWidth'), {
      target: { value: '320' },
    });
    const openInput = screen.getByTestId(
      'inspector-external-prop-open'
    ) as HTMLInputElement;
    fireEvent.change(openInput, { target: { checked: false } });

    let node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'mui-dialog-1');
    expect(node?.props?.maxWidth).toBe('320');
    await waitFor(() => {
      const latest = useEditorStore
        .getState()
        .mirDoc.ui.root.children?.find((item) => item.id === 'mui-dialog-1');
      expect(latest?.props?.open).toBe(false);
    });

    fireEvent.click(screen.getByTestId('inspector-external-prop-reset-open'));
    fireEvent.click(
      screen.getByTestId('inspector-external-prop-reset-maxWidth')
    );

    node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'mui-dialog-1');
    expect(node?.props?.open).toBeUndefined();
    expect(node?.props?.maxWidth).toBeUndefined();
  });

  it('mounts data model JSON on selected node', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'card-1', type: 'MdrCard' }]),
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

    fireEvent.click(screen.getByTestId('inspector-data-model-enable'));
    const textarea = screen.getByTestId(
      'inspector-data-model-schema'
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: '{ "title": "Demo", "meta": { "price": 9.9 } }' },
    });
    fireEvent.blur(textarea);

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'card-1');
    expect(node?.data?.value).toEqual({
      title: 'Demo',
      meta: { price: 9.9 },
    });
  });

  it('persists array json in mock input', () => {
    resetEditorStore({
      mirDoc: createMirDoc([{ id: 'card-1', type: 'MdrCard' }]),
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

    fireEvent.click(screen.getByTestId('inspector-data-model-enable'));
    const textarea = screen.getByTestId(
      'inspector-data-model-mock'
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: '[{"data":"mdr"},{"data":"mar"}]' },
    });
    fireEvent.blur(textarea);

    const node = useEditorStore
      .getState()
      .mirDoc.ui.root.children?.find((item) => item.id === 'card-1');
    expect(node?.data?.mock).toEqual([{ data: 'mdr' }, { data: 'mar' }]);
  });

  it('shows parent data-model field paths in child external prop input', () => {
    setExternalRuntimeMeta('MuiCard', {
      libraryId: 'mui',
      runtimeType: 'MuiCard',
      defaultProps: { title: '' },
    });
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'parent',
          type: 'MdrDiv',
          data: {
            extend: {
              title: 'Demo',
              detail: { price: 18 },
            },
          },
          children: [{ id: 'card-1', type: 'MuiCard' }],
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
      'inspector-external-prop-title'
    ) as HTMLInputElement;
    expect(input.getAttribute('list')).toBe('inspector-prop-paths-card-1');
    const datalist = document.getElementById('inspector-prop-paths-card-1');
    expect(datalist?.querySelector('option[value=\"title\"]')).toBeTruthy();
    expect(
      datalist?.querySelector('option[value=\"detail.price\"]')
    ).toBeTruthy();
  });
});
