/**
 * Exterior try-out lights: facade sconces, door lights, LED strips, garden bollards.
 * Daylight mode (sun / moon / neutral) drives how bright the scene and fixtures read.
 */

export type DaylightMode = 'sun' | 'moon' | 'neutral';

export const DAYLIGHT_MODES: readonly DaylightMode[] = ['sun', 'moon', 'neutral'];

export function acceptDaylightMode(value: unknown): DaylightMode {
  if (value === 'moon' || value === 'neutral') return value;
  return 'sun';
}

export interface HouseLightsConfig {
  /** Wall washers auto-placed on the front facade. */
  facadeLights: boolean;
  /** Sconce above each exterior door. */
  doorLight: boolean;
  /** Soft LED strip under door canopy / front eave. */
  ledStrips: boolean;
  /** Garden bollards in front of the house. */
  gardenLights: boolean;
}

export const DEFAULT_HOUSE_LIGHTS: HouseLightsConfig = {
  facadeLights: true,
  doorLight: false,
  ledStrips: false,
  gardenLights: false
};

export type HouseLightKey = keyof HouseLightsConfig;

export function parseHouseLights(raw: unknown): HouseLightsConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HOUSE_LIGHTS };
  const src = raw as Record<string, unknown>;
  return {
    facadeLights:
      typeof src.facadeLights === 'boolean' ? src.facadeLights : DEFAULT_HOUSE_LIGHTS.facadeLights,
    doorLight: src.doorLight === true,
    ledStrips: src.ledStrips === true,
    gardenLights: src.gardenLights === true
  };
}

/**
 * How dark the sky should read for a given sun hour (sun mode only).
 * Evening (~18+) and early morning ramp toward night.
 */
export function nightGainForHour(hour: number, altitude: number): number {
  if (altitude <= 0.02) return 1;
  if (hour >= 19.5) return Math.min(1, (hour - 19.5) / 1.5 + 0.55);
  if (hour >= 18) return Math.min(0.7, ((hour - 18) / 1.5) * 0.55);
  if (hour <= 6.5) return Math.min(1, (6.5 - hour) / 1.5 + 0.45);
  if (hour <= 7.5) return Math.min(0.45, (7.5 - hour) / 1);
  return 0;
}

/**
 * Exterior fixture PointLight intensity. Off in full day; ramps up with nightGain.
 * (Was a small residual glow even at noon — that read as “lights on” during sun.)
 */
export function fixtureLightIntensity(base: number, nightGain: number): number {
  if (nightGain <= 0.04) return 0;
  return base * (0.12 + 0.88 * nightGain);
}

/** Matching emissive glow on the fixture lens / LED mesh. */
export function fixtureEmissiveIntensity(base: number, nightGain: number): number {
  if (nightGain <= 0.04) return 0;
  return base * (0.2 + 0.8 * nightGain);
}

/** Opening span along a wall (doors, windows). Centre + clear width. */
export interface WallOpeningSpan {
  x: number;
  width: number;
}

export interface FacadeSconcePlaceOpts {
  wallLength: number;
  openings: WallOpeningSpan[];
  /** How many washers to place (typically 2–3). */
  count: number;
  /** Keep clear of the wall ends / corner boards. */
  endInset?: number;
  /** Extra space past the opening edge so the fixture sits on cladding. */
  clearance?: number;
  /** Minimum spacing between two sconces. */
  minSpacing?: number;
}

function openingBlocks(openings: WallOpeningSpan[], clearance: number) {
  return openings
    .map((o) => ({
      lo: o.x - o.width / 2 - clearance,
      hi: o.x + o.width / 2 + clearance
    }))
    .filter((b) => b.hi > b.lo)
    .sort((a, b) => a.lo - b.lo);
}

function overlapsBlock(
  x: number,
  blocks: { lo: number; hi: number }[]
): { lo: number; hi: number } | null {
  for (const b of blocks) {
    if (x >= b.lo && x <= b.hi) return b;
  }
  return null;
}

function inBounds(x: number, lo: number, hi: number) {
  return x >= lo && x <= hi;
}

