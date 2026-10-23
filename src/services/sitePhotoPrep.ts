/**
 * Wipe the old building from a garden photo before site AI compositing.
 * Flux latches onto the existing shed silhouette; a cleared footprint forces
 * the model to insert the configured 3D house instead of recoloring the old one.
 */

export type SitePlacement = { x: number; y: number };

/** Bounding box (px) covering the old structure above the ground-contact pin. */
export function oldStructureClearRect(
  placement: SitePlacement,
  width: number,
  height: number
): { x: number; y: number; w: number; h: number } {
  const cx = (Math.max(5, Math.min(95, placement.x)) / 100) * width;
  const cy = (Math.max(10, Math.min(95, placement.y)) / 100) * height;
  // Wide enough for terrace + sauna + tub; tall enough for a pulpettak shell.
  const w = Math.min(width * 0.72, Math.max(width * 0.42, width * 0.55));
  const h = Math.min(height * 0.62, Math.max(height * 0.38, height * 0.5));
  const x = Math.max(0, Math.min(width - w, cx - w * 0.5));
  // Pin is ground contact — most of the mass sits above it.
  const y = Math.max(0, Math.min(height - h * 0.15, cy - h * 0.9));
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(Math.min(w, width - x)),
    h: Math.round(Math.min(h, height - y))
  };
}

function sampleLawnColor(context: CanvasRenderingContext2D, width: number, height: number) {
  const bandTop = Math.floor(height * 0.72);
  const bandH = Math.max(4, height - bandTop);
  const data = context.getImageData(0, bandTop, width, bandH).data;
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
  if (!n) return { r: 90, g: 110, b: 70 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function sampleSkyColor(context: CanvasRenderingContext2D, width: number, height: number) {
  const bandH = Math.max(4, Math.floor(height * 0.18));
  const data = context.getImageData(0, 0, width, bandH).data;
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
  if (!n) return { r: 170, g: 185, b: 195 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/**
 * Paint out the old house with a soft lawn/sky gradient so image 0 keeps the
 * garden context but no building silhouette for the model to cling to.
 */
export function clearOldStructureFromCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  placement: SitePlacement
) {
  const rect = oldStructureClearRect(placement, width, height);
  const lawn = sampleLawnColor(context, width, height);
  const sky = sampleSkyColor(context, width, height);

  const gradient = context.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  gradient.addColorStop(0, `rgb(${sky.r},${sky.g},${sky.b})`);
  gradient.addColorStop(0.35, `rgb(${Math.round((sky.r + lawn.r) / 2)},${Math.round((sky.g + lawn.g) / 2)},${Math.round((sky.b + lawn.b) / 2)})`);
  gradient.addColorStop(1, `rgb(${lawn.r},${lawn.g},${lawn.b})`);

  context.save();
  // Soft feather so the clear patch blends into the garden.
  context.filter = `blur(${Math.max(6, Math.round(Math.min(width, height) * 0.018))}px)`;
  context.fillStyle = gradient;
  context.beginPath();
  const rx = rect.w * 0.12;
  const ry = rect.h * 0.1;
  context.roundRect(rect.x, rect.y, rect.w, rect.h, [rx, rx, ry, ry]);
  context.fill();
  context.restore();

  // Light grass noise so the fill does not read as a hard cut-out.
  const noise = context.getImageData(rect.x, rect.y, rect.w, rect.h);
  for (let i = 0; i < noise.data.length; i += 4) {
    const jitter = ((i * 17) % 13) - 6;
    noise.data[i] = Math.max(0, Math.min(255, noise.data[i]! + jitter));
    noise.data[i + 1] = Math.max(0, Math.min(255, noise.data[i + 1]! + jitter));
    noise.data[i + 2] = Math.max(0, Math.min(255, noise.data[i + 2]! + jitter));
  }
  context.putImageData(noise, rect.x, rect.y);

  return rect;
}
