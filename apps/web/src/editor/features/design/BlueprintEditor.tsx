import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ANCHOR_ITEMS,
  BREADCRUMB_ITEMS,
  CHECKLIST_ITEMS,
  COLLAPSE_ITEMS,
  DEFAULT_ROUTES,
  GALLERY_IMAGES,
  GRID_COLUMNS,
  GRID_DATA,
  LIST_ITEMS,
  NAVBAR_ITEMS,
  REGION_OPTIONS,
  SIDEBAR_ITEMS,
  STEPS_ITEMS,
  TAB_ITEMS,
  TABLE_COLUMNS,
  TABLE_DATA,
  TIMELINE_ITEMS,
  TREE_DATA,
  TREE_SELECT_OPTIONS,
  VIEWPORT_ZOOM_RANGE,
} from './BlueprintEditor.data';
import { BlueprintEditorAddressBar } from './BlueprintEditorAddressBar';
import { BlueprintEditorCanvas } from './BlueprintEditorCanvas';
import { BlueprintEditorComponentTree } from './BlueprintEditorComponentTree';
import { BlueprintEditorInspector } from './BlueprintEditorInspector';
import { BlueprintEditorSidebar } from './BlueprintEditorSidebar';
import { BlueprintEditorViewportBar } from './BlueprintEditorViewportBar';
import type { RouteItem } from './BlueprintEditor.types';
import { isNonNestableType } from './blueprint/nesting';
import type { ComponentNode, MIRDocument } from '@/core/types/engine.types';
import { defaultComponentRegistry } from '@/mir/renderer/registry';
import {
  getNavigateLinkKind,
  resolveNavigateTarget,
} from '@/mir/actions/registry';
import {
  DEFAULT_BLUEPRINT_STATE,
  useEditorStore,
} from '@/editor/store/useEditorStore';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { useAuthStore } from '@/auth/useAuthStore';
import { editorApi } from '@/editor/editorApi';

export type TreeDropPlacement = 'before' | 'after' | 'child';

type TreeDropHint = { overNodeId: string; placement: TreeDropPlacement } | null;

export const getTreeDropPlacement = (options: {
  canNest: boolean;
  overTop: number;
  overHeight: number;
  activeCenterY: number;
}): TreeDropPlacement => {
  const { canNest, overTop, overHeight, activeCenterY } = options;
  if (
    !Number.isFinite(overTop) ||
    !Number.isFinite(overHeight) ||
    overHeight <= 0 ||
    !Number.isFinite(activeCenterY)
  ) {
    return 'after';
  }

  const rawRatio = (activeCenterY - overTop) / overHeight;
  const ratio = Math.max(0, Math.min(1, rawRatio));

  if (canNest) {
    if (ratio < 1 / 3) return 'before';
    if (ratio > 2 / 3) return 'after';
    return 'child';
  }

  return ratio < 1 / 2 ? 'before' : 'after';
};

const createRouteId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const collectTypeCounts = (
  node: ComponentNode,
  counts: Record<string, number>
) => {
  counts[node.type] = (counts[node.type] ?? 0) + 1;
  node.children?.forEach((child) => collectTypeCounts(child, counts));
};

const createNodeIdFactory = (doc: MIRDocument) => {
  const counts: Record<string, number> = {};
  collectTypeCounts(doc.ui.root, counts);
  return (type: string) => {
    const next = (counts[type] ?? 0) + 1;
    counts[type] = next;
    return `${type}-${next}`;
  };
};

const PALETTE_NODE_DEFAULTS: Record<
  string,
  { type: string; props: Record<string, unknown> }
> = {
  breadcrumb: { type: 'MdrBreadcrumb', props: { items: BREADCRUMB_ITEMS } },
  table: {
    type: 'MdrTable',
    props: { data: TABLE_DATA, columns: TABLE_COLUMNS, size: 'Medium' },
  },
  'data-grid': {
    type: 'MdrDataGrid',
    props: { data: GRID_DATA, columns: GRID_COLUMNS },
  },
  list: { type: 'MdrList', props: { items: LIST_ITEMS, size: 'Medium' } },
  'check-list': {
    type: 'MdrCheckList',
    props: { items: CHECKLIST_ITEMS, defaultValue: ['wireframes'] },
  },
  tree: {
    type: 'MdrTree',
    props: { data: TREE_DATA, defaultExpandedKeys: ['root'] },
  },
  'tree-select': {
    type: 'MdrTreeSelect',
    props: { options: TREE_SELECT_OPTIONS, defaultValue: 'option-1' },
  },
  'region-picker': {
    type: 'MdrRegionPicker',
    props: {
      options: REGION_OPTIONS,
      defaultValue: { province: 'east', city: 'metro', district: 'downtown' },
    },
  },
  'anchor-navigation': {
    type: 'MdrAnchorNavigation',
    props: { items: ANCHOR_ITEMS, orientation: 'Vertical' },
  },
  tabs: { type: 'MdrTabs', props: { items: TAB_ITEMS } },
  collapse: {
    type: 'MdrCollapse',
    props: { items: COLLAPSE_ITEMS, defaultActiveKeys: ['panel-1'] },
  },
  navbar: {
    type: 'MdrNavbar',
    props: { brand: 'Mdr', items: NAVBAR_ITEMS, size: 'Medium' },
  },
  sidebar: {
    type: 'MdrSidebar',
    props: { title: 'Menu', items: SIDEBAR_ITEMS, width: 160 },
  },
  'image-gallery': {
    type: 'MdrImageGallery',
    props: { images: GALLERY_IMAGES, columns: 2, gap: 'Small', size: 'Medium' },
  },
  timeline: { type: 'MdrTimeline', props: { items: TIMELINE_ITEMS } },
  steps: { type: 'MdrSteps', props: { items: STEPS_ITEMS, current: 1 } },
  progress: { type: 'MdrProgress', props: { value: 62, size: 'Medium' } },
  statistic: {
    type: 'MdrStatistic',
    props: { title: 'Total', value: 248, trend: 'Up' },
  },
  pagination: { type: 'MdrPagination', props: { page: 2, total: 50 } },
};

