import type {
  NodeGraphNode,
  NodeGraphPort,
  NodeGraphPortKind,
  NodeGraphPortShape,
  NodeGraphNodeType,
} from '../types';
import {
  getNodeLayoutLines,
  resolveNodePortAnchorY,
} from '../layout/verticalLayout';
import { NODE_CANVAS_VISUAL_TOKENS } from './tokens';

export type NodeCanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NodeCanvasPoint = {
  x: number;
  y: number;
};

export type NodeCanvasTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
};

export type NodeCanvasTextMeasurer = (
  text: string,
  style: NodeCanvasTextStyle
) => number;

export type NodeCanvasTextMeasureCache = {
  measure: NodeCanvasTextMeasurer;
  clear: () => void;
  clearByStyle: (style: NodeCanvasTextStyle) => void;
  getSize: () => number;
};

export type NodeCanvasRenderState = {
  hovered?: boolean;
  selected?: boolean;
  running?: boolean;
  readonly?: boolean;
  error?: boolean;
};

export type NodeCanvasHitResult = {
  target: 'body' | 'header' | 'port';
  portId?: string;
};

export type NodeCanvasPortAnchor = {
  port: NodeGraphPort;
  x: number;
  y: number;
  visualRadius: number;
  hitRadius: number;
};

export type NodeCanvasRenderDefinition = {
  type: NodeGraphNodeType;
  measure: (
    node: NodeGraphNode,
    measureText: NodeCanvasTextMeasurer
  ) => {
    width: number;
    height: number;
  };
  draw: (
    node: NodeGraphNode,
    rect: NodeCanvasRect,
    state: NodeCanvasRenderState,
    ctx: CanvasRenderingContext2D
  ) => void;
  ports: (node: NodeGraphNode) => NodeGraphPort[];
  hitTest: (
    node: NodeGraphNode,
    rect: NodeCanvasRect,
    point: NodeCanvasPoint
  ) => NodeCanvasHitResult | null;
};

export type NodeCanvasRendererRegistry = Record<
  string,
  NodeCanvasRenderDefinition
>;

const composeFontDeclaration = (style: NodeCanvasTextStyle) => {
  const weight = style.fontWeight ?? 400;
  return `${weight} ${style.fontSize}px ${style.fontFamily}`;
};

const createMeasureCacheKey = (text: string, style: NodeCanvasTextStyle) =>
  `${composeFontDeclaration(style)}|${text}`;

/**
 * 文本测量缓存：以 font declaration + text 作为键，避免重复 measureText。
 * 支持整体清空和按样式前缀清理，供字体配置变更时失效。
 */
export const createNodeCanvasTextMeasureCache = (
  ctx: CanvasRenderingContext2D,
  maxEntries = 2000
): NodeCanvasTextMeasureCache => {
  const cache = new Map<string, number>();
  const safeMaxEntries =
    Number.isFinite(maxEntries) && maxEntries > 0
      ? Math.floor(maxEntries)
      : 2000;

  const evictIfNeeded = () => {
    while (cache.size > safeMaxEntries) {
      const firstKey = cache.keys().next().value;
      if (!firstKey) break;
      cache.delete(firstKey);
    }
  };

  const measure: NodeCanvasTextMeasurer = (text, style) => {
    const key = createMeasureCacheKey(text, style);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const previousFont = ctx.font;
    ctx.font = composeFontDeclaration(style);
    const width = ctx.measureText(text).width;
    ctx.font = previousFont;
    cache.set(key, width);
    evictIfNeeded();
    return width;
  };

  const clear = () => {
    cache.clear();
  };

  const clearByStyle = (style: NodeCanvasTextStyle) => {
    const prefix = `${composeFontDeclaration(style)}|`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  };

  return {
    measure,
    clear,
    clearByStyle,
    getSize: () => cache.size,
  };
};

