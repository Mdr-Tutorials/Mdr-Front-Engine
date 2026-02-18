import type { NodeCanvasPoint } from './renderer';

export type NodeCanvasBezierPath = {
  start: NodeCanvasPoint;
  control1: NodeCanvasPoint;
  control2: NodeCanvasPoint;
  end: NodeCanvasPoint;
};

export type NodeCanvasPolylinePath = {
  points: NodeCanvasPoint[];
};

export type NodeCanvasEdgeDrawOptions = {
  selected?: boolean;
  preview?: boolean;
  lineWidth?: number;
  selectedLineWidth?: number;
  strokeStyle?: string;
  selectedStrokeStyle?: string;
  dashPattern?: number[];
  arrowSize?: number;
  cornerRadius?: number;
};

const DEFAULT_CURVE_OFFSET = 56;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_SELECTED_LINE_WIDTH = 3;
const DEFAULT_ARROW_SIZE = 7;
const DEFAULT_CORNER_RADIUS = 10;

export const resolveNodeCanvasEdgePath = (
  start: NodeCanvasPoint,
  end: NodeCanvasPoint,
  curveOffset = DEFAULT_CURVE_OFFSET
): NodeCanvasBezierPath => {
  const forward = Math.max(curveOffset, Math.abs(end.x - start.x) * 0.35);
  return {
    start,
    control1: { x: start.x + forward, y: start.y },
    control2: { x: end.x - forward, y: end.y },
    end,
  };
};

const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  path: NodeCanvasBezierPath,
  size: number
) => {
  const tangent = {
    x: path.end.x - path.control2.x,
    y: path.end.y - path.control2.y,
  };
  const length = Math.hypot(tangent.x, tangent.y) || 1;
  const ux = tangent.x / length;
  const uy = tangent.y / length;
  const nx = -uy;
  const ny = ux;
  const backX = path.end.x - ux * size;
  const backY = path.end.y - uy * size;

  ctx.beginPath();
  ctx.moveTo(path.end.x, path.end.y);
  ctx.lineTo(backX + nx * (size * 0.55), backY + ny * (size * 0.55));
  ctx.lineTo(backX - nx * (size * 0.55), backY - ny * (size * 0.55));
  ctx.closePath();
  ctx.fill();
};

const drawArrowHeadFromSegment = (
  ctx: CanvasRenderingContext2D,
  from: NodeCanvasPoint,
  to: NodeCanvasPoint,
  size: number
) => {
  const tangent = {
    x: to.x - from.x,
    y: to.y - from.y,
  };
  const length = Math.hypot(tangent.x, tangent.y) || 1;
  const ux = tangent.x / length;
  const uy = tangent.y / length;
  const nx = -uy;
  const ny = ux;
  const backX = to.x - ux * size;
  const backY = to.y - uy * size;

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(backX + nx * (size * 0.55), backY + ny * (size * 0.55));
  ctx.lineTo(backX - nx * (size * 0.55), backY - ny * (size * 0.55));
  ctx.closePath();
  ctx.fill();
};

const dedupePolylinePoints = (points: NodeCanvasPoint[]) => {
  if (points.length <= 1) return points;
  const result: NodeCanvasPoint[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = result[result.length - 1];
    if (previous.x !== point.x || previous.y !== point.y) {
      result.push(point);
    }
  }
  return result;
};

