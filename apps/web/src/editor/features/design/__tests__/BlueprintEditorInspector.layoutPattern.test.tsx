import { fireEvent, render, screen } from '@testing-library/react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorInspector } from '../BlueprintEditorInspector';
import { resetInspectorExpansionPersistence } from '../BlueprintEditorInspector.controller';
import { buildLayoutPatternNode } from '../blueprint/layoutPatterns/registry';
import {
  getLayoutPatternParamKey,
  isLayoutPatternRootNode,
} from '../blueprint/layoutPatterns/dataAttributes';
import { resetLayoutPanelExpansionPersistence } from '../inspector/panels/LayoutPanel';
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

describe('BlueprintEditorInspector layout pattern panel', () => {
  it('updates split ratio and persists params into root data attributes', () => {
    const createId = (() => {
      const counter: Record<string, number> = {};
      return (type: string) => {
        const next = (counter[type] ?? 0) + 1;
        counter[type] = next;
        return `${type}-${next}`;
      };
    })();

    const splitNode = buildLayoutPatternNode({
      patternId: 'split',
      createId,
    });
    if (!splitNode || !isLayoutPatternRootNode(splitNode)) {
      throw new Error('Expected split layout pattern root node');
    }

    resetEditorStore({
      mirDoc: createMirDoc([splitNode]),
      blueprintStateByProject: {
        [PROJECT_ID]: {
          ...DEFAULT_BLUEPRINT_STATE,
          selectedId: splitNode.id,
        },
      },
    });

    render(
      <BlueprintEditorInspector
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />
    );

    if (!screen.queryByText('Pattern')) {
      fireEvent.click(screen.getByText('Style'));
    }
    if (!screen.queryByText('Split Ratio')) {
      fireEvent.click(screen.getByText('Pattern'));
    }

    const ratioInput = screen.getByPlaceholderText('1-1') as HTMLInputElement;
    fireEvent.change(ratioInput, {
      target: { value: '3-7' },
    });

    const child = useEditorStore.getState().mirDoc.ui.root.children?.[0];
    const attributes = child?.props?.dataAttributes as Record<string, string>;

    expect(child?.style?.gridTemplateColumns).toBe('3fr 7fr');
    expect(attributes[getLayoutPatternParamKey('ratio')]).toBe('3-7');
  });
});
