import type { MIRDocument } from '@/core/types/engine.types';

type WorkspaceLikeDocument = {
  id?: string;
  type?: string;
  path?: string;
  content?: unknown;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultMirDoc = (): MIRDocument => ({
  version: '1.2',
  ui: {
    root: {
      id: 'root',
      type: 'container',
    },
  },
});

const normalizeNodeTree = (node: unknown): MIRDocument['ui']['root'] | null => {
  if (!isPlainObject(node)) return null;
  const id =
    typeof node.id === 'string' && node.id.trim() ? node.id.trim() : 'root';
  const type =
    typeof node.type === 'string' && node.type.trim()
      ? node.type.trim()
      : 'container';
  const normalized: Record<string, unknown> = {
    ...node,
    id,
    type,
  };
  if (Array.isArray(node.children)) {
    normalized.children = node.children
      .map((child) => normalizeNodeTree(child))
      .filter((child): child is MIRDocument['ui']['root'] => Boolean(child));
  }
  return normalized as MIRDocument['ui']['root'];
};

export const normalizeMirToV12 = (source: unknown): MIRDocument => {
  if (!isPlainObject(source)) {
    return createDefaultMirDoc();
  }
  const normalizedRoot = normalizeNodeTree(
    (source as { ui?: { root?: unknown } }).ui?.root
  );
  if (!normalizedRoot) {
    return createDefaultMirDoc();
  }
  const normalized = {
    ...source,
    version: '1.2',
    ui: {
      ...((source as { ui?: Record<string, unknown> }).ui ?? {}),
      root: normalizedRoot,
    },
  } as MIRDocument;
  return normalized;
};

export const resolveCanonicalWorkspaceDocumentId = (
  documents: WorkspaceLikeDocument[]
): string | undefined => {
  if (!documents.length) return undefined;

  const rootPage = documents.find(
    (document) =>
      document.type === 'mir-page' &&
      ((document.path ?? '').trim() === '/' ||
        (document.path ?? '').trim() === '')
  );
  if (rootPage?.id) return rootPage.id;

  const firstPage = documents.find((document) => document.type === 'mir-page');
  if (firstPage?.id) return firstPage.id;

  return documents[0]?.id;
};

export const normalizeMirDocument = (source: unknown): MIRDocument => {
  return normalizeMirToV12(source);
};

const tryResolveFromWorkspaceShape = (source: unknown): MIRDocument | null => {
  if (!isPlainObject(source)) return null;
  if (!Array.isArray(source.documents)) return null;
  const documents = source.documents.filter((item) =>
    isPlainObject(item)
  ) as WorkspaceLikeDocument[];
  if (!documents.length) return null;
  const activeId = resolveCanonicalWorkspaceDocumentId(documents);
  if (!activeId) return null;
  const activeDocument = documents.find((document) => document.id === activeId);
  if (!activeDocument) return null;
  return normalizeMirDocument(activeDocument.content);
};

export const resolveMirDocument = (source: unknown): MIRDocument => {
  const direct = normalizeMirDocument(source);
  const hasValidDirectShape =
    isPlainObject(source) &&
    isPlainObject((source as { ui?: { root?: unknown } }).ui?.root);
  if (hasValidDirectShape) {
    return direct;
  }
  const resolved = tryResolveFromWorkspaceShape(source);
  if (resolved) return resolved;
  return direct;
};