const HEADER_HIT_HEIGHT = 36;
const PORT_VISUAL_RADIUS = 5;
const PORT_HIT_RADIUS = 12;
const NODE_RADIUS = 12;
const NODE_LEFT_GUTTER = 36;
const NODE_RIGHT_GUTTER = 36;
const NODE_HEADER_HEIGHT = 36;
const NODE_BODY_ROW_HEIGHT = 28;
const TITLE_FONT: NodeCanvasTextStyle = {
  fontFamily: NODE_CANVAS_VISUAL_TOKENS.titleFontFamily,
  fontSize: NODE_CANVAS_VISUAL_TOKENS.titleFontSize,
  fontWeight: NODE_CANVAS_VISUAL_TOKENS.titleFontWeight,
};
const BODY_FONT: NodeCanvasTextStyle = {
  fontFamily: NODE_CANVAS_VISUAL_TOKENS.bodyFontFamily,
  fontSize: NODE_CANVAS_VISUAL_TOKENS.bodyFontSize,
  fontWeight: NODE_CANVAS_VISUAL_TOKENS.bodyFontWeight,
};
const COMPACT_NODE_TYPES: NodeGraphNodeType[] = [
  'start',
  'end',
  'break',
  'continue',
];

const isCompactNodeType = (type: NodeGraphNodeType) =>
  COMPACT_NODE_TYPES.includes(type);

const resolveNodeIcon = (type: NodeGraphNodeType) => {
  if (type === 'start') return '⚑';
  if (type === 'end') return '⚑';
  if (type === 'break') return '⤴';
  if (type === 'continue') return '↺';
  return null;
};

const resolveNodeIconColor = (type: NodeGraphNodeType) => {
  if (type === 'start') return '#16a34a';
  if (type === 'end') return '#dc2626';
  return '#4b5563';
};

const toNodeLabel = (type: NodeGraphNodeType) =>
  type
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const PORT_KIND_STYLE: Record<
  NodeGraphPortKind,
  { stroke: string; fill: string; halo: string }
> = {
  control: { stroke: '#334155', fill: '#475569', halo: 'rgba(71,85,105,0.35)' },
  condition: {
    stroke: '#92400e',
    fill: '#d97706',
    halo: 'rgba(217,119,6,0.35)',
  },
  data: { stroke: '#0c4a6e', fill: '#0284c7', halo: 'rgba(2,132,199,0.35)' },
};

const resolvePortShape = (port: NodeGraphPort): NodeGraphPortShape => {
  if (port.shape) return port.shape;
  if (port.kind === 'condition') return 'diamond';
  if (port.kind === 'data') return 'square';
  return 'circle';
};

const resolvePortVisualRadius = (port: NodeGraphPort) =>
  PORT_VISUAL_RADIUS + (port.multiplicity === 'multi' ? 1 : 0);

const drawPortShapePath = (
  ctx: CanvasRenderingContext2D,
  shape: NodeGraphPortShape,
  x: number,
  y: number,
  size: number,
  role: NodeGraphPort['role']
) => {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, size, 0, Math.PI * 2);
    return;
  }

  if (shape === 'square') {
    ctx.rect(x - size, y - size, size * 2, size * 2);
    return;
  }

  if (shape === 'diamond') {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    return;
  }

  if (shape === 'triangle') {
    if (role === 'out') {
      ctx.moveTo(x - size * 0.92, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x - size * 0.92, y + size);
    } else {
      ctx.moveTo(x + size * 0.92, y - size);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x + size * 0.92, y + size);
    }
    ctx.closePath();
    return;
  }

  const innerX = size * 0.58;
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - innerX, y - size);
  ctx.lineTo(x + innerX, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + innerX, y + size);
  ctx.lineTo(x - innerX, y + size);
  ctx.closePath();
};

const drawNodePort = (
  ctx: CanvasRenderingContext2D,
  anchor: NodeCanvasPortAnchor
) => {
  const kindStyle = PORT_KIND_STYLE[anchor.port.kind];
  const shape = resolvePortShape(anchor.port);
  const role = anchor.port.role;
  const isInput = role === 'in';
  const baseRadius = anchor.visualRadius;

  if (anchor.port.multiplicity === 'multi') {
    drawPortShapePath(ctx, shape, anchor.x, anchor.y, baseRadius + 2.4, role);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = kindStyle.halo;
    ctx.stroke();
  }

  drawPortShapePath(ctx, shape, anchor.x, anchor.y, baseRadius, role);
  ctx.fillStyle = isInput ? '#ffffff' : kindStyle.fill;
  ctx.strokeStyle = kindStyle.stroke;
  ctx.lineWidth = isInput ? 1.7 : 1.45;
  ctx.fill();
  ctx.stroke();
};

