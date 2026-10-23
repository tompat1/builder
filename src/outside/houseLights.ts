/**
 * Exterior try-out lights: facade sconces, door lights, LED strips, garden bollards.
 * Daylight mode (sun / moon / neutral) drives how bright the scene and fixtures read.
 */

import type { Layers, Object3D } from 'three';

/** Default / outdoor meshes and outdoor fixture lights. */
export const LIGHTING_LAYER_EXTERIOR = 0;
/** Interior drywall, rooms, ceilings — outdoor fixtures skip this layer. */
export const LIGHTING_LAYER_INTERIOR = 1;

/** Sun / ambient / camera: light and see both shells. */
export function enableAllLightingLayers(target: { layers: Layers }) {
  target.layers.enable(LIGHTING_LAYER_EXTERIOR);
  target.layers.enable(LIGHTING_LAYER_INTERIOR);
}

/** Outdoor PointLights only — does not wash the inside of the house. */
export function setExteriorOnlyLightingLayer(target: { layers: Layers }) {
  target.layers.set(LIGHTING_LAYER_EXTERIOR);
}

/** Tag interior meshes so outdoor fixtures cannot illuminate them. */
export function setInteriorLightingLayer(root: Object3D) {
  root.traverse((child) => {
    child.layers.set(LIGHTING_LAYER_INTERIOR);
  });
}

export type DaylightMode = 'sun' | 'moon' | 'neutral';

export const DAYLIGHT_MODES: readonly DaylightMode[] = ['sun', 'moon', 'neutral'];

export function acceptDaylightMode(value: unknown): DaylightMode {
  if (value === 'moon' || value === 'neutral') return value;
  return 'sun';
}

export interface HouseLightsConfig {
  /** Classic wall sconces on every facade. */
  facadeLights: boolean;
  /** Up/down LED wall lights (2×8 W class) — alternative to classic sconces. */
  facadeUpDownLights: boolean;
  /** Sconce above each exterior door. */
  doorLight: boolean;
  /** Soft LED strip under door canopy / front eave. */
  ledStrips: boolean;
  /** Recessed warm LED dots along terrace edges (+ rim strip). */
  terraceLights: boolean;
  /** Garden bollards in front of the house. */
  gardenLights: boolean;
}

export const DEFAULT_HOUSE_LIGHTS: HouseLightsConfig = {
  facadeLights: true,
  facadeUpDownLights: false,
  doorLight: false,
  ledStrips: false,
  terraceLights: false,
  gardenLights: false
};

export type HouseLightKey = keyof HouseLightsConfig;

/** Classic sconce vs dual-beam up/down LED (label + default step). */
export type FixturePowerKind = 'single' | 'dual';

