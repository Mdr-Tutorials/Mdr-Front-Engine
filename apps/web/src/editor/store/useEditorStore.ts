import type { MIRDocument } from '@/core/types/engine.types';
import type {
  WorkspaceDocumentRecord,
  WorkspaceMutationResponse,
  WorkspaceSnapshot,
} from '@/editor/editorApi';
import {
  createDefaultMirDoc,
  normalizeMirDocument,
  resolveCanonicalWorkspaceDocumentId,
} from '@/mir/resolveMirDocument';
import {
  collectRouteDocumentRefs,
  findRouteNodeById,
  removeRouteNodeById,
  updateRouteNodeById,
} from './routeManifest';
import { create } from 'zustand';

export { createDefaultMirDoc } from '@/mir/resolveMirDocument';

export type BlueprintState = {
  viewportWidth: string;
  viewportHeight: string;
  zoom: number;
  pan: { x: number; y: number };
  selectedId?: string;
};

export type WorkspaceRouteNode = {
  id: string;
  segment?: string;
  index?: boolean;
  layoutDocId?: string;
  pageDocId?: string;
  outletNodeId?: string;
  children?: WorkspaceRouteNode[];
};

export type WorkspaceRouteManifest = {
  version: string;
  root: WorkspaceRouteNode;
};

export type WorkspaceVfsNode = {
  id: string;
  kind: 'dir' | 'doc';
  name: string;
  parentId: string | null;
  children?: string[];
  docId?: string;
};

export type RouteIntent =
  | {
      type: 'create-page';
      path: string;
      routeNodeId?: string;
    }
  | {
      type: 'create-child-route';
      parentRouteNodeId: string;
      segment: string;
      routeNodeId?: string;
      pageDocId?: string;
    }
  | {
      type: 'split-layout';
      routeNodeId: string;
      layoutDocId?: string;
    }
  | {
      type: 'delete-route';
      routeNodeId: string;
    };

export const DEFAULT_BLUEPRINT_STATE: BlueprintState = {
  viewportWidth: '1440',
  viewportHeight: '900',
  zoom: 100,
  pan: { x: 80, y: 60 },
  selectedId: undefined,
};

const DEFAULT_ROUTE_MANIFEST: WorkspaceRouteManifest = {
  version: '1',
  root: {
    id: 'root',
    children: [],
  },
};

const normalizeRouteNode = (
  value: unknown,
  fallbackId: string
): WorkspaceRouteNode => {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const node: WorkspaceRouteNode = {
    id:
      typeof source.id === 'string' && source.id.trim()
        ? source.id
        : fallbackId,
  };
  if (typeof source.segment === 'string') node.segment = source.segment;
  if (typeof source.index === 'boolean') node.index = source.index;
  if (typeof source.layoutDocId === 'string')
    node.layoutDocId = source.layoutDocId;
  if (typeof source.pageDocId === 'string') node.pageDocId = source.pageDocId;
  if (typeof source.outletNodeId === 'string')
    node.outletNodeId = source.outletNodeId;
  const children = Array.isArray(source.children) ? source.children : [];
  if (children.length) {
    node.children = children.map((child, index) =>
      normalizeRouteNode(child, `${node.id}-child-${index + 1}`)
    );
  }
  return node;
};

const normalizeRouteManifest = (
  routeManifest: WorkspaceSnapshot['routeManifest'] | undefined
): WorkspaceRouteManifest => {
  const source =
    routeManifest &&
    typeof routeManifest === 'object' &&
    !Array.isArray(routeManifest)
      ? (routeManifest as Record<string, unknown>)
      : {};
  const version =
    typeof source.version === 'string' && source.version.trim()
      ? source.version
      : DEFAULT_ROUTE_MANIFEST.version;
  return {
    version,
    root: {
      ...normalizeRouteNode(source.root, DEFAULT_ROUTE_MANIFEST.root.id),
      id: DEFAULT_ROUTE_MANIFEST.root.id,
    },
  };
};

