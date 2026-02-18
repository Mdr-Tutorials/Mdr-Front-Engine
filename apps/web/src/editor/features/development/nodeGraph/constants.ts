import type { NodeGraphNodeType } from '../node';

export type NodeLibraryItem = {
  type: NodeGraphNodeType;
  title: string;
};

export type NodeLibraryGroup = {
  id: string;
  label: string;
  items: NodeLibraryItem[];
};

export const GRID_SIZE = 128;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 1.8;
export const ZOOM_STEP = 0.1;
export const NODE_HEADER_HEIGHT = 36;
export const EDGE_EXIT_OFFSET = 16;
export const CONTEXT_MENU_WIDTH = 220;
export const CONTEXT_MENU_SAFE_MARGIN = 12;
export const STORAGE_PREFIX = 'mdr:nodegraph:workspace';

export const EDGE_COLOR_OPTIONS: Array<{
  key: string;
  label: string;
  color: string | null;
}> = [
  { key: 'default', label: 'Default', color: null },
  { key: 'slate', label: 'Slate', color: '#475569' },
  { key: 'blue', label: 'Blue', color: '#2563eb' },
  { key: 'emerald', label: 'Emerald', color: '#059669' },
  { key: 'amber', label: 'Amber', color: '#d97706' },
  { key: 'rose', label: 'Rose', color: '#e11d48' },
];

export const NODE_LIBRARY_GROUPS: NodeLibraryGroup[] = [
  {
    id: 'branch',
    label: 'Branch',
    items: [
      { type: 'if-else', title: 'if-else' },
      { type: 'switch', title: 'switch' },
    ],
  },
  {
    id: 'loop',
    label: 'Loop',
    items: [
      { type: 'for-each', title: 'for-each' },
      { type: 'while', title: 'while' },
    ],
  },
  {
    id: 'flow',
    label: 'Flow',
    items: [
      { type: 'merge', title: 'merge' },
      { type: 'join', title: 'join' },
    ],
  },
  {
    id: 'terminal',
    label: 'Terminal',
    items: [{ type: 'end', title: 'end' }],
  },
];

export const NODE_LIBRARY = NODE_LIBRARY_GROUPS.flatMap((group) => group.items);
