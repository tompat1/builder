/** Decks around the house. One terrace per side, each with its own size and roof. */

export const TERRACE_SIDES = ['front', 'right', 'back', 'left'] as const;
export type TerraceSide = (typeof TERRACE_SIDES)[number];

/** How far the deck sticks out, in metres. */
export const TERRACE_DEPTHS = [1.2, 1.8, 2.4, 3] as const;
export type TerraceDepth = (typeof TERRACE_DEPTHS)[number];

/** By the door, or along the whole wall. */
export type TerraceSpan = 'door' | 'full';

export interface HouseTerrace {
  side: TerraceSide;
  depth: TerraceDepth;
  span: TerraceSpan;
  roof: boolean;
}

const DOOR_DEPTH = 1.8;
const FULL_DEPTH = 2.4;
const DOOR_DECK = 28400;
const ROOF = 14200;
/** Full side at 2.4 m with a roof is the existing 72 600 kr package. */
const FULL_DECK = 58400;

export function terracePrice(terrace: HouseTerrace): number {
  const depthScale = terrace.span === 'full' ? terrace.depth / FULL_DEPTH : terrace.depth / DOOR_DEPTH;
  const deck = terrace.span === 'full' ? FULL_DECK : DOOR_DECK;
  const roof = terrace.roof ? ROOF : 0;
  return Math.round(((deck + roof) * depthScale) / 100) * 100;
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
    terraces.push({
      side: row.side as TerraceSide,
      depth: TERRACE_DEPTHS.includes(row.depth as TerraceDepth) ? (row.depth as TerraceDepth) : 1.8,
      span: row.span === 'full' ? 'full' : 'door',
      roof: row.roof === true
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
