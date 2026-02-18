import type { NodeCanvasPoint, NodeCanvasRect } from './renderer';

export type NodeCanvasRouteOptions = {
  cellSize?: number;
  maxExpanded?: number;
  magneticWeight?: number;
  turnPenalty?: number;
};

export type NodeCanvasRouteInput = {
  start: NodeCanvasPoint;
  end: NodeCanvasPoint;
  obstacles: NodeCanvasRect[];
  options?: NodeCanvasRouteOptions;
};

type GridPoint = { gx: number; gy: number };

type OpenNode = GridPoint & {
  g: number;
  f: number;
  parentKey?: string;
  dirX: number;
  dirY: number;
};

const DEFAULT_OPTIONS: Required<NodeCanvasRouteOptions> = {
  cellSize: 24,
  maxExpanded: 2400,
  magneticWeight: 0.012,
  turnPenalty: 0.32,
};

const toKey = (point: GridPoint) => `${point.gx},${point.gy}`;

const fromKey = (key: string): GridPoint => {
  const [gx, gy] = key.split(',').map((value) => Number(value));
  return { gx, gy };
};

const pointInsideRect = (point: NodeCanvasPoint, rect: NodeCanvasRect) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const segmentIntersectsRect = (
  from: NodeCanvasPoint,
  to: NodeCanvasPoint,
  rect: NodeCanvasRect
) => {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  if (from.x === to.x) {
    const x = from.x;
    if (x < left || x > right) return false;
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    return maxY >= top && minY <= bottom;
  }

  if (from.y === to.y) {
    const y = from.y;
    if (y < top || y > bottom) return false;
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    return maxX >= left && minX <= right;
  }

  return false;
};

const orthDistance = (from: NodeCanvasPoint, to: NodeCanvasPoint) =>
  Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

const isOrthogonalSegment = (from: NodeCanvasPoint, to: NodeCanvasPoint) =>
  from.x === to.x || from.y === to.y;

const isSegmentClear = (
  from: NodeCanvasPoint,
  to: NodeCanvasPoint,
  obstacles: NodeCanvasRect[]
) => {
  if (!isOrthogonalSegment(from, to)) return false;
  return !obstacles.some((rect) => segmentIntersectsRect(from, to, rect));
};

const dedupeConsecutivePoints = (points: NodeCanvasPoint[]) => {
  if (points.length <= 1) return points;
  const result: NodeCanvasPoint[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const previous = result[result.length - 1];
    const current = points[index];
    if (previous.x !== current.x || previous.y !== current.y) {
      result.push(current);
    }
  }
  return result;
};

const countBends = (points: NodeCanvasPoint[]) => {
  if (points.length <= 2) return 0;
  let bends = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const inDx = current.x - previous.x;
    const inDy = current.y - previous.y;
    const outDx = next.x - current.x;
    const outDy = next.y - current.y;
    if (inDx !== outDx || inDy !== outDy) bends += 1;
  }
  return bends;
};

const scoreOrthPath = (
  points: NodeCanvasPoint[],
  start: NodeCanvasPoint,
  end: NodeCanvasPoint
) => {
  const length = points.reduce((accumulator, point, index) => {
    if (index === 0) return accumulator;
    return accumulator + orthDistance(points[index - 1], point);
  }, 0);
  const bends = countBends(points);
  const magnetic = points.slice(1, -1).reduce((accumulator, point) => {
    return accumulator + perpendicularDistanceToLine(point, start, end);
  }, 0);
  return length + bends * 96 + magnetic * 0.08;
};

const isPathClear = (
  points: NodeCanvasPoint[],
  obstacles: NodeCanvasRect[]
) => {
  if (points.length < 2) return false;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (!isSegmentClear(from, to, obstacles)) {
      return false;
    }
  }
  return true;
};

const toGridPoint = (point: NodeCanvasPoint, cellSize: number): GridPoint => ({
  gx: Math.round(point.x / cellSize),
  gy: Math.round(point.y / cellSize),
});

