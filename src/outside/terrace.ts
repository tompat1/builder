/** Decks around the house. One terrace per side, each with its own size and roof. */

export const TERRACE_SIDES = ['front', 'right', 'back', 'left'] as const;
export type TerraceSide = (typeof TERRACE_SIDES)[number];

/** How far the deck sticks out, in metres. Preset standard sizes. */
export const TERRACE_DEPTHS = [1.2, 1.8, 2.4, 3, 5] as const;
export type StandardTerraceDepth = (typeof TERRACE_DEPTHS)[number];

export const MIN_TERRACE_DEPTH = 0.8;
export const MAX_TERRACE_DEPTH = 6.0;

/** Terrace depth in metres (standard preset or custom within [0.8, 6.0]). */
export type TerraceDepth = number;

/** By the door, or along the whole wall. */
export type TerraceSpan = 'door' | 'full';

export type TerraceBuilding = 'none' | 'sauna' | 'shed' | 'hot-tub';
export const TERRACE_BUILDINGS = ['none', 'sauna', 'shed', 'hot-tub'] as const;

export type TerraceBuildingPlacement = 'left' | 'right';
export const TERRACE_BUILDING_PLACEMENTS = ['left', 'right'] as const;

/** Mono-pitch, a 3° low roof, or a gable. */
export type TerraceBuildingRoof = 'pulpet' | 'low' | 'gable';
export const TERRACE_BUILDING_ROOFS = ['pulpet', 'low', 'gable'] as const;

/** Quarter turns of the sauna room. 0 keeps the benches against the house. */
export const SAUNA_TURNS = [0, 1, 2, 3] as const;
export type SaunaTurn = (typeof SAUNA_TURNS)[number];
export type CabinWall = 'house' | 'yard' | 'left' | 'right';

export type SaunaColor = 'natural' | 'svart' | 'falurod' | 'gra' | 'vit' | 'match';
export const SAUNA_COLORS = ['natural', 'svart', 'falurod', 'gra', 'vit', 'match'] as const;

export type SaunaDoor = 'glass' | 'lervik' | 'stehag' | 'solid';
export const SAUNA_DOORS = ['glass', 'lervik', 'stehag', 'solid'] as const;

export type SaunaWindow = 'panorama' | 'standard' | 'sprojat' | 'frost' | 'none';
export const SAUNA_WINDOWS = ['panorama', 'standard', 'sprojat', 'frost', 'none'] as const;

export type SaunaWindowPlacement = 'yard' | 'side' | 'both' | 'none';
export const SAUNA_WINDOW_PLACEMENTS = ['yard', 'side', 'both', 'none'] as const;

export type SaunaSize = 'compact' | 'standard' | 'large';
export const SAUNA_SIZES = ['compact', 'standard', 'large'] as const;

export type SaunaWindowSize = 'compact' | 'standard' | 'large';
export const SAUNA_WINDOW_SIZES = ['compact', 'standard', 'large'] as const;

const SAUNA_WALLS: CabinWall[] = ['house', 'left', 'yard', 'right'];

/** Benches, window, and door stay one room and step clockwise together. */
export function saunaFacing(turn: number, doorOnRight: boolean): { bench: CabinWall; window: CabinWall; door: CabinWall } {
  const steps = ((Math.trunc(turn) % 4) + 4) % 4;
  return {
    bench: SAUNA_WALLS[steps],
    window: SAUNA_WALLS[(steps + 2) % 4],
    door: SAUNA_WALLS[(steps + (doorOnRight ? 3 : 1)) % 4]
  };
}

export interface HouseTerrace {
  side: TerraceSide;
  depth: TerraceDepth;
  span: TerraceSpan;
  roof: boolean;
  building?: TerraceBuilding;
  buildingPlacement?: TerraceBuildingPlacement;
  buildingRoof?: TerraceBuildingRoof;
  /** Quarter turns of a sauna interior. Missing means the benches face the yard. */
  buildingTurn?: SaunaTurn;
  /** Exterior facade color/material of the sauna cabin */
  buildingColor?: SaunaColor;
  /** Door model choice for the sauna */
  buildingDoor?: SaunaDoor;
  /** Window style choice for the sauna */
  buildingWindow?: SaunaWindow;
  /** Which wall(s) have windows */
  buildingWindowPlacement?: SaunaWindowPlacement;
  /** Overall footprint size of the sauna cabin */
  buildingSize?: SaunaSize;
  /** Size scaling of the sauna window */
  buildingWindowSize?: SaunaWindowSize;
}

