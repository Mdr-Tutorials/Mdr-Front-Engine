import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueprintEditorComponentTree } from '../BlueprintEditorComponentTree';
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

  describe('Drag and Drop Behavior', () => {
    it('applies isDragging state and reduces opacity when dragging', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      mockDraggableState.isDragging = true;

      const { container } = render(
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

      const treeItem = container.querySelector('.BlueprintEditorTreeItem');
      expect(treeItem).toBeTruthy();
      const style = window.getComputedStyle(treeItem!);
      expect(treeItem?.getAttribute('style')).toContain('opacity');
    });

    it('applies isOver state with IsOver class when hovering', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      mockDroppableState.isOver = true;

      const { container } = render(
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

      const treeItem = container.querySelector('.BlueprintEditorTreeItem');
      expect(treeItem?.classList.contains('IsOver')).toBe(true);
    });

    it('shows DropBefore class when dropHint placement is before', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      const { container } = render(
        <BlueprintEditorComponentTree
          isCollapsed={false}
          selectedId={undefined}
          dropHint={{ overNodeId: 'child-1', placement: 'before' }}
          onToggleCollapse={() => {}}
          onSelectNode={() => {}}
          onDeleteSelected={() => {}}
          onDeleteNode={() => {}}
          onCopyNode={() => {}}
          onMoveNode={() => {}}
        />
      );

      const treeItems = container.querySelectorAll('.BlueprintEditorTreeItem');
      const childItem = Array.from(treeItems).find((item) =>
        item.getAttribute('title')?.includes('child-1')
      );
      expect(childItem?.classList.contains('DropBefore')).toBe(true);
    });

    it('shows DropAfter class when dropHint placement is after', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      const { container } = render(
        <BlueprintEditorComponentTree
          isCollapsed={false}
          selectedId={undefined}
          dropHint={{ overNodeId: 'child-1', placement: 'after' }}
          onToggleCollapse={() => {}}
          onSelectNode={() => {}}
          onDeleteSelected={() => {}}
          onDeleteNode={() => {}}
          onCopyNode={() => {}}
          onMoveNode={() => {}}
        />
      );

      const treeItems = container.querySelectorAll('.BlueprintEditorTreeItem');
      const childItem = Array.from(treeItems).find((item) =>
        item.getAttribute('title')?.includes('child-1')
      );
      expect(childItem?.classList.contains('DropAfter')).toBe(true);
    });

    it('shows DropChild class when dropHint placement is child', () => {
      resetEditorStore({
        mirDoc: createMirDoc([{ id: 'child-1', type: 'MdrDiv', children: [] }]),
      });

      const { container } = render(
        <BlueprintEditorComponentTree
          isCollapsed={false}
          selectedId={undefined}
          dropHint={{ overNodeId: 'child-1', placement: 'child' }}
          onToggleCollapse={() => {}}
          onSelectNode={() => {}}
          onDeleteSelected={() => {}}
          onDeleteNode={() => {}}
          onCopyNode={() => {}}
          onMoveNode={() => {}}
        />
      );

      const treeItems = container.querySelectorAll('.BlueprintEditorTreeItem');
      const childItem = Array.from(treeItems).find((item) =>
        item.getAttribute('title')?.includes('child-1')
      );
      expect(childItem?.classList.contains('DropChild')).toBe(true);
    });

    it('applies transform style when dragging with transform value', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      mockDraggableState.transform = { x: 10, y: 20, scaleX: 1, scaleY: 1 };

      const { container } = render(
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

      const treeItems = container.querySelectorAll('.BlueprintEditorTreeItem');
      const childItem = Array.from(treeItems).find((item) =>
        item.getAttribute('title')?.includes('child-1')
      );
      const style = childItem?.getAttribute('style');
      expect(style).toBeTruthy();
      expect(style).toContain('transform');
    });

    it('renders drag handle with proper attributes and listeners', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      const mockListeners = { onPointerDown: vi.fn() };
      mockDraggableState.listeners = mockListeners;

      const { container } = render(
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

      const dragHandle = container.querySelector(
        '.BlueprintEditorTreeDragHandle'
      );
      expect(dragHandle).toBeTruthy();
      expect(dragHandle?.getAttribute('aria-label')).toBe('Drag to reorder');
    });

    it('disables drag handle for root node', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          { id: 'child-1', type: 'MdrText', text: 'Text' },
        ]),
      });

      const { container } = render(
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

      const dragHandles = container.querySelectorAll(
        '.BlueprintEditorTreeDragHandle'
      );
      const rootDragHandle = dragHandles[0];
      expect(rootDragHandle?.hasAttribute('disabled')).toBe(true);
    });

    it('handles nested nodes with proper drag and drop states', () => {
      resetEditorStore({
        mirDoc: createMirDoc([
          {
            id: 'parent-1',
            type: 'MdrDiv',
            children: [{ id: 'child-1', type: 'MdrText', text: 'Nested Text' }],
          },
        ]),
      });

      const { container } = render(
        <BlueprintEditorComponentTree
          isCollapsed={false}
          selectedId={undefined}
          dropHint={{ overNodeId: 'child-1', placement: 'before' }}
          onToggleCollapse={() => {}}
          onSelectNode={() => {}}
          onDeleteSelected={() => {}}
          onDeleteNode={() => {}}
          onCopyNode={() => {}}
          onMoveNode={() => {}}
        />
      );

      const treeItems = container.querySelectorAll('.BlueprintEditorTreeItem');
      expect(treeItems.length).toBeGreaterThan(1);

      const nestedItem = Array.from(treeItems).find((item) =>
        item.getAttribute('title')?.includes('child-1')
      );
      expect(nestedItem?.classList.contains('DropBefore')).toBe(true);
    });
  });
});