const collapseCollinearPoints = (points: NodeCanvasPoint[]) => {
  if (points.length <= 2) return points;
  const result: NodeCanvasPoint[] = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = result[result.length - 1];
    const current = points[index];
    const next = points[index + 1];
    const inX = current.x - previous.x;
    const inY = current.y - previous.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const cross = inX * outY - inY * outX;
    if (Math.abs(cross) > 0.001) {
      result.push(current);
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const drawSmoothPolyline = (
  ctx: CanvasRenderingContext2D,
  points: NodeCanvasPoint[],
  cornerRadius: number
) => {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const inX = current.x - previous.x;
    const inY = current.y - previous.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const inLength = Math.hypot(inX, inY);
    const outLength = Math.hypot(outX, outY);
    if (inLength < 0.001 || outLength < 0.001) {
      ctx.lineTo(current.x, current.y);
      continue;
    }

    const dot = (inX * outX + inY * outY) / (inLength * outLength);
    if (Math.abs(Math.abs(dot) - 1) < 0.0001) {
      ctx.lineTo(current.x, current.y);
      continue;
    }

    const radius = Math.min(cornerRadius, inLength * 0.45, outLength * 0.45);
    const enter = {
      x: current.x - (inX / inLength) * radius,
      y: current.y - (inY / inLength) * radius,
    };
    const leave = {
      x: current.x + (outX / outLength) * radius,
      y: current.y + (outY / outLength) * radius,
    };
    ctx.lineTo(enter.x, enter.y);
    ctx.quadraticCurveTo(current.x, current.y, leave.x, leave.y);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
};

export const drawNodeCanvasEdge = (
  ctx: CanvasRenderingContext2D,
  path: NodeCanvasBezierPath,
  options: NodeCanvasEdgeDrawOptions = {}
) => {
  const isSelected = Boolean(options.selected);
  const isPreview = Boolean(options.preview);
  const lineWidth = isSelected
    ? (options.selectedLineWidth ?? DEFAULT_SELECTED_LINE_WIDTH)
    : (options.lineWidth ?? DEFAULT_LINE_WIDTH);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(path.start.x, path.start.y);
  ctx.bezierCurveTo(
    path.control1.x,
    path.control1.y,
    path.control2.x,
    path.control2.y,
    path.end.x,
    path.end.y
  );

  if (isPreview) {
    ctx.setLineDash(options.dashPattern ?? [6, 4]);
  }

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = isSelected
    ? (options.selectedStrokeStyle ?? 'rgba(0,0,0,0.9)')
    : (options.strokeStyle ?? 'rgba(0,0,0,0.7)');
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = ctx.strokeStyle;
  drawArrowHead(ctx, path, options.arrowSize ?? DEFAULT_ARROW_SIZE);
  ctx.restore();
};

export const drawNodeCanvasRoutedEdge = (
  ctx: CanvasRenderingContext2D,
  path: NodeCanvasPolylinePath,
  options: NodeCanvasEdgeDrawOptions = {}
) => {
  const points = collapseCollinearPoints(dedupePolylinePoints(path.points));
  if (points.length < 2) return;
  const isSelected = Boolean(options.selected);
  const isPreview = Boolean(options.preview);
  const lineWidth = isSelected
    ? (options.selectedLineWidth ?? DEFAULT_SELECTED_LINE_WIDTH)
    : (options.lineWidth ?? DEFAULT_LINE_WIDTH);

  ctx.save();
  drawSmoothPolyline(
    ctx,
    points,
    options.cornerRadius ?? DEFAULT_CORNER_RADIUS
  );
  if (isPreview) {
    ctx.setLineDash(options.dashPattern ?? [6, 4]);
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = isSelected
    ? (options.selectedStrokeStyle ?? 'rgba(0,0,0,0.9)')
    : (options.strokeStyle ?? 'rgba(0,0,0,0.7)');
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ctx.strokeStyle;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  drawArrowHeadFromSegment(
    ctx,
    prev,
    last,
    options.arrowSize ?? DEFAULT_ARROW_SIZE
  );
  ctx.restore();
};

const sampleBezierPoint = (
  path: NodeCanvasBezierPath,
  t: number
): NodeCanvasPoint => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const x =
    mt2 * mt * path.start.x +
    3 * mt2 * t * path.control1.x +
    3 * mt * t2 * path.control2.x +
    t2 * t * path.end.x;
  const y =
    mt2 * mt * path.start.y +
    3 * mt2 * t * path.control1.y +
    3 * mt * t2 * path.control2.y +
    t2 * t * path.end.y;
  return { x, y };
};

export const isPointNearNodeCanvasEdge = (
  point: NodeCanvasPoint,
  path: NodeCanvasBezierPath,
  tolerance = 8,
  segments = 18
) => {
  let previous = path.start;
  for (let index = 1; index <= segments; index += 1) {
    const current = sampleBezierPoint(path, index / segments);
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const len2 = dx * dx + dy * dy;
    if (len2 > 0) {
      const t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - previous.x) * dx + (point.y - previous.y) * dy) / len2
        )
      );
      const projX = previous.x + dx * t;
      const projY = previous.y + dy * t;
      const dist = Math.hypot(point.x - projX, point.y - projY);
      if (dist <= tolerance) return true;
    }
    previous = current;
  }
  return false;
};

export const isPointNearNodeCanvasPolyline = (
  point: NodeCanvasPoint,
  path: NodeCanvasPolylinePath,
  tolerance = 8
) => {
  const points = collapseCollinearPoints(dedupePolylinePoints(path.points));
  if (points.length < 2) return false;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const len2 = dx * dx + dy * dy;
    if (len2 <= 0) continue;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - previous.x) * dx + (point.y - previous.y) * dy) / len2
      )
    );
    const projX = previous.x + dx * t;
    const projY = previous.y + dy * t;
    const dist = Math.hypot(point.x - projX, point.y - projY);
    if (dist <= tolerance) return true;
  }
  return false;
};
