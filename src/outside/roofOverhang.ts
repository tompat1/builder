/**
 * Roof overhang versions for deep south eaves (Stugan V4 and similar).
 *
 * v1 — open timber canopy: header on posts, knee braces, short eave rafters.
 *      Main roof beams still run with the width-fall (east→west).
 *
 * v2 — closed soffit canopy: light plank soffit, spotlights, one outer post,
 *      no braces. Main roof beams run north→south into the overhang.
 *
 * v3 — pure cantilever: closed light soffit, thick black fascia casing, no
 *      posts. Main roof beams run north→south and carry the eave alone.
 */

export type RoofOverhangVersion = 'v1' | 'v2' | 'v3';

export const ROOF_OVERHANG_VERSIONS: readonly RoofOverhangVersion[] = ['v1', 'v2', 'v3'];

export const DEFAULT_ROOF_OVERHANG_VERSION: RoofOverhangVersion = 'v1';

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
  return roofFallsAlongWidth && (version === 'v2' || version === 'v3');
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

/** Closed plank soffit under a deep front eave (v2 post / v3 cantilever). */
export function usesPlankSoffitOverhang(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return (version === 'v2' || version === 'v3') && frontOverhangM >= 1.5;
}

/** Thick dark fascia casing with no posts — pure cantilever eave. */
export function usesCantileverBlackFascia(
  version: RoofOverhangVersion,
  frontOverhangM: number
): boolean {
  return version === 'v3' && frontOverhangM >= 1.5;
}
