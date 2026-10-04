/** Reference photos must be at least 64px on both sides and under 512px. */

const MIN_SIDE = 64;
const MAX_SIDE = 480;

export function fitImageSize(width, height) {
  const sourceWidth = Math.max(1, Math.round(width));
  const sourceHeight = Math.max(1, Math.round(height));
  const down = Math.min(1, MAX_SIDE / Math.max(sourceWidth, sourceHeight));
  let fittedWidth = Math.max(1, Math.round(sourceWidth * down));
  let fittedHeight = Math.max(1, Math.round(sourceHeight * down));
  if (fittedWidth < MIN_SIDE || fittedHeight < MIN_SIDE) {
    const up = Math.max(MIN_SIDE / fittedWidth, MIN_SIDE / fittedHeight);
    fittedWidth = Math.round(fittedWidth * up);
    fittedHeight = Math.round(fittedHeight * up);
  }
  return {
    width: Math.min(fittedWidth, MAX_SIDE),
    height: Math.min(fittedHeight, MAX_SIDE)
  };
}
