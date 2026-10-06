/** Floor area in square metres, to one decimal, from width and depth in millimetres. */
export function floorAreaSqMeters(widthMm: number, depthMm: number): number {
  return Math.round((widthMm * depthMm) / 1e5) / 10;
}
