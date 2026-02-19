import type {
  NodeGraphNode,
  NodeGraphPort,
  NodeGraphPortKind,
  NodeGraphPortShape,
  NodeGraphNodeType,
} from '../types';
import {
  createDefaultSwitchNodeConfig,
  normalizeSwitchNodeConfig,
  resolveSwitchNodePorts,
} from '../switchNode';
import { getNodeLayoutLines } from '../layout/verticalLayout';
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

export type NodeCanvasSwitchControlAction =
  | 'add-case'
  | 'remove-case'
  | 'toggle-collapse';

export type NodeCanvasSwitchControlHit = {
  action: NodeCanvasSwitchControlAction;
  disabled: boolean;
  caseId?: string;
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
const PORT_SLOT_MIN_GAP = PORT_VISUAL_RADIUS * 2 + 8;
const NODE_RADIUS = 12;
const NODE_LEFT_GUTTER = 36;
const NODE_RIGHT_GUTTER = 36;
const NODE_HEADER_HEIGHT = 36;
const NODE_BODY_ROW_HEIGHT = 28;
const SWITCH_CONTROL_SIZE = 16;
const SWITCH_CONTROL_GAP = 8;
const SWITCH_CONTROL_EDGE_INSET = 10;
const SWITCH_CONTROL_TOP_INSET = (NODE_HEADER_HEIGHT - SWITCH_CONTROL_SIZE) / 2;
const SWITCH_HEADER_CONTROL_COUNT = 2;
const SWITCH_HEADER_CONTROL_BLOCK_WIDTH =
  SWITCH_HEADER_CONTROL_COUNT * SWITCH_CONTROL_SIZE +
  (SWITCH_HEADER_CONTROL_COUNT - 1) * SWITCH_CONTROL_GAP;
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
  { stroke: string; fill: string }
> = {
  control: { stroke: '#334155', fill: '#334155' },
  data: { stroke: '#334155', fill: '#334155' },
  node: { stroke: '#334155', fill: '#334155' },
};
const MULTI_PORT_RING_STROKE = '#94a3b8';

const resolvePortShape = (port: NodeGraphPort): NodeGraphPortShape => {
  if (port.shape) return port.shape;
  if (port.kind === 'data') return 'square';
  if (port.kind === 'node') return 'diamond';
  return 'circle';
};

const resolvePortVisualRadius = (port: NodeGraphPort) =>
  PORT_VISUAL_RADIUS + (port.multiplicity === 'multi' ? 1 : 0);

const drawPortShapePath = (
  ctx: CanvasRenderingContext2D,
  shape: NodeGraphPortShape,
  x: number,
  y: number,
  size: number
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
  }
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
    drawPortShapePath(ctx, shape, anchor.x, anchor.y, baseRadius + 2.3);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = MULTI_PORT_RING_STROKE;
    ctx.stroke();
  }

  drawPortShapePath(ctx, shape, anchor.x, anchor.y, baseRadius);
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
  if (slotCount <= 1) return rect.y + NODE_HEADER_HEIGHT / 2;
  const top = rect.y + NODE_HEADER_HEIGHT / 2;
  const bottom = rect.y + rect.height - NODE_HEADER_HEIGHT / 2;
  const ratio = slotIndex / Math.max(1, slotCount - 1);
  return top + (bottom - top) * ratio;
};

const resolveSwitchControlRects = (rect: NodeCanvasRect, collapsed = false) => {
  const y = rect.y + SWITCH_CONTROL_TOP_INSET;
  const collapsedShift = collapsed ? NODE_RIGHT_GUTTER + SWITCH_CONTROL_GAP : 0;
  const foldX =
    rect.x +
    rect.width -
    SWITCH_CONTROL_EDGE_INSET -
    SWITCH_CONTROL_SIZE -
    collapsedShift;
  const addX = foldX - SWITCH_CONTROL_GAP - SWITCH_CONTROL_SIZE;
  return {
    fold: {
      x: foldX,
      y,
      width: SWITCH_CONTROL_SIZE,
      height: SWITCH_CONTROL_SIZE,
    },
    add: {
      x: addX,
      y,
      width: SWITCH_CONTROL_SIZE,
      height: SWITCH_CONTROL_SIZE,
    },
  };
};

const resolveSwitchRowCenterY = (rect: NodeCanvasRect, rowIndex: number) =>
  rect.y +
  NODE_HEADER_HEIGHT +
  rowIndex * NODE_BODY_ROW_HEIGHT +
  NODE_BODY_ROW_HEIGHT / 2;