const hasRouteNodeId = (node: WorkspaceRouteNode, nodeId: string): boolean => {
  if (node.id === nodeId) return true;
  const children = node.children ?? [];
  for (const child of children) {
    if (hasRouteNodeId(child, nodeId)) return true;
  }
  return false;
};

const resolveDefaultActiveRouteNodeId = (
  manifest: WorkspaceRouteManifest
): string => {
  const firstChild = manifest.root.children?.[0];
  return firstChild?.id ?? manifest.root.id;
};

const resolveActiveRouteNodeId = (
  manifest: WorkspaceRouteManifest,
  candidateIds: Array<string | undefined>
): string => {
  for (const candidate of candidateIds) {
    const normalizedCandidate = candidate?.trim();
    if (!normalizedCandidate) continue;
    if (hasRouteNodeId(manifest.root, normalizedCandidate)) {
      return normalizedCandidate;
    }
  }
  return resolveDefaultActiveRouteNodeId(manifest);
};

const normalizeMirContent = (
  content: WorkspaceDocumentRecord['content'] | undefined
): MIRDocument => {
  return normalizeMirDocument(content);
};

const normalizeWorkspaceDocument = (
  document: WorkspaceDocumentRecord
): WorkspaceDocumentRecord => ({
  ...document,
  content: normalizeMirContent(document.content),
});

const normalizeVfsNode = (
  value: unknown,
  fallbackId: string
): WorkspaceVfsNode | null => {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  if (!source) return null;
  const kind =
    source.kind === 'doc' ? 'doc' : source.kind === 'dir' ? 'dir' : null;
  if (!kind) return null;
  const id =
    typeof source.id === 'string' && source.id.trim() ? source.id : fallbackId;
  const name =
    typeof source.name === 'string' && source.name.trim() ? source.name : id;
  const parentId =
    source.parentId === null
      ? null
      : typeof source.parentId === 'string'
        ? source.parentId
        : null;
  const node: WorkspaceVfsNode = { id, kind, name, parentId };
  if (kind === 'dir') {
    const children = Array.isArray(source.children)
      ? source.children.filter(
          (item): item is string => typeof item === 'string'
        )
      : [];
    node.children = children;
  }
  if (
    kind === 'doc' &&
    typeof source.docId === 'string' &&
    source.docId.trim()
  ) {
    node.docId = source.docId;
  }
  return node;
};

const createFallbackWorkspaceTree = (
  documentsById: Record<string, WorkspaceDocumentRecord>
): { treeRootId: string; treeById: Record<string, WorkspaceVfsNode> } => {
  const treeRootId = 'root';
  const documentIds = Object.keys(documentsById).sort((a, b) => {
    const left = documentsById[a];
    const right = documentsById[b];
    return left.path.localeCompare(right.path);
  });
  const rootChildren = documentIds.map((documentId) => `doc-${documentId}`);
  const treeById: Record<string, WorkspaceVfsNode> = {
    [treeRootId]: {
      id: treeRootId,
      kind: 'dir',
      name: '/',
      parentId: null,
      children: rootChildren,
    },
  };
  documentIds.forEach((documentId) => {
    const document = documentsById[documentId];
    treeById[`doc-${documentId}`] = {
      id: `doc-${documentId}`,
      kind: 'doc',
      name: document.path.split('/').filter(Boolean).at(-1) || document.id,
      parentId: treeRootId,
      docId: documentId,
    };
  });
  return { treeRootId, treeById };
};

