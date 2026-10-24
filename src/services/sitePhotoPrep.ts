/** Geometry helpers for placing an exact 3D house cutout in a site photograph. */

export type SitePlacement = { x: number; y: number };

export type SiteRect = { x: number; y: number; width: number; height: number };

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
): SiteRect {
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

/** Slightly larger wipe so the old shed does not peek around the cutout. */
export function siteClearRect(house: SiteRect): SiteRect {
  const padX = house.width * 0.1;
  const padTop = house.height * 0.08;
  const padBottom = house.height * 0.04;
  return {
    x: house.x - padX,
    y: house.y - padTop,
    width: house.width + padX * 2,
    height: house.height + padTop + padBottom
  };
}

function sampleBandColor(
  context: CanvasRenderingContext2D,
  width: number,
  top: number,
  bandHeight: number,
  fallback: { r: number; g: number; b: number }
) {
  const y = Math.max(0, Math.min(context.canvas.height - 1, Math.floor(top)));
  const h = Math.max(1, Math.min(bandHeight, context.canvas.height - y));
  const data = context.getImageData(0, y, width, h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const step = 16 * 4;
  for (let i = 0; i < data.length; i += step) {
    r += data[i]!;
    g += data[i + 1]!;
    b += data[i + 2]!;
    n += 1;
  }
  if (!n) return fallback;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/**
 * Paint out the old building under the new house footprint so only garden
 * surroundings remain around the exact 3D cutout.
 */
export function clearOldStructureUnderHouse(
  context: CanvasRenderingContext2D,
  photoWidth: number,
  photoHeight: number,
  house: SiteRect
) {
  const wipe = siteClearRect(house);
  const lawn = sampleBandColor(context, photoWidth, photoHeight * 0.72, Math.max(4, photoHeight * 0.28), {
    r: 90,
    g: 110,
    b: 70
  });
  const sky = sampleBandColor(context, photoWidth, 0, Math.max(4, photoHeight * 0.18), {
    r: 170,
    g: 185,
    b: 195
  });

  const gradient = context.createLinearGradient(0, wipe.y, 0, wipe.y + wipe.height);
  gradient.addColorStop(0, `rgb(${sky.r},${sky.g},${sky.b})`);
  gradient.addColorStop(
    0.4,
    `rgb(${Math.round((sky.r + lawn.r) / 2)},${Math.round((sky.g + lawn.g) / 2)},${Math.round((sky.b + lawn.b) / 2)})`
  );
  gradient.addColorStop(1, `rgb(${lawn.r},${lawn.g},${lawn.b})`);

  context.save();
  context.filter = `blur(${Math.max(8, Math.round(Math.min(photoWidth, photoHeight) * 0.02))}px)`;
  context.fillStyle = gradient;
  context.beginPath();
  const rx = Math.max(8, wipe.width * 0.08);
  const ry = Math.max(8, wipe.height * 0.06);
  context.roundRect(wipe.x, wipe.y, wipe.width, wipe.height, [rx, rx, ry, ry]);
  context.fill();
  context.restore();
  return wipe;
}

/** Soft contact shadow so the cutout reads as sitting on the ground. */
export function drawHouseContactShadow(
  context: CanvasRenderingContext2D,
  house: SiteRect
) {
  const cx = house.x + house.width / 2;
  const cy = house.y + house.height * 0.97;
  const rx = house.width * 0.42;
  const ry = Math.max(6, house.height * 0.045);
  context.save();
  context.fillStyle = 'rgba(20, 28, 22, 0.28)';
  context.beginPath();
  context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}
