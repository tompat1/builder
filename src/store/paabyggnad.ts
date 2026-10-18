/** Starting size of the concrete house, in millimetres. One storey, 520 × 520 cm. */
export const CONCRETE_PLAN_MM = 5200;

/** Concrete plan stays inside the same buildable range as the timber shell. */
export const CONCRETE_MIN_WIDTH_MM = 3600;
export const CONCRETE_MIN_DEPTH_MM = 2500;
export const CONCRETE_MAX_WIDTH_MM = 12000;
export const CONCRETE_MAX_DEPTH_MM = 10000;

/** Concrete walls stay a single open storey, with no roof of their own. */
export const CONCRETE_MIN_HEIGHT_MM = 2000;
export const CONCRETE_MAX_HEIGHT_MM = 4000;
export const CONCRETE_DEFAULT_HEIGHT_MM = 2500;

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
  const area = (nextWidth / 1000) * (nextDepth / 1000);
  if (area > PAABYGGNAD_MAX_AREA) {
    if (axis === 'width') nextWidth = Math.round((PAABYGGNAD_MAX_AREA * 1_000_000) / nextDepth);
    else nextDepth = Math.round((PAABYGGNAD_MAX_AREA * 1_000_000) / nextWidth);
  }
  return { width: nextWidth, depth: nextDepth, height: nextHeight };
}

export interface PlanMm {
  width: number;
  depth: number;
  height: number;
}

/** Concrete walls keep their own size. The timber plan is not part of this clamp. */
export function clampConcretePlan(axis: 'width' | 'depth' | 'height', concrete: PlanMm): PlanMm {
  if (axis === 'height') {
    return {
      ...concrete,
      height: Math.min(CONCRETE_MAX_HEIGHT_MM, Math.max(CONCRETE_MIN_HEIGHT_MM, concrete.height))
    };
  }
  if (axis === 'width') {
    return {
      ...concrete,
      width: Math.min(CONCRETE_MAX_WIDTH_MM, Math.max(CONCRETE_MIN_WIDTH_MM, concrete.width))
    };
  }
  return {
    ...concrete,
    depth: Math.min(CONCRETE_MAX_DEPTH_MM, Math.max(CONCRETE_MIN_DEPTH_MM, concrete.depth))
  };
}

/** An extra concrete wall inside the open shell. `x` spans the width; `z` spans the length. */
export interface ConcreteWall {
  id: string;
  axis: 'x' | 'z';
  /** Distance from the middle of the shell, millimetres. */
  offsetMm: number;
}

export const CONCRETE_WALL_LIMIT = 8;
const CONCRETE_WALL_INSET_MM = 400;

/** Keeps an extra wall inside the concrete shell, clear of the outer walls. */
export function clampConcreteWall(wall: ConcreteWall, widthMm: number, depthMm: number): ConcreteWall {
  const span = wall.axis === 'x' ? depthMm : widthMm;
  const max = Math.max(0, Math.round(span / 2 - CONCRETE_WALL_INSET_MM));
  const offset = Number.isFinite(wall.offsetMm) ? wall.offsetMm : 0;
  return {
    id: wall.id,
    axis: wall.axis === 'z' ? 'z' : 'x',
    offsetMm: Math.round(Math.min(max, Math.max(-max, offset)))
  };
}

export function acceptConcreteWalls(value: unknown, widthMm: number, depthMm: number): ConcreteWall[] {
  if (!Array.isArray(value)) return [];
  const walls: ConcreteWall[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (record.axis !== 'x' && record.axis !== 'z') continue;
    if (typeof record.id !== 'string' || record.id.length < 2 || record.id.length > 40) continue;
    const offset = Number(record.offsetMm);
    if (!Number.isFinite(offset)) continue;
    walls.push(clampConcreteWall({
      id: record.id,
      axis: record.axis,
      offsetMm: offset
    }, widthMm, depthMm));
    if (walls.length >= CONCRETE_WALL_LIMIT) break;
  }
  return walls;
}

/**
 * Timber shell placed on the concrete house.
 * Outer faces share the concrete outer faces. Extra width grows to +x and extra
 * depth to +z, so the other outer walls stay in line with the concrete facade.
 * A smaller timber plan does not pull a wooden wall inside that facade.
 */
export function timberShellOnConcrete(
  widthM: number,
  depthM: number,
  concreteWidthM: number,
  concreteDepthM: number
): { widthM: number; depthM: number; x: number; z: number } {
  const width = Math.max(widthM, concreteWidthM);
  const depth = Math.max(depthM, concreteDepthM);
  return {
    widthM: width,
    depthM: depth,
    x: (width - concreteWidthM) / 2,
    z: (depth - concreteDepthM) / 2
  };
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
  panelWidth: number,
  concreteWidthM = CONCRETE_PLAN_MM / 1000,
  concreteDepthM = CONCRETE_PLAN_MM / 1000
): boolean {
  const halfW = concreteWidthM / 2;
  const halfD = concreteDepthM / 2;
  const onEdge = 0.2;
  if (wall === 'front' || wall === 'back') {
    if (Math.abs(Math.abs(pz) - halfD) > onEdge) return false;
    return Math.abs(px) + panelWidth * 0.25 <= halfW + 0.02;
  }
  if (Math.abs(Math.abs(px) - halfW) > onEdge) return false;
  return Math.abs(pz) + panelWidth * 0.25 <= halfD + 0.02;
}

export interface PaabyggnadSlot {
  id: string;
  wall: 'front' | 'back' | 'left' | 'right';
  index: number;
  type: 'empty' | 'door' | 'window' | 'gate';
  itemId?: string;
  canAcceptDoor?: boolean;
  isUpper?: boolean;
  coveredBy?: string;
}

const PANEL_COUNTS = { front: 4, back: 4, left: 3, right: 3 } as const;

/**
 * Wall slots for the concrete/timber combo:
 * Lower walls can accept doors and windows.
 */
export function paabyggnadWallSlots(): Record<string, PaabyggnadSlot> {
  const slots: Record<string, PaabyggnadSlot> = {};
  (Object.keys(PANEL_COUNTS) as (keyof typeof PANEL_COUNTS)[]).forEach((wall) => {
    for (let index = 0; index < PANEL_COUNTS[wall]; index += 1) {
      const id = `${wall}-${index}`;
      const isFront = wall === 'front';
      slots[id] = {
        id,
        wall,
        index,
        type: 'empty',
        canAcceptDoor: true
      };
      const upperId = `${id}u`;
      slots[upperId] = {
        id: upperId,
        wall,
        index,
        type: isFront ? 'window' : 'empty',
        itemId: isFront ? 'standard-single' : undefined,
        canAcceptDoor: false,
        isUpper: true
      };
    }
  });
  return slots;
}
