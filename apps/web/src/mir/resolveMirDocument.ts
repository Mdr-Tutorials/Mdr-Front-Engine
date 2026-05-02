import type { MIRDocument } from '@/core/types/engine.types';
import {
  createDefaultMirDocV13,
  normalizeMirDocumentToV13,
} from '@/mir/graph/normalize';
import {
  hasDirectMirShape,
  tryResolveFromWorkspaceShape,
} from './resolveWorkspaceShape';

export { resolveCanonicalWorkspaceDocumentId } from './resolveWorkspaceShape';

export const createDefaultMirDoc = (): MIRDocument => createDefaultMirDocV13();

export const normalizeMirToV13 = (source: unknown): MIRDocument =>
  normalizeMirDocumentToV13(source);

export const normalizeMirDocument = normalizeMirToV13;

/**
 * Resolve an arbitrary input (already-normalized MIR, raw MIR with legacy
 * shape, or a workspace snapshot) into a v1.3 MIRDocument. The input is
 * dispatched to the most specific resolver: direct MIR shape wins; otherwise
 * try to extract the canonical document from a workspace snapshot; otherwise
 * fall back to running the normalizer over the raw payload.
 */
export const resolveMirDocument = (source: unknown): MIRDocument => {
  if (hasDirectMirShape(source)) {
    return normalizeMirToV13(source);
  }
  const resolved = tryResolveFromWorkspaceShape(source);
  if (resolved) return resolved;
  return normalizeMirToV13(source);
};
