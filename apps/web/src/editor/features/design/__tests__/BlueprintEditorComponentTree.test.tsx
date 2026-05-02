import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorComponentTree } from '@/editor/features/design/BlueprintEditorComponentTree';
import { createMirDoc, resetEditorStore } from '@/test-utils/editorStore';

let mockDraggableState = {
  attributes: {},
  listeners: {},
  setNodeRef: () => {},
  transform: null,
  isDragging: false,
};

let mockDroppableState = {
  setNodeRef: () => {},
  isOver: false,
};

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => mockDraggableState,
  useDroppable: () => mockDroppableState,
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => {
        if (!transform) return '';
        return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
      },
    },
  },
}));

vi.mock('lucide-react', () => ({
  ArrowDown: () => null,
  ArrowUp: () => null,
  Box: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
  ChevronUp: () => null,
  Copy: () => null,
  GripVertical: () => null,
  LayoutGrid: () => null,
  Layers: () => null,
  MoreHorizontal: () => null,
  MousePointerClick: () => null,
  Trash2: () => null,
  Type: () => null,
  TextCursorInput: () => null,
}));

beforeEach(() => {
  resetEditorStore();
  // Reset mock states
  mockDraggableState = {
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
  };
  mockDroppableState = {
    setNodeRef: () => {},
    isOver: false,
  };
});

describe('BlueprintEditorComponentTree', () => {
  it('renders collapsed state with expand button', () => {
    render(
      <BlueprintEditorComponentTree
        isCollapsed
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={() => {}}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Expand component tree' })
    ).toBeTruthy();
  });

  it('shows node counts and selection, and fires actions', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        { id: 'child-1', type: 'MdrText', text: 'Text' },
        {
          id: 'child-2',
          type: 'MdrDiv',
          children: [{ id: 'child-2a', type: 'MdrText', text: 'Nested' }],
        },
      ]),
    });

    const onToggleCollapse = vi.fn();
    const onSelectNode = vi.fn();
    const onDeleteSelected = vi.fn();
    const onDeleteNode = vi.fn();
    const onCopyNode = vi.fn();
    const onMoveNode = vi.fn();

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId="child-1"
        onToggleCollapse={onToggleCollapse}
        onSelectNode={onSelectNode}
        onDeleteSelected={onDeleteSelected}
        onDeleteNode={onDeleteNode}
        onCopyNode={onCopyNode}
        onMoveNode={onMoveNode}
      />
    );

    expect(screen.getByText('4')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse component tree' })
    );
    expect(onToggleCollapse).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('MdrText (child-1)'));
    expect(onSelectNode).toHaveBeenCalledWith('child-1');

    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[1]);
    expect(onDeleteNode).toHaveBeenCalledWith('child-1');

    fireEvent.click(screen.getByLabelText('Delete selected component'));
    expect(onDeleteSelected).toHaveBeenCalled();

    const moveUpButtons = screen.getAllByLabelText('Move up');
    fireEvent.click(moveUpButtons[1]);
    expect(onMoveNode).toHaveBeenCalledWith('child-1', 'up');
  });

  it('double-clicks a collapsed node to expand it without selecting', () => {
    vi.useFakeTimers();
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'child-2',
          type: 'MdrDiv',
          children: [{ id: 'child-2a', type: 'MdrText', text: 'Nested' }],
        },
      ]),
    });

    const onSelectNode = vi.fn();

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={onSelectNode}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    );

    expect(screen.queryByTitle('MdrText (child-2a)')).toBeNull();

    fireEvent.doubleClick(screen.getByTitle('MdrDiv (child-2)'));
    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(onSelectNode).not.toHaveBeenCalled();
    expect(screen.getByTitle('MdrText (child-2a)')).toBeTruthy();
    vi.useRealTimers();
  });

  it('double-clicks an expanded node to collapse it', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'child-2',
          type: 'MdrDiv',
          children: [{ id: 'child-2a', type: 'MdrText', text: 'Nested' }],
        },
      ]),
    });

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={() => {}}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    );

    fireEvent.doubleClick(screen.getByTitle('MdrDiv (child-2)'));
    expect(screen.getByTitle('MdrText (child-2a)')).toBeTruthy();

    fireEvent.doubleClick(screen.getByTitle('MdrDiv (child-2)'));
    expect(screen.queryByTitle('MdrText (child-2a)')).toBeNull();
  });

  it('uses the context menu to expand and collapse a branch recursively', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'parent-1',
          type: 'MdrDiv',
          children: [
            {
              id: 'nested-1',
              type: 'MdrDiv',
              children: [{ id: 'leaf-1', type: 'MdrText', text: 'Leaf' }],
            },
          ],
        },
      ]),
    });

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={() => {}}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    );

    expect(screen.queryByTitle('MdrDiv (nested-1)')).toBeNull();

    fireEvent.contextMenu(screen.getByTitle('MdrDiv (parent-1)'));
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Expand recursively' })
    );
    expect(screen.getByTitle('MdrDiv (nested-1)')).toBeTruthy();
    expect(screen.getByTitle('MdrText (leaf-1)')).toBeTruthy();
  });

  it('renders layout pattern root with distinguishable type label', () => {
    resetEditorStore({
      mirDoc: createMirDoc([
        {
          id: 'pattern-root',
          type: 'MdrDiv',
          props: {
            dataAttributes: {
              'data-layout-pattern': 'split',
              'data-layout-pattern-root': 'true',
              'data-layout-role': 'root',
              'data-layout-version': '1',
            },
          },
          children: [],
        },
      ]),
    });

    render(
      <BlueprintEditorComponentTree
        isCollapsed={false}
        selectedId={undefined}
        onToggleCollapse={() => {}}
        onSelectNode={() => {}}
        onDeleteSelected={() => {}}
        onDeleteNode={() => {}}
        onCopyNode={() => {}}
        onMoveNode={() => {}}
      />
    );

    expect(screen.getByTitle('Split (pattern-root)')).toBeTruthy();
  });
});