const normalizeWorkspaceTree = (
  tree: WorkspaceSnapshot['tree'] | undefined,
  documentsById: Record<string, WorkspaceDocumentRecord>
): { treeRootId: string; treeById: Record<string, WorkspaceVfsNode> } => {
  const source =
    tree && typeof tree === 'object' && !Array.isArray(tree)
      ? (tree as Record<string, unknown>)
      : {};
  const treeRootId =
    typeof source.treeRootId === 'string' && source.treeRootId.trim()
      ? source.treeRootId
      : '';
  const treeByIdSource =
    source.treeById &&
    typeof source.treeById === 'object' &&
    !Array.isArray(source.treeById)
      ? (source.treeById as Record<string, unknown>)
      : {};
  const normalizedTreeById: Record<string, WorkspaceVfsNode> = {};
  Object.entries(treeByIdSource).forEach(([nodeId, nodeValue]) => {
    const node = normalizeVfsNode(nodeValue, nodeId);
    if (!node) return;
    if (node.kind === 'doc') {
      if (!node.docId || !documentsById[node.docId]) return;
    }
    normalizedTreeById[node.id] = node;
  });
  if (!treeRootId || !normalizedTreeById[treeRootId]) {
    return createFallbackWorkspaceTree(documentsById);
  }
  return { treeRootId, treeById: normalizedTreeById };
};

const createEntityId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

const createWorkspaceDocumentRecord = (
  documentId: string,
  type: WorkspaceDocumentRecord['type'],
  path: string
): WorkspaceDocumentRecord => ({
  id: documentId,
  type,
  path,
  contentRev: 1,
  metaRev: 1,
  content: createDefaultMirDoc(),
});

const attachDocumentToTree = (
  treeRootId: string | undefined,
  treeById: Record<string, WorkspaceVfsNode>,
  document: WorkspaceDocumentRecord
): { treeRootId: string; treeById: Record<string, WorkspaceVfsNode> } => {
  const normalizedRootId =
    treeRootId && treeById[treeRootId] ? treeRootId : 'root';
  const normalizedTreeById = { ...treeById };
  const rootNode = normalizedTreeById[normalizedRootId];
  if (!rootNode || rootNode.kind !== 'dir') {
    normalizedTreeById[normalizedRootId] = {
      id: normalizedRootId,
      kind: 'dir',
      name: '/',
      parentId: null,
      children: [],
    };
  }
  const docNodeId = `doc-${document.id}`;
  normalizedTreeById[docNodeId] = {
    id: docNodeId,
    kind: 'doc',
    name: document.path.split('/').filter(Boolean).at(-1) || document.id,
    parentId: normalizedRootId,
    docId: document.id,
  };
  const rootChildren = normalizedTreeById[normalizedRootId].children ?? [];
  if (!rootChildren.includes(docNodeId)) {
    normalizedTreeById[normalizedRootId] = {
      ...normalizedTreeById[normalizedRootId],
      children: [...rootChildren, docNodeId],
    };
  }
  return { treeRootId: normalizedRootId, treeById: normalizedTreeById };
};

const removeDocumentFromTree = (
  treeById: Record<string, WorkspaceVfsNode>,
  documentId: string
): Record<string, WorkspaceVfsNode> => {
  const docNodeId = `doc-${documentId}`;
  if (!treeById[docNodeId]) return treeById;
  const nextTreeById = { ...treeById };
  delete nextTreeById[docNodeId];
  Object.keys(nextTreeById).forEach((nodeId) => {
    const node = nextTreeById[nodeId];
    if (node.kind !== 'dir') return;
    const children = node.children ?? [];
    if (!children.includes(docNodeId)) return;
    nextTreeById[nodeId] = {
      ...node,
      children: children.filter((childId) => childId !== docNodeId),
    };
  });
  return nextTreeById;
};