const resolveCenteredBaselineY = (
  ctx: CanvasRenderingContext2D,
  centerY: number,
  fallbackFontSize: number
) => {
  const metrics = ctx.measureText('Mg');
  if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
    return (
      centerY +
      (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
    );
  }
  return centerY + fallbackFontSize * 0.34;
};

const resolveHeaderPortY = (
  rect: NodeCanvasRect,
  slotIndex: number,
  slotCount: number
) => {
  const centerY = rect.y + NODE_HEADER_HEIGHT / 2;
  if (slotCount <= 1) return centerY;
  const offset = (slotIndex - (slotCount - 1) / 2) * 10;
  return centerY + offset;
};

const DEFAULT_PORTS_BY_TYPE: Record<string, NodeGraphPort[]> = {
  start: [
    {
      id: 'out.next',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'triangle',
    },
  ],
  end: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
  ],
  'if-else': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'out.true',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'condition',
      multiplicity: 'single',
      shape: 'diamond',
    },
    {
      id: 'out.false',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'condition',
      multiplicity: 'single',
      shape: 'diamond',
    },
  ],
  switch: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'in.value',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'data',
      acceptsKinds: ['data'],
      multiplicity: 'single',
      shape: 'square',
    },
    {
      id: 'out.case-0',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'condition',
      multiplicity: 'multi',
      shape: 'diamond',
    },
    {
      id: 'out.default',
      role: 'out',
      side: 'right',
      slotOrder: 999,
      kind: 'condition',
      multiplicity: 'multi',
      shape: 'diamond',
    },
  ],
  'for-each': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'in.items',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'data',
      acceptsKinds: ['data'],
      multiplicity: 'single',
      shape: 'square',
    },
    {
      id: 'out.loop',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'triangle',
    },
    {
      id: 'out.done',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
      shape: 'square',
    },
  ],
  while: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'in.condition',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'condition',
      acceptsKinds: ['condition', 'data'],
      multiplicity: 'single',
      shape: 'diamond',
    },
    {
      id: 'out.loop',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'condition',
      multiplicity: 'single',
      shape: 'diamond',
    },
    {
      id: 'out.done',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
      shape: 'square',
    },
  ],
  break: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'out.break',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'square',
    },
  ],
  continue: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'out.continue',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'square',
    },
  ],
  merge: [
    {
      id: 'in.in0',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'circle',
    },
    {
      id: 'in.in1',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'circle',
    },
    {
      id: 'out.next',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'triangle',
    },
  ],
  'parallel-fork': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'circle',
    },
    {
      id: 'out.branch-0',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'triangle',
    },
    {
      id: 'out.branch-1',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'triangle',
    },
  ],
  join: [
    {
      id: 'in.in0',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'circle',
    },
    {
      id: 'in.in1',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'multi',
      shape: 'circle',
    },
    {
      id: 'out.next',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
      shape: 'triangle',
    },
  ],
};

const sortPorts = (ports: NodeGraphPort[]) =>
  [...ports].sort((left, right) => left.slotOrder - right.slotOrder);

export const resolveNodePorts = (node: NodeGraphNode): NodeGraphPort[] => {
  if (node.ports?.length) return sortPorts(node.ports);
  return sortPorts(DEFAULT_PORTS_BY_TYPE[node.type] ?? []);
};

export const resolveNodeDefaultPorts = (
  nodeType: NodeGraphNodeType
): NodeGraphPort[] => sortPorts(DEFAULT_PORTS_BY_TYPE[nodeType] ?? []);

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  rect: NodeCanvasRect,
  radius: number
) => {
  const boundedRadius = Math.max(
    0,
    Math.min(radius, rect.width / 2, rect.height / 2)
  );
  ctx.beginPath();
  ctx.moveTo(rect.x + boundedRadius, rect.y);
  ctx.lineTo(rect.x + rect.width - boundedRadius, rect.y);
  ctx.arcTo(
    rect.x + rect.width,
    rect.y,
    rect.x + rect.width,
    rect.y + boundedRadius,
    boundedRadius
  );
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - boundedRadius);
  ctx.arcTo(
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + rect.width - boundedRadius,
    rect.y + rect.height,
    boundedRadius
  );
  ctx.lineTo(rect.x + boundedRadius, rect.y + rect.height);
  ctx.arcTo(
    rect.x,
    rect.y + rect.height,
    rect.x,
    rect.y + rect.height - boundedRadius,
    boundedRadius
  );
  ctx.lineTo(rect.x, rect.y + boundedRadius);
  ctx.arcTo(rect.x, rect.y, rect.x + boundedRadius, rect.y, boundedRadius);
  ctx.closePath();
};

