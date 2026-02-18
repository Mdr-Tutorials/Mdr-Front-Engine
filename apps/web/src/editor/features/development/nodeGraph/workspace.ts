import { createDefaultNodeGraphModel, normalizeNodeGraphModel } from '../node';
import { STORAGE_PREFIX } from './constants';
import type { GraphMeta, GraphWorkspaceSnapshot } from './types';

export const createStorageKey = (projectId: string) =>
  `${STORAGE_PREFIX}:${projectId}`;

export const createGraphId = () =>
  `graph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createDefaultSnapshot = (): GraphWorkspaceSnapshot => {
  const graphId = 'graph-main';
  return {
    activeGraphId: graphId,
    graphs: [{ id: graphId, name: 'Main Graph' }],
    documents: {
      [graphId]: createDefaultNodeGraphModel(),
    },
  };
};

export const ensureDocuments = (
  graphs: GraphMeta[],
  documents: Record<string, ReturnType<typeof createDefaultNodeGraphModel>>
) => {
  const next: GraphWorkspaceSnapshot['documents'] = {};
  graphs.forEach((graph) => {
    next[graph.id] = normalizeNodeGraphModel(documents[graph.id]);
  });
  return next;
};

export const normalizeSnapshot = (raw: unknown): GraphWorkspaceSnapshot => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultSnapshot();
  }

  const source = raw as {
    activeGraphId?: unknown;
    graphs?: unknown;
    documents?: unknown;
  };

  const graphs = Array.isArray(source.graphs)
    ? source.graphs
        .map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
          }
          const graph = item as { id?: unknown; name?: unknown };
          const id = typeof graph.id === 'string' ? graph.id.trim() : '';
          const name = typeof graph.name === 'string' ? graph.name.trim() : '';
          if (!id || !name) return null;
          return { id, name };
        })
        .filter((item): item is GraphMeta => Boolean(item))
    : [];

  if (!graphs.length) {
    return createDefaultSnapshot();
  }

  const activeGraphId =
    typeof source.activeGraphId === 'string' &&
    graphs.some((graph) => graph.id === source.activeGraphId)
      ? source.activeGraphId
      : graphs[0].id;

  const rawDocuments =
    source.documents && typeof source.documents === 'object'
      ? (source.documents as GraphWorkspaceSnapshot['documents'])
      : {};

  return {
    activeGraphId,
    graphs,
    documents: ensureDocuments(graphs, rawDocuments),
  };
};

export const loadSnapshot = (projectId: string): GraphWorkspaceSnapshot => {
  if (typeof window === 'undefined') return createDefaultSnapshot();
  const raw = window.localStorage.getItem(createStorageKey(projectId));
  if (!raw) return createDefaultSnapshot();
  try {
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return createDefaultSnapshot();
  }
};

export const saveSnapshot = (
  projectId: string,
  snapshot: GraphWorkspaceSnapshot
) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    createStorageKey(projectId),
    JSON.stringify(snapshot)
  );
};
