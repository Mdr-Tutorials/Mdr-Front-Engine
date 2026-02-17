import type {
  WorkspaceRouteManifest,
  WorkspaceRouteNode,
} from './useEditorStore';

export type RouteItem = {
  id: string;
  path: string;
  depth: number;
  label: string;
};

export const normalizeRoutePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
};

const routeNodePath = (
  parentPath: string,
  node: WorkspaceRouteNode
): string => {
  if (node.index) return parentPath || '/';
  const segment = node.segment?.trim() ?? '';
  if (!segment) return parentPath || '/';
  if (segment.startsWith('/')) return normalizeRoutePath(segment);
  if (parentPath === '/' || !parentPath) return normalizeRoutePath(segment);
  return `${parentPath}/${segment}`;
};

export const flattenRouteItems = (
  node: WorkspaceRouteNode,
  parentPath: string,
  depth = 0
): RouteItem[] => {
  const currentPath = routeNodePath(parentPath, node);
  const items: RouteItem[] = [];
  if (node.id !== 'root') {
    const segment = node.segment?.trim();
    const label = node.index
      ? '(index)'
      : segment && segment.length > 0
        ? segment
        : currentPath;
    items.push({ id: node.id, path: currentPath, depth, label });
  }
  const children = node.children ?? [];
  children.forEach((child) => {
    items.push(...flattenRouteItems(child, currentPath, depth + 1));
  });
  return items;
};

export const appendRootRouteNode = (
  manifest: WorkspaceRouteManifest,
  path: string,
  nextNodeId: string
): { manifest: WorkspaceRouteManifest; nodeId: string } => {
  const normalizedPath = normalizeRoutePath(path);
  const nextNode: WorkspaceRouteNode = {
    id: nextNodeId,
    segment:
      normalizedPath === '/' ? undefined : normalizedPath.replace(/^\//, ''),
    index: normalizedPath === '/',
  };
  return {
    nodeId: nextNodeId,
    manifest: {
      ...manifest,
      root: {
        ...manifest.root,
        children: [...(manifest.root.children ?? []), nextNode],
      },
    },
  };
};

export const findRouteNodeById = (
  node: WorkspaceRouteNode,
  nodeId: string
): WorkspaceRouteNode | undefined => {
  if (node.id === nodeId) return node;
  for (const child of node.children ?? []) {
    const matched = findRouteNodeById(child, nodeId);
    if (matched) return matched;
  }
  return undefined;
};

export const updateRouteNodeById = (
  node: WorkspaceRouteNode,
  nodeId: string,
  updater: (target: WorkspaceRouteNode) => WorkspaceRouteNode
): WorkspaceRouteNode => {
  if (node.id === nodeId) {
    return updater(node);
  }
  const children = node.children ?? [];
  if (!children.length) return node;
  let changed = false;
  const nextChildren = children.map((child) => {
    const nextChild = updateRouteNodeById(child, nodeId, updater);
    if (nextChild !== child) changed = true;
    return nextChild;
  });
  if (!changed) return node;
  return { ...node, children: nextChildren };
};

export const removeRouteNodeById = (
  node: WorkspaceRouteNode,
  nodeId: string
): { node: WorkspaceRouteNode; removed?: WorkspaceRouteNode } => {
  const children = node.children ?? [];
  if (!children.length) return { node };
  const removedDirect = children.find((child) => child.id === nodeId);
  if (removedDirect) {
    return {
      node: {
        ...node,
        children: children.filter((child) => child.id !== nodeId),
      },
      removed: removedDirect,
    };
  }
  let removed: WorkspaceRouteNode | undefined;
  let changed = false;
  const nextChildren = children.map((child) => {
    const result = removeRouteNodeById(child, nodeId);
    if (result.removed) {
      removed = result.removed;
    }
    if (result.node !== child) changed = true;
    return result.node;
  });
  if (!changed) return { node };
  return { node: { ...node, children: nextChildren }, removed };
};

export const collectRouteDocumentRefs = (
  node: WorkspaceRouteNode,
  refs: Set<string> = new Set()
): Set<string> => {
  if (node.layoutDocId) refs.add(node.layoutDocId);
  if (node.pageDocId) refs.add(node.pageDocId);
  (node.children ?? []).forEach((child) =>
    collectRouteDocumentRefs(child, refs)
  );
  return refs;
};