export function parseHouseLights(raw: unknown): HouseLightsConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HOUSE_LIGHTS };
  const src = raw as Record<string, unknown>;
  let facadeLights =
    typeof src.facadeLights === 'boolean' ? src.facadeLights : DEFAULT_HOUSE_LIGHTS.facadeLights;
  let facadeUpDownLights = src.facadeUpDownLights === true;
  // One facade style at a time — prefer the explicit up/down choice.
  if (facadeLights && facadeUpDownLights) facadeLights = false;
  return {
    facadeLights,
    facadeUpDownLights,
    doorLight: src.doorLight === true,
    ledStrips: src.ledStrips === true,
    terraceLights: src.terraceLights === true,
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

/** Four clickable LED output steps — typical modern exterior LED figures. */
export type FixturePowerStep = 0 | 1 | 2 | 3;

export interface FixturePowerSpec {
  /** Electrical input (W). */
  watts: number;
  /** Useful light output (lm). */
  lumens: number;
  /** Correlated colour temperature (K). */
  cctK: number;
  /** Relative scene intensity vs the 12 W step. */
  gain: number;
}

/** Single-emitter sconces / bollards / strips. */
export const FIXTURE_POWER_STEPS: readonly FixturePowerSpec[] = [
  { watts: 3, lumens: 300, cctK: 2700, gain: 0.4 },
  { watts: 7, lumens: 700, cctK: 3000, gain: 0.7 },
  { watts: 12, lumens: 1200, cctK: 3000, gain: 1 },
  { watts: 15, lumens: 1500, cctK: 3000, gain: 1.25 }
] as const;

/**
 * Up/down LED modules — each step is watts/lumens *per* beam.
 * Default step 1 = 2 × 8 W (1600 lm total).
 */
export const DUAL_FIXTURE_POWER_STEPS: readonly FixturePowerSpec[] = [
  { watts: 4, lumens: 400, cctK: 2700, gain: 0.5 },
  { watts: 8, lumens: 800, cctK: 3000, gain: 0.9 },
  { watts: 12, lumens: 1200, cctK: 3000, gain: 1.15 },
  { watts: 15, lumens: 1500, cctK: 3000, gain: 1.35 }
] as const;

export const DEFAULT_FIXTURE_POWER_STEP: FixturePowerStep = 1;

export function acceptFixturePowerStep(value: unknown): FixturePowerStep {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return DEFAULT_FIXTURE_POWER_STEP;
}

export function nextFixturePowerStep(step: FixturePowerStep): FixturePowerStep {
  return ((step + 1) % FIXTURE_POWER_STEPS.length) as FixturePowerStep;
}

export function fixturePowerSpec(
  step: FixturePowerStep = DEFAULT_FIXTURE_POWER_STEP,
  kind: FixturePowerKind = 'single'
): FixturePowerSpec {
  const table = kind === 'dual' ? DUAL_FIXTURE_POWER_STEPS : FIXTURE_POWER_STEPS;
  return table[acceptFixturePowerStep(step)];
}

/** Short HUD line, e.g. `7 W · 700 lm · 3000 K` or `2 × 8 W · 1600 lm · 3000 K`. */
export function formatFixturePowerLabel(
  step: FixturePowerStep,
  kind: FixturePowerKind = 'single'
): string {
  const spec = fixturePowerSpec(step, kind);
  if (kind === 'dual') {
    return `2 × ${spec.watts} W · ${spec.lumens * 2} lm · ${spec.cctK} K`;
  }
  return `${spec.watts} W · ${spec.lumens} lm · ${spec.cctK} K`;
}

/**
 * Exterior fixture PointLight intensity. Off in full day; ramps up with nightGain.
 * `powerGain` is the active LED step (0.4 / 0.7 / 1).
 */
export function fixtureLightIntensity(
  base: number,
  nightGain: number,
  powerGain = 1
): number {
  if (nightGain <= 0.04) return 0;
  return base * (0.12 + 0.88 * nightGain) * Math.max(0, powerGain);
}

/** Matching emissive glow on the fixture lens / LED mesh. */
export function fixtureEmissiveIntensity(
  base: number,
  nightGain: number,
  powerGain = 1
): number {
  if (nightGain <= 0.04) return 0;
  return base * (0.2 + 0.8 * nightGain) * Math.max(0, powerGain);
}

/** Minimum gap from openings, corners, and other fixtures (metres). */
export const FIXTURE_CLEARANCE_M = 0.5;

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
  clearance = FIXTURE_CLEARANCE_M
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

/** How many facade washers: front always 2; other walls keep even spacing by length. */
export function facadeSconceCountForWall(
  wall: 'front' | 'back' | 'left' | 'right',
  wallLength: number
): number {
  if (wall === 'front') return 2;
  if (wallLength > 7) return 3;
  return 2;
}

/** Evenly spaced seeds along the usable wall strip (1/(n+1) … n/(n+1)). */
export function evenWallSeeds(count: number, wallLo: number, wallHi: number): number[] {
  if (count <= 0 || wallHi <= wallLo) return [];
  const span = wallHi - wallLo;
  const seeds: number[] = [];
  for (let i = 1; i <= count; i++) {
    seeds.push(wallLo + (span * i) / (count + 1));
  }
  return seeds;
}

/**
 * Place facade washers on free cladding — never on doors/windows.
 * Starts from even spacing, then slides each seed beside any opening it hits.
 * Opening flanks fill in if a seed cannot land.
 */
export function placeFacadeSconcesAlongWall(opts: FacadeSconcePlaceOpts): number[] {
  const {
    wallLength,
    openings,
    count,
    endInset = FIXTURE_CLEARANCE_M,
    clearance = FIXTURE_CLEARANCE_M,
    minSpacing = FIXTURE_CLEARANCE_M
  } = opts;
  if (count <= 0 || wallLength < endInset * 2 + 0.2) return [];

  const half = wallLength / 2;
  const edgePad = Math.max(clearance, endInset, FIXTURE_CLEARANCE_M);
  const hardLo = -half + edgePad;
  const hardHi = half - edgePad;
  const wallLo = hardLo;
  const wallHi = hardHi;
  if (hardHi <= hardLo) return [];

  const seeds = evenWallSeeds(count, wallLo, wallHi);
  // Front (and busy walls): also try flanks so lights sit next to doors/windows.
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
    // Prefer outermost free spots so a pair stays evenly spread.
    candidates.sort((a, b) => Math.abs(b) - Math.abs(a));

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
  clearance = FIXTURE_CLEARANCE_M
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