const isPointInRect = (point: NodeCanvasPoint, rect: NodeCanvasRect) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

export const getNodePortAnchors = (
  node: NodeGraphNode,
  rect: NodeCanvasRect
): NodeCanvasPortAnchor[] => {
  const ports = resolveNodePorts(node);
  const leftPorts = ports.filter((port) => port.side === 'left');
  const rightPorts = ports.filter((port) => port.side === 'right');

  const anchors: NodeCanvasPortAnchor[] = [];
  leftPorts.forEach((port, index) => {
    const visualRadius = resolvePortVisualRadius(port);
    anchors.push({
      port,
      x: rect.x + NODE_LEFT_GUTTER / 2,
      y: resolveHeaderPortY(rect, index, leftPorts.length),
      visualRadius,
      hitRadius: PORT_HIT_RADIUS + (port.multiplicity === 'multi' ? 2 : 0),
    });
  });
  rightPorts.forEach((port, index) => {
    const visualRadius = resolvePortVisualRadius(port);
    anchors.push({
      port,
      x: rect.x + rect.width - NODE_RIGHT_GUTTER / 2,
      y: resolveNodePortAnchorY(rect, index, rightPorts.length),
      visualRadius,
      hitRadius: PORT_HIT_RADIUS + (port.multiplicity === 'multi' ? 2 : 0),
    });
  });
  return anchors;
};

const defaultMeasure: NodeCanvasRenderDefinition['measure'] = (
  node,
  measureText
) => {
  const compact = isCompactNodeType(node.type);
  const lines = getNodeLayoutLines(node);
  const title = node.title?.trim() || node.id || node.type;
  const hasInputPort = resolveNodePorts(node).some(
    (port) => port.role === 'in'
  );
  const icon = resolveNodeIcon(node.type);
  const bodyLines = compact
    ? []
    : ([lines[0]?.text, ...lines.slice(2).map((line) => line.text)].filter(
        Boolean
      ) as string[]);
  const widest = [title, ...bodyLines].reduce((maxWidth, text, index) => {
    const width = measureText(text, index === 0 ? TITLE_FONT : BODY_FONT);
    return Math.max(maxWidth, width);
  }, 0);
  const iconExtraWidth = compact && icon && hasInputPort ? 16 : 0;
  const width = NODE_LEFT_GUTTER + widest + iconExtraWidth + NODE_RIGHT_GUTTER;
  const height = compact
    ? NODE_HEADER_HEIGHT
    : NODE_HEADER_HEIGHT + bodyLines.length * NODE_BODY_ROW_HEIGHT;
  return { width: Math.ceil(width), height: Math.ceil(height) };
};

