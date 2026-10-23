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

function encodeDataUrl(dataUrl: string, maxSide: number, quality: number) {
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(64, Math.round(image.width * scale));
      canvas.height = Math.max(64, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve('');
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => resolve('');
    image.src = dataUrl;
  });
}

/** Side-by-side facade + overview so one reference image carries terrace/sauna/tub. */
export async function joinHouseReferencePanels(facingPanel: string, overviewPanel: string) {
  if (!facingPanel) return '';
  if (!overviewPanel) return facingPanel;

  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image'));
      image.src = src;
    });

  try {
    const [left, right] = await Promise.all([load(facingPanel), load(overviewPanel)]);
    const panelH = Math.max(left.height, right.height);
    const leftW = Math.round((left.width / left.height) * panelH);
    const rightW = Math.round((right.width / right.height) * panelH);
    const canvas = document.createElement('canvas');
    canvas.width = leftW + rightW + 8;
    canvas.height = panelH;
    const context = canvas.getContext('2d');
    if (!context) return facingPanel;
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(left, 0, 0, leftW, panelH);
    context.drawImage(right, leftW + 8, 0, rightW, panelH);
    const attempts = [
      { maxSide: 960, quality: 0.8 },
      { maxSide: 800, quality: 0.72 },
      { maxSide: 640, quality: 0.62 },
      { maxSide: 512, quality: 0.55 }
    ];
    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxSide / Math.max(canvas.width, canvas.height));
      const out = document.createElement('canvas');
      out.width = Math.max(64, Math.round(canvas.width * scale));
      out.height = Math.max(64, Math.round(canvas.height * scale));
      const outContext = out.getContext('2d');
      if (!outContext) return facingPanel;
      outContext.drawImage(canvas, 0, 0, out.width, out.height);
      const dataUrl = out.toDataURL('image/jpeg', attempt.quality);
      if (dataUrl.length <= HOUSE_IMAGE_LIMIT) return dataUrl;
    }
    return facingPanel;
  } catch {
    return facingPanel;
  }
}

type HouseSceneBridge = {
  getCanvas?: () => HTMLCanvasElement;
  renderStill?: () => void;
  prepareFacingCapture?: (facing: SiteFacing) => () => void;
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

/**
 * One house reference for site placement: matching facade on the left, wider
 * overview (terrace / sauna / hot tub / roof) on the right.
 */
export async function captureSiteHouseReference(facing: SiteFacing = 'front'): Promise<string> {
  const facade = captureHouseReference(facing);
  if (!facade) return '';
  const overview = captureHouseOverview();
  if (!overview) return facade;
  const joined = await joinHouseReferencePanels(facade, overview);
  if (joined && joined.length <= HOUSE_IMAGE_LIMIT) return joined;
  // Prefer the overview alone if the diptych will not fit — attachments matter most.
  for (const attempt of [
    { maxSide: 640, quality: 0.72 },
    { maxSide: 512, quality: 0.6 },
    { maxSide: 384, quality: 0.52 }
  ]) {
    const shrunk = await encodeDataUrl(overview, attempt.maxSide, attempt.quality);
    if (shrunk && shrunk.length <= HOUSE_IMAGE_LIMIT) return shrunk;
  }
  return facade;
}
