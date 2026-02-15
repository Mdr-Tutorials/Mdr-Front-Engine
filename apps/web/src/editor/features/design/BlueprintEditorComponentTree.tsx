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
};

const INDENT_PX = 14;
const NODE_SELECT_DELAY_MS = 220;

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
}: TreeNodeProps) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedKeys.includes(node.id);
  const Icon = getNodeIcon(node.type);
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
    <div className="BlueprintEditorTreeNode flex flex-col gap-0.5">
      <div
        className="BlueprintEditorTreeRow flex items-center [&:hover_.BlueprintEditorTreeDragHandle]:opacity-100 [&:focus-within_.BlueprintEditorTreeDragHandle]:opacity-100"
        style={{ paddingLeft: depth * INDENT_PX }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`BlueprintEditorTreeToggle inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) hover:text-(--color-9) ${isExpanded ? 'Expanded' : ''}`}
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span
            className="BlueprintEditorTreeSpacer h-[18px] w-[18px] flex-none"
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          className="BlueprintEditorTreeDragHandle inline-flex h-[18px] w-[18px] flex-none cursor-grab items-center justify-center rounded-md border-0 bg-transparent text-(--color-6) opacity-0 transition-[opacity,color] duration-150 active:cursor-grabbing disabled:cursor-default disabled:opacity-0"
          disabled={isRoot}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <div
          ref={setNodeRef}
          role="button"
          tabIndex={0}
          className={`BlueprintEditorTreeItem relative flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-transparent px-0 py-0.5 text-left text-(--color-8) transition-[color,opacity] duration-150 hover:text-(--color-9) [&.Selected_.BlueprintEditorTreeCount]:text-(--color-8) [&.Selected_.BlueprintEditorTreeIcon]:text-(--color-9) [&.Selected_.BlueprintEditorTreeId]:text-(--color-7) [&.Selected]:text-(--color-9) [&.IsOver]:text-(--color-9) [&:focus-within_.BlueprintEditorTreeActions]:opacity-100 [&:hover_.BlueprintEditorTreeActions]:opacity-100 [&:hover_.BlueprintEditorTreeIcon]:text-(--color-9) [&:hover_.BlueprintEditorTreeId]:text-(--color-7) ${selectedId === node.id ? 'Selected' : ''} ${isOver ? 'IsOver' : ''} ${dropPlacement === 'before' ? 'DropBefore' : ''} ${dropPlacement === 'after' ? 'DropAfter' : ''} ${dropPlacement === 'child' ? 'DropChild bg-[rgba(0,0,0,0.03)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]' : ''}`.trim()}
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
          title={`${node.type} (${node.id})`}
          aria-label={`${node.type} (${node.id})`}
        >
          {dropPlacement === 'before' && (
            <span
              className="pointer-events-none absolute -top-1 left-2.5 right-2.5 h-0.5 rounded-full bg-[rgba(0,0,0,0.55)] shadow-[0_0_0_1px_rgba(255,255,255,0.65)]"
              aria-hidden="true"
            />
          )}
          {dropPlacement === 'after' && (
            <span
              className="pointer-events-none absolute -bottom-1 left-2.5 right-2.5 h-0.5 rounded-full bg-[rgba(0,0,0,0.55)] shadow-[0_0_0_1px_rgba(255,255,255,0.65)]"
              aria-hidden="true"
            />
          )}
          <span
            className="BlueprintEditorTreeIcon inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-lg bg-transparent text-(--color-7)"
            aria-hidden="true"
          >
            <Icon size={14} />
          </span>
          <span className="BlueprintEditorTreeMeta flex min-w-0 flex-col gap-px">
            <span className="BlueprintEditorTreeTypeRow inline-flex min-w-0 items-center gap-1.5">
              <span className="BlueprintEditorTreeType truncate text-[11px] font-bold tracking-[0.01em]">
                {node.type}
              </span>
              {hasChildren && (
                <span
                  className="BlueprintEditorTreeCount inline-flex h-[15px] min-w-[15px] flex-none items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.04)] text-[10px] tabular-nums text-(--color-7) dark:border-white/16 dark:bg-white/8"
                  aria-label={`${children.length} children`}
                >
                  {children.length}
                </span>
              )}
            </span>
            <span className="BlueprintEditorTreeId truncate font-mono text-[10px] font-extralight text-(--color-6)">
              {node.id}
            </span>
          </span>
          <span className="BlueprintEditorTreeActions ml-auto inline-flex items-center opacity-0 transition-opacity duration-150">
            <button
              type="button"
              className="BlueprintEditorTreeNodeAction Danger inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent px-1 py-0.5 text-[10px] text-[rgba(220,74,74,0.85)] hover:text-[rgba(220,74,74,1)] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(node.id);
              }}
              disabled={isRoot}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <span
              className={`BlueprintEditorTreeMenu relative inline-flex items-center [&.IsOpen_.BlueprintEditorTreeMenuList]:visible [&.IsOpen_.BlueprintEditorTreeMenuList]:pointer-events-auto [&.IsOpen_.BlueprintEditorTreeMenuList]:opacity-100 [&.IsOpen_.BlueprintEditorTreeMenuList]:delay-0 [&:focus-within_.BlueprintEditorTreeMenuList]:visible [&:focus-within_.BlueprintEditorTreeMenuList]:pointer-events-auto [&:focus-within_.BlueprintEditorTreeMenuList]:opacity-100 [&:focus-within_.BlueprintEditorTreeMenuList]:delay-0 [&:hover_.BlueprintEditorTreeMenuList]:visible [&:hover_.BlueprintEditorTreeMenuList]:pointer-events-auto [&:hover_.BlueprintEditorTreeMenuList]:opacity-100 [&:hover_.BlueprintEditorTreeMenuList]:delay-0 ${openMenuId === node.id ? 'IsOpen' : ''}`}
            >
              <button
                type="button"
                className="BlueprintEditorTreeNodeAction inline-flex items-center gap-1.5 rounded-full border-0 bg-transparent px-1 py-0.5 text-[10px] text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
                onClick={(event) => {
                  event.stopPropagation();
                  onMenuAction?.(node.id);
                }}
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal size={14} />
              </button>
              <span
                className="BlueprintEditorTreeMenuList pointer-events-none invisible absolute left-0 top-1/2 z-[5] inline-flex -translate-x-full -translate-y-1/2 gap-1 rounded-[10px] bg-(--color-0) p-1.5 opacity-0 shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-[opacity,visibility] duration-150 delay-[500ms] dark:shadow-[0_12px_22px_rgba(0,0,0,0.45)]"
                role="menu"
              >
                <button
                  type="button"
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="BlueprintEditorTreeMenuItem inline-flex items-center justify-center rounded-lg border-0 bg-transparent px-1 py-0.5 text-(--color-6) hover:text-(--color-9) disabled:cursor-not-allowed disabled:opacity-45"
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

  if (isCollapsed) {
    return (
      <aside className="BlueprintEditorComponentTree Collapsed absolute bottom-10 left-0 z-[6] h-0 w-0 overflow-visible border-0 bg-transparent shadow-none">
        <button
          type="button"
          className="BlueprintEditorTreeExpand inline-flex h-8 w-6 items-center justify-center rounded-r-full rounded-l-none border border-l-0 border-black/8 bg-(--color-0) pr-0.5 text-(--color-6) shadow-[0_10px_22px_rgba(0,0,0,0.14)] hover:text-(--color-9) dark:border-white/16 dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
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
      className={`BlueprintEditorComponentTree absolute bottom-0 left-0 z-[3] flex h-[var(--component-tree-height)] w-[var(--tree-width)] min-h-0 flex-col overflow-hidden rounded-xl border-0 bg-(--color-0) shadow-[0_10px_20px_rgba(0,0,0,0.06)] ${!isTreeCollapsed ? 'rounded-t-none' : ''}`}
    >
      <div className="BlueprintEditorTreeHeader flex items-center justify-between bg-transparent px-2.5 pb-1.5 pt-2.5 text-[13px] font-semibold">
        <div className="BlueprintEditorTreeHeaderLeft inline-flex min-w-0 items-center gap-2">
          <span
            className="BlueprintEditorTreeHeaderIcon inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-transparent text-(--color-7)"
            aria-hidden="true"
          >
            <Layers size={14} />
          </span>
          <span>{t('tree.title', { defaultValue: 'Component Tree' })}</span>
          {totalNodes > 0 && (
            <span
              className="BlueprintEditorTreeHeaderCount inline-flex h-[18px] flex-none items-center justify-center rounded-full bg-transparent px-1.5 text-[10px] font-bold tabular-nums text-(--color-7)"
              aria-label={`${totalNodes} nodes`}
            >
              {totalNodes}
            </span>
          )}
        </div>
        <div className="BlueprintEditorTreeHeaderActions inline-flex items-center gap-1">
          <button
            type="button"
            className="BlueprintEditorTreeAction Danger inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-[rgba(220,74,74,0.85)] hover:text-[rgba(220,74,74,1)] dark:text-[rgba(255,128,128,0.85)] dark:hover:text-[rgba(255,160,160,1)] disabled:cursor-not-allowed disabled:text-(--color-6) disabled:opacity-45"
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
            className="BlueprintEditorCollapse inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-1.5 py-0.5 text-(--color-6) hover:text-(--color-9)"
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
        className={`BlueprintEditorTreeBody min-h-0 flex-1 overflow-auto px-2 pb-2 pt-1.5 ${isOverRoot ? 'IsOver' : ''}`}
        ref={setRootDropRef}
      >
        {rootNode ? (
          <div className="BlueprintEditorTreeList flex flex-col gap-0.5 p-0">
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
            />
          </div>
        ) : (
          <div className="BlueprintEditorTreePlaceholder px-2 py-3 text-center text-xs text-(--color-6)">
            <p>
              {t('tree.empty', {
                defaultValue: 'No components yet.',
              })}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
