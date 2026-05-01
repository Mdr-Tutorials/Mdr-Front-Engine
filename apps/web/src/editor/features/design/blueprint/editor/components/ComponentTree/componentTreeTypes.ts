import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ComponentNode } from '@/core/types/engine.types';

export type BlueprintEditorComponentTreeProps = {
  isCollapsed: boolean;
  isTreeCollapsed?: boolean;
  selectedId?: string;
  dropHint?: {
    overNodeId: string;
    placement: 'before' | 'after' | 'child';
  } | null;
  onToggleCollapse: () => void;
  onSelectNode: (nodeId: string) => void;
  onDeleteSelected: () => void;
  onDeleteNode: (nodeId: string) => void;
  onCopyNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, direction: 'up' | 'down') => void;
};

export type TreeNodeProps = {
  node: ComponentNode;
  depth: number;
  expandedKeys: string[];
  selectedId?: string;
  dropHint?: {
    overNodeId: string;
    placement: 'before' | 'after' | 'child';
  } | null;
  rootId?: string;
  parentId?: string;
  openMenuId?: string | null;
  onMenuAction?: (nodeId: string) => void;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
  onMove: (nodeId: string, direction: 'up' | 'down') => void;
  onOpenContextMenu: (
    node: ComponentNode,
    event: ReactMouseEvent<HTMLDivElement>
  ) => void;
};

export type TreeContextMenuState = {
  node: ComponentNode;
  x: number;
  y: number;
};

export type TreeContextMenuAction =
  | 'expand'
  | 'expandRecursive'
  | 'collapse'
  | 'collapseRecursive';

export type TreeContextMenuAvailability = {
  canExpand: boolean;
  canExpandRecursive: boolean;
  canCollapse: boolean;
  canCollapseRecursive: boolean;
};