const defaultDraw: NodeCanvasRenderDefinition['draw'] = (
  node,
  rect,
  state,
  ctx
) => {
  const compact = isCompactNodeType(node.type);
  const lines = getNodeLayoutLines(node);
  const title = compact
    ? toNodeLabel(node.type)
    : node.title?.trim() || node.id || node.type;
  const bodyLines = [
    lines[0]?.text,
    ...lines.slice(2).map((line) => line.text),
  ].filter(Boolean) as string[];
  const icon = resolveNodeIcon(node.type);
  const hasInputPort = resolveNodePorts(node).some(
    (port) => port.role === 'in'
  );
  const iconColor = resolveNodeIconColor(node.type);

  ctx.save();
  drawRoundedRect(ctx, rect, NODE_RADIUS);
  ctx.shadowColor = state.selected
    ? 'rgba(30, 41, 59, 0.22)'
    : 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = state.selected ? 16 : 12;
  ctx.shadowOffsetY = state.selected ? 6 : 4;
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.font = composeFontDeclaration(TITLE_FONT);
  ctx.textBaseline = 'alphabetic';

  const textX = rect.x + NODE_LEFT_GUTTER;
  const headerCenterY = rect.y + NODE_HEADER_HEIGHT / 2;
  const titleBaselineY = resolveCenteredBaselineY(
    ctx,
    headerCenterY,
    TITLE_FONT.fontSize
  );
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.fillText(
    title,
    textX,
    titleBaselineY + NODE_CANVAS_VISUAL_TOKENS.titleYOffset
  );

  if (icon) {
    const titleFont = composeFontDeclaration(TITLE_FONT);
    ctx.font = titleFont;
    ctx.fillStyle = iconColor;
    ctx.textBaseline = 'middle';
    if (!hasInputPort) {
      ctx.textAlign = 'center';
      ctx.fillText(
        icon,
        rect.x + NODE_LEFT_GUTTER / 2,
        headerCenterY + NODE_CANVAS_VISUAL_TOKENS.iconYOffset
      );
    } else {
      const titleWidth = ctx.measureText(title).width;
      ctx.textAlign = 'left';
      ctx.fillText(
        icon,
        textX + titleWidth + 6,
        headerCenterY + NODE_CANVAS_VISUAL_TOKENS.iconYOffset
      );
    }
    ctx.font = titleFont;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  if (!compact) {
    ctx.font = composeFontDeclaration(BODY_FONT);
    bodyLines.forEach((line, index) => {
      const centerY =
        rect.y +
        NODE_HEADER_HEIGHT +
        index * NODE_BODY_ROW_HEIGHT +
        NODE_BODY_ROW_HEIGHT / 2;
      const baselineY = resolveCenteredBaselineY(
        ctx,
        centerY,
        BODY_FONT.fontSize
      );
      ctx.fillStyle = index === 0 ? '#374151' : '#6b7280';
      ctx.fillText(line, textX, baselineY);
    });
  }

  const anchors = getNodePortAnchors(node, rect);
  anchors.forEach((anchor) => {
    drawNodePort(ctx, anchor);
  });
  ctx.restore();
};

const defaultHitTest: NodeCanvasRenderDefinition['hitTest'] = (
  node,
  rect,
  point
) => {
  const anchors = getNodePortAnchors(node, rect);
  const hitPort = anchors.find((anchor) => {
    const dx = point.x - anchor.x;
    const dy = point.y - anchor.y;
    return dx * dx + dy * dy <= anchor.hitRadius * anchor.hitRadius;
  });
  if (hitPort) return { target: 'port', portId: hitPort.port.id };
  if (!isPointInRect(point, rect)) return null;
  if (point.y <= rect.y + HEADER_HIT_HEIGHT) return { target: 'header' };
  return { target: 'body' };
};

const createDefaultRenderDefinition = (
  type: NodeGraphNodeType
): NodeCanvasRenderDefinition => ({
  type,
  measure: defaultMeasure,
  draw: defaultDraw,
  ports: resolveNodePorts,
  hitTest: defaultHitTest,
});

export const BUILTIN_NODE_RENDERERS: NodeCanvasRendererRegistry = {
  start: createDefaultRenderDefinition('start'),
  end: createDefaultRenderDefinition('end'),
  'if-else': createDefaultRenderDefinition('if-else'),
  switch: createDefaultRenderDefinition('switch'),
  'for-each': createDefaultRenderDefinition('for-each'),
  while: createDefaultRenderDefinition('while'),
  break: createDefaultRenderDefinition('break'),
  continue: createDefaultRenderDefinition('continue'),
  merge: createDefaultRenderDefinition('merge'),
  'parallel-fork': createDefaultRenderDefinition('parallel-fork'),
  join: createDefaultRenderDefinition('join'),
};

export const FALLBACK_NODE_RENDERER = createDefaultRenderDefinition('merge');

export const createNodeRendererRegistry = (
  overrides: NodeCanvasRendererRegistry = {}
): NodeCanvasRendererRegistry => ({
  ...BUILTIN_NODE_RENDERERS,
  ...overrides,
});

export const getNodeRenderer = (
  nodeType: NodeGraphNodeType,
  registry: NodeCanvasRendererRegistry
): NodeCanvasRenderDefinition => registry[nodeType] ?? FALLBACK_NODE_RENDERER;
