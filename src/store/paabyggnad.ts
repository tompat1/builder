/** The existing concrete house, in millimetres. One storey, 520 × 520 cm. */
export const CONCRETE_PLAN_MM = 5200;

/** Timber addition: plan may grow from the concrete house up to this floor area. */
export const PAABYGGNAD_MAX_AREA = 35;

/** Highest point of the new timber house, millimetres. */
export const PAABYGGNAD_MAX_HEIGHT_MM = 5000;

/**
 * Lowest total height that still leaves a timber storey above the concrete.
 * The concrete storey ends 2.5 m above the ground.
 */
export const PAABYGGNAD_MIN_HEIGHT_MM = 4500;

/** Top of the old concrete walls, metres above the ground. The timber loft starts here. */
export const CONCRETE_STOREY_TOP_M = 2.5;

export function clampPaabyggnadPlan(
  axis: 'width' | 'depth' | 'height',
  width: number,
  depth: number,
  height: number
): { width: number; depth: number; height: number } {
  let nextWidth = width;
  let nextDepth = depth;
  let nextHeight = height;
  if (axis === 'height') {
    nextHeight = Math.min(PAABYGGNAD_MAX_HEIGHT_MM, Math.max(PAABYGGNAD_MIN_HEIGHT_MM, height));
    return { width: nextWidth, depth: nextDepth, height: nextHeight };
  }
  if (axis === 'width') nextWidth = Math.max(CONCRETE_PLAN_MM, width);
  else nextDepth = Math.max(CONCRETE_PLAN_MM, depth);
  const area = (nextWidth / 1000) * (nextDepth / 1000);
  if (area > PAABYGGNAD_MAX_AREA) {
    if (axis === 'width') nextWidth = Math.round((PAABYGGNAD_MAX_AREA * 1_000_000) / nextDepth);
    else nextDepth = Math.round((PAABYGGNAD_MAX_AREA * 1_000_000) / nextWidth);
  }
  return { width: nextWidth, depth: nextDepth, height: nextHeight };
}

/** Loft choices for the timber floor, never larger than the plan or 35 m². */
function planArea(widthMm: number, depthMm: number) {
  return Math.round((widthMm * depthMm) / 1e5) / 10;
}

export function paabyggnadLoftAreas(widthMm: number, depthMm: number): number[] {
  const whole = Math.min(PAABYGGNAD_MAX_AREA, planArea(widthMm, depthMm));
  const mid = Math.round(whole * 0.66 * 10) / 10;
  const half = Math.round(whole * 0.45 * 10) / 10;
  return [...new Set([half, mid, whole])].sort((a, b) => a - b);
}

/**
 * A wall panel sits on the old concrete house when its face is the 5.2 m
 * concrete edge and the panel itself stays inside that square.
 */
export function panelOnConcrete(
  wall: 'front' | 'back' | 'left' | 'right',
  px: number,
  pz: number,
  panelWidth: number
): boolean {
  const half = CONCRETE_PLAN_MM / 2000;
  const onEdge = 0.35;
  const inside = half + 0.02;
  if (wall === 'front' || wall === 'back') {
    if (Math.abs(Math.abs(pz) - half) > onEdge) return false;
    return Math.abs(px) + panelWidth * 0.25 <= inside;
  }
  if (Math.abs(Math.abs(px) - half) > onEdge) return false;
  return Math.abs(pz) + panelWidth * 0.25 <= inside;
}