export const createNodeFromPaletteItem = (
  itemId: string,
  createId: (type: string) => string,
  variantProps?: Record<string, unknown>,
  selectedSize?: string
): ComponentNode => {
  const typeFromPalette = (value: string) =>
    `Mdr${value
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
      .join('')}`;

  if (itemId === 'text') {
    return {
      id: createId('MdrText'),
      type: 'MdrText',
      text: 'Text',
      props: { size: selectedSize ?? 'Medium' },
    };
  }
  if (itemId === 'heading') {
    const rawLevel = variantProps?.level;
    const resolvedLevel =
      typeof rawLevel === 'number'
        ? rawLevel
        : typeof rawLevel === 'string'
          ? Number(rawLevel)
          : 2;
    const level = Number.isFinite(resolvedLevel) ? resolvedLevel : 2;
    return {
      id: createId('MdrHeading'),
      type: 'MdrHeading',
      text: 'Heading',
      props: { ...variantProps, level, weight: 'Bold', size: selectedSize },
    };
  }
  if (itemId === 'paragraph') {
    return {
      id: createId('MdrParagraph'),
      type: 'MdrParagraph',
      text: 'Paragraph',
      props: { size: selectedSize ?? 'Medium' },
    };
  }
  if (itemId === 'button') {
    return {
      id: createId('MdrButton'),
      type: 'MdrButton',
      text: 'Button',
      props: {
        size: selectedSize ?? 'Medium',
        category: 'Primary',
        ...variantProps,
      },
    };
  }
  if (itemId === 'button-link') {
    return {
      id: createId('MdrButtonLink'),
      type: 'MdrButtonLink',
      text: 'Link',
      props: {
        to: '',
        size: selectedSize ?? 'Medium',
        category: 'Secondary',
        ...variantProps,
      },
    };
  }
  if (itemId === 'link') {
    return {
      id: createId('MdrLink'),
      type: 'MdrLink',
      text: 'Link',
      props: { to: '' },
    };
  }
  if (itemId === 'input') {
    return {
      id: createId('MdrInput'),
      type: 'MdrInput',
      props: { placeholder: 'Input', size: selectedSize ?? 'Medium' },
    };
  }
  if (itemId === 'textarea') {
    return {
      id: createId('MdrTextarea'),
      type: 'MdrTextarea',
      props: {
        placeholder: 'Textarea',
        rows: 3,
        size: selectedSize ?? 'Medium',
      },
    };
  }
  if (itemId === 'div') {
    return {
      id: createId('MdrDiv'),
      type: 'MdrDiv',
    };
  }
  if (itemId === 'flex') {
    return {
      id: createId('MdrDiv'),
      type: 'MdrDiv',
      props: {
        display: 'Flex',
      },
    };
  }
  if (itemId === 'grid') {
    return {
      id: createId('MdrDiv'),
      type: 'MdrDiv',
      props: {
        display: 'Grid',
      },
    };
  }
  if (itemId === 'section') {
    return {
      id: createId('MdrSection'),
      type: 'MdrSection',
      props: {
        size: selectedSize ?? 'Medium',
        padding: 'Medium',
        backgroundColor: 'Light',
      },
    };
  }
  if (itemId === 'card') {
    return {
      id: createId('MdrCard'),
      type: 'MdrCard',
      props: {
        size: selectedSize ?? 'Medium',
        variant: 'Bordered',
        padding: 'Medium',
        ...(variantProps ?? {}),
      },
    };
  }
  if (itemId === 'panel') {
    return {
      id: createId('MdrPanel'),
      type: 'MdrPanel',
      props: {
        size: selectedSize ?? 'Medium',
        variant: 'Default',
        padding: 'Medium',
        title: 'Panel',
        ...(variantProps ?? {}),
      },
    };
  }
  if (itemId === 'icon') {
    return {
      id: createId('MdrIcon'),
      type: 'MdrIcon',
      props: {
        iconRef: {
          provider: 'lucide',
          name: 'Sparkles',
        },
        size: 20,
        ...variantProps,
      },
    };
  }
  if (itemId === 'icon-link') {
    return {
      id: createId('MdrIconLink'),
      type: 'MdrIconLink',
      props: {
        iconRef: {
          provider: 'lucide',
          name: 'Sparkles',
        },
        to: '',
        size: 18,
        ...variantProps,
      },
    };
  }

  const defaultNode = PALETTE_NODE_DEFAULTS[itemId];
  if (defaultNode) {
    return {
      id: createId(defaultNode.type),
      type: defaultNode.type,
      props: {
        ...defaultNode.props,
        ...(selectedSize ? { size: selectedSize } : {}),
        ...(variantProps ?? {}),
      },
    };
  }

  const inferredType = typeFromPalette(itemId);

  return {
    id: createId(inferredType),
    type: inferredType,
    props: {
      dataAttributes: { 'data-palette-item': itemId },
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(variantProps ?? {}),
    },
  };
};

