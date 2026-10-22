/**
 * Roof overhang versions for deep south eaves (Stugan V4 and similar).
 *
 * v1 — open timber canopy: header on posts, knee braces, short eave rafters.
 *      Main roof beams still run with the width-fall (east→west).
 *
 * v2 — closed soffit canopy (reference): light plank soffit, spotlights,
 *      one outer post, no braces. Main roof beams run north→south so they
 *      cantilever into the overhang and carry the eave.
 */

export type RoofOverhangVersion = 'v1' | 'v2';

export const ROOF_OVERHANG_VERSIONS: readonly RoofOverhangVersion[] = ['v1', 'v2'];

export const DEFAULT_ROOF_OVERHANG_VERSION: RoofOverhangVersion = 'v1';

export function acceptRoofOverhangVersion(value: unknown): RoofOverhangVersion {
  return value === 'v2' ? 'v2' : 'v1';
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
