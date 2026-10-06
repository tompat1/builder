/** A small picture of the open 3D house, kept beside each saved name. */

const THUMB_KEY = 'builder.house.thumbs';
const THUMB_LIMIT = 24_000;

export function acceptHouseThumb(value: unknown): string {
  if (typeof value !== 'string' || value.length < 32 || value.length > THUMB_LIMIT) return '';
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)) return '';
  return value;
}

function readMap(): Record<string, string> {
  try {
    const data = JSON.parse(localStorage.getItem(THUMB_KEY) || '{}') as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const thumbs: Record<string, string> = {};
    for (const [id, value] of Object.entries(data)) {
      const thumb = acceptHouseThumb(value);
      if (thumb) thumbs[id] = thumb;
    }
    return thumbs;
  } catch {
    return {};
  }
}

export function houseThumb(id: string): string {
  return readMap()[id] || '';
}

export function rememberHouseThumb(id: string, value: unknown) {
  const thumb = acceptHouseThumb(value);
  if (!id || !thumb) return;
  const thumbs = readMap();
  thumbs[id] = thumb;
  localStorage.setItem(THUMB_KEY, JSON.stringify(thumbs));
}

export function forgetHouseThumb(id: string) {
  const thumbs = readMap();
  if (!thumbs[id]) return;
  delete thumbs[id];
  localStorage.setItem(THUMB_KEY, JSON.stringify(thumbs));
}

export function captureHouseThumb(): string {
  try {
    const scene = (window as unknown as {
      __houseScene?: { getCanvas?: () => HTMLCanvasElement; renderStill?: () => void };
    }).__houseScene;
    scene?.renderStill?.();
    const source = scene?.getCanvas?.();
    if (!source || source.width < 2 || source.height < 2) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 144;
    const context = canvas.getContext('2d');
    if (!context) return '';
    const scale = Math.max(canvas.width / source.width, canvas.height / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const sharp = acceptHouseThumb(canvas.toDataURL('image/jpeg', 0.72));
    if (sharp) return sharp;
    return acceptHouseThumb(canvas.toDataURL('image/jpeg', 0.5));
  } catch {
    return '';
  }
}
