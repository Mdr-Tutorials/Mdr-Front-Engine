import type { MIRDocument } from '@/core/types/engine.types';
import type { TreeDropPlacement } from '@/editor/features/design/BlueprintEditor.tree';

export type TreeDropHint = {
  overNodeId: string;
  placement: TreeDropPlacement;
} | null;

export type PaletteItemDragData = {
  kind: 'palette-item';
  itemId: string;
  variantProps?: Record<string, unknown>;
  selectedSize?: string;
};

export type TreeSortDragData = {
  kind: 'tree-sort';
  nodeId: string;
  parentId?: string;
};

export type TreeNodeDropData = {
  kind: 'tree-node';
  nodeId: string;
};

export type TreeSortDropData = {
  kind: 'tree-sort';
  nodeId: string;
};

export type TreeRootDropData = {
  kind: 'tree-root';
};

export type CanvasDropData = {
  kind: 'canvas';
};

export type DragActiveData =
  | PaletteItemDragData
  | TreeSortDragData
  | { kind: string; [key: string]: unknown };

export type DragOverData =
  | TreeNodeDropData
  | TreeSortDropData
  | TreeRootDropData
  | CanvasDropData
  | { kind: string; [key: string]: unknown };

export type UseBlueprintDragDropOptions = {
  mirDoc: MIRDocument;
  currentPath: string;
  selectedId?: string;
  updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
  onNodeSelect: (nodeId: string) => void;
};
