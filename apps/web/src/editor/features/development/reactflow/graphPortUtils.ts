import { resolveMultiplicity, type PortSemantic } from './graphNodeShared';

export type PortRole = 'in' | 'out';
export type HandleInfo = { role: PortRole; semantic: PortSemantic };

export const parseHandleInfo = (
  handleId?: string | null
): HandleInfo | null => {
  if (!handleId) return null;
  const matched = handleId.match(/^(in|out)\.(control|data|condition)\./);
  if (!matched) return null;
  return {
    role: matched[1] as PortRole,
    semantic: matched[2] as PortSemantic,
  };
};

export const normalizeHandleId = (handleId?: string | null): string | null => {
  if (!handleId) return null;
  if (handleId.startsWith('in.control.') || handleId.startsWith('out.control.'))
    return handleId;
  if (handleId.startsWith('in.data.') || handleId.startsWith('out.data.'))
    return handleId;
  if (
    handleId.startsWith('in.condition.') ||
    handleId.startsWith('out.condition.')
  )
    return handleId;
  if (handleId === 'in.prev') return 'in.control.prev';
  if (handleId === 'out.next') return 'out.control.next';
  if (handleId.startsWith('out.case-'))
    return `out.control.${handleId.slice(4)}`;
  if (handleId.startsWith('in.case-'))
    return `in.condition.${handleId.slice(3)}`;
  if (handleId === 'in.value') return 'in.data.value';
  return handleId;
};

export const isMultiHandle = (handleId: string) => {
  const handle = parseHandleInfo(handleId);
  if (!handle) return false;
  const multiplicity = resolveMultiplicity(
    handle.role === 'in' ? 'target' : 'source',
    handle.semantic
  );
  if (multiplicity === 'multi') return true;
  if (handleId === 'out.condition.result') return true;
  return false;
};