const resolveSwitchCaseRemoveControlRect = (
  rect: NodeCanvasRect,
  caseRowIndex: number
) => ({
  x:
    rect.x +
    rect.width -
    SWITCH_CONTROL_EDGE_INSET -
    SWITCH_CONTROL_SIZE * 2 -
    SWITCH_CONTROL_GAP,
  y: resolveSwitchRowCenterY(rect, caseRowIndex) - SWITCH_CONTROL_SIZE / 2,
  width: SWITCH_CONTROL_SIZE,
  height: SWITCH_CONTROL_SIZE,
});

const resolveSwitchPortCenterY = (
  node: NodeGraphNode,
  rect: NodeCanvasRect,
  port: NodeGraphPort
) => {
  const config = normalizeSwitchNodeConfig(node.config, node.ports);
  if (config.collapsed) {
    return rect.y + NODE_HEADER_HEIGHT / 2;
  }
  if (port.id === 'in.prev') return rect.y + NODE_HEADER_HEIGHT / 2;
  if (port.id === 'in.value') return resolveSwitchRowCenterY(rect, 0);
  if (port.id === 'out.default') {
    return resolveSwitchRowCenterY(rect, config.cases.length + 1);
  }
  if (port.id.startsWith('in.case-')) {
    const caseId = port.id.slice(3);
    const caseIndex = config.cases.findIndex((item) => item.id === caseId);
    return resolveSwitchRowCenterY(
      rect,
      caseIndex >= 0 ? caseIndex + 1 : config.cases.length + 1
    );
  }
  if (port.id.startsWith('out.case-')) {
    const caseId = port.id.slice(4);
    const caseIndex = config.cases.findIndex((item) => item.id === caseId);
    return resolveSwitchRowCenterY(
      rect,
      caseIndex >= 0 ? caseIndex + 1 : config.cases.length + 1
    );
  }
  return rect.y + NODE_HEADER_HEIGHT / 2;
};

const resolveSwitchVisiblePorts = (
  ports: NodeGraphPort[],
  collapsed: boolean
) => {
  if (!collapsed) return ports;
  return ports.filter(
    (port) => port.id === 'in.prev' || port.id === 'out.default'
  );
};

const isPointInControlRect = (
  point: NodeCanvasPoint,
  rect: { x: number; y: number; width: number; height: number }
) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

