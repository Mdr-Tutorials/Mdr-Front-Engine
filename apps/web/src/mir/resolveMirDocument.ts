import type { MIRDocument } from '@/core/types/engine.types';
import {
  createDefaultMirDocV13,
  normalizeMirDocumentToV13,
} from '@/mir/graph/normalize';

type WorkspaceLikeDocument = {
  id?: string;
  type?: string;
  path?: string;
  content?: unknown;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultMirDoc = (): MIRDocument => createDefaultMirDocV13();

export const normalizeMirToV13 = (source: unknown): MIRDocument =>
  normalizeMirDocumentToV13(source);

export const normalizeMirToV12 = normalizeMirToV13;

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
  return normalizeMirToV13(source);
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

const hasDirectMirShape = (source: unknown): boolean => {
  if (!isPlainObject(source)) return false;
  const ui = source.ui;
  if (!isPlainObject(ui)) return false;
  return isPlainObject(ui.graph) || isPlainObject(ui.root);
};

export const resolveMirDocument = (source: unknown): MIRDocument => {
  if (hasDirectMirShape(source)) {
    return normalizeMirDocument(source);
  }
  const resolved = tryResolveFromWorkspaceShape(source);
  if (resolved) return resolved;
  return normalizeMirDocument(source);
};
