export interface MeasurePoint {
  x: number;
  y: number;
  z: number;
}

/** Straight distance between two points on the house, in millimetres. */
export function measureLengthMm(from: MeasurePoint, to: MeasurePoint) {
  const dx = (to.x - from.x) * 1000;
  const dy = (to.y - from.y) * 1000;
  const dz = (to.z - from.z) * 1000;
  return Math.round(Math.hypot(dx, dy, dz));
}

/** A click sets the start, the next click sets the end, and a later click starts again. */
export function nextMeasure(
  start: MeasurePoint | null,
  end: MeasurePoint | null,
  point: MeasurePoint
) {
  if (!start || end) return { start: point, end: null as MeasurePoint | null };
  if (measureLengthMm(start, point) < 10) return { start, end: null as MeasurePoint | null };
  return { start, end: point };
}
