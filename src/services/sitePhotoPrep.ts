/** Geometry helpers for placing an exact 3D house cutout in a site photograph. */

export type SitePlacement = { x: number; y: number };

export function acceptHouseWidthPercent(value: unknown) {
  const width = Number(value);
  return Number.isFinite(width) ? Math.max(20, Math.min(90, Math.round(width))) : 55;
}

/**
 * Pixel rectangle for a house cutout whose bottom centre sits on the placement
 * pin. Drawing may clip at a photo edge; preserving the requested scale matters
 * more than silently shrinking the configured building.
 */
export function siteHouseRect(
  placement: SitePlacement,
  photoWidth: number,
  photoHeight: number,
  houseWidthPercent: number,
  cutoutAspect: number
) {
  const width = photoWidth * (acceptHouseWidthPercent(houseWidthPercent) / 100);
  const aspect = Number.isFinite(cutoutAspect) && cutoutAspect > 0.1 ? cutoutAspect : 1;
  const height = width / aspect;
  const centreX = (Math.max(5, Math.min(95, placement.x)) / 100) * photoWidth;
  const groundY = (Math.max(10, Math.min(95, placement.y)) / 100) * photoHeight;
  return {
    x: centreX - width / 2,
    y: groundY - height,
    width,
    height
  };
}