const toWorldPoint = (point: GridPoint, cellSize: number): NodeCanvasPoint => ({
  x: point.gx * cellSize,
  y: point.gy * cellSize,
});

const estimateHeuristic = (current: GridPoint, end: GridPoint) => {
  const dx = end.gx - current.gx;
  const dy = end.gy - current.gy;
  return Math.hypot(dx, dy);
};

const getNeighbors = (
  point: GridPoint
): Array<{ point: GridPoint; dx: number; dy: number }> => {
  return [
    { point: { gx: point.gx + 1, gy: point.gy }, dx: 1, dy: 0 },
    { point: { gx: point.gx - 1, gy: point.gy }, dx: -1, dy: 0 },
    { point: { gx: point.gx, gy: point.gy + 1 }, dx: 0, dy: 1 },
    { point: { gx: point.gx, gy: point.gy - 1 }, dx: 0, dy: -1 },
  ];
};

const perpendicularDistanceToLine = (
  point: NodeCanvasPoint,
  lineStart: NodeCanvasPoint,
  lineEnd: NodeCanvasPoint
) => {
  const vx = lineEnd.x - lineStart.x;
  const vy = lineEnd.y - lineStart.y;
  const length = Math.hypot(vx, vy) || 1;
  const area = Math.abs(
    vx * (lineStart.y - point.y) - (lineStart.x - point.x) * vy
  );
  return area / length;
};