const insertChildById = (
  node: ComponentNode,
  parentId: string,
  child: ComponentNode
): { node: ComponentNode; inserted: boolean } => {
  if (node.id === parentId) {
    const nextChildren = [...(node.children ?? []), child];
    return { node: { ...node, children: nextChildren }, inserted: true };
  }
  if (!node.children?.length) return { node, inserted: false };
  let inserted = false;
  const nextChildren = node.children.map((item) => {
    const result = insertChildById(item, parentId, child);
    if (result.inserted) inserted = true;
    return result.node;
  });
  return inserted
    ? { node: { ...node, children: nextChildren }, inserted: true }
    : { node, inserted: false };
};

const insertAfterById = (
  node: ComponentNode,
  siblingId: string,
  child: ComponentNode
): { node: ComponentNode; inserted: boolean } => {
  if (!node.children?.length) return { node, inserted: false };
  const idx = node.children.findIndex((item) => item.id === siblingId);
  if (idx >= 0) {
    const nextChildren = [
      ...node.children.slice(0, idx + 1),
      child,
      ...node.children.slice(idx + 1),
    ];
    return { node: { ...node, children: nextChildren }, inserted: true };
  }
  let inserted = false;
  const nextChildren = node.children.map((item) => {
    const result = insertAfterById(item, siblingId, child);
    if (result.inserted) inserted = true;
    return result.node;
  });
  return inserted
    ? { node: { ...node, children: nextChildren }, inserted: true }
    : { node, inserted: false };
};

const removeNodeById = (
  node: ComponentNode,
  targetId: string
): { node: ComponentNode; removed: boolean } => {
  if (!node.children?.length) return { node, removed: false };
  const idx = node.children.findIndex((item) => item.id === targetId);
  if (idx >= 0) {
    const nextChildren = [
      ...node.children.slice(0, idx),
      ...node.children.slice(idx + 1),
    ];
    return {
      node: {
        ...node,
        children: nextChildren.length > 0 ? nextChildren : undefined,
      },
      removed: true,
    };
  }
  let removed = false;
  const nextChildren = node.children.map((item) => {
    const result = removeNodeById(item, targetId);
    if (result.removed) removed = true;
    return result.node;
  });
  if (!removed) return { node, removed: false };
  return {
    node: {
      ...node,
      children: nextChildren.length > 0 ? nextChildren : undefined,
    },
    removed: true,
  };
};

const removeNodeByIdWithNode = (
  node: ComponentNode,
  targetId: string
): { node: ComponentNode; removed: boolean; removedNode?: ComponentNode } => {
  if (!node.children?.length) return { node, removed: false };
  const idx = node.children.findIndex((item) => item.id === targetId);
  if (idx >= 0) {
    const removedNode = node.children[idx];
    const nextChildren = [
      ...node.children.slice(0, idx),
      ...node.children.slice(idx + 1),
    ];
    return {
      node: {
        ...node,
        children: nextChildren.length > 0 ? nextChildren : undefined,
      },
      removed: true,
      removedNode,
    };
  }
  let removed = false;
  let removedNode: ComponentNode | undefined;
  const nextChildren = node.children.map((item) => {
    const result = removeNodeByIdWithNode(item, targetId);
    if (result.removed) {
      removed = true;
      removedNode = result.removedNode;
    }
    return result.node;
  });
  if (!removed) return { node, removed: false };
  return {
    node: {
      ...node,
      children: nextChildren.length > 0 ? nextChildren : undefined,
    },
    removed: true,
    removedNode,
  };
};

const moveChildById = (
  node: ComponentNode,
  parentId: string,
  childId: string,
  direction: 'up' | 'down'
): { node: ComponentNode; moved: boolean } => {
  if (node.id === parentId) {
    const children = node.children ?? [];
    const index = children.findIndex((item) => item.id === childId);
    if (index === -1) return { node, moved: false };
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= children.length)
      return { node, moved: false };
    const nextChildren = [...children];
    const [movedNode] = nextChildren.splice(index, 1);
    nextChildren.splice(nextIndex, 0, movedNode);
    return { node: { ...node, children: nextChildren }, moved: true };
  }
  if (!node.children?.length) return { node, moved: false };
  let moved = false;
  const nextChildren = node.children.map((item) => {
    const result = moveChildById(item, parentId, childId, direction);
    if (result.moved) moved = true;
    return result.node;
  });
  return moved
    ? { node: { ...node, children: nextChildren }, moved: true }
    : { node, moved: false };
};