export const hitTestSwitchControl = (
  node: NodeGraphNode,
  rect: NodeCanvasRect,
  point: NodeCanvasPoint
): NodeCanvasSwitchControlHit | null => {
  if (node.type !== 'switch') return null;
  const switchConfig = normalizeSwitchNodeConfig(node.config, node.ports);
  const controls = resolveSwitchControlRects(rect, switchConfig.collapsed);
  if (isPointInControlRect(point, controls.fold)) {
    return { action: 'toggle-collapse', disabled: false };
  }
  if (isPointInControlRect(point, controls.add)) {
    return { action: 'add-case', disabled: false };
  }
  if (switchConfig.collapsed) return null;
  for (
    let caseIndex = 0;
    caseIndex < switchConfig.cases.length;
    caseIndex += 1
  ) {
    const rowIndex = caseIndex + 1;
    const removeRect = resolveSwitchCaseRemoveControlRect(rect, rowIndex);
    if (isPointInControlRect(point, removeRect)) {
      return {
        action: 'remove-case',
        disabled: false,
        caseId: switchConfig.cases[caseIndex]?.id,
      };
    }
  }
  return null;
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
    },
  ],
  end: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
  ],
  'if-else': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.true',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
    {
      id: 'out.false',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
  switch: [...resolveSwitchNodePorts(createDefaultSwitchNodeConfig())],
  'for-each': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'in.items',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'data',
      acceptsKinds: ['data'],
      multiplicity: 'single',
    },
    {
      id: 'out.loop',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
    {
      id: 'out.done',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
  while: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.loop',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
    {
      id: 'out.done',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
  break: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.break',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
  continue: [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.continue',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
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
    },
    {
      id: 'in.in1',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.next',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
  'parallel-fork': [
    {
      id: 'in.prev',
      role: 'in',
      side: 'left',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.branch-0',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
    {
      id: 'out.branch-1',
      role: 'out',
      side: 'right',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'single',
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
    },
    {
      id: 'in.in1',
      role: 'in',
      side: 'left',
      slotOrder: 1,
      kind: 'control',
      multiplicity: 'multi',
    },
    {
      id: 'out.next',
      role: 'out',
      side: 'right',
      slotOrder: 0,
      kind: 'control',
      multiplicity: 'single',
    },
  ],
};

const sortPorts = (ports: NodeGraphPort[]) =>
  [...ports].sort((left, right) => {
    if (left.slotOrder !== right.slotOrder) {
      return left.slotOrder - right.slotOrder;
    }
    return left.id.localeCompare(right.id);
  });

export const resolveNodePorts = (node: NodeGraphNode): NodeGraphPort[] => {
  if (node.type === 'switch') {
    return sortPorts(
      resolveSwitchNodePorts(normalizeSwitchNodeConfig(node.config))
    );
  }
  if (node.ports?.length) return sortPorts(node.ports);
  return sortPorts(DEFAULT_PORTS_BY_TYPE[node.type] ?? []);
};

export const resolveNodeDefaultPorts = (
  nodeType: NodeGraphNodeType,
  config?: unknown
): NodeGraphPort[] => {
  if (nodeType === 'switch') {
    return sortPorts(resolveSwitchNodePorts(normalizeSwitchNodeConfig(config)));
  }
  return sortPorts(DEFAULT_PORTS_BY_TYPE[nodeType] ?? []);
};

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
  const switchConfig =
    node.type === 'switch'
      ? normalizeSwitchNodeConfig(node.config, node.ports)
      : null;
  const anchorPorts =
    node.type === 'switch'
      ? resolveSwitchVisiblePorts(ports, Boolean(switchConfig?.collapsed))
      : ports;
  const leftPorts = anchorPorts.filter((port) => port.side === 'left');
  const rightPorts = anchorPorts.filter((port) => port.side === 'right');

  const anchors: NodeCanvasPortAnchor[] = [];
  leftPorts.forEach((port, index) => {
    const visualRadius = resolvePortVisualRadius(port);
    anchors.push({
      port,
      x: rect.x + NODE_LEFT_GUTTER / 2,
      y:
        node.type === 'switch'
          ? resolveSwitchPortCenterY(node, rect, port)
          : resolveHeaderPortY(rect, index, leftPorts.length),
      visualRadius,
      hitRadius: PORT_HIT_RADIUS + (port.multiplicity === 'multi' ? 2 : 0),
    });
  });
  rightPorts.forEach((port, index) => {
    const visualRadius = resolvePortVisualRadius(port);
    anchors.push({
      port,
      x: rect.x + rect.width - NODE_RIGHT_GUTTER / 2,
      y:
        node.type === 'switch'
          ? resolveSwitchPortCenterY(node, rect, port)
          : resolveHeaderPortY(rect, index, rightPorts.length),
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
  const ports = resolveNodePorts(node);
  const switchConfig =
    node.type === 'switch' ? normalizeSwitchNodeConfig(node.config) : null;
  const layoutPorts =
    node.type === 'switch'
      ? resolveSwitchVisiblePorts(ports, Boolean(switchConfig?.collapsed))
      : ports;
  const title = node.title?.trim() || node.type;
  const hasInputPort = layoutPorts.some((port) => port.role === 'in');
  const icon = resolveNodeIcon(node.type);
  const leftPortCount = layoutPorts.filter(
    (port) => port.side === 'left'
  ).length;
  const rightPortCount = layoutPorts.filter(
    (port) => port.side === 'right'
  ).length;
  const maxSidePortCount = Math.max(leftPortCount, rightPortCount, 1);
  const bodyLines = compact
    ? []
    : (lines
        .slice(2)
        .map((line) => line.text)
        .filter(Boolean) as string[]);
  const switchLines =
    switchConfig?.cases.map((item, index) =>
      item.value.trim()
        ? `branch ${index + 1}: ${item.value}`
        : `branch ${index + 1}`
    ) ?? [];
  if (switchConfig) {
    switchLines.unshift('switch value');
    switchLines.push('default');
  }
  const widest = [title, ...bodyLines].reduce((maxWidth, text, index) => {
    const width = measureText(text, index === 0 ? TITLE_FONT : BODY_FONT);
    return Math.max(maxWidth, width);
  }, 0);
  const widestSwitchLine = switchLines.reduce((maxWidth, line) => {
    const width = measureText(line, BODY_FONT);
    return Math.max(maxWidth, width);
  }, 0);
  const iconExtraWidth = compact && icon && hasInputPort ? 16 : 0;
  const headerReserveWidth =
    node.type === 'switch' ? SWITCH_HEADER_CONTROL_BLOCK_WIDTH + 10 : 0;
  const switchRowControlReserve =
    node.type === 'switch' ? SWITCH_CONTROL_SIZE + 14 : 0;
  const contentWidth = Math.max(widest + headerReserveWidth, widestSwitchLine);
  const width =
    NODE_LEFT_GUTTER +
    contentWidth +
    switchRowControlReserve +
    iconExtraWidth +
    NODE_RIGHT_GUTTER;
  const contentHeight =
    node.type === 'switch'
      ? NODE_HEADER_HEIGHT +
        NODE_BODY_ROW_HEIGHT *
          (switchConfig && !switchConfig.collapsed
            ? switchConfig.cases.length + 2
            : 0)
      : compact
        ? NODE_HEADER_HEIGHT
        : NODE_HEADER_HEIGHT + bodyLines.length * NODE_BODY_ROW_HEIGHT;
  const minPortHeight =
    NODE_HEADER_HEIGHT + (maxSidePortCount - 1) * PORT_SLOT_MIN_GAP;
  const height = Math.max(contentHeight, minPortHeight);
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
    : node.title?.trim() || node.type;
  const bodyLines = lines
    .slice(2)
    .map((line) => line.text)
    .filter(Boolean) as string[];
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

  if (!compact && node.type === 'switch') {
    const switchConfig = normalizeSwitchNodeConfig(node.config, node.ports);
    const ports = resolveNodePorts(node);
    const inPorts = ports
      .filter((port) => port.side === 'left')
      .sort((left, right) => left.slotOrder - right.slotOrder);
    const outPorts = ports
      .filter((port) => port.side === 'right')
      .sort((left, right) => left.slotOrder - right.slotOrder);
    const inIndexByPortId = new Map(
      inPorts.map((port, index) => [port.id, index])
    );
    const outIndexByPortId = new Map(
      outPorts.map((port, index) => [port.id, index])
    );

    ctx.font = composeFontDeclaration(BODY_FONT);
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'left';
    const drawAlignedLabel = (
      label: string,
      centerY: number,
      active = false
    ) => {
      const baselineY = resolveCenteredBaselineY(
        ctx,
        centerY,
        BODY_FONT.fontSize
      );
      ctx.fillStyle = active ? '#374151' : '#6b7280';
      ctx.fillText(
        label,
        textX,
        baselineY + NODE_CANVAS_VISUAL_TOKENS.bodyYOffset
      );
    };
    const controls = resolveSwitchControlRects(rect, switchConfig.collapsed);
    const drawControlIcon = (
      controlRect: { x: number; y: number; width: number; height: number },
      sign: '+' | '-',
      disabled = false
    ) => {
      const centerX = controlRect.x + controlRect.width / 2;
      const centerY = controlRect.y + controlRect.height / 2;
      ctx.strokeStyle = disabled ? '#d1d5db' : '#475569';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX - 4.8, centerY);
      ctx.lineTo(centerX + 4.8, centerY);
      if (sign === '+') {
        ctx.moveTo(centerX, centerY - 4.8);
        ctx.lineTo(centerX, centerY + 4.8);
      }
      ctx.stroke();
    };
    const drawChevronIcon = (
      controlRect: { x: number; y: number; width: number; height: number },
      collapsed: boolean
    ) => {
      const centerX = controlRect.x + controlRect.width / 2;
      const centerY = controlRect.y + controlRect.height / 2;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (collapsed) {
        ctx.moveTo(centerX - 3.8, centerY - 2.2);
        ctx.lineTo(centerX, centerY + 2.2);
        ctx.lineTo(centerX + 3.8, centerY - 2.2);
      } else {
        ctx.moveTo(centerX - 3.8, centerY + 1.8);
        ctx.lineTo(centerX, centerY - 2.2);
        ctx.lineTo(centerX + 3.8, centerY + 1.8);
      }
      ctx.stroke();
    };
    drawControlIcon(controls.add, '+');
    drawChevronIcon(controls.fold, switchConfig.collapsed);
    if (switchConfig.collapsed) {
      const anchors = getNodePortAnchors(node, rect);
      anchors.forEach((anchor) => {
        drawNodePort(ctx, anchor);
      });
      ctx.restore();
      return;
    }
    const inValueIndex = inIndexByPortId.get('in.value');
    if (inValueIndex !== undefined) {
      drawAlignedLabel(
        'switch value',
        resolveSwitchPortCenterY(node, rect, inPorts[inValueIndex]),
        true
      );
    }
    switchConfig.cases.forEach((item, index) => {
      const caseInputId = `in.${item.id}`;
      const caseOutputId = `out.${item.id}`;
      const inIndex = inIndexByPortId.get(caseInputId);
      const outIndex = outIndexByPortId.get(caseOutputId);
      const centerY =
        inIndex !== undefined
          ? resolveSwitchPortCenterY(node, rect, inPorts[inIndex])
          : outIndex !== undefined
            ? resolveSwitchPortCenterY(node, rect, outPorts[outIndex])
            : rect.y + NODE_HEADER_HEIGHT;
      const label = item.value.trim()
        ? `branch ${index + 1}: ${item.value}`
        : `branch ${index + 1}`;
      drawAlignedLabel(label, centerY);
      const removeControlRect = resolveSwitchCaseRemoveControlRect(
        rect,
        index + 1
      );
      drawControlIcon(removeControlRect, '-');
    });
    const defaultOutIndex = outIndexByPortId.get('out.default');
    if (defaultOutIndex !== undefined) {
      drawAlignedLabel(
        'default',
        resolveSwitchPortCenterY(node, rect, outPorts[defaultOutIndex])
      );
    }
  } else if (!compact) {
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
