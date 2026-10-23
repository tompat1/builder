/**
 * Standard roof-edge choices (uniform eaves) plus special deep-south overhangs
 * (Stugan-style: flush sides + long front eave — a combo of overhang and wall line).
 *
 * Standard:
 *   overhang — usual ~0.4 m eaves all around
 *   flush    — at the wall line (Scandi cube metal edge)
 *   none     — no roof overhang
 *
 * Special (v1–v3):
 *   v1 — open timber canopy: posts, knee braces, header
 *   v2 — closed soffit, spotlights, one outer post; beams N–S
 *   v3 — framed terrace bay: black fascia + side walls; beams E–W
 */

export type RoofEdgeChoice = 'overhang' | 'flush' | 'none' | 'v1' | 'v2' | 'v3';

export type RoofOverhangVersion = 'v1' | 'v2' | 'v3';

export const ROOF_EDGE_STANDARD: readonly Exclude<RoofEdgeChoice, RoofOverhangVersion>[] = [
  'overhang',
  'flush',
  'none'
];

export const ROOF_OVERHANG_VERSIONS: readonly RoofOverhangVersion[] = ['v1', 'v2', 'v3'];

export const DEFAULT_ROOF_OVERHANG_VERSION: RoofOverhangVersion = 'v1';

export const DEFAULT_ROOF_EDGE: RoofEdgeChoice = 'overhang';

export function isSpecialRoofOverhang(value: unknown): value is RoofOverhangVersion {
  return value === 'v1' || value === 'v2' || value === 'v3';
}

export function acceptRoofEdgeChoice(
  value: unknown,
  fallback: RoofEdgeChoice = DEFAULT_ROOF_EDGE
): RoofEdgeChoice {
  if (
    value === 'overhang'
    || value === 'flush'
    || value === 'none'
    || value === 'v1'
    || value === 'v2'
    || value === 'v3'
  ) {
    return value;
  }
  return fallback;
}

/** Per-edge overhangs in metres, or undefined to use the scene default from flushRoof. */
export function roofOverhangsForEdge(
  choice: RoofEdgeChoice
): { front: number; back: number; left: number; right: number } | undefined {
  if (isSpecialRoofOverhang(choice)) return { front: 3.0, back: 0, left: 0, right: 0 };
  if (choice === 'none') return { front: 0, back: 0, left: 0, right: 0 };
  if (choice === 'flush') return { front: 0.02, back: 0.02, left: 0.02, right: 0.02 };
  return undefined;
}

export function flushRoofForEdge(choice: RoofEdgeChoice): boolean {
  return choice === 'flush' || choice === 'none';
}

/** Map legacy flushRoof + version snapshot fields onto a single edge choice. */
export function roofEdgeFromLegacy(
  flushRoof: boolean,
  version: unknown,
  preferSpecial: boolean
): RoofEdgeChoice {
  if (preferSpecial && isSpecialRoofOverhang(version)) return version;
  if (preferSpecial && !flushRoof) return acceptRoofOverhangVersion(version);
  if (flushRoof) return 'flush';
  return 'overhang';
}

/**
 * Local Y centre for a cylindrical downlight recessed into the underside of a
 * roof soffit. Negative Y points out through the visible soffit face.
 */
export function recessedSoffitLightCenterY(
  roofThicknessM: number,
  soffitThicknessM: number,
  fixtureDepthM: number,
  revealM = 0.0015
): number {
  const soffitUndersideY = -roofThicknessM / 2 - soffitThicknessM;
  return soffitUndersideY + fixtureDepthM / 2 - revealM;
}

export function acceptRoofOverhangVersion(value: unknown): RoofOverhangVersion {
  if (value === 'v2' || value === 'v3') return value;
  return 'v1';
}

/** True when primary roof beams should run along depth (N–S) to support the south eave. */
export function roofBeamsAlongDepthForOverhang(
  version: RoofOverhangVersion,
  roofFallsAlongWidth: boolean
): boolean {
  return roofFallsAlongWidth && version === 'v2';
}

/** Deep front eave uses open timber framing (posts / braces / header). */
export function usesTimberCanopyFraming(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return version === 'v1' && frontOverhangM >= 1.5;
}

/** Deep front eave uses a closed soffit with a single outer post. */
export function usesSoffitCanopyFraming(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return version === 'v2' && frontOverhangM >= 1.5;
}

/** Closed plank soffit under a deep front eave (v2 post / v3 side walls). */
export function usesPlankSoffitOverhang(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return (version === 'v2' || version === 'v3') && frontOverhangM >= 1.5;
}

/** Thick dark fascia casing around the framed v3 terrace bay. */
export function usesBlackFasciaCasing(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return version === 'v3' && frontOverhangM >= 1.5;
}

/** How far the fascia hangs below the roof slab underside (metres). */
export const FASCIA_EAVES_DROP_WHITE_M = 0.08;
export const FASCIA_EAVES_DROP_BLACK_M = 0.16;

export function fasciaEavesDropM(blackCasing: boolean): number {
  return blackCasing ? FASCIA_EAVES_DROP_BLACK_M : FASCIA_EAVES_DROP_WHITE_M;
}

/** Metal roof outside corner trim / fascia / barge colour. */
export type FasciaTrimColor = 'white' | 'black' | 'metal';

export const FASCIA_TRIM_COLORS: readonly FasciaTrimColor[] = ['white', 'black', 'metal'];

export function acceptFasciaTrimColor(value: unknown): FasciaTrimColor {
  if (value === 'black' || value === 'metal') return value;
  return 'white';
}

/** MeshStandardMaterial props for fascia / barge boards. */
export function fasciaTrimMaterialProps(color: FasciaTrimColor): {
  color: string;
  roughness: number;
  metalness: number;
} {
  if (color === 'black') return { color: '#1a1a1a', roughness: 0.55, metalness: 0.08 };
  if (color === 'metal') return { color: '#d5d8dc', roughness: 0.32, metalness: 0.72 };
  return { color: '#f4f1ea', roughness: 0.55, metalness: 0 };
}

/**
 * How far below the wall plate / eave line corner boards stop so their tops
 * sit under the fascia instead of poking through it.
 */
export function cornerBoardRoofTrimDropM(opts: {
  roofFallsAlongWidth: boolean;
  roofType: string;
  blackFasciaCasing: boolean;
}): number {
  const { roofFallsAlongWidth, roofType, blackFasciaCasing } = opts;
  if (roofFallsAlongWidth) return fasciaEavesDropM(blackFasciaCasing);
  if (roofType === 'pulpettak') return FASCIA_EAVES_DROP_WHITE_M;
  if (roofType === 'flackt') return 0.13;
  return 0.06;
}

/** Deep structural side walls carry the east–west beams of the v3 overhang. */
export function usesOverhangSideWalls(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return version === 'v3' && frontOverhangM >= 1.5;
}
