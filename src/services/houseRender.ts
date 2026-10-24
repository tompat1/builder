/** Ask the worker for a picture. The 3D house is left alone. */

export type SiteFacing = 'front' | 'back' | 'left' | 'right';

type RenderScene = {
  mode: 'site';
  placement: { x: number; y: number };
  houseWidthPercent: number;
  aspectRatio: number;
  facing: SiteFacing;
} | {
  mode: 'house';
  facing: SiteFacing;
};

export async function requestHousePicture(
  parts: string[],
  images: string[],
  facts: string,
  revision?: { originalParts: string[] },
  scene?: RenderScene
): Promise<string> {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL
    || 'https://builder-knowledge.thomasrynell.workers.dev';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts,
        images,
        facts,
        revision: Boolean(revision),
        originalParts: revision?.originalParts ?? [],
        scene
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('render');
    const data = (await response.json()) as { image?: unknown };
    if (typeof data.image !== 'string' || !data.image.startsWith('data:image')) throw new Error('render');
    return data.image;
  } finally {
    clearTimeout(timer);
  }
}

export function requestTrueHousePicture(images: string[], facts: string, facing: SiteFacing) {
  return requestHousePicture([], images, facts, undefined, { mode: 'house', facing });
}

export function requestSitePicture(
  images: string[],
  facts: string,
  placement: { x: number; y: number },
  houseWidthPercent: number,
  aspectRatio: number,
  facing: SiteFacing
) {
  return requestHousePicture([], images, facts, undefined, {
    mode: 'site',
    placement,
    houseWidthPercent,
    aspectRatio,
    facing
  });
}

const HOUSE_IMAGE_LIMIT = 270_000;

function encodeCanvas(source: HTMLCanvasElement | undefined) {
  if (!source || source.width < 2 || source.height < 2) return '';
  const attempts = [
    { maxSide: 720, quality: 0.82 },
    { maxSide: 640, quality: 0.74 },
    { maxSide: 512, quality: 0.64 },
    { maxSide: 384, quality: 0.55 }
  ];
  let fallback = '';
  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.maxSide / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(64, Math.round(source.width * scale));
    canvas.height = Math.max(64, Math.round(source.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return '';
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    fallback = canvas.toDataURL('image/jpeg', attempt.quality);
    if (fallback.length <= HOUSE_IMAGE_LIMIT) return fallback;
  }
  return fallback.length <= HOUSE_IMAGE_LIMIT ? fallback : '';
}

/** True when a pixel is the cutout magenta key plate (or a soft edge of it). */
function isCutoutChroma(r: number, g: number, b: number, a: number) {
  if (a < 8) return true;
  // Magenta key #ff00ff — keep timber greens and warm woods solid.
  return r > 180 && b > 180 && g < 90 && r - g > 90 && b - g > 90;
}

/** Crop a keyed WebGL still to the configured building's visible pixels. */
function encodeTransparentCanvas(source: HTMLCanvasElement | undefined) {
  if (!source || source.width < 2 || source.height < 2) return '';
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return '';
  context.drawImage(source, 0, 0);

  let pixels: ImageData;
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return canvas.toDataURL('image/png');
  }
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i]!;
    const g = pixels.data[i + 1]!;
    const b = pixels.data[i + 2]!;
    const a = pixels.data[i + 3]!;
    if (isCutoutChroma(r, g, b, a)) {
      pixels.data[i + 3] = 0;
      continue;
    }
    const x = (i / 4) % canvas.width;
    const y = Math.floor(i / 4 / canvas.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) return '';
  context.putImageData(pixels, 0, 0);

  const pad = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.008));
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(canvas.width - 1, maxX + pad);
  maxY = Math.min(canvas.height - 1, maxY + pad);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const scale = Math.min(1, 1400 / Math.max(width, height));
  const cropped = document.createElement('canvas');
  cropped.width = Math.max(2, Math.round(width * scale));
  cropped.height = Math.max(2, Math.round(height * scale));
  const croppedContext = cropped.getContext('2d');
  if (!croppedContext) return '';
  croppedContext.drawImage(canvas, minX, minY, width, height, 0, 0, cropped.width, cropped.height);
  return cropped.toDataURL('image/png');
}

type HouseSceneBridge = {
  getCanvas?: () => HTMLCanvasElement;
  renderStill?: () => void;
  prepareFacingCapture?: (facing: SiteFacing) => () => void;
  prepareSiteCutoutCapture?: (facing: SiteFacing) => () => void;
  prepareOverviewCapture?: () => () => void;
};

function houseScene(): HouseSceneBridge | undefined {
  return (window as unknown as { __houseScene?: HouseSceneBridge }).__houseScene;
}

function captureWith(prepare?: () => (() => void) | undefined) {
  const scene = houseScene();
  const restore = prepare?.();
  try {
    scene?.renderStill?.();
    return encodeCanvas(scene?.getCanvas?.());
  } finally {
    restore?.();
  }
}

/** Capture the configured house from the side the site photo was taken. */
export function captureHouseReference(facing: SiteFacing = 'front'): string {
  const scene = houseScene();
  return captureWith(() => scene?.prepareFacingCapture?.(facing));
}

/** Elevated 3/4 still showing terrace, sauna, hot tub, and full roof. */
export function captureHouseOverview(): string {
  const scene = houseScene();
  return captureWith(() => scene?.prepareOverviewCapture?.());
}

/** Exact configured 3D house with a transparent background for draft placement. */
export function captureHouseCutout(facing: SiteFacing = 'front'): string {
  const scene = houseScene();
  const restore = scene?.prepareSiteCutoutCapture?.(facing);
  try {
    scene?.renderStill?.();
    return encodeTransparentCanvas(scene?.getCanvas?.());
  } finally {
    restore?.();
  }
}

export type SiteHouseReferences = {
  facade: string;
  overview: string;
  cutout: string;
};

/** Separate high-detail references plus a transparent cutout for the draft composite. */
export function captureSiteHouseReferences(facing: SiteFacing = 'front'): SiteHouseReferences {
  return {
    facade: captureHouseReference(facing),
    overview: captureHouseOverview(),
    cutout: captureHouseCutout(facing)
  };
}