const SAUNA_EAVE_M = 2.05;

export function normalizeBuildingRoof(value: unknown): TerraceBuildingRoof {
  return value === 'low' || value === 'gable' ? value : 'pulpet';
}

export function buildingRoofDegrees(roof: TerraceBuildingRoof): number {
  if (roof === 'low') return 3;
  if (roof === 'gable') return 22;
  return 12;
}

/**
 * Wall-top height above the deck. `t` is 0 against the house and 1 at the yard face.
 * The roof underside uses this same line, so the joint has no gap.
 */
export function buildingWallTop(roof: TerraceBuildingRoof, depth: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const pitch = (buildingRoofDegrees(roof) * Math.PI) / 180;
  if (roof === 'gable') {
    const rise = (depth / 2) * Math.tan(pitch);
    return SAUNA_EAVE_M + rise * (1 - Math.abs(clamped * 2 - 1));
  }
  return SAUNA_EAVE_M + depth * Math.tan(pitch) * (1 - clamped);
}

export interface TerraceBoardLayout {
  count: number;
  depth: number;
  centers: number[];
}

/**
 * Split a terrace depth into flush boards. A non-zero gap remains available
 * for other uses, but house terraces deliberately pass the zero-gap default so
 * there are no holes at the wall, between boards, at the rim, or at corners.
 */
export function terraceBoardLayout(depth: number, targetDepth = 0.16, gap = 0): TerraceBoardLayout {
  const count = Math.max(1, Math.round((depth + gap) / (targetDepth + gap)));
  const boardDepth = (depth - gap * (count - 1)) / count;
  return {
    count,
    depth: boardDepth,
    centers: Array.from({ length: count }, (_, index) => boardDepth / 2 + index * (boardDepth + gap))
  };
}

const DOOR_DEPTH = 1.8;
const FULL_DEPTH = 2.4;
const DOOR_DECK = 28400;
const ROOF = 14200;
/** Full side at 2.4 m with a roof is the existing 72 600 kr package. */
const FULL_DECK = 58400;

export const SAUNA_BUILDING_PRICE = 48000;
export const SHED_BUILDING_PRICE = 32000;
export const HOT_TUB_BUILDING_PRICE = 42000;

export function terraceBuildingPrice(building?: TerraceBuilding, size?: SaunaSize): number {
  if (building === 'sauna') {
    if (size === 'compact') return 42000;
    if (size === 'large') return 56000;
    return SAUNA_BUILDING_PRICE;
  }
  if (building === 'shed') return SHED_BUILDING_PRICE;
  if (building === 'hot-tub') return HOT_TUB_BUILDING_PRICE;
  return 0;
}

export function terracePrice(terrace: HouseTerrace): number {
  const depthScale = terrace.span === 'full' ? terrace.depth / FULL_DEPTH : terrace.depth / DOOR_DEPTH;
  const deck = terrace.span === 'full' ? FULL_DECK : DOOR_DECK;
  const roof = terrace.roof ? ROOF : 0;
  const building = terraceBuildingPrice(terrace.building, terrace.buildingSize);
  return Math.round(((deck + roof) * depthScale) / 100) * 100 + building;
}

