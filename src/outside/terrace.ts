/** Decks around the house. One terrace per side, each with its own size and roof. */

export const TERRACE_SIDES = ['front', 'right', 'back', 'left'] as const;
export type TerraceSide = (typeof TERRACE_SIDES)[number];

/** How far the deck sticks out, in metres. */
export const TERRACE_DEPTHS = [1.2, 1.8, 2.4, 3] as const;
export type TerraceDepth = (typeof TERRACE_DEPTHS)[number];

/** By the door, or along the whole wall. */
export type TerraceSpan = 'door' | 'full';

export type TerraceBuilding = 'none' | 'sauna' | 'shed';
export const TERRACE_BUILDINGS = ['none', 'sauna', 'shed'] as const;

export type TerraceBuildingPlacement = 'left' | 'right';
export const TERRACE_BUILDING_PLACEMENTS = ['left', 'right'] as const;

export interface HouseTerrace {
  side: TerraceSide;
  depth: TerraceDepth;
  span: TerraceSpan;
  roof: boolean;
  building?: TerraceBuilding;
  buildingPlacement?: TerraceBuildingPlacement;
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

export function terraceBuildingPrice(building?: TerraceBuilding): number {
  if (building === 'sauna') return SAUNA_BUILDING_PRICE;
  if (building === 'shed') return SHED_BUILDING_PRICE;
  return 0;
}

export function terracePrice(terrace: HouseTerrace): number {
  const depthScale = terrace.span === 'full' ? terrace.depth / FULL_DEPTH : terrace.depth / DOOR_DEPTH;
  const deck = terrace.span === 'full' ? FULL_DECK : DOOR_DECK;
  const roof = terrace.roof ? ROOF : 0;
  const building = terraceBuildingPrice(terrace.building);
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
      row.building === 'sauna' || row.building === 'shed'
        ? row.building
        : row.building === 'none'
          ? 'none'
          : undefined;
    const buildingPlacement: TerraceBuildingPlacement | undefined =
      row.buildingPlacement === 'left' || row.buildingPlacement === 'right'
        ? row.buildingPlacement
        : undefined;
    terraces.push({
      side: row.side as TerraceSide,
      depth: TERRACE_DEPTHS.includes(row.depth as TerraceDepth) ? (row.depth as TerraceDepth) : 1.8,
      span: row.span === 'full' ? 'full' : 'door',
      roof: row.roof === true,
      ...(building ? { building } : {}),
      ...(buildingPlacement ? { buildingPlacement } : {})
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
