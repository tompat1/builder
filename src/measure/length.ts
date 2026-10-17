export interface MeasurePoint {
  x: number;
  y: number;
  z: number;
}

export const MEASURE_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 3v18M3 12h18' stroke='%23ffffff' stroke-width='3.5' stroke-linecap='square'/%3E%3Cpath d='M12 3v18M3 12h18' stroke='%230f172a' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E\") 12 12, crosshair";

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