/** Nudge a seed off any opening, preferring the nearer free side. */
export function nudgeOffOpenings(
  x: number,
  openings: WallOpeningSpan[],
  wallLo: number,
  wallHi: number,
  clearance = 0.22
): number | null {
  const blocks = openingBlocks(openings, clearance);
  let cur = x;
  for (let i = 0; i < 8; i++) {
    const hit = overlapsBlock(cur, blocks);
    if (!hit) {
      return inBounds(cur, wallLo, wallHi) ? cur : null;
    }
    const left = hit.lo - 0.01;
    const right = hit.hi + 0.01;
    const leftOk = inBounds(left, wallLo, wallHi) && !overlapsBlock(left, blocks);
    const rightOk = inBounds(right, wallLo, wallHi) && !overlapsBlock(right, blocks);
    // Prefer the side closer to the original seed.
    const preferLeft = Math.abs(left - x) <= Math.abs(right - x);
    if (preferLeft && leftOk) cur = left;
    else if (rightOk) cur = right;
    else if (leftOk) cur = left;
    else return null;
  }
  return overlapsBlock(cur, blocks) || !inBounds(cur, wallLo, wallHi) ? null : cur;
}

/**
 * Place facade washers on free cladding — never on doors/windows.
 * Seeds near the corners (and centre on wide walls); each seed slides beside
 * any opening it would otherwise sit on. Opening flanks are preferred fill-ins.
 */
export function placeFacadeSconcesAlongWall(opts: FacadeSconcePlaceOpts): number[] {
  const {
    wallLength,
    openings,
    count,
    endInset = 0.4,
    clearance = 0.16,
    minSpacing = 0.7
  } = opts;
  if (count <= 0 || wallLength < endInset * 2 + 0.2) return [];

  const half = wallLength / 2;
  // Soft outer limit — may place a little closer to the corner when an opening
  // leaves only a narrow free strip of cladding.
  const hardLo = -half + 0.22;
  const hardHi = half - 0.22;
  const wallLo = Math.max(hardLo, -half + endInset);
  const wallHi = Math.min(hardHi, half - endInset);
  if (hardHi <= hardLo) return [];

  const seeds: number[] = [];
  if (count >= 3 && wallLength > 4.5) {
    seeds.push(wallLo, 0, wallHi);
  } else if (count >= 2) {
    seeds.push(wallLo, wallHi);
  } else {
    seeds.push((wallLo + wallHi) / 2);
  }

  // Prefer sitting next to openings when filling gaps.
  for (const o of openings) {
    seeds.push(o.x - o.width / 2 - clearance, o.x + o.width / 2 + clearance);
  }

  const placed: number[] = [];
  const farEnough = (x: number) => placed.every((p) => Math.abs(p - x) >= minSpacing);

  for (const seed of seeds) {
    if (placed.length >= count) break;
    const nudged = nudgeOffOpenings(seed, openings, hardLo, hardHi, clearance);
    if (nudged == null || !farEnough(nudged)) continue;
    placed.push(nudged);
  }

  if (placed.length < count) {
    const blocks = openingBlocks(openings, clearance);
    const gaps: { lo: number; hi: number }[] = [];
    let cursor = hardLo;
    for (const b of blocks) {
      if (b.lo > cursor + 0.12) gaps.push({ lo: cursor, hi: Math.min(b.lo, hardHi) });
      cursor = Math.max(cursor, b.hi);
    }
    if (cursor < hardHi - 0.12) gaps.push({ lo: cursor, hi: hardHi });

    const candidates: number[] = [];
    for (const g of gaps) {
      if (g.hi - g.lo < 0.2) continue;
      candidates.push((g.lo + g.hi) / 2, g.lo + 0.08, g.hi - 0.08);
    }
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b));

    for (const mid of candidates) {
      if (placed.length >= count) break;
      if (!inBounds(mid, hardLo, hardHi) || !farEnough(mid)) continue;
      if (overlapsBlock(mid, blocks)) continue;
      placed.push(mid);
    }
  }

  return placed.sort((a, b) => a - b);
}

/**
 * Door sconce sits on the wall beside the opening (not on the leaf / glass).
 * Prefers the side with more free cladding; falls back to the other side.
 */
export function placeDoorSconceBeside(
  doorX: number,
  doorWidth: number,
  wallLo: number,
  wallHi: number,
  openings: WallOpeningSpan[],
  clearance = 0.22
): number | null {
  const half = doorWidth / 2;
  const left = doorX - half - clearance;
  const right = doorX + half + clearance;
  const leftSpot = nudgeOffOpenings(left, openings, wallLo, wallHi, clearance);
  const rightSpot = nudgeOffOpenings(right, openings, wallLo, wallHi, clearance);
  if (leftSpot != null && rightSpot != null) {
    return leftSpot - wallLo >= wallHi - rightSpot ? leftSpot : rightSpot;
  }
  return leftSpot ?? rightSpot;
}