interface EditorStore {
  mirDoc: MIRDocument;
  setMirDoc: (doc: MIRDocument) => void;
  updateMirDoc: (updater: (doc: MIRDocument) => MIRDocument) => void;
  workspaceId?: string;
  workspaceRev?: number;
  routeRev?: number;
  opSeq?: number;
  activeDocumentId?: string;
  workspaceDocumentsById: Record<string, WorkspaceDocumentRecord>;
  treeRootId?: string;
  treeById: Record<string, WorkspaceVfsNode>;
  workspaceCapabilities: Record<string, boolean>;
  workspaceCapabilitiesLoaded: boolean;
  routeManifest: WorkspaceRouteManifest;
  activeRouteNodeId?: string;
  setWorkspaceSnapshot: (workspace: WorkspaceSnapshot) => void;
  setWorkspaceCapabilities: (
    workspaceId: string,
    capabilities: Record<string, boolean>
  ) => void;
  clearWorkspaceState: () => void;
  setActiveDocumentId: (documentId: string | undefined) => void;
  setActiveRouteNodeId: (routeNodeId: string | undefined) => void;
  updateRouteManifest: (
    updater: (manifest: WorkspaceRouteManifest) => WorkspaceRouteManifest
  ) => void;
  applyRouteIntent: (intent: RouteIntent) => void;
  bindOutletToRoute: (
    routeNodeId: string,
    outletNodeId: string | undefined
  ) => void;
  applyWorkspaceMutation: (mutation: WorkspaceMutationResponse) => void;
  blueprintStateByProject: Record<string, BlueprintState>;
  runtimeStateByProject: Record<string, Record<string, unknown>>;
  projectsById: Record<
    string,
    {
      id: string;
      name: string;
      description?: string;
      type: 'project' | 'component' | 'nodegraph';
      isPublic?: boolean;
      starsCount?: number;
    }
  >;
  setBlueprintState: (
    projectId: string,
    partial: Partial<BlueprintState>
  ) => void;
  patchRuntimeState: (
    projectId: string,
    patch: Record<string, unknown>
  ) => void;
  resetRuntimeState: (projectId?: string) => void;
  setProject: (project: {
    id: string;
    name: string;
    description?: string;
    type?: 'project' | 'component' | 'nodegraph';
    isPublic?: boolean;
    starsCount?: number;
  }) => void;
  setProjects: (
    projects: Array<{
      id: string;
      name: string;
      description?: string;
      type?: 'project' | 'component' | 'nodegraph';
      isPublic?: boolean;
      starsCount?: number;
    }>
  ) => void;
  removeProject: (projectId: string) => void;
}