const insertChildAtIndex = (
  node: ComponentNode,
  parentId: string,
  child: ComponentNode,
  index: number
): { node: ComponentNode; inserted: boolean } => {
  if (node.id === parentId) {
    const nextChildren = [...(node.children ?? [])];
    const clampedIndex = Math.max(0, Math.min(index, nextChildren.length));
    nextChildren.splice(clampedIndex, 0, child);
    return { node: { ...node, children: nextChildren }, inserted: true };
  }
  if (!node.children?.length) return { node, inserted: false };
  let inserted = false;
  const nextChildren = node.children.map((item) => {
    const result = insertChildAtIndex(item, parentId, child, index);
    if (result.inserted) inserted = true;
    return result.node;
  });
  return inserted
    ? { node: { ...node, children: nextChildren }, inserted: true }
    : { node, inserted: false };
};

const arrayMove = <T,>(list: T[], fromIndex: number, toIndex: number) => {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const reorderChildById = (
  node: ComponentNode,
  parentId: string,
  activeId: string,
  overId: string
): { node: ComponentNode; moved: boolean } => {
  if (node.id === parentId) {
    const children = node.children ?? [];
    const fromIndex = children.findIndex((item) => item.id === activeId);
    const toIndex = children.findIndex((item) => item.id === overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
      return { node, moved: false };
    const nextChildren = arrayMove(children, fromIndex, toIndex);
    return { node: { ...node, children: nextChildren }, moved: true };
  }
  if (!node.children?.length) return { node, moved: false };
  let moved = false;
  const nextChildren = node.children.map((item) => {
    const result = reorderChildById(item, parentId, activeId, overId);
    if (result.moved) moved = true;
    return result.node;
  });
  return moved
    ? { node: { ...node, children: nextChildren }, moved: true }
    : { node, moved: false };
};

const isAncestorOf = (
  root: ComponentNode,
  ancestorId: string,
  targetId: string
) => {
  if (ancestorId === targetId) return true;
  const ancestorNode = findNodeById(root, ancestorId);
  if (!ancestorNode) return false;
  return Boolean(findNodeById(ancestorNode, targetId));
};

const findParentId = (
  node: ComponentNode,
  targetId: string,
  parentId: string | null = null
): string | null => {
  if (node.id === targetId) return parentId;
  const children = node.children ?? [];
  for (const child of children) {
    const result = findParentId(child, targetId, node.id);
    if (result !== null) return result;
  }
  return null;
};

const findNodeById = (
  node: ComponentNode,
  nodeId: string
): ComponentNode | null => {
  if (node.id === nodeId) return node;
  const children = node.children ?? [];
  for (const child of children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
};

const cloneNodeWithNewIds = (
  node: ComponentNode,
  createId: (type: string) => string
): ComponentNode => {
  const { children, ...rest } = node;
  const clonedRest =
    typeof structuredClone === 'function'
      ? structuredClone(rest)
      : JSON.parse(JSON.stringify(rest));
  return {
    ...clonedRest,
    id: createId(node.type),
    children: children?.map((child) => cloneNodeWithNewIds(child, createId)),
  };
};

const supportsChildrenForNode = (node: ComponentNode) => {
  if (isNonNestableType(node.type)) return false;

  // Reuse renderer adapter metadata so drop behavior expands with component registrations.
  const registryEntry = defaultComponentRegistry.get(node.type);
  if (registryEntry?.adapter.isVoid) return false;
  if (registryEntry?.adapter.supportsChildren === false) return false;

  return true;
};

const insertIntoMirDoc = (
  doc: MIRDocument,
  targetId: string,
  child: ComponentNode
) => {
  const root = doc.ui.root;
  const targetNode = findNodeById(root, targetId);
  if (!targetNode) {
    const insertedAtRoot = insertChildById(root, root.id, child);
    return insertedAtRoot.inserted
      ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } }
      : doc;
  }

  if (supportsChildrenForNode(targetNode)) {
    const insertedChild = insertChildById(root, targetId, child);
    return insertedChild.inserted
      ? { ...doc, ui: { ...doc.ui, root: insertedChild.node } }
      : doc;
  }

  const insertedSibling = insertAfterById(root, targetId, child);
  if (insertedSibling.inserted) {
    return { ...doc, ui: { ...doc.ui, root: insertedSibling.node } };
  }

  const insertedAtRoot = insertChildById(root, root.id, child);
  return insertedAtRoot.inserted
    ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } }
    : doc;
};

