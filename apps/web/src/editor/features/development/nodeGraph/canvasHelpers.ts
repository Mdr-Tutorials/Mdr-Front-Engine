import {
  createNodeRendererRegistry,
  getNodePortAnchors,
  getNodeRenderer,
  type NodeCanvasPoint,
  type NodeCanvasPortAnchor,
  type NodeCanvasTextMeasureCache,
  type NodeGraphModel,
  type NodeGraphNode,
} from '../node';
import type { NodeRenderCache } from './types';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const toPortAnchorKey = (nodeId: string, portId: string) =>
  `${nodeId}::${portId}`;

export const toWorldPoint = (
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  pan: { x: number; y: number },
  zoom: number
): NodeCanvasPoint => ({
  x: (clientX - containerRect.left - pan.x) / zoom,
  y: (clientY - containerRect.top - pan.y) / zoom,
});

export const toViewportPoint = (
  clientX: number,
  clientY: number,
  containerRect: DOMRect
): NodeCanvasPoint => ({
  x: clientX - containerRect.left,
  y: clientY - containerRect.top,
});

export const buildNodeRenderCache = (
  nodes: NodeGraphNode[],
  textMeasurer: NodeCanvasTextMeasureCache['measure']
): NodeRenderCache => {
  const registry = createNodeRendererRegistry();
  const rectByNodeId: NodeRenderCache['rectByNodeId'] = {};
  const anchorByNodePort: NodeRenderCache['anchorByNodePort'] = {};

  nodes.forEach((node) => {
    const renderer = getNodeRenderer(node.type, registry);
    const measured = renderer.measure(node, textMeasurer);
    const rect = {
      x: node.position.x,
      y: node.position.y,
      width: node.size?.width ?? measured.width,
      height: node.size?.height ?? measured.height,
    };
    rectByNodeId[node.id] = rect;

    const anchors = getNodePortAnchors(node, rect);
    anchors.forEach((anchor) => {
      anchorByNodePort[toPortAnchorKey(node.id, anchor.port.id)] = anchor;
    });
  });

  return { rectByNodeId, anchorByNodePort };
};

export const isNear = (
  left: NodeCanvasPoint,
  right: NodeCanvasPoint | NodeCanvasPortAnchor,
  radius: number
) => Math.hypot(left.x - right.x, left.y - right.y) <= radius;

export const moveNodeByDelta = (
  model: NodeGraphModel,
  nodeId: string,
  delta: NodeCanvasPoint
): NodeGraphModel => ({
  ...model,
  nodes: model.nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          position: {
            x: node.position.x + delta.x,
            y: node.position.y + delta.y,
          },
        }
      : node
  ),
});

export const resolveBorderPoint = (
  anchor: NodeCanvasPortAnchor,
  rect: { x: number; width: number }
): NodeCanvasPoint => ({
  x: anchor.port.side === 'left' ? rect.x : rect.x + rect.width,
  y: anchor.y,
});

export const resolveOutsidePoint = (
  anchor: NodeCanvasPortAnchor,
  borderPoint: NodeCanvasPoint,
  edgeExitOffset: number
): NodeCanvasPoint => ({
  x:
    anchor.port.side === 'left'
      ? borderPoint.x - edgeExitOffset
      : borderPoint.x + edgeExitOffset,
  y: borderPoint.y,
});
