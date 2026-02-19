import type { NodeGraphNode } from '../types';

export type NodeLayoutTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
};

export type NodeLayoutTextMeasurer = (
  text: string,
  style: NodeLayoutTextStyle
) => number;

export type NodeLayoutLineKind = 'header' | 'title' | 'meta';

export type NodeLayoutLine = {
  kind: NodeLayoutLineKind;
  text: string;
};

export type NodeVerticalLayoutOptions = {
  paddingX: number;
  paddingY: number;
  lineHeight: number;
  rowGap: number;
};

export type NodeVerticalLayoutResult = {
  width: number;
  height: number;
  lines: NodeLayoutLine[];
  options: NodeVerticalLayoutOptions;
};

export type NodePortAnchorLayoutOptions = {
  sidePadding: number;
  slotGap: number;
};

export const DEFAULT_NODE_LAYOUT_TEXT_STYLE: NodeLayoutTextStyle = {
  fontFamily: 'Inter, "Inter var", "Segoe UI", sans-serif',
  fontSize: 13,
  fontWeight: 400,
};

export const DEFAULT_NODE_VERTICAL_LAYOUT_OPTIONS: NodeVerticalLayoutOptions = {
  paddingX: 12,
  paddingY: 10,
  lineHeight: 18,
  rowGap: 4,
};

export const DEFAULT_NODE_PORT_ANCHOR_LAYOUT_OPTIONS: NodePortAnchorLayoutOptions =
  {
    sidePadding: 18,
    slotGap: 20,
  };

export const getNodeLayoutLines = (node: NodeGraphNode): NodeLayoutLine[] => {
  const header = node.type.toUpperCase().replaceAll('-', ' ');
  const title = node.title?.trim() || node.type;
  return [
    { kind: 'header', text: header },
    { kind: 'title', text: title },
  ];
};

export const measureNodeVerticalLayout = (
  node: NodeGraphNode,
  measureText: NodeLayoutTextMeasurer,
  style: NodeLayoutTextStyle = DEFAULT_NODE_LAYOUT_TEXT_STYLE,
  options: NodeVerticalLayoutOptions = DEFAULT_NODE_VERTICAL_LAYOUT_OPTIONS
): NodeVerticalLayoutResult => {
  const lines = getNodeLayoutLines(node);
  const widestLine = lines.reduce((maxWidth, line) => {
    const lineWidth = measureText(line.text, style);
    return Math.max(maxWidth, lineWidth);
  }, 0);
  const linesHeight =
    lines.length * options.lineHeight +
    Math.max(0, lines.length - 1) * options.rowGap;
  return {
    width: Math.ceil(options.paddingX * 2 + widestLine),
    height: Math.ceil(options.paddingY * 2 + linesHeight),
    lines,
    options,
  };
};

export const resolveNodeLineTop = (
  lineIndex: number,
  options: NodeVerticalLayoutOptions = DEFAULT_NODE_VERTICAL_LAYOUT_OPTIONS
) => options.paddingY + lineIndex * (options.lineHeight + options.rowGap);

export const resolveNodePortAnchorY = (
  rect: { y: number; height: number },
  slotIndex: number,
  slotCount: number,
  options: NodePortAnchorLayoutOptions = DEFAULT_NODE_PORT_ANCHOR_LAYOUT_OPTIONS
) => {
  if (slotCount <= 1) return rect.y + rect.height / 2;
  const usableHeight = Math.max(0, rect.height - options.sidePadding * 2);
  const gap = Math.max(
    options.slotGap,
    usableHeight / Math.max(1, slotCount - 1)
  );
  return rect.y + options.sidePadding + gap * slotIndex;
};
