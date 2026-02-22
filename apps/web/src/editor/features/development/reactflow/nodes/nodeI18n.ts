export type NodeI18n = (
  key: string,
  defaultValueOrOptions?: unknown,
  options?: Record<string, unknown>
) => string;

export const tNode = (
  t: NodeI18n,
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>
) =>
  t(`nodeGraph.nodes.${key}`, {
    defaultValue,
    ...(options ?? {}),
  });
