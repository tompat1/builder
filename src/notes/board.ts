/** Paper notes on the house board. A note sits on the board, or follows one part of the house. */

export const NOTE_COLORS = ['sand', 'moss', 'sky'] as const;
export const NOTE_WIDTH = 176;
export const NOTE_HEIGHT = 156;
export const NOTE_WIDTH_MIN = 132;
export const NOTE_WIDTH_MAX = 280;
export const NOTE_HEIGHT_MIN = 120;
export const NOTE_HEIGHT_MAX = 260;
export type NoteColor = (typeof NOTE_COLORS)[number];
export const NOTE_LIMIT = 24;
export const NOTE_TEXT_LIMIT = 240;
export type NoteScope = 'outside' | 'inside';

export type NoteWall = 'front' | 'back' | 'left' | 'right';

export type NoteLink =
  | { kind: 'board' }
  | { kind: 'roof' }
  | { kind: 'floor' }
  | { kind: 'loft' }
  | { kind: 'wall'; wall: NoteWall }
  | { kind: 'slot'; slotId: string };

/** A point on the house, in metres, and the facing of the panel it sticks to. */
export interface NotePin {
  x: number;
  y: number;
  z: number;
  nx?: number;
  ny?: number;
  nz?: number;
  /** View where the sheet was attached. Older pins without this field are exterior. */
  scope?: NoteScope;
}

export interface HouseNote {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  link: NoteLink;
  pin: NotePin | null;
  /** Paper size in CSS pixels. The stuck sheet uses the same box. */
  width: number;
  height: number;
}

const WALLS = new Set<NoteWall>(['front', 'back', 'left', 'right']);
const SLOT_ID = /^(front|back|left|right)-\d+u?$/;
const NOTE_ID = /^note_[a-z0-9]{8,40}$/i;

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function noteTargetId(link: NoteLink): string | null {
  if (link.kind === 'board') return null;
  if (link.kind === 'wall') return `wall-${link.wall}`;
  if (link.kind === 'slot') return `slot:${link.slotId}`;
  return link.kind;
}

/** Exterior sheets never bleed into the cutaway interior view. */
export function noteVisibleInView(note: HouseNote, viewMode: 'utsida' | 'insida' | 'blueprint') {
  if (viewMode !== 'insida') return true;
  if (note.pin) return note.pin.scope === 'inside';
  return note.link.kind === 'board' || note.link.kind === 'floor' || note.link.kind === 'loft';
}

export function parseNoteLink(value: unknown): NoteLink {
  if (!value || typeof value !== 'object') return { kind: 'board' };
  const link = value as { kind?: string; wall?: string; slotId?: string };
  if (link.kind === 'roof' || link.kind === 'floor' || link.kind === 'loft' || link.kind === 'board') {
    return { kind: link.kind };
  }
  if (link.kind === 'wall' && WALLS.has(link.wall as NoteWall)) {
    return { kind: 'wall', wall: link.wall as NoteWall };
  }
  if (link.kind === 'slot' && typeof link.slotId === 'string' && SLOT_ID.test(link.slotId)) {
    return { kind: 'slot', slotId: link.slotId };
  }
  return { kind: 'board' };
}

export function linkToValue(link: NoteLink) {
  if (link.kind === 'wall') return `wall:${link.wall}`;
  if (link.kind === 'slot') return `slot:${link.slotId}`;
  return link.kind;
}

export function linkFromValue(value: string): NoteLink {
  if (value.startsWith('wall:')) return parseNoteLink({ kind: 'wall', wall: value.slice(5) });
  if (value.startsWith('slot:')) return parseNoteLink({ kind: 'slot', slotId: value.slice(5) });
  return parseNoteLink({ kind: value });
}

export function parseNotePin(value: unknown): NotePin | null {
  if (!value || typeof value !== 'object') return null;
  const pin = value as { x?: unknown; y?: unknown; z?: unknown };
  const x = Number(pin.x);
  const y = Number(pin.y);
  const z = Number(pin.z);
  if (![x, y, z].every((item) => Number.isFinite(item))) return null;
  const stuck: NotePin = {
    x: clamp(x, -20, 20, 0),
    y: clamp(y, -20, 20, 0),
    z: clamp(z, -20, 20, 0)
  };
  const nx = Number((pin as { nx?: unknown }).nx);
  const ny = Number((pin as { ny?: unknown }).ny);
  const nz = Number((pin as { nz?: unknown }).nz);
  if ([nx, ny, nz].every((item) => Number.isFinite(item)) && nx * nx + ny * ny + nz * nz > 0.25) {
    stuck.nx = clamp(nx, -1, 1, 0);
    stuck.ny = clamp(ny, -1, 1, 0);
    stuck.nz = clamp(nz, -1, 1, 1);
  }
  const scope = (pin as { scope?: unknown }).scope;
  if (scope === 'outside' || scope === 'inside') stuck.scope = scope;
  return stuck;
}

export function acceptNotes(value: unknown): HouseNote[] {
  if (!Array.isArray(value)) return [];
  const notes: HouseNote[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<HouseNote>;
    if (typeof row.id !== 'string' || !NOTE_ID.test(row.id)) continue;
    const color = NOTE_COLORS.includes(row.color as NoteColor) ? (row.color as NoteColor) : 'sand';
    notes.push({
      id: row.id,
      text: String(row.text ?? '').slice(0, NOTE_TEXT_LIMIT),
      color,
      x: clamp(Number(row.x), 2, 90, 8),
      y: clamp(Number(row.y), 2, 86, 36),
      offsetX: clamp(Number(row.offsetX), -480, 480, 20),
      offsetY: clamp(Number(row.offsetY), -480, 480, -128),
      link: parseNoteLink(row.link),
      pin: parseNotePin(row.pin),
      width: clamp(Number(row.width), NOTE_WIDTH_MIN, NOTE_WIDTH_MAX, NOTE_WIDTH),
      height: clamp(Number(row.height), NOTE_HEIGHT_MIN, NOTE_HEIGHT_MAX, NOTE_HEIGHT)
    });
    if (notes.length >= NOTE_LIMIT) break;
  }
  return notes;
}

export function freshNote(index: number, id: string): HouseNote {
  return {
    id,
    text: '',
    color: NOTE_COLORS[index % NOTE_COLORS.length],
    x: 8 + (index % 3) * 8,
    y: 36 + (index % 4) * 8,
    offsetX: 64,
    offsetY: -56,
    link: { kind: 'board' },
    pin: null,
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT
  };
}
