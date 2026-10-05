/** Screen colours for a painted facade. RAL values are stand-ins, not certified chips. */

export type PaintSystem = 'rgb' | 'pantone' | 'cmyk' | 'hex' | 'ral';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface CustomPaint {
  hex: string;
  system: PaintSystem;
  pantone: string;
  ral: string;
}

export interface RalChip {
  code: string;
  name: string;
  hex: string;
}

/** Common exterior RAL Classic codes, as usual sRGB stand-ins. */
export const RAL_CLASSIC: RalChip[] = [
  { code: '1001', name: 'Beige', hex: '#c2b078' },
  { code: '1013', name: 'Oyster white', hex: '#e3d9c6' },
  { code: '1015', name: 'Light ivory', hex: '#e6d2b5' },
  { code: '1019', name: 'Grey beige', hex: '#9a8c73' },
  { code: '3009', name: 'Oxide red', hex: '#6d3b33' },
  { code: '3011', name: 'Brown red', hex: '#792423' },
  { code: '5008', name: 'Grey blue', hex: '#2f3a44' },
  { code: '6003', name: 'Olive green', hex: '#424f3b' },
  { code: '6005', name: 'Moss green', hex: '#0f4336' },
  { code: '6009', name: 'Fir green', hex: '#31372b' },
  { code: '6011', name: 'Reseda green', hex: '#6c7c59' },
  { code: '7001', name: 'Silver grey', hex: '#8a9597' },
  { code: '7012', name: 'Basalt grey', hex: '#4e5754' },
  { code: '7015', name: 'Slate grey', hex: '#434b4d' },
  { code: '7016', name: 'Anthracite grey', hex: '#383e42' },
  { code: '7021', name: 'Black grey', hex: '#23282b' },
  { code: '7022', name: 'Umbra grey', hex: '#4a453d' },
  { code: '7024', name: 'Graphite grey', hex: '#474a51' },
  { code: '7030', name: 'Stone grey', hex: '#8b8c7a' },
  { code: '7035', name: 'Light grey', hex: '#d7d7d7' },
  { code: '7039', name: 'Quartz grey', hex: '#6c6960' },
  { code: '7040', name: 'Window grey', hex: '#9da1aa' },
  { code: '7042', name: 'Traffic grey A', hex: '#8d948d' },
  { code: '7043', name: 'Traffic grey B', hex: '#4e5452' },
  { code: '8014', name: 'Sepia brown', hex: '#49392d' },
  { code: '8017', name: 'Chocolate brown', hex: '#45322e' },
  { code: '8019', name: 'Grey brown', hex: '#403a3a' },
  { code: '9001', name: 'Cream', hex: '#fdf4e3' },
  { code: '9003', name: 'Signal white', hex: '#f4f4f4' },
  { code: '9005', name: 'Jet black', hex: '#0a0a0a' },
  { code: '9010', name: 'Pure white', hex: '#f1ece1' },
  { code: '9011', name: 'Graphite black', hex: '#1c1c1c' },
  { code: '9016', name: 'Traffic white', hex: '#f6f6f6' }
];

const SYSTEMS = new Set<PaintSystem>(['rgb', 'pantone', 'cmyk', 'hex', 'ral']);

function clampByte(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split('').map((char) => char + char).join('').toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const normal = normalizeHex(hex) ?? '#000000';
  return {
    r: parseInt(normal.slice(1, 3), 16),
    g: parseInt(normal.slice(3, 5), 16),
    b: parseInt(normal.slice(5, 7), 16)
  };
}

export function rgbToHex(rgb: Rgb) {
  const part = (value: number) => clampByte(value).toString(16).padStart(2, '0');
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`;
}

export function rgbToHsv(rgb: Rgb) {
  const r = clampByte(rgb.r) / 255;
  const g = clampByte(rgb.g) / 255;
  const b = clampByte(rgb.b) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const sat = clampUnit(s);
  const val = clampUnit(v);
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: clampByte((r + m) * 255),
    g: clampByte((g + m) * 255),
    b: clampByte((b + m) * 255)
  };
}

export function rgbToCmyk(rgb: Rgb) {
  const r = clampByte(rgb.r) / 255;
  const g = clampByte(rgb.g) / 255;
  const b = clampByte(rgb.b) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const channel = (value: number) => Math.round(((1 - value - k) / (1 - k)) * 100);
  return { c: channel(r), m: channel(g), y: channel(b), k: Math.round(k * 100) };
}

export function cmykToRgb(c: number, m: number, y: number, k: number): Rgb {
  const scale = (value: number) => Math.min(100, Math.max(0, value)) / 100;
  const black = scale(k);
  const channel = (value: number) => clampByte(255 * (1 - scale(value)) * (1 - black));
  return { r: channel(c), g: channel(m), b: channel(y) };
}

export function lookupRal(code: string) {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 4) return null;
  return RAL_CLASSIC.find((chip) => chip.code === digits) ?? null;
}

export function nearestRal(hex: string) {
  const rgb = hexToRgb(hex);
  let best = RAL_CLASSIC[0];
  let distance = Number.POSITIVE_INFINITY;
  for (const chip of RAL_CLASSIC) {
    const other = hexToRgb(chip.hex);
    const gap = Math.hypot(rgb.r - other.r, rgb.g - other.g, rgb.b - other.b);
    if (gap < distance) {
      distance = gap;
      best = chip;
    }
  }
  return { ...best, distance };
}

/** Darker board tones so a painted facade still reads as timber. */
export function paintBoards(hex: string) {
  const base = hexToRgb(hex);
  const shade = (factor: number) => rgbToHex({
    r: base.r * factor,
    g: base.g * factor,
    b: base.b * factor
  });
  return { base: rgbToHex(base), grain: shade(0.82), darkGrain: shade(0.62) };
}

export function readableInk(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#1e293b' : '#ffffff';
}

export function paintTitle(paint: CustomPaint) {
  if (paint.ral) return `RAL ${paint.ral}`;
  const pantone = paint.pantone.trim();
  if (pantone) return pantone;
  return paint.hex.toUpperCase();
}

export function parseCustomPaint(value: unknown): CustomPaint | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<CustomPaint>;
  const hex = normalizeHex(String(row.hex ?? ''));
  if (!hex) return null;
  const system = SYSTEMS.has(row.system as PaintSystem) ? row.system as PaintSystem : 'hex';
  const pantone = String(row.pantone ?? '').replace(/[^\w -]/g, '').slice(0, 24);
  const ralCode = String(row.ral ?? '').replace(/\D/g, '');
  return {
    hex,
    system,
    pantone,
    ral: lookupRal(ralCode) ? ralCode : ''
  };
}
