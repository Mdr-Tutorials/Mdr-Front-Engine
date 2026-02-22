import type { Node } from '@xyflow/react';
import type { GraphNodeData, GraphNodeKind } from './GraphNode';
import { supportsPortSemantic } from './nodeCatalog';
import {
  normalizeHandleId,
  parseHandleInfo,
  type PortRole,
} from './graphPortUtils';
import {
  GROUP_BOX_THEME_OPTIONS,
  MENU_COLUMN_GAP,
  MENU_COLUMN_WIDTH,
  MENU_VIEWPORT_PADDING,
  STICKY_NOTE_THEME_OPTIONS,
  clampNumber,
  getMenuTreeDepth,
  resolveAttachedGroupBoxId,
  type ContextMenuItem,
  type ContextMenuState,
} from './nodeGraphEditorModel';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type LocalizedNodeMenuItem = {
  icon?: string;
  kind: GraphNodeKind;
  label: string;
};

export type LocalizedNodeMenuGroup = {
  id: string;
  items: LocalizedNodeMenuItem[];
  label: string;
};

type BuildContextMenuItemsParams = {
  createNodeFromCanvas: (kind: GraphNodeKind) => void;
  createNodeFromGroupBox: (kind: GraphNodeKind) => void;
  createNodeFromPort: (kind: GraphNodeKind) => void;
  deleteNode: () => void;
  detachNodeFromBox: () => void;
  disconnectPort: () => void;
  duplicateNode: () => void;
  localizedNodeMenuGroups: LocalizedNodeMenuGroup[];
  menu: ContextMenuState;
  nodes: Node<GraphNodeData>[];
  portMenuGroups: LocalizedNodeMenuGroup[];
  t: TranslateFn;
  updateNodeColorTheme: (nodeId: string, color: string) => void;
};

export const resolvePortMenuGroups = ({
  localizedNodeMenuGroups,
  menu,
}: {
  localizedNodeMenuGroups: LocalizedNodeMenuGroup[];
  menu: ContextMenuState;
}) => {
  if (!menu || menu.kind !== 'port') return localizedNodeMenuGroups;
  const normalizedHandleId = normalizeHandleId(menu.handleId);
  const handleInfo = parseHandleInfo(normalizedHandleId);
  if (!handleInfo) return [];
  const requiredRole: PortRole = menu.role === 'source' ? 'in' : 'out';
  return localizedNodeMenuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        supportsPortSemantic(item.kind, requiredRole, handleInfo.semantic)
      ),
    }))
    .filter((group) => group.items.length > 0);
};