export function acceptTerraces(value: unknown): HouseTerrace[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const terraces: HouseTerrace[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<HouseTerrace>;
    if (!TERRACE_SIDES.includes(row.side as TerraceSide) || seen.has(row.side as string)) continue;
    seen.add(row.side as string);
    const building: TerraceBuilding | undefined =
      row.building === 'sauna' || row.building === 'shed' || row.building === 'hot-tub'
        ? row.building
        : row.building === 'none'
          ? 'none'
          : undefined;
    const buildingPlacement: TerraceBuildingPlacement | undefined =
      row.buildingPlacement === 'left' || row.buildingPlacement === 'right'
        ? row.buildingPlacement
        : undefined;
    const buildingRoof: TerraceBuildingRoof | undefined =
      row.buildingRoof === 'pulpet' || row.buildingRoof === 'low' || row.buildingRoof === 'gable'
        ? row.buildingRoof
        : undefined;
    const buildingTurn: SaunaTurn | undefined =
      row.buildingTurn === 1 || row.buildingTurn === 2 || row.buildingTurn === 3
        ? row.buildingTurn
        : undefined;
    const buildingColor: SaunaColor | undefined =
      row.buildingColor && SAUNA_COLORS.includes(row.buildingColor as SaunaColor)
        ? (row.buildingColor as SaunaColor)
        : undefined;
    const buildingDoor: SaunaDoor | undefined =
      row.buildingDoor && SAUNA_DOORS.includes(row.buildingDoor as SaunaDoor)
        ? (row.buildingDoor as SaunaDoor)
        : undefined;
    const buildingWindow: SaunaWindow | undefined =
      row.buildingWindow && SAUNA_WINDOWS.includes(row.buildingWindow as SaunaWindow)
        ? (row.buildingWindow as SaunaWindow)
        : undefined;
    const buildingWindowPlacement: SaunaWindowPlacement | undefined =
      row.buildingWindowPlacement && SAUNA_WINDOW_PLACEMENTS.includes(row.buildingWindowPlacement as SaunaWindowPlacement)
        ? (row.buildingWindowPlacement as SaunaWindowPlacement)
        : undefined;
    const buildingSize: SaunaSize | undefined =
      row.buildingSize && SAUNA_SIZES.includes(row.buildingSize as SaunaSize)
        ? (row.buildingSize as SaunaSize)
        : undefined;
    const buildingWindowSize: SaunaWindowSize | undefined =
      row.buildingWindowSize && SAUNA_WINDOW_SIZES.includes(row.buildingWindowSize as SaunaWindowSize)
        ? (row.buildingWindowSize as SaunaWindowSize)
        : undefined;
    const rawDepth = typeof row.depth === 'number' && !Number.isNaN(row.depth) ? row.depth : 1.8;
    const depth =
      rawDepth >= MIN_TERRACE_DEPTH && rawDepth <= MAX_TERRACE_DEPTH
        ? Math.round(rawDepth * 10) / 10
        : 1.8;
    terraces.push({
      side: row.side as TerraceSide,
      depth,
      span: row.span === 'full' ? 'full' : 'door',
      roof: row.roof === true,
      ...(building ? { building } : {}),
      ...(buildingPlacement ? { buildingPlacement } : {}),
      ...(buildingRoof ? { buildingRoof } : {}),
      ...(buildingTurn ? { buildingTurn } : {}),
      ...(buildingColor ? { buildingColor } : {}),
      ...(buildingDoor ? { buildingDoor } : {}),
      ...(buildingWindow ? { buildingWindow } : {}),
      ...(buildingWindowPlacement ? { buildingWindowPlacement } : {}),
      ...(buildingSize ? { buildingSize } : {}),
      ...(buildingWindowSize ? { buildingWindowSize } : {})
    });
    if (terraces.length >= TERRACE_SIDES.length) break;
  }
  return terraces;
}

/** Houses saved before a terrace was its own record. */
export function terracesFromLegacy(data: {
  terrace?: unknown;
  terraceCeiling?: unknown;
  bigTerrace?: unknown;
  terraceSide?: unknown;
}): HouseTerrace[] {
  if (data.bigTerrace === true) {
    const side = TERRACE_SIDES.includes(data.terraceSide as TerraceSide)
      ? (data.terraceSide as TerraceSide)
      : 'front';
    return [{ side, depth: 2.4, span: 'full', roof: true }];
  }
  if (data.terrace === true) {
    return [{ side: 'front', depth: 1.8, span: 'door', roof: data.terraceCeiling === true }];
  }
  return [];
}