const simplifyPolyline = (points: NodeCanvasPoint[]) => {
  if (points.length <= 2) return points;
  const result: NodeCanvasPoint[] = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = result[result.length - 1];
    const current = points[index];
    const next = points[index + 1];
    const v1x = current.x - prev.x;
    const v1y = current.y - prev.y;
    const v2x = next.x - current.x;
    const v2y = next.y - current.y;
    const cross = Math.abs(v1x * v2y - v1y * v2x);
    if (cross > 0.001) {
      result.push(current);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const routeOrthogonally = (
  input: NodeCanvasRouteInput,
  options: Required<NodeCanvasRouteOptions>
) => {
  const laneGap = Math.max(8, Math.floor(options.cellSize * 0.5));
  const candidatePaths: NodeCanvasPoint[][] = [];
  const start = input.start;
  const end = input.end;
  const obstacles = input.obstacles;

  if (isOrthogonalSegment(start, end)) {
    candidatePaths.push([start, end]);
  }
  candidatePaths.push([start, { x: start.x, y: end.y }, end]);
  candidatePaths.push([start, { x: end.x, y: start.y }, end]);

  const candidateXs = new Set<number>([start.x, end.x]);
  const candidateYs = new Set<number>([start.y, end.y]);
  input.obstacles.forEach((rect) => {
    candidateXs.add(rect.x - laneGap);
    candidateXs.add(rect.x + rect.width + laneGap);
    candidateYs.add(rect.y - laneGap);
    candidateYs.add(rect.y + rect.height + laneGap);
  });

  candidateXs.forEach((x) => {
    candidatePaths.push([start, { x, y: start.y }, { x, y: end.y }, end]);
  });
  candidateYs.forEach((y) => {
    candidatePaths.push([start, { x: start.x, y }, { x: end.x, y }, end]);
  });

  candidateXs.forEach((x) => {
    candidateYs.forEach((y) => {
      candidatePaths.push([
        start,
        { x, y: start.y },
        { x, y },
        { x: end.x, y },
        end,
      ]);
      candidatePaths.push([
        start,
        { x: start.x, y },
        { x, y },
        { x, y: end.y },
        end,
      ]);
    });
  });

  let bestPath: NodeCanvasPoint[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  candidatePaths.forEach((path) => {
    const normalized = dedupeConsecutivePoints(path);
    if (!isPathClear(normalized, obstacles)) return;
    const simplified = simplifyPolyline(normalized);
    const score = scoreOrthPath(simplified, start, end);
    if (score < bestScore) {
      bestScore = score;
      bestPath = simplified;
    }
  });

  return bestPath;
};

export const routeNodeCanvasMagneticPath = (
  input: NodeCanvasRouteInput
): NodeCanvasPoint[] => {
  const options = { ...DEFAULT_OPTIONS, ...(input.options ?? {}) };
  const orthPath = routeOrthogonally(input, options);
  if (orthPath) return orthPath;
  const startGrid = toGridPoint(input.start, options.cellSize);
  const endGrid = toGridPoint(input.end, options.cellSize);
  const startKey = toKey(startGrid);
  const endKey = toKey(endGrid);

  const isBlocked = (gridPoint: GridPoint) => {
    const point = toWorldPoint(gridPoint, options.cellSize);
    return input.obstacles.some((rect) => pointInsideRect(point, rect));
  };

  const open = new Map<string, OpenNode>();
  const visited = new Map<string, OpenNode>();
  const closed = new Set<string>();
  const startNode: OpenNode = {
    ...startGrid,
    g: 0,
    f: estimateHeuristic(startGrid, endGrid),
    dirX: 0,
    dirY: 0,
  };
  open.set(startKey, startNode);
  visited.set(startKey, startNode);

  let expanded = 0;
  while (open.size > 0 && expanded < options.maxExpanded) {
    expanded += 1;
    let bestKey = '';
    let bestNode: OpenNode | null = null;
    for (const [key, node] of open.entries()) {
      if (!bestNode || node.f < bestNode.f) {
        bestNode = node;
        bestKey = key;
      }
    }
    if (!bestNode) break;
    open.delete(bestKey);
    closed.add(bestKey);

    if (bestKey === endKey) {
      const route: NodeCanvasPoint[] = [];
      let currentKey: string | undefined = endKey;
      while (currentKey) {
        route.push(toWorldPoint(fromKey(currentKey), options.cellSize));
        currentKey = visited.get(currentKey)?.parentKey;
      }
      route.reverse();
      const merged = [input.start, ...route, input.end];
      return simplifyPolyline(merged);
    }

    for (const neighbor of getNeighbors(bestNode)) {
      const neighborKey = toKey(neighbor.point);
      if (closed.has(neighborKey)) continue;
      const currentWorld = toWorldPoint(bestNode, options.cellSize);
      const neighborWorld = toWorldPoint(neighbor.point, options.cellSize);
      if (
        neighborKey !== endKey &&
        neighborKey !== startKey &&
        isBlocked(neighbor.point)
      ) {
        continue;
      }
      if (
        input.obstacles.some((rect) =>
          segmentIntersectsRect(currentWorld, neighborWorld, rect)
        )
      ) {
        continue;
      }

      const moveCost = Math.hypot(neighbor.dx, neighbor.dy);
      const turnCost =
        bestNode.dirX === 0 && bestNode.dirY === 0
          ? 0
          : bestNode.dirX !== neighbor.dx || bestNode.dirY !== neighbor.dy
            ? options.turnPenalty
            : 0;
      const magneticCost =
        perpendicularDistanceToLine(neighborWorld, input.start, input.end) *
        options.magneticWeight;
      const g = bestNode.g + moveCost + turnCost + magneticCost;
      const h = estimateHeuristic(neighbor.point, endGrid);
      const f = g + h;

      const existing = open.get(neighborKey);
      if (!existing || g < existing.g) {
        open.set(neighborKey, {
          ...neighbor.point,
          g,
          f,
          parentKey: bestKey,
          dirX: neighbor.dx,
          dirY: neighbor.dy,
        });
        visited.set(neighborKey, {
          ...neighbor.point,
          g,
          f,
          parentKey: bestKey,
          dirX: neighbor.dx,
          dirY: neighbor.dy,
        });
      }
    }
  }

  return [input.start, input.end];
};