export const useEditorStore = create<EditorStore>()((set) => ({
  mirDoc: createDefaultMirDoc(),
  setMirDoc: (doc) =>
    set((state) => {
      if (!state.activeDocumentId) {
        return { mirDoc: doc };
      }
      const activeDocument =
        state.workspaceDocumentsById[state.activeDocumentId];
      if (!activeDocument) {
        return { mirDoc: doc };
      }
      return {
        mirDoc: doc,
        workspaceDocumentsById: {
          ...state.workspaceDocumentsById,
          [state.activeDocumentId]: {
            ...activeDocument,
            content: doc,
          },
        },
      };
    }),
  updateMirDoc: (updater) =>
    set((state) => {
      const nextMirDoc = updater(state.mirDoc);
      if (nextMirDoc === state.mirDoc) {
        return state;
      }
      if (!state.activeDocumentId) {
        return { mirDoc: nextMirDoc };
      }
      const activeDocument =
        state.workspaceDocumentsById[state.activeDocumentId];
      if (!activeDocument) {
        return { mirDoc: nextMirDoc };
      }
      return {
        mirDoc: nextMirDoc,
        workspaceDocumentsById: {
          ...state.workspaceDocumentsById,
          [state.activeDocumentId]: {
            ...activeDocument,
            content: nextMirDoc,
          },
        },
      };
    }),
  workspaceId: undefined,
  workspaceRev: undefined,
  routeRev: undefined,
  opSeq: undefined,
  activeDocumentId: undefined,
  workspaceDocumentsById: {},
  treeRootId: undefined,
  treeById: {},
  workspaceCapabilities: {},
  workspaceCapabilitiesLoaded: false,
  routeManifest: DEFAULT_ROUTE_MANIFEST,
  activeRouteNodeId: undefined,
  setWorkspaceSnapshot: (workspace) =>
    set((state) => {
      const isSameWorkspace = state.workspaceId === workspace.id;
      const nextDocumentsById: Record<string, WorkspaceDocumentRecord> = {};
      workspace.documents.forEach((document) => {
        nextDocumentsById[document.id] = normalizeWorkspaceDocument(document);
      });

      const nextActiveDocumentId =
        state.activeDocumentId && nextDocumentsById[state.activeDocumentId]
          ? state.activeDocumentId
          : resolveCanonicalWorkspaceDocumentId(workspace.documents);
      const { treeRootId, treeById } = normalizeWorkspaceTree(
        workspace.tree,
        nextDocumentsById
      );
      const activeDocument = nextActiveDocumentId
        ? nextDocumentsById[nextActiveDocumentId]
        : undefined;
      const nextRouteManifest = normalizeRouteManifest(workspace.routeManifest);
      const nextActiveRouteNodeId = resolveActiveRouteNodeId(
        nextRouteManifest,
        [workspace.activeRouteNodeId, state.activeRouteNodeId]
      );

      return {
        workspaceId: workspace.id,
        workspaceRev: workspace.workspaceRev,
        routeRev: workspace.routeRev,
        opSeq: workspace.opSeq,
        workspaceDocumentsById: nextDocumentsById,
        treeRootId,
        treeById,
        workspaceCapabilities: isSameWorkspace
          ? state.workspaceCapabilities
          : {},
        workspaceCapabilitiesLoaded: isSameWorkspace
          ? state.workspaceCapabilitiesLoaded
          : false,
        routeManifest: nextRouteManifest,
        activeRouteNodeId: nextActiveRouteNodeId,
        activeDocumentId: nextActiveDocumentId,
        mirDoc: activeDocument?.content ?? state.mirDoc,
      };
    }),
  setWorkspaceCapabilities: (workspaceId, capabilities) =>
    set((state) => {
      const normalizedWorkspaceId = workspaceId.trim();
      if (
        !normalizedWorkspaceId ||
        normalizedWorkspaceId !== state.workspaceId
      ) {
        return state;
      }
      return {
        workspaceCapabilities: { ...capabilities },
        workspaceCapabilitiesLoaded: true,
      };
    }),
  clearWorkspaceState: () =>
    set({
      workspaceId: undefined,
      workspaceRev: undefined,
      routeRev: undefined,
      opSeq: undefined,
      activeDocumentId: undefined,
      workspaceDocumentsById: {},
      treeRootId: undefined,
      treeById: {},
      workspaceCapabilities: {},
      workspaceCapabilitiesLoaded: false,
      routeManifest: DEFAULT_ROUTE_MANIFEST,
      activeRouteNodeId: undefined,
      runtimeStateByProject: {},
    }),
  setActiveDocumentId: (documentId) =>
    set((state) => {
      const normalizedDocumentId = documentId?.trim();
      if (!normalizedDocumentId) {
        return { activeDocumentId: undefined };
      }
      const nextDocument = state.workspaceDocumentsById[normalizedDocumentId];
      if (!nextDocument) {
        return state;
      }
      return {
        activeDocumentId: normalizedDocumentId,
        mirDoc: nextDocument.content,
      };
    }),
  setActiveRouteNodeId: (routeNodeId) =>
    set((state) => {
      const normalizedRouteNodeId = routeNodeId?.trim();
      if (!normalizedRouteNodeId) {
        return {
          activeRouteNodeId: resolveDefaultActiveRouteNodeId(
            state.routeManifest
          ),
        };
      }
      if (!hasRouteNodeId(state.routeManifest.root, normalizedRouteNodeId)) {
        return state;
      }
      return { activeRouteNodeId: normalizedRouteNodeId };
    }),
  updateRouteManifest: (updater) =>
    set((state) => {
      const nextRouteManifest = normalizeRouteManifest(
        updater(state.routeManifest)
      );
      const nextActiveRouteNodeId = resolveActiveRouteNodeId(
        nextRouteManifest,
        [state.activeRouteNodeId]
      );
      return {
        routeManifest: nextRouteManifest,
        activeRouteNodeId: nextActiveRouteNodeId,
      };
    }),
  applyRouteIntent: (intent) =>
    set((state) => {
      const nextDocumentsById = { ...state.workspaceDocumentsById };
      let nextRouteManifest = state.routeManifest;
      let nextTreeRootId = state.treeRootId;
      let nextTreeById = state.treeById;
      let nextActiveRouteNodeId = state.activeRouteNodeId;
      let nextActiveDocumentId = state.activeDocumentId;

      if (intent.type === 'create-page') {
        const routeNodeId =
          intent.routeNodeId?.trim() || createEntityId('route');
        const documentId = createEntityId('page');
        const normalizedPath = intent.path.startsWith('/')
          ? intent.path
          : `/${intent.path}`;
        const pageDocument = createWorkspaceDocumentRecord(
          documentId,
          'mir-page',
          normalizedPath
        );
        nextDocumentsById[documentId] = pageDocument;
        const treeResult = attachDocumentToTree(
          nextTreeRootId,
          nextTreeById,
          pageDocument
        );
        nextTreeRootId = treeResult.treeRootId;
        nextTreeById = treeResult.treeById;
        nextRouteManifest = {
          ...state.routeManifest,
          root: {
            ...state.routeManifest.root,
            children: [
              ...(state.routeManifest.root.children ?? []),
              {
                id: routeNodeId,
                index: normalizedPath === '/',
                segment:
                  normalizedPath === '/'
                    ? undefined
                    : normalizedPath.replace(/^\//, ''),
                pageDocId: documentId,
              },
            ],
          },
        };
        nextActiveRouteNodeId = routeNodeId;
        if (!nextActiveDocumentId || !nextDocumentsById[nextActiveDocumentId]) {
          nextActiveDocumentId = documentId;
        }
        return {
          routeManifest: normalizeRouteManifest(nextRouteManifest),
          activeRouteNodeId: nextActiveRouteNodeId,
          workspaceDocumentsById: nextDocumentsById,
          treeRootId: nextTreeRootId,
          treeById: nextTreeById,
          activeDocumentId: nextActiveDocumentId,
          mirDoc: nextActiveDocumentId
            ? (nextDocumentsById[nextActiveDocumentId]?.content ?? state.mirDoc)
            : state.mirDoc,
        };
      }

      if (intent.type === 'create-child-route') {
        const parent = findRouteNodeById(
          state.routeManifest.root,
          intent.parentRouteNodeId
        );
        if (!parent) return state;
        const routeNodeId =
          intent.routeNodeId?.trim() || createEntityId('route');
        const documentId = intent.pageDocId?.trim() || createEntityId('page');
        const pageDocument = createWorkspaceDocumentRecord(
          documentId,
          'mir-page',
          `/${intent.segment}`
        );
        nextDocumentsById[documentId] = pageDocument;
        const treeResult = attachDocumentToTree(
          nextTreeRootId,
          nextTreeById,
          pageDocument
        );
        nextTreeRootId = treeResult.treeRootId;
        nextTreeById = treeResult.treeById;
        nextRouteManifest = {
          ...state.routeManifest,
          root: updateRouteNodeById(
            state.routeManifest.root,
            intent.parentRouteNodeId,
            (target) => ({
              ...target,
              children: [
                ...(target.children ?? []),
                {
                  id: routeNodeId,
                  segment: intent.segment,
                  pageDocId: documentId,
                },
              ],
            })
          ),
        };
        nextActiveRouteNodeId = routeNodeId;
        if (!nextActiveDocumentId || !nextDocumentsById[nextActiveDocumentId]) {
          nextActiveDocumentId = documentId;
        }
        return {
          routeManifest: normalizeRouteManifest(nextRouteManifest),
          activeRouteNodeId: nextActiveRouteNodeId,
          workspaceDocumentsById: nextDocumentsById,
          treeRootId: nextTreeRootId,
          treeById: nextTreeById,
          activeDocumentId: nextActiveDocumentId,
          mirDoc: nextActiveDocumentId
            ? (nextDocumentsById[nextActiveDocumentId]?.content ?? state.mirDoc)
            : state.mirDoc,
        };
      }

      if (intent.type === 'split-layout') {
        const targetNode = findRouteNodeById(
          state.routeManifest.root,
          intent.routeNodeId
        );
        if (!targetNode) return state;
        if (targetNode.layoutDocId) return state;
        const layoutDocId =
          intent.layoutDocId?.trim() || createEntityId('layout');
        const layoutDocument = createWorkspaceDocumentRecord(
          layoutDocId,
          'mir-layout',
          `/layouts/${layoutDocId}`
        );
        nextDocumentsById[layoutDocId] = layoutDocument;
        const treeResult = attachDocumentToTree(
          nextTreeRootId,
          nextTreeById,
          layoutDocument
        );
        nextTreeRootId = treeResult.treeRootId;
        nextTreeById = treeResult.treeById;
        nextRouteManifest = {
          ...state.routeManifest,
          root: updateRouteNodeById(
            state.routeManifest.root,
            intent.routeNodeId,
            (target) => ({ ...target, layoutDocId })
          ),
        };
        nextActiveDocumentId = layoutDocId;
        return {
          routeManifest: normalizeRouteManifest(nextRouteManifest),
          workspaceDocumentsById: nextDocumentsById,
          treeRootId: nextTreeRootId,
          treeById: nextTreeById,
          activeDocumentId: nextActiveDocumentId,
          mirDoc: layoutDocument.content,
        };
      }

      if (intent.type === 'delete-route') {
        if (intent.routeNodeId === 'root') return state;
        const removed = removeRouteNodeById(
          state.routeManifest.root,
          intent.routeNodeId
        );
        if (!removed.removed) return state;
        nextRouteManifest = { ...state.routeManifest, root: removed.node };
        const referencedDocs = collectRouteDocumentRefs(nextRouteManifest.root);
        const removedRouteDocs = collectRouteDocumentRefs(removed.removed);
        removedRouteDocs.forEach((docId) => {
          if (referencedDocs.has(docId)) return;
          if (!nextDocumentsById[docId]) return;
          delete nextDocumentsById[docId];
          nextTreeById = removeDocumentFromTree(nextTreeById, docId);
        });
        nextActiveRouteNodeId = resolveActiveRouteNodeId(nextRouteManifest, [
          state.activeRouteNodeId === intent.routeNodeId
            ? undefined
            : state.activeRouteNodeId,
        ]);
        if (nextActiveDocumentId && !nextDocumentsById[nextActiveDocumentId]) {
          nextActiveDocumentId = Object.keys(nextDocumentsById)[0];
        }
        const nextMirDoc = nextActiveDocumentId
          ? (nextDocumentsById[nextActiveDocumentId]?.content ?? state.mirDoc)
          : state.mirDoc;
        return {
          routeManifest: normalizeRouteManifest(nextRouteManifest),
          activeRouteNodeId: nextActiveRouteNodeId,
          workspaceDocumentsById: nextDocumentsById,
          treeRootId: nextTreeRootId,
          treeById: nextTreeById,
          activeDocumentId: nextActiveDocumentId,
          mirDoc: nextMirDoc,
        };
      }

      return state;
    }),
  bindOutletToRoute: (routeNodeId, outletNodeId) =>
    set((state) => {
      const normalizedRouteNodeId = routeNodeId.trim();
      if (!normalizedRouteNodeId) return state;
      const normalizedOutletNodeId = outletNodeId?.trim();
      const currentNode = findRouteNodeById(
        state.routeManifest.root,
        normalizedRouteNodeId
      );
      if (!currentNode) return state;
      if ((currentNode.outletNodeId ?? '') === (normalizedOutletNodeId ?? '')) {
        return state;
      }
      const nextManifest: WorkspaceRouteManifest = {
        ...state.routeManifest,
        root: updateRouteNodeById(
          state.routeManifest.root,
          normalizedRouteNodeId,
          (target) => ({
            ...target,
            outletNodeId: normalizedOutletNodeId || undefined,
          })
        ),
      };
      return {
        routeManifest: normalizeRouteManifest(nextManifest),
      };
    }),
  applyWorkspaceMutation: (mutation) =>
    set((state) => {
      if (!state.workspaceId || state.workspaceId !== mutation.workspaceId) {
        return state;
      }

      let nextDocumentsById = state.workspaceDocumentsById;
      if (mutation.updatedDocuments?.length) {
        nextDocumentsById = { ...state.workspaceDocumentsById };
        mutation.updatedDocuments.forEach((documentRevision) => {
          const previousDocument = nextDocumentsById[documentRevision.id];
          if (!previousDocument) {
            return;
          }
          nextDocumentsById[documentRevision.id] = {
            ...previousDocument,
            contentRev: documentRevision.contentRev,
            metaRev: documentRevision.metaRev,
            ...(documentRevision.id === state.activeDocumentId
              ? { content: state.mirDoc }
              : null),
          };
        });
      }

      return {
        workspaceRev: mutation.workspaceRev,
        routeRev: mutation.routeRev,
        opSeq: mutation.opSeq,
        workspaceDocumentsById: nextDocumentsById,
      };
    }),
  blueprintStateByProject: {},
  runtimeStateByProject: {},
  projectsById: {},
  setBlueprintState: (projectId, partial) =>
    set((state) => {
      const previous =
        state.blueprintStateByProject[projectId] ?? DEFAULT_BLUEPRINT_STATE;
      const nextPan = partial.pan
        ? { ...previous.pan, ...partial.pan }
        : previous.pan;
      return {
        blueprintStateByProject: {
          ...state.blueprintStateByProject,
          [projectId]: { ...previous, ...partial, pan: nextPan },
        },
      };
    }),
  patchRuntimeState: (projectId, patch) =>
    set((state) => {
      const normalizedProjectId = projectId.trim();
      if (!normalizedProjectId) return state;
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return state;
      }
      const previous = state.runtimeStateByProject[normalizedProjectId] ?? {};
      return {
        runtimeStateByProject: {
          ...state.runtimeStateByProject,
          [normalizedProjectId]: {
            ...previous,
            ...patch,
          },
        },
      };
    }),
  resetRuntimeState: (projectId) =>
    set((state) => {
      const normalizedProjectId = projectId?.trim();
      if (!normalizedProjectId) {
        if (!Object.keys(state.runtimeStateByProject).length) return state;
        return { runtimeStateByProject: {} };
      }
      if (!state.runtimeStateByProject[normalizedProjectId]) return state;
      const nextRuntimeStateByProject = { ...state.runtimeStateByProject };
      delete nextRuntimeStateByProject[normalizedProjectId];
      return { runtimeStateByProject: nextRuntimeStateByProject };
    }),
  setProject: (project) =>
    set((state) => ({
      projectsById: {
        ...state.projectsById,
        [project.id]: {
          ...project,
          type: project.type ?? 'project',
          isPublic: project.isPublic ?? false,
          starsCount: project.starsCount ?? 0,
        },
      },
    })),
  setProjects: (projects) =>
    set((state) => {
      const nextProjectsById = { ...state.projectsById };
      projects.forEach((project) => {
        nextProjectsById[project.id] = {
          ...project,
          type: project.type ?? 'project',
          isPublic: project.isPublic ?? false,
          starsCount: project.starsCount ?? 0,
        };
      });
      return { projectsById: nextProjectsById };
    }),
  removeProject: (projectId) =>
    set((state) => {
      if (!state.projectsById[projectId]) return state;
      const nextProjectsById = { ...state.projectsById };
      delete nextProjectsById[projectId];
      const nextRuntimeStateByProject = { ...state.runtimeStateByProject };
      delete nextRuntimeStateByProject[projectId];
      return {
        projectsById: nextProjectsById,
        runtimeStateByProject: nextRuntimeStateByProject,
      };
    }),
}));
