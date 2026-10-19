/** Ask the worker for a picture. The 3D house is left alone. */

export async function requestHousePicture(
  parts: string[],
  images: string[],
  facts: string,
  revision?: { originalParts: string[] },
  scene?: {
    mode: 'site';
    placement: { x: number; y: number };
    aspectRatio: number;
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
  aspectRatio: number
) {
  return requestHousePicture([], images, facts, undefined, {
    mode: 'site',
    placement,
    aspectRatio
  });
}

/** Capture the configured 3D house from the camera the user is currently viewing. */
export function captureHouseReference(): string {
  const scene = (window as unknown as {
    __houseScene?: { getCanvas?: () => HTMLCanvasElement; renderStill?: () => void };
  }).__houseScene;
  scene?.renderStill?.();
  const source = scene?.getCanvas?.();
  if (!source || source.width < 2 || source.height < 2) return '';

  const attempts = [
    { maxSide: 640, quality: 0.78 },
    { maxSide: 480, quality: 0.68 }
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
    if (fallback.length <= 270_000) return fallback;
  }
  return fallback;
}
