import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  GripVertical,
  LayoutGrid,
  Layers,
  MoreHorizontal,
  MousePointerClick,
  Trash2,
  Type,
  TextCursorInput,
} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ComponentNode } from '@/core/types/engine.types';
import { useEditorStore } from '@/editor/store/useEditorStore';
import {
  getLayoutPatternId,
  isLayoutPatternRootNode,
} from './blueprint/layoutPatterns/dataAttributes';

type BlueprintEditorComponentTreeProps = {
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

const collectExpandedKeys = (node: ComponentNode, keys: string[] = []) => {
  if (node.children && node.children.length > 0) {
    keys.push(node.id);
    node.children.forEach((child) => collectExpandedKeys(child, keys));
  }
  return keys;
};

const collectBranchExpandedKeys = (
  node: ComponentNode,
  keys: string[] = []
) => {
  if (node.children && node.children.length > 0) {
    keys.push(node.id);
    node.children.forEach((child) => collectBranchExpandedKeys(child, keys));
  }
  return keys;
};

const findAncestorIds = (
  node: ComponentNode,
  targetId: string,
  ancestors: string[] = []
): string[] | null => {
  if (node.id === targetId) return ancestors;
  const children = node.children ?? [];
  for (const child of children) {
    const result = findAncestorIds(child, targetId, [...ancestors, node.id]);
    if (result) return result;
  }
  return null;
};

const getNodeIcon = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes('text')) return Type;
  if (normalized.includes('button')) return MousePointerClick;
  if (normalized.includes('input')) return TextCursorInput;
  if (
    normalized.includes('div') ||
    normalized.includes('container') ||
    normalized.includes('section')
  )
    return LayoutGrid;
  return Box;
};

const countNodes = (node: ComponentNode): number => {
  const children = node.children ?? [];
  return 1 + children.reduce((acc, child) => acc + countNodes(child), 0);
};

const formatPatternLabel = (patternId: string) =>
  patternId
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('-');

const isHiddenBySplitCategory = (node: ComponentNode) => {
  const props =
    node.props && typeof node.props === 'object'
      ? (node.props as Record<string, unknown>)
      : null;
  const dataAttributes =
    props?.dataAttributes && typeof props.dataAttributes === 'object'
      ? (props.dataAttributes as Record<string, unknown>)
      : null;
  if (dataAttributes?.['data-layout-pattern'] !== 'split') return false;
  if (dataAttributes?.['data-layout-role'] !== 'content') return false;
  return props?.display === 'None';
};

