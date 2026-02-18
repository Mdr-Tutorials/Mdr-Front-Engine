export type {
  NodeGraphEdge,
  NodeGraphEdgeKind,
  NodeGraphModel,
  NodeGraphModelDraft,
  NodeGraphNode,
  NodeGraphNodeType,
  NodeGraphPort,
  NodeGraphPortKind,
  NodeGraphPortMultiplicity,
  NodeGraphPortRole,
  NodeGraphPortShape,
  NodeGraphPortSide,
  NodeGraphPosition,
  NodeGraphSize,
} from './types';

export {
  BUILTIN_NODE_RENDERERS,
  FALLBACK_NODE_RENDERER,
  createNodeCanvasTextMeasureCache,
  createNodeRendererRegistry,
  getNodePortAnchors,
  getNodeRenderer,
  resolveNodeDefaultPorts,
  resolveNodePorts,
} from './canvas/renderer';

export type {
  NodeCanvasHitResult,
  NodeCanvasPoint,
  NodeCanvasPortAnchor,
  NodeCanvasRect,
  NodeCanvasRenderDefinition,
  NodeCanvasRendererRegistry,
  NodeCanvasRenderState,
  NodeCanvasTextMeasureCache,
  NodeCanvasTextMeasurer,
  NodeCanvasTextStyle,
} from './canvas/renderer';

export type {
  NodeCanvasBezierPath,
  NodeCanvasEdgeDrawOptions,
  NodeCanvasPolylinePath,
} from './canvas/edges';

export {
  drawNodeCanvasEdge,
  drawNodeCanvasRoutedEdge,
  isPointNearNodeCanvasEdge,
  isPointNearNodeCanvasPolyline,
  resolveNodeCanvasEdgePath,
} from './canvas/edges';

export { NODE_CANVAS_VISUAL_TOKENS } from './canvas/tokens';

export type { NodeCanvasVisualTokens } from './canvas/tokens';

export { routeNodeCanvasMagneticPath } from './canvas/route';

export type {
  NodeCanvasRouteInput,
  NodeCanvasRouteOptions,
} from './canvas/route';

export {
  DEFAULT_NODE_LAYOUT_TEXT_STYLE,
  DEFAULT_NODE_PORT_ANCHOR_LAYOUT_OPTIONS,
  DEFAULT_NODE_VERTICAL_LAYOUT_OPTIONS,
  getNodeLayoutLines,
  measureNodeVerticalLayout,
  resolveNodeLineTop,
  resolveNodePortAnchorY,
} from './layout/verticalLayout';

export type {
  NodeLayoutLine,
  NodeLayoutLineKind,
  NodeLayoutTextMeasurer,
  NodeLayoutTextStyle,
  NodePortAnchorLayoutOptions,
  NodeVerticalLayoutOptions,
  NodeVerticalLayoutResult,
} from './layout/verticalLayout';

export {
  createPortAnchorIndex,
  hitTestPortAnchor,
  pickNearestPortAnchor,
  resolvePortSnapTarget,
} from './ports/portsRenderer';

export type {
  NodePortAnchorQuery,
  NodePortHitResult,
  NodePortHitTestOptions,
} from './ports/portsRenderer';

export {
  createNodeGraphInteractionState,
  reduceNodeGraphInteraction,
} from './interaction/interaction';

export type {
  NodeGraphConnectionDraft,
  NodeGraphHitTarget,
  NodeGraphInteractionAction,
  NodeGraphInteractionEvent,
  NodeGraphInteractionMode,
  NodeGraphInteractionResult,
  NodeGraphInteractionState,
} from './interaction/interaction';

export {
  addNodeAndConnectNext,
  createDefaultNodeGraphModel,
  createNodeGraphNode,
  findNodeById,
  findPortByRole,
  normalizeNodeGraphModel,
  removeEdgeById,
  upsertEdge,
} from './states/graphState';
