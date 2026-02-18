import type { NodeCanvasPoint, NodeCanvasPortAnchor } from '../canvas/renderer';
import type { NodeGraphPortRole, NodeGraphPortSide } from '../types';

export type NodePortAnchorQuery = {
  role?: NodeGraphPortRole;
  side?: NodeGraphPortSide;
};

export type NodePortHitTestOptions = NodePortAnchorQuery & {
  maxDistance?: number;
};

export type NodePortHitResult = {
  anchor: NodeCanvasPortAnchor;
  distance: number;
};

const toDistance = (point: NodeCanvasPoint, anchor: NodeCanvasPortAnchor) => {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const filterAnchors = (
  anchors: NodeCanvasPortAnchor[],
  query: NodePortAnchorQuery
) =>
  anchors.filter((anchor) => {
    if (query.role && anchor.port.role !== query.role) return false;
    if (query.side && anchor.port.side !== query.side) return false;
    return true;
  });

const sortByDistanceAndSlot = (
  point: NodeCanvasPoint,
  anchors: NodeCanvasPortAnchor[]
) =>
  [...anchors].sort((left, right) => {
    const leftDistance = toDistance(point, left);
    const rightDistance = toDistance(point, right);
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    if (left.port.slotOrder !== right.port.slotOrder)
      return left.port.slotOrder - right.port.slotOrder;
    return left.port.id.localeCompare(right.port.id);
  });

export const pickNearestPortAnchor = (
  point: NodeCanvasPoint,
  anchors: NodeCanvasPortAnchor[],
  query: NodePortAnchorQuery = {}
): NodePortHitResult | null => {
  const candidates = filterAnchors(anchors, query);
  if (!candidates.length) return null;
  const sorted = sortByDistanceAndSlot(point, candidates);
  const anchor = sorted[0];
  return {
    anchor,
    distance: toDistance(point, anchor),
  };
};

export const hitTestPortAnchor = (
  point: NodeCanvasPoint,
  anchors: NodeCanvasPortAnchor[],
  options: NodePortHitTestOptions = {}
): NodePortHitResult | null => {
  const nearest = pickNearestPortAnchor(point, anchors, options);
  if (!nearest) return null;
  const maxDistance = options.maxDistance ?? nearest.anchor.hitRadius;
  return nearest.distance <= maxDistance ? nearest : null;
};

export const resolvePortSnapTarget = (
  point: NodeCanvasPoint,
  anchors: NodeCanvasPortAnchor[],
  options: NodePortHitTestOptions = {}
): NodeCanvasPortAnchor | null => {
  const hit = hitTestPortAnchor(point, anchors, options);
  return hit?.anchor ?? null;
};

export const createPortAnchorIndex = (anchors: NodeCanvasPortAnchor[]) =>
  anchors.reduce<Record<string, NodeCanvasPortAnchor>>(
    (accumulator, anchor) => {
      accumulator[anchor.port.id] = anchor;
      return accumulator;
    },
    {}
  );