function BlueprintEditor() {
  const [routes, setRoutes] = useState<RouteItem[]>(DEFAULT_ROUTES);
  const [currentPath, setCurrentPath] = useState(DEFAULT_ROUTES[0].path);
  const [newPath, setNewPath] = useState('');
  const panelLayout = useSettingsStore((state) => state.global.panelLayout);
  const [isLibraryCollapsed, setLibraryCollapsed] = useState(
    () => panelLayout === 'focus'
  );
  const [isInspectorCollapsed, setInspectorCollapsed] = useState(
    () => panelLayout === 'focus' || panelLayout === 'wide'
  );
  const [isTreeCollapsed, setTreeCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [expandedPreviews, setExpandedPreviews] = useState<
    Record<string, boolean>
  >({});
  const [sizeSelections, setSizeSelections] = useState<Record<string, string>>(
    {}
  );
  const [statusSelections, setStatusSelections] = useState<
    Record<string, number>
  >({});
  const statusTimers = useRef<Record<string, number>>({});
  const [activePaletteItemId, setActivePaletteItemId] = useState<string | null>(
    null
  );
  const { t } = useTranslation('blueprint');
  const { projectId } = useParams();
  const blueprintKey = projectId ?? 'global';
  const blueprintState = useEditorStore(
    (state) => state.blueprintStateByProject[blueprintKey]
  );
  const setBlueprintState = useEditorStore((state) => state.setBlueprintState);
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const updateMirDoc = useEditorStore((state) => state.updateMirDoc);
  const token = useAuthStore((state) => state.token);
  const zoomStep = useSettingsStore((state) => state.global.zoomStep);
  const defaultViewportWidth = useSettingsStore(
    (state) => state.global.viewportWidth
  );
  const defaultViewportHeight = useSettingsStore(
    (state) => state.global.viewportHeight
  );
  const initialBlueprintState = useMemo(
    () => ({
      ...DEFAULT_BLUEPRINT_STATE,
      viewportWidth: defaultViewportWidth,
      viewportHeight: defaultViewportHeight,
    }),
    [defaultViewportWidth, defaultViewportHeight]
  );
  const resolvedBlueprintState = blueprintState ?? DEFAULT_BLUEPRINT_STATE;
  const { viewportWidth, viewportHeight, zoom, pan, selectedId } =
    resolvedBlueprintState;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    if (!projectId || !token) return;

    const timeoutId = window.setTimeout(() => {
      editorApi.saveProjectMir(token, projectId, mirDoc).catch(() => {});
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [mirDoc, projectId, token]);

  const handleAddRoute = () => {
    const value = newPath.trim();
    if (!value) return;
    const next = { id: createRouteId(), path: value };
    setRoutes((prev) => [...prev, next]);
    setCurrentPath(value);
    setNewPath('');
  };

  const ensureRouteExists = (path: string) => {
    setRoutes((prev) => {
      if (prev.some((route) => route.path === path)) return prev;
      return [...prev, { id: createRouteId(), path }];
    });
  };

  const handleNavigateRequest = (options: {
    params?: Record<string, unknown>;
    nodeId: string;
    trigger: string;
    eventKey: string;
  }) => {
    const params = options.params ?? {};
    const to = typeof params.to === 'string' ? params.to.trim() : '';
    if (!to) return;
    const linkKind = getNavigateLinkKind(to);
    if (linkKind === 'external') {
      if (typeof window === 'undefined') return;
      const { configuredTarget, effectiveTarget, openedAsBlankForSafety } =
        resolveNavigateTarget(params.target, {
          forceBlankForExternalSafety: true,
        });
      const replace = Boolean(params.replace);
      const targetLine = openedAsBlankForSafety
        ? t('inspector.groups.triggers.navigation.confirm.targetOverridden', {
            defaultValue:
              'Configured target: {{configuredTarget}} (opened as {{effectiveTarget}} in Blueprint preview for safety).',
            configuredTarget,
            effectiveTarget,
          })
        : t('inspector.groups.triggers.navigation.confirm.target', {
            defaultValue: 'Target: {{effectiveTarget}}',
            effectiveTarget,
          });
      const confirmed = window.confirm(
        [
          t('inspector.groups.triggers.navigation.confirm.title', {
            defaultValue: 'Open external link?',
          }),
          t('inspector.groups.triggers.navigation.confirm.url', {
            defaultValue: 'URL: {{to}}',
            to,
          }),
          targetLine,
          t('inspector.groups.triggers.navigation.confirm.replace', {
            defaultValue: 'Replace history: {{replace}}',
            replace: replace
              ? t('inspector.groups.triggers.navigation.confirm.yes', {
                  defaultValue: 'Yes',
                })
              : t('inspector.groups.triggers.navigation.confirm.no', {
                  defaultValue: 'No',
                }),
          }),
          t('inspector.groups.triggers.navigation.confirm.source', {
            defaultValue: 'Source: {{nodeId}} · {{trigger}}',
            nodeId: options.nodeId,
            trigger: options.trigger,
          }),
        ].join('\n')
      );
      if (!confirmed) return;
      window.open(to, '_blank', 'noopener,noreferrer');
      return;
    }

    if (linkKind === 'internal') {
      setCurrentPath(to);
      ensureRouteExists(to);
    }
  };

  const handleExecuteGraphRequest = (options: {
    params?: Record<string, unknown>;
    nodeId: string;
    trigger: string;
    eventKey: string;
  }) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('mdr:execute-graph', {
        detail: {
          nodeId: options.nodeId,
          trigger: options.trigger,
          eventKey: options.eventKey,
          ...(options.params ?? {}),
        },
      })
    );
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const togglePreview = (previewId: string) => {
    setExpandedPreviews((prev) => ({ ...prev, [previewId]: !prev[previewId] }));
  };

  const handlePreviewKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    previewId: string,
    hasVariants: boolean
  ) => {
    if (!hasVariants) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePreview(previewId);
    }
  };

  const handleSizeSelect = (itemId: string, sizeId: string) => {
    setSizeSelections((prev) => ({ ...prev, [itemId]: sizeId }));
  };

  const handleStatusSelect = (itemId: string, index: number) => {
    setStatusSelections((prev) => ({ ...prev, [itemId]: index }));
  };

  const startStatusCycle = (itemId: string, total: number) => {
    if (typeof window === 'undefined' || total < 2) return;
    window.clearInterval(statusTimers.current[itemId]);
    statusTimers.current[itemId] = window.setInterval(() => {
      setStatusSelections((prev) => ({
        ...prev,
        [itemId]: ((prev[itemId] ?? 0) + 1) % total,
      }));
    }, 1200);
  };

  const stopStatusCycle = (itemId: string) => {
    if (typeof window === 'undefined') return;
    window.clearInterval(statusTimers.current[itemId]);
    delete statusTimers.current[itemId];
  };

  useEffect(() => {
    if (blueprintState) return;
    setBlueprintState(blueprintKey, initialBlueprintState);
  }, [blueprintKey, blueprintState, initialBlueprintState, setBlueprintState]);

  useEffect(() => {
    if (panelLayout === 'focus') {
      setLibraryCollapsed(true);
      setInspectorCollapsed(true);
      return;
    }
    if (panelLayout === 'wide') {
      setLibraryCollapsed(false);
      setInspectorCollapsed(true);
      return;
    }
    setLibraryCollapsed(false);
    setInspectorCollapsed(false);
  }, [panelLayout]);

  const handleZoomChange = (value: number) => {
    const next = Math.min(
      VIEWPORT_ZOOM_RANGE.max,
      Math.max(VIEWPORT_ZOOM_RANGE.min, value)
    );
    setBlueprintState(blueprintKey, { zoom: next });
  };

  const handleViewportWidthChange = (value: string) => {
    setBlueprintState(blueprintKey, { viewportWidth: value });
  };

  const handleViewportHeightChange = (value: string) => {
    setBlueprintState(blueprintKey, { viewportHeight: value });
  };

  const handlePanChange = (nextPan: { x: number; y: number }) => {
    setBlueprintState(blueprintKey, { pan: nextPan });
  };

  const handleResetView = () => {
    setBlueprintState(blueprintKey, {
      zoom: DEFAULT_BLUEPRINT_STATE.zoom,
      pan: DEFAULT_BLUEPRINT_STATE.pan,
    });
  };

  const handleNodeSelect = (nodeId: string) => {
    setInspectorCollapsed(false);
    setBlueprintState(blueprintKey, { selectedId: nodeId });
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    let nextSelectedId: string | undefined;
    let removed = false;
    updateMirDoc((doc) => {
      if (selectedId === doc.ui.root.id) return doc;
      const parentId = findParentId(doc.ui.root, selectedId);
      const removal = removeNodeById(doc.ui.root, selectedId);
      removed = removal.removed;
      if (!removal.removed) return doc;
      nextSelectedId = parentId ?? undefined;
      return {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      };
    });
    if (removed) {
      setBlueprintState(blueprintKey, { selectedId: nextSelectedId });
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!nodeId) return;
    let nextSelectedId: string | undefined;
    let removed = false;
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc;
      const parentId = findParentId(doc.ui.root, nodeId);
      const removal = removeNodeById(doc.ui.root, nodeId);
      removed = removal.removed;
      if (!removal.removed) return doc;
      if (selectedId === nodeId) {
        nextSelectedId = parentId ?? undefined;
      }
      return {
        ...doc,
        ui: { ...doc.ui, root: removal.node },
      };
    });
    if (removed && selectedId === nodeId) {
      setBlueprintState(blueprintKey, { selectedId: nextSelectedId });
    }
  };

  const handleCopyNode = (nodeId: string) => {
    if (!nodeId) return;
    let nextNodeId = '';
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc;
      const source = findNodeById(doc.ui.root, nodeId);
      if (!source) return doc;
      const createId = createNodeIdFactory(doc);
      const cloned = cloneNodeWithNewIds(source, createId);
      nextNodeId = cloned.id;
      const insertedSibling = insertAfterById(doc.ui.root, nodeId, cloned);
      if (insertedSibling.inserted) {
        return { ...doc, ui: { ...doc.ui, root: insertedSibling.node } };
      }
      const insertedAtRoot = insertChildById(
        doc.ui.root,
        doc.ui.root.id,
        cloned
      );
      return insertedAtRoot.inserted
        ? { ...doc, ui: { ...doc.ui, root: insertedAtRoot.node } }
        : doc;
    });
    if (nextNodeId) {
      handleNodeSelect(nextNodeId);
    }
  };

  const handleMoveNode = (nodeId: string, direction: 'up' | 'down') => {
    if (!nodeId) return;
    let moved = false;
    updateMirDoc((doc) => {
      if (nodeId === doc.ui.root.id) return doc;
      const parentId = findParentId(doc.ui.root, nodeId);
      if (!parentId) return doc;
      const result = moveChildById(doc.ui.root, parentId, nodeId, direction);
      moved = result.moved;
      return result.moved
        ? { ...doc, ui: { ...doc.ui, root: result.node } }
        : doc;
    });
    if (moved) {
      handleNodeSelect(nodeId);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      Object.values(statusTimers.current).forEach((timer) =>
        window.clearInterval(timer)
      );
      statusTimers.current = {};
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any;
    if (data?.kind === 'palette-item') {
      setActivePaletteItemId(String(data.itemId));
    }
  };

  const [treeDropHint, setTreeDropHint] = useState<TreeDropHint>(null);

  const handleDragMove = (event: DragMoveEvent) => {
    const data = event.active.data.current as any;
    const over = event.over;
    if (!over || data?.kind !== 'tree-sort') {
      setTreeDropHint(null);
      return;
    }

    const root = mirDoc?.ui?.root;
    if (!root) {
      setTreeDropHint(null);
      return;
    }

    const overData = over.data.current as any;
    const overId = typeof over.id === 'string' ? over.id : null;
    const overNodeIdRaw =
      overData?.kind === 'tree-sort'
        ? overData.nodeId
        : overData?.kind === 'tree-node'
          ? overData.nodeId
          : overId?.startsWith('tree-node:')
            ? overId.slice('tree-node:'.length)
            : null;

    const overNodeId = typeof overNodeIdRaw === 'string' ? overNodeIdRaw : null;
    if (!overNodeId) {
      setTreeDropHint(null);
      return;
    }

    const activeId = data.nodeId;
    if (!activeId || activeId === overNodeId) {
      setTreeDropHint(null);
      return;
    }

    const overNode = findNodeById(root, overNodeId);
    if (!overNode) {
      setTreeDropHint(null);
      return;
    }

    const canNest =
      supportsChildrenForNode(overNode) &&
      !isAncestorOf(root, activeId, overNodeId);

    const translated =
      event.active.rect?.current?.translated ??
      event.active.rect?.current?.initial;
    const activeCenterY = translated
      ? translated.top + translated.height / 2
      : Number.NaN;
    const hasGeometry = Boolean(
      over.rect &&
        Number.isFinite(over.rect.top) &&
        Number.isFinite(over.rect.height) &&
        over.rect.height > 0 &&
        Number.isFinite(activeCenterY)
    );

    const placement = hasGeometry
      ? getTreeDropPlacement({
          canNest,
          overTop: over.rect.top,
          overHeight: over.rect.height,
          activeCenterY,
        })
      : overData?.kind === 'tree-node'
        ? canNest
          ? 'child'
          : 'after'
        : 'after';

    setTreeDropHint({ overNodeId, placement });
  };

  const handleDragCancel = () => {
    setActivePaletteItemId(null);
    setTreeDropHint(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as any;
    const over = event.over;
    setActivePaletteItemId(null);
    setTreeDropHint(null);
    if (!over) return;
    if (data?.kind === 'tree-sort') {
      const overData = over.data.current as any;
      const overId = typeof over.id === 'string' ? over.id : null;
      const activeId = data.nodeId;
      const activeParentId = data.parentId;
      if (!activeId || !activeParentId) return;
      updateMirDoc((doc) => {
        const root = doc.ui.root;
        if (activeId === root.id) return doc;

        const overNodeIdRaw =
          overData?.kind === 'tree-sort'
            ? overData.nodeId
            : overData?.kind === 'tree-node'
              ? overData.nodeId
              : overId?.startsWith('tree-node:')
                ? overId.slice('tree-node:'.length)
                : null;
        const isOverRoot =
          overId === 'tree-root' || overData?.kind === 'tree-root';

        const overNodeId =
          typeof overNodeIdRaw === 'string' ? overNodeIdRaw : null;
        if (overNodeId === activeId) return doc;

        const overNode = overNodeId ? findNodeById(root, overNodeId) : null;
        const canNest = Boolean(overNode && supportsChildrenForNode(overNode));

        const translated =
          event.active.rect?.current?.translated ??
          event.active.rect?.current?.initial;
        const activeCenterY = translated
          ? translated.top + translated.height / 2
          : Number.NaN;
        const hasGeometry = Boolean(
          over.rect &&
            Number.isFinite(over.rect.top) &&
            Number.isFinite(over.rect.height) &&
            over.rect.height > 0 &&
            Number.isFinite(activeCenterY)
        );

        const placement = hasGeometry
          ? getTreeDropPlacement({
              canNest,
              overTop: over.rect.top,
              overHeight: over.rect.height,
              activeCenterY,
            })
          : overData?.kind === 'tree-node'
            ? canNest
              ? 'child'
              : 'after'
            : 'after';

        let targetParentId: string | null = null;
        let targetIndex: number | null = null;

        if (isOverRoot) {
          targetParentId = root.id;
          targetIndex = root.children?.length ?? 0;
        } else if (overNode) {
          if (overNode.id === root.id) {
            targetParentId = root.id;
            targetIndex = root.children?.length ?? 0;
          } else if (placement === 'child' && canNest) {
            targetParentId = overNode.id;
            targetIndex = overNode.children?.length ?? 0;
          } else {
            const parentId = findParentId(root, overNode.id);
            if (!parentId) return doc;
            const parentNode = findNodeById(root, parentId);
            const siblings = parentNode?.children ?? [];
            const overIndex = siblings.findIndex(
              (item) => item.id === overNode.id
            );
            if (overIndex === -1) return doc;
            targetParentId = parentId;
            targetIndex = placement === 'before' ? overIndex : overIndex + 1;
          }
        }

        if (!targetParentId || targetIndex === null) return doc;
        if (isAncestorOf(root, activeId, targetParentId)) return doc;

        let adjustedIndex = targetIndex;
        if (targetParentId === activeParentId) {
          const parentNode = findNodeById(root, targetParentId);
          const siblings = parentNode?.children ?? [];
          const fromIndex = siblings.findIndex((item) => item.id === activeId);
          if (fromIndex === -1) return doc;
          if (fromIndex < targetIndex) adjustedIndex = targetIndex - 1;
          if (fromIndex === adjustedIndex) return doc;
        }

        const removal = removeNodeByIdWithNode(root, activeId);
        if (!removal.removed || !removal.removedNode) return doc;
        const insertion = insertChildAtIndex(
          removal.node,
          targetParentId,
          removal.removedNode,
          adjustedIndex
        );
        return insertion.inserted
          ? { ...doc, ui: { ...doc.ui, root: insertion.node } }
          : doc;
      });
      return;
    }
    if (data?.kind !== 'palette-item') return;

    const itemId = String(data.itemId);
    const variantProps = data.variantProps as
      | Record<string, unknown>
      | undefined;
    const selectedSize = data.selectedSize as string | undefined;
    const overData = over.data.current as any;
    const dropKind = overData?.kind;
    const dropNodeId =
      dropKind === 'tree-node' ? String(overData.nodeId) : null;
    const targetId =
      dropNodeId ?? (dropKind === 'canvas' ? (selectedId ?? 'root') : 'root');

    let nextNodeId = '';
    updateMirDoc((doc) => {
      const createId = createNodeIdFactory(doc);
      const newNode = createNodeFromPaletteItem(
        itemId,
        createId,
        variantProps,
        selectedSize
      );
      nextNodeId = newNode.id;
      return insertIntoMirDoc(doc, targetId, newNode);
    });
    if (nextNodeId) {
      handleNodeSelect(nextNodeId);
    }
  };

  return (
    <div className="flex h-full min-h-screen flex-col text-(--color-10)">
      <BlueprintEditorAddressBar
        currentPath={currentPath}
        newPath={newPath}
        routes={routes}
        onCurrentPathChange={setCurrentPath}
        onNewPathChange={setNewPath}
        onAddRoute={handleAddRoute}
      />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`BlueprintEditorBody relative flex min-h-0 flex-1 p-[14px_20px_20px] [--sidebar-width:400px] [--tree-width:400px] [--inspector-width:360px] [--collapsed-panel-width:36px] [--component-tree-height:450px] max-[1100px]:p-[12px_16px_16px] max-[1100px]:[--sidebar-width:220px] max-[1100px]:[--tree-width:220px] max-[1100px]:[--inspector-width:240px] max-[1100px]:[--component-tree-height:340px] ${isLibraryCollapsed ? '[--sidebar-width:var(--collapsed-panel-width)]' : ''} ${isInspectorCollapsed ? '[--inspector-width:var(--collapsed-panel-width)]' : ''} ${isTreeCollapsed ? '[--component-tree-height:0px]' : ''}`}
        >
          <BlueprintEditorSidebar
            isCollapsed={isLibraryCollapsed}
            isTreeCollapsed={isTreeCollapsed}
            collapsedGroups={collapsedGroups}
            expandedPreviews={expandedPreviews}
            sizeSelections={sizeSelections}
            statusSelections={statusSelections}
            onToggleCollapse={() => setLibraryCollapsed((prev) => !prev)}
            onToggleGroup={toggleGroup}
            onTogglePreview={togglePreview}
            onPreviewKeyDown={handlePreviewKeyDown}
            onSizeSelect={handleSizeSelect}
            onStatusSelect={handleStatusSelect}
            onStatusCycleStart={startStatusCycle}
            onStatusCycleStop={stopStatusCycle}
          />
          <BlueprintEditorComponentTree
            isCollapsed={isTreeCollapsed}
            isTreeCollapsed={isTreeCollapsed}
            selectedId={selectedId}
            dropHint={treeDropHint}
            onToggleCollapse={() => setTreeCollapsed((prev) => !prev)}
            onSelectNode={handleNodeSelect}
            onDeleteSelected={handleDeleteSelected}
            onDeleteNode={handleDeleteNode}
            onCopyNode={handleCopyNode}
            onMoveNode={handleMoveNode}
          />
          <BlueprintEditorCanvas
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            zoom={zoom}
            pan={pan}
            selectedId={selectedId}
            onPanChange={handlePanChange}
            onZoomChange={handleZoomChange}
            onSelectNode={handleNodeSelect}
            onNavigateRequest={handleNavigateRequest}
            onExecuteGraphRequest={handleExecuteGraphRequest}
          />
          <BlueprintEditorInspector
            isCollapsed={isInspectorCollapsed}
            onToggleCollapse={() => setInspectorCollapsed((prev) => !prev)}
          />
        </div>
        <DragOverlay>
          {activePaletteItemId ? (
            <div className="pointer-events-none">
              <div className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/92 px-2.5 py-2 text-xs font-bold tracking-[0.01em] text-(--color-9) shadow-[0_14px_30px_rgba(0,0,0,0.18)] dark:border-white/14 dark:bg-[rgba(10,10,10,0.92)]">
                {activePaletteItemId}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <BlueprintEditorViewportBar
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        onViewportWidthChange={handleViewportWidthChange}
        onViewportHeightChange={handleViewportHeightChange}
        zoom={zoom}
        zoomStep={zoomStep}
        onZoomChange={handleZoomChange}
        onResetView={handleResetView}
      />
    </div>
  );
}

export default BlueprintEditor;