export const buildContextMenuItems = ({
  createNodeFromCanvas,
  createNodeFromGroupBox,
  createNodeFromPort,
  deleteNode,
  detachNodeFromBox,
  disconnectPort,
  duplicateNode,
  localizedNodeMenuGroups,
  menu,
  nodes,
  portMenuGroups,
  t,
  updateNodeColorTheme,
}: BuildContextMenuItemsParams): ContextMenuItem[] => {
  if (!menu) return [];

  if (menu.kind === 'canvas') {
    return [
      {
        id: 'canvas-create-node',
        label: t('nodeGraph.menu.createNode', {
          defaultValue: 'Create Node',
        }),
        icon: '＋',
        children: localizedNodeMenuGroups.map((group) => ({
          id: `canvas-group-${group.id}`,
          label: group.label,
          children: group.items.map((item) => ({
            id: `canvas-node-${group.id}-${item.kind}`,
            label: item.label,
            icon: item.icon,
            onSelect: () => createNodeFromCanvas(item.kind),
          })),
        })),
      },
    ];
  }

  if (menu.kind === 'node') {
    const targetNode = nodes.find((node) => node.id === menu.nodeId);
    const isGroupBoxTarget = targetNode?.data.kind === 'groupBox';
    const isStickyNoteTarget = targetNode?.data.kind === 'stickyNote';
    const attachedGroupId =
      targetNode && targetNode.data.kind !== 'groupBox'
        ? resolveAttachedGroupBoxId(targetNode, nodes)
        : undefined;
    const canCreateInGroup = Boolean(isGroupBoxTarget);
    const groupedMenuItems = canCreateInGroup
      ? localizedNodeMenuGroups
          .map((group) => ({
            id: `group-node-${group.id}`,
            label: group.label,
            children: group.items
              .filter((item) => item.kind !== 'groupBox')
              .map((item) => ({
                id: `group-node-${group.id}-${item.kind}`,
                label: item.label,
                icon: item.icon,
                onSelect: () => createNodeFromGroupBox(item.kind),
              })),
          }))
          .filter((group) => group.children.length > 0)
      : [];
    const themeOptions = isGroupBoxTarget
      ? GROUP_BOX_THEME_OPTIONS
      : isStickyNoteTarget
        ? STICKY_NOTE_THEME_OPTIONS
        : [];
    return [
      ...(canCreateInGroup
        ? [
            {
              id: 'group-create-node',
              label: t('nodeGraph.menu.createNodeInBox', {
                defaultValue: 'Create in Box',
              }),
              icon: '＋',
              children: groupedMenuItems,
            } satisfies ContextMenuItem,
          ]
        : []),
      ...(targetNode && themeOptions.length
        ? [
            {
              id: 'node-theme',
              label: t('nodeGraph.menu.theme', {
                defaultValue: 'Theme',
              }),
              icon: '◐',
              children: themeOptions.map((item) => ({
                id: `node-theme-${item.value}`,
                label: t(item.labelKey, {
                  defaultValue: item.defaultLabel,
                }),
                onSelect: () => updateNodeColorTheme(targetNode.id, item.value),
              })),
            } satisfies ContextMenuItem,
          ]
        : []),
      {
        id: 'node-duplicate',
        label: t('nodeGraph.menu.duplicateNode', {
          defaultValue: 'Duplicate Node',
        }),
        icon: '⧉',
        onSelect: duplicateNode,
      },
      ...(attachedGroupId
        ? [
            {
              id: 'node-detach-box',
              label: t('nodeGraph.menu.detachFromBox', {
                defaultValue: 'Detach from Box',
              }),
              icon: '⤴',
              onSelect: detachNodeFromBox,
            } satisfies ContextMenuItem,
          ]
        : []),
      {
        id: 'node-delete',
        label: t('nodeGraph.menu.deleteNode', {
          defaultValue: 'Delete Node',
        }),
        icon: '×',
        tone: 'danger',
        onSelect: deleteNode,
      },
    ];
  }

  return [
    {
      id: 'port-disconnect',
      label: t('nodeGraph.menu.disconnectPort', {
        defaultValue: 'Disconnect',
      }),
      icon: '⨯',
      onSelect: disconnectPort,
    },
    {
      id: 'port-create-connect',
      label: t('nodeGraph.menu.createAndConnect', {
        defaultValue: 'Create and Connect',
      }),
      icon: '＋',
      children: portMenuGroups.map((group) => ({
        id: `port-group-${group.id}`,
        label: group.label,
        children: group.items.map((item) => ({
          id: `port-node-${group.id}-${item.kind}`,
          label: item.label,
          icon: item.icon,
          onSelect: () => createNodeFromPort(item.kind),
        })),
      })),
    },
  ];
};

export const buildMenuColumns = (
  menuItems: ContextMenuItem[],
  menuPath: number[]
) => {
  if (!menuItems.length) return [] as ContextMenuItem[][];
  const columns: ContextMenuItem[][] = [menuItems];
  let levelItems = menuItems;
  let levelIndex = 0;
  while (true) {
    const selectedIndex = menuPath[levelIndex];
    if (typeof selectedIndex !== 'number') break;
    const selectedItem = levelItems[selectedIndex];
    if (!selectedItem?.children?.length) break;
    columns.push(selectedItem.children);
    levelItems = selectedItem.children;
    levelIndex += 1;
  }
  return columns;
};

export type ContextMenuLayout = { lefts: number[]; top: number } | null;

export const resolveMenuLayout = ({
  menu,
  menuColumns,
  menuItems,
}: {
  menu: ContextMenuState;
  menuColumns: ContextMenuItem[][];
  menuItems: ContextMenuItem[];
}): ContextMenuLayout => {
  if (!menu || !menuColumns.length) return null;
  if (typeof window === 'undefined') {
    return {
      top: menu.y,
      lefts: menuColumns.map((_, index) => menu.x + index * 224),
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const minLeft = MENU_VIEWPORT_PADDING;
  const maxLeft = Math.max(
    MENU_VIEWPORT_PADDING,
    viewportWidth - MENU_COLUMN_WIDTH - MENU_VIEWPORT_PADDING
  );
  const rootLeft = clampNumber(menu.x, minLeft, maxLeft);
  const menuMaxDepth = getMenuTreeDepth(menuItems);
  const maxSpan =
    (Math.max(1, menuMaxDepth) - 1) * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP);
  const canOpenRight =
    rootLeft + maxSpan + MENU_COLUMN_WIDTH <=
    viewportWidth - MENU_VIEWPORT_PADDING;
  const canOpenLeft = rootLeft - maxSpan >= MENU_VIEWPORT_PADDING;
  const direction = canOpenRight || !canOpenLeft ? 1 : -1;
  const top = clampNumber(
    menu.y,
    MENU_VIEWPORT_PADDING,
    Math.max(MENU_VIEWPORT_PADDING, viewportHeight - 120)
  );

  return {
    top,
    lefts: menuColumns.map((_, level) =>
      clampNumber(
        rootLeft + direction * level * (MENU_COLUMN_WIDTH + MENU_COLUMN_GAP),
        minLeft,
        maxLeft
      )
    ),
  };
};
