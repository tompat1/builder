/** Ask the worker for a picture. The 3D house is left alone. */

export type SiteFacing = 'front' | 'back' | 'left' | 'right';

export async function requestHousePicture(
  parts: string[],
  images: string[],
  facts: string,
  revision?: { originalParts: string[] },
  scene?: {
    mode: 'site';
    placement: { x: number; y: number };
    aspectRatio: number;
    facing: SiteFacing;
  }
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

export function requestSitePicture(
  images: string[],
  facts: string,
  placement: { x: number; y: number },
  aspectRatio: number,
  facing: SiteFacing
) {
  return requestHousePicture([], images, facts, undefined, {
    mode: 'site',
    placement,
    aspectRatio,
    facing
  });
}

const HOUSE_IMAGE_LIMIT = 270_000;

function encodeCanvas(source: HTMLCanvasElement | undefined) {
  if (!source || source.width < 2 || source.height < 2) return '';
  const attempts = [
    { maxSide: 640, quality: 0.78 },
    { maxSide: 480, quality: 0.68 },
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

/** Capture the configured house from the side the site photo was taken. */
export function captureHouseReference(facing: SiteFacing = 'front'): string {
  const scene = (window as unknown as {
    __houseScene?: {
      getCanvas?: () => HTMLCanvasElement;
      renderStill?: () => void;
      prepareFacingCapture?: (facing: SiteFacing) => () => void;
    };
  }).__houseScene;
  const restore = scene?.prepareFacingCapture?.(facing);
  try {
    scene?.renderStill?.();
    return encodeCanvas(scene?.getCanvas?.());
  } finally {
    restore?.();
  }
}