type TreeNodeProps = {
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

type TreeContextMenuState = {
  node: ComponentNode;
  x: number;
  y: number;
};

type TreeContextMenuAction =
  | 'expand'
  | 'expandRecursive'
  | 'collapse'
  | 'collapseRecursive';

type TreeContextMenuAvailability = {
  canExpand: boolean;
  canExpandRecursive: boolean;
  canCollapse: boolean;
  canCollapseRecursive: boolean;
};

const INDENT_PX = 12;
const NODE_SELECT_DELAY_MS = 220;
const CONTEXT_MENU_WIDTH_PX = 168;
const CONTEXT_MENU_HEIGHT_PX = 132;
const CONTEXT_MENU_VIEWPORT_GAP_PX = 8;

function BlueprintTreeNode({
  node,
  depth,
  expandedKeys,
  selectedId,
  dropHint,
  rootId,
  parentId,
  openMenuId,
  onMenuAction,
  onToggle,
  onSelect,
  onDelete,
  onCopy,
  onMove,
  onOpenContextMenu,
}: TreeNodeProps) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedKeys.includes(node.id);
  const layoutPatternId = getLayoutPatternId(node);
  const isLayoutPatternRoot = isLayoutPatternRootNode(node);
  const Icon = isLayoutPatternRoot ? Layers : getNodeIcon(node.type);
  const nodeTypeLabel =
    isLayoutPatternRoot && layoutPatternId
      ? formatPatternLabel(layoutPatternId)
      : node.type;
  const nodeLabel = `${nodeTypeLabel} (${node.id})`;
  const hiddenBySplitCategory = isHiddenBySplitCategory(node);
  const nodeTypeSecondaryLabel = hiddenBySplitCategory
    ? 'Hidden by 2 Columns'
    : null;
  const isRoot = rootId && node.id === rootId;
  const dropPlacement =
    dropHint?.overNodeId === node.id ? dropHint.placement : null;
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { kind: 'tree-sort', nodeId: node.id, parentId },
    disabled: isRoot,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `tree-node:${node.id}`,
    data: { kind: 'tree-node', nodeId: node.id },
  });
  const setNodeRef = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.6 : undefined,
  };
  const selectTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      if (selectTimer.current) {
        window.clearTimeout(selectTimer.current);
        selectTimer.current = null;
      }
    };
  }, []);

  return (
    <div className="BlueprintEditorTreeNode flex flex-col gap-px">
      <div
        className="BlueprintEditorTreeRow flex items-center [&:focus-within_.BlueprintEditorTreeDragHandle]:opacity-100 [&:hover_.BlueprintEditorTreeDragHandle]:opacity-100"
        style={{ paddingLeft: depth * INDENT_PX }}
        onContextMenu={(event) => {
          if (!hasChildren) return;
          event.preventDefault();
          event.stopPropagation();
          if (typeof window !== 'undefined' && selectTimer.current) {
            window.clearTimeout(selectTimer.current);
            selectTimer.current = null;
          }
          onOpenContextMenu(node, event);
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`BlueprintEditorTreeToggle inline-flex h-4 w-4 flex-none items-center justify-center rounded-md border-0 bg-transparent text-(--text-muted) hover:text-(--text-primary) ${isExpanded ? 'Expanded' : ''}`}
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        ) : (
          <span
            className="BlueprintEditorTreeSpacer h-4 w-4 flex-none"
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          className="BlueprintEditorTreeDragHandle inline-flex h-4 w-4 flex-none cursor-grab items-center justify-center rounded-md border-0 bg-transparent text-(--text-muted) opacity-0 transition-[opacity,color] duration-150 active:cursor-grabbing disabled:cursor-default disabled:opacity-0"
          disabled={isRoot}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </button>
        <div
          ref={setNodeRef}
          role="button"
          tabIndex={0}
          className={`BlueprintEditorTreeItem relative flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-transparent px-0 py-px text-left text-(--text-secondary) transition-[color,opacity,background,box-shadow] duration-150 hover:text-(--text-primary) [&.IsOver]:text-(--text-primary) [&.Selected]:text-(--text-primary) [&.Selected_.BlueprintEditorTreeCount]:text-(--text-secondary) [&.Selected_.BlueprintEditorTreeIcon]:text-(--text-primary) [&:focus-within_.BlueprintEditorTreeActions]:opacity-100 [&:hover_.BlueprintEditorTreeActions]:opacity-100 [&:hover_.BlueprintEditorTreeIcon]:text-(--text-primary) ${selectedId === node.id ? 'Selected' : ''} ${isOver ? 'IsOver' : ''} ${dropPlacement === 'before' ? 'DropBefore' : ''} ${dropPlacement === 'after' ? 'DropAfter' : ''} ${dropPlacement === 'child' ? 'DropChild bg-(--bg-raised) shadow-[inset_0_0_0_1px_var(--border-strong)]' : ''}`.trim()}
          style={style}
          onClick={(event) => {
            // For collapsed parent nodes, defer selection briefly so double-click can expand only.
            if (hasChildren && !isExpanded) {
              if (typeof window !== 'undefined') {
                if (selectTimer.current) {
                  window.clearTimeout(selectTimer.current);
                }
                if (event.detail > 1) return;
                selectTimer.current = window.setTimeout(() => {
                  onSelect(node.id);
                  selectTimer.current = null;
                }, NODE_SELECT_DELAY_MS);
              }
              return;
            }
            onSelect(node.id);
          }}
          onDoubleClick={(event) => {
            if (!hasChildren) return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof window !== 'undefined' && selectTimer.current) {
              window.clearTimeout(selectTimer.current);
              selectTimer.current = null;
            }
            onToggle(node.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(node.id);
            }
          }}
          title={nodeLabel}
          aria-label={nodeLabel}
        >
          {dropPlacement === 'before' && (
            <span
              className="pointer-events-none absolute -top-1 right-2.5 left-2.5 h-0.5 rounded-full bg-(--accent-color) shadow-[0_0_0_1px_var(--bg-canvas)]"
              aria-hidden="true"
            />
          )}
          {dropPlacement === 'after' && (
            <span
              className="pointer-events-none absolute right-2.5 -bottom-1 left-2.5 h-0.5 rounded-full bg-(--accent-color) shadow-[0_0_0_1px_var(--bg-canvas)]"
              aria-hidden="true"
            />
          )}
          <span
            className="BlueprintEditorTreeIcon inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-transparent text-(--text-muted)"
            aria-hidden="true"
          >
            <Icon size={12} />
          </span>
          <span className="BlueprintEditorTreeMeta flex min-w-0 items-center gap-1.5 select-none">
            <span className="BlueprintEditorTreeTypeRow inline-flex min-w-0 items-center gap-1.5">
              <span className="BlueprintEditorTreeType truncate text-[10px] font-semibold tracking-[0.01em]">
                {nodeTypeLabel}
              </span>
              {nodeTypeSecondaryLabel ? (
                <span className="inline-flex items-center rounded-full border border-(--border-default) px-1 py-0 text-[8px] text-(--text-muted)">
                  {nodeTypeSecondaryLabel}
                </span>
              ) : null}
              {hasChildren && (
                <span
                  className="BlueprintEditorTreeCount inline-flex h-3.5 min-w-3.5 flex-none items-center justify-center rounded-full border border-(--border-subtle) bg-(--bg-raised) px-1 text-[9px] text-(--text-muted) tabular-nums"
                  aria-label={`${children.length} children`}
                >
                  {children.length}
                </span>
              )}
            </span>
          </span>
          <span className="BlueprintEditorTreeActions ml-auto inline-flex items-center opacity-0 transition-opacity duration-150">
            <button
              type="button"
              className="BlueprintEditorTreeNodeAction Danger inline-flex items-center gap-1 rounded-full border-0 bg-transparent px-0.5 py-0 text-[10px] text-(--danger-color) hover:text-(--danger-hover) disabled:cursor-not-allowed disabled:opacity-45"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(node.id);
              }}
              disabled={isRoot}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
            <span
              className={`BlueprintEditorTreeMenu relative inline-flex items-center [&.IsOpen_.BlueprintEditorTreeMenuList]:pointer-events-auto [&.IsOpen_.BlueprintEditorTreeMenuList]:visible [&.IsOpen_.BlueprintEditorTreeMenuList]:opacity-100 [&.IsOpen_.BlueprintEditorTreeMenuList]:delay-0 [&:focus-within_.BlueprintEditorTreeMenuList]:pointer-events-auto [&:focus-within_.BlueprintEditorTreeMenuList]:visible [&:focus-within_.BlueprintEditorTreeMenuList]:opacity-100 [&:focus-within_.BlueprintEditorTreeMenuList]:delay-0 [&:hover_.BlueprintEditorTreeMenuList]:pointer-events-auto [&:hover_.BlueprintEditorTreeMenuList]:visible [&:hover_.BlueprintEditorTreeMenuList]:opacity-100 [&:hover_.BlueprintEditorTreeMenuList]:delay-0 ${openMenuId === node.id ? 'IsOpen' : ''}`}
            >
              <button
                type="button"
                className="BlueprintEditorTreeNodeAction inline-flex items-center gap-1 rounded-full border-0 bg-transparent px-0.5 py-0 text-[10px] text-(--text-muted) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-45"
                onClick={(event) => {
                  event.stopPropagation();
                  onMenuAction?.(node.id);
                }}
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal size={12} />
              </button>
              <span
                className="BlueprintEditorTreeMenuList pointer-events-none invisible absolute top-1/2 left-0 z-[5] inline-flex -translate-x-full -translate-y-1/2 gap-1 rounded-[10px] bg-(--bg-canvas) p-1.5 opacity-0 shadow-(--shadow-md) ring-1 ring-(--border-subtle) transition-[opacity,visibility] delay-[500ms] duration-150"
                role="menu"
              >
                <button
                  type="button"
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--text-muted) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-45"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuAction?.(node.id);
                    onMove(node.id, 'up');
                  }}
                  disabled={isRoot}
                  aria-label="Move up"
                  title="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--text-muted) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-45"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuAction?.(node.id);
                    onMove(node.id, 'down');
                  }}
                  disabled={isRoot}
                  aria-label="Move down"
                  title="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--text-muted) hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-45"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuAction?.(node.id);
                    onCopy(node.id);
                  }}
                  disabled={isRoot}
                  aria-label="Copy"
                  title="Copy"
                >
                  <Copy size={14} />
                </button>
              </span>
            </span>
          </span>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="BlueprintEditorTreeChildren flex flex-col gap-0.5">
          {children.map((child) => (
            <BlueprintTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedKeys={expandedKeys}
              selectedId={selectedId}
              dropHint={dropHint}
              rootId={rootId}
              parentId={node.id}
              openMenuId={openMenuId}
              onMenuAction={onMenuAction}
              onToggle={onToggle}
              onSelect={onSelect}
              onDelete={onDelete}
              onCopy={onCopy}
              onMove={onMove}
              onOpenContextMenu={onOpenContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BlueprintEditorComponentTree({
  isCollapsed,
  isTreeCollapsed = false,
  selectedId,
  dropHint,
  onToggleCollapse,
  onSelectNode,
  onDeleteSelected,
  onDeleteNode,
  onCopyNode,
  onMoveNode,
}: BlueprintEditorComponentTreeProps) {
  const { t } = useTranslation('blueprint');
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const rootNode = mirDoc?.ui?.root;
  const isDeleteDisabled =
    !selectedId || !rootNode || selectedId === rootNode.id;
  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: 'tree-root',
    data: { kind: 'tree-root' },
  });
  const totalNodes = useMemo(
    () => (rootNode ? countNodes(rootNode) : 0),
    [rootNode]
  );
  const initialExpandedKeys = useMemo(
    () => (rootNode ? collectExpandedKeys(rootNode) : []),
    [rootNode]
  );
  const [expandedKeys, setExpandedKeys] =
    useState<string[]>(initialExpandedKeys);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<TreeContextMenuState | null>(
    null
  );
  const menuHoldTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!rootNode || !selectedId) return;
    const ancestors = findAncestorIds(rootNode, selectedId) ?? [];
    if (ancestors.length === 0) return;
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      let changed = false;
      ancestors.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? Array.from(next) : prev;
    });
  }, [rootNode, selectedId]);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      if (menuHoldTimer.current) {
        window.clearTimeout(menuHoldTimer.current);
        menuHoldTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!contextMenu || typeof window === 'undefined') return;

    const closeContextMenu = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };

    document.addEventListener('pointerdown', closeContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      document.removeEventListener('pointerdown', closeContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [contextMenu]);

  const holdMenuOpen = (nodeId: string) => {
    setOpenMenuId(nodeId);
    if (typeof window === 'undefined') return;
    if (menuHoldTimer.current) {
      window.clearTimeout(menuHoldTimer.current);
    }
    menuHoldTimer.current = window.setTimeout(() => {
      setOpenMenuId((prev) => (prev === nodeId ? null : prev));
    }, 350);
  };

  const handleToggle = (nodeId: string) => {
    setExpandedKeys((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const openContextMenu = (
    node: ComponentNode,
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    const viewportWidth =
      typeof window === 'undefined' ? Infinity : window.innerWidth;
    const viewportHeight =
      typeof window === 'undefined' ? Infinity : window.innerHeight;
    setOpenMenuId(null);
    setContextMenu({
      node,
      x: Math.max(
        CONTEXT_MENU_VIEWPORT_GAP_PX,
        Math.min(
          event.clientX,
          viewportWidth - CONTEXT_MENU_WIDTH_PX - CONTEXT_MENU_VIEWPORT_GAP_PX
        )
      ),
      y: Math.max(
        CONTEXT_MENU_VIEWPORT_GAP_PX,
        Math.min(
          event.clientY,
          viewportHeight - CONTEXT_MENU_HEIGHT_PX - CONTEXT_MENU_VIEWPORT_GAP_PX
        )
      ),
    });
  };

  const runContextMenuAction = (action: TreeContextMenuAction) => {
    if (!contextMenu) return;
    const node = contextMenu.node;
    const branchKeys = collectBranchExpandedKeys(node);

    setExpandedKeys((prev) => {
      const next = new Set(prev);

      switch (action) {
        case 'expand':
          next.add(node.id);
          break;
        case 'expandRecursive':
          branchKeys.forEach((id) => next.add(id));
          break;
        case 'collapse':
          next.delete(node.id);
          break;
        case 'collapseRecursive':
          branchKeys.forEach((id) => next.delete(id));
          break;
      }

      return Array.from(next);
    });
    setContextMenu(null);
  };

  const getContextMenuAvailability = (
    node: ComponentNode
  ): TreeContextMenuAvailability => {
    const branchKeys = collectBranchExpandedKeys(node);
    const expandedSet = new Set(expandedKeys);
    const isExpanded = expandedSet.has(node.id);
    const isBranchFullyExpanded = branchKeys.every((id) => expandedSet.has(id));
    const isBranchFullyCollapsed = branchKeys.every(
      (id) => !expandedSet.has(id)
    );

    return {
      canExpand: !isExpanded,
      canExpandRecursive: !isBranchFullyExpanded,
      canCollapse: isExpanded,
      canCollapseRecursive: !isBranchFullyCollapsed,
    };
  };

  const contextMenuAvailability = contextMenu
    ? getContextMenuAvailability(contextMenu.node)
    : null;

  if (isCollapsed) {
    return (
      <aside className="BlueprintEditorComponentTree Collapsed absolute bottom-10 left-0 z-[6] h-0 w-0 overflow-visible border-0 bg-transparent shadow-none">
        <button
          type="button"
          className="BlueprintEditorTreeExpand inline-flex h-8 w-6 items-center justify-center rounded-l-none rounded-r-full border border-l-0 border-(--border-default) bg-(--bg-canvas) pr-0.5 text-(--text-muted) shadow-(--shadow-md) hover:text-(--text-primary)"
          onClick={onToggleCollapse}
          aria-label={t('tree.expand', {
            defaultValue: 'Expand component tree',
          })}
        >
          <ChevronUp size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`BlueprintEditorComponentTree absolute bottom-0 left-0 z-[3] flex h-[var(--component-tree-height)] min-h-0 w-[var(--tree-width)] flex-col overflow-hidden rounded-xl border-0 bg-(--bg-canvas) shadow-(--shadow-sm) ${!isTreeCollapsed ? 'rounded-t-none' : ''}`}
    >
      <div className="BlueprintEditorTreeHeader flex items-center justify-between bg-transparent px-2.5 pt-2.5 pb-1.5 text-[13px] font-semibold">
        <div className="BlueprintEditorTreeHeaderLeft inline-flex min-w-0 items-center gap-2">
          <span
            className="BlueprintEditorTreeHeaderIcon inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-transparent text-(--text-muted)"
            aria-hidden="true"
          >
            <Layers size={14} />
          </span>
          <span>{t('tree.title', { defaultValue: 'Component Tree' })}</span>
          {totalNodes > 0 && (
            <span
              className="BlueprintEditorTreeHeaderCount inline-flex h-[18px] flex-none items-center justify-center rounded-full bg-transparent px-1.5 text-[10px] font-bold text-(--text-muted) tabular-nums"
              aria-label={`${totalNodes} nodes`}
            >
              {totalNodes}
            </span>
          )}
        </div>
        <div className="BlueprintEditorTreeHeaderActions inline-flex items-center gap-1">
          <button
            type="button"
            className="BlueprintEditorTreeAction Danger inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--danger-color) hover:text-(--danger-hover) disabled:cursor-not-allowed disabled:text-(--text-muted) disabled:opacity-45"
            onClick={onDeleteSelected}
            disabled={isDeleteDisabled}
            aria-label={t('tree.deleteSelected', {
              defaultValue: 'Delete selected component',
            })}
            title={t('tree.deleteSelected', {
              defaultValue: 'Delete selected component',
            })}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className="BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--text-muted) hover:text-(--text-primary)"
            onClick={onToggleCollapse}
            aria-label={t('tree.collapse', {
              defaultValue: 'Collapse component tree',
            })}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      <div
        className={`BlueprintEditorTreeBody min-h-0 flex-1 overflow-auto px-2 pt-1 pb-1.5 ${isOverRoot ? 'IsOver' : ''}`}
        ref={setRootDropRef}
      >
        {rootNode ? (
          <div className="BlueprintEditorTreeList flex flex-col gap-px p-0">
            <BlueprintTreeNode
              node={rootNode}
              depth={0}
              expandedKeys={expandedKeys}
              selectedId={selectedId}
              dropHint={dropHint}
              rootId={rootNode.id}
              openMenuId={openMenuId}
              onMenuAction={holdMenuOpen}
              onToggle={handleToggle}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onCopy={onCopyNode}
              onMove={onMoveNode}
              onOpenContextMenu={openContextMenu}
            />
          </div>
        ) : (
          <div className="BlueprintEditorTreePlaceholder px-2 py-3 text-center text-xs text-(--text-muted)">
            <p>
              {t('tree.empty', {
                defaultValue: 'No components yet.',
              })}
            </p>
          </div>
        )}
      </div>
      {contextMenu && contextMenuAvailability ? (
        <div
          className="BlueprintEditorTreeContextMenu fixed z-50 flex w-[168px] flex-col gap-0.5 rounded-[8px] bg-(--bg-canvas) p-1 shadow-(--shadow-md) ring-1 ring-(--border-subtle)"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          aria-label="Component tree context menu"
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {contextMenuAvailability.canExpand ? (
            <button
              type="button"
              className="BlueprintEditorTreeContextMenuItem inline-flex items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-[11px] text-(--text-secondary) hover:bg-(--bg-raised) hover:text-(--text-primary)"
              role="menuitem"
              onClick={() => runContextMenuAction('expand')}
            >
              <ChevronRight size={13} />
              <span>Expand</span>
            </button>
          ) : null}
          {contextMenuAvailability.canExpandRecursive ? (
            <button
              type="button"
              className="BlueprintEditorTreeContextMenuItem inline-flex items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-[11px] text-(--text-secondary) hover:bg-(--bg-raised) hover:text-(--text-primary)"
              role="menuitem"
              onClick={() => runContextMenuAction('expandRecursive')}
            >
              <Layers size={13} />
              <span>Expand recursively</span>
            </button>
          ) : null}
          {contextMenuAvailability.canCollapse ? (
            <button
              type="button"
              className="BlueprintEditorTreeContextMenuItem inline-flex items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-[11px] text-(--text-secondary) hover:bg-(--bg-raised) hover:text-(--text-primary)"
              role="menuitem"
              onClick={() => runContextMenuAction('collapse')}
            >
              <ChevronDown size={13} />
              <span>Collapse</span>
            </button>
          ) : null}
          {contextMenuAvailability.canCollapseRecursive ? (
            <button
              type="button"
              className="BlueprintEditorTreeContextMenuItem inline-flex items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-[11px] text-(--text-secondary) hover:bg-(--bg-raised) hover:text-(--text-primary)"
              role="menuitem"
              onClick={() => runContextMenuAction('collapseRecursive')}
            >
              <Layers size={13} />
              <span>Collapse recursively</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
