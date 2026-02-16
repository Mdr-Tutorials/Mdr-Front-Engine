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
  version: '1.0',
  ui: {
    root: {
      id: 'root',
      type: 'container',
    },
  },
});

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
  if (!isPlainObject(source)) {
    return createDefaultMirDoc();
  }
  const root = (source as { ui?: { root?: unknown } }).ui?.root;
  if (!isPlainObject(root)) {
    return createDefaultMirDoc();
  }
  return source as MIRDocument;
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
