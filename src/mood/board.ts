/** A collage of pictures and clips kept beside the house, not inside its saved file. */

export const MOOD_LIMIT = 1000;
export const CAPTION_LIMIT = 500;
export const SRC_LIMIT = 180_000;

export type MoodKind = 'image' | 'clip' | 'note';
export type MoodClip = '' | 'youtube' | 'vimeo' | 'file';
export type MoodColor = 'yellow' | 'sand' | 'moss' | 'sky' | 'rose';

export interface MoodAuthor {
  name: string;
  avatar: string;
  email?: string;
}

export interface MoodParticipant {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  themes?: string[];
  joinedAt: string;
}

export interface MoodComment {
  id: string;
  pieceId: string;
  author: MoodAuthor;
  text: string;
  createdAt: string;
}

export interface MoodPiece {
  id: string;
  kind: MoodKind;
  src: string;
  clip: MoodClip;
  ref: string;
  x: number;
  y: number;
  w: number;
  tilt: number;
  caption: string;
  color?: MoodColor;
  author?: MoodAuthor;
  likes?: number;
  likedBy?: string[];
  comments?: MoodComment[];
}

export interface MoodLink {
  kind: MoodKind;
  src: string;
  clip: MoodClip;
  ref: string;
}

const ID = /^mood_[a-f0-9]{8,32}$/;
const YOUTUBE = /^[A-Za-z0-9_-]{6,16}$/;
const VIMEO = /^\d{6,12}$/;

export function moodId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `mood_${hex}`;
}

export function placeFor(index: number): Pick<MoodPiece, 'x' | 'y' | 'w' | 'tilt'> {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const xs = [3, 37, 68];
  const tilts = [-1.4, 1.2, -0.8, 0.9, -1.6, 1.5, -0.5, 1.1];
  const widths = [30, 28, 29, 31, 28, 30];
  const xJitter = ((index * 7) % 5) - 2;
  const yJitter = ((index * 11) % 6) - 3;
  const baseTilt = tilts[index % tilts.length];
  const baseW = widths[index % widths.length];

  return {
    x: clamp(xs[col] + xJitter, 2, 70),
    y: Math.max(4, Math.round(4 + row * 34 + yJitter)),
    w: baseW,
    tilt: baseTilt
  };
}

export function pieceFrom(link: MoodLink, index: number, caption = '', author?: MoodAuthor): MoodPiece {
  return {
    id: moodId(),
    ...link,
    ...placeFor(index),
    caption: caption.slice(0, CAPTION_LIMIT),
    ...(author ? { author } : {})
  };
}

/** A pasted address, a same-site picture, or a picture we already compressed. */
export function readLink(raw: string): MoodLink | null {
  const text = raw.trim();
  if (!text || text.length > SRC_LIMIT) return null;
  if (/^javascript:/i.test(text) || /^data:(?!image\/jpeg;base64,)/i.test(text)) return null;

  if (text.startsWith('data:image/jpeg;base64,')) {
    return text.length <= SRC_LIMIT ? { kind: 'image', src: text, clip: '', ref: '' } : null;
  }
  if (text.startsWith('local:') && ID.test(text.slice(6))) {
    return { kind: 'clip', src: text, clip: 'file', ref: '' };
  }
  if (text.startsWith('/') && !text.startsWith('//') && text.length < 300 && !text.includes(' ')) {
    return { kind: 'image', src: text, clip: '', ref: '' };
  }

  const url = asHttps(text);
  if (!url) return null;

  const youtube = youtubeId(url);
  if (youtube) {
    return { kind: 'clip', src: url.toString(), clip: 'youtube', ref: youtube };
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return { kind: 'clip', src: url.toString(), clip: 'vimeo', ref: vimeo };
  }

  const path = url.pathname.toLowerCase();
  const video = /\.(mp4|webm|mov|ogv|m4v)$/.test(path);
  return {
    kind: video ? 'clip' : 'image',
    src: url.toString(),
    clip: video ? 'file' : '',
    ref: ''
  };
}

export function acceptMood(value: unknown): MoodPiece[] {
  let list: unknown[] = [];
  if (Array.isArray(value)) {
    list = value;
  } else if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).pieces)) {
    list = (value as Record<string, unknown>).pieces as unknown[];
  } else {
    return [];
  }
  const pieces: MoodPiece[] = [];
  for (const entry of list) {
    if (pieces.length >= MOOD_LIMIT) break;
    const piece = acceptPiece(entry);
    if (piece && !pieces.some((item) => item.id === piece.id)) pieces.push(piece);
  }
  return pieces;
}

export function acceptMoodBoard(value: unknown): {
  title: string;
  createdAt: string;
  pieces: MoodPiece[];
  participants?: MoodParticipant[];
} {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    const participants = acceptParticipants(rec.participants);
    return {
      title: typeof rec.title === 'string' ? rec.title.slice(0, 100) : '',
      createdAt: typeof rec.createdAt === 'string' ? rec.createdAt.slice(0, 50) : '',
      pieces: acceptMood(rec.pieces),
      ...(participants ? { participants } : {})
    };
  }
  return {
    title: '',
    createdAt: '',
    pieces: acceptMood(value)
  };
}

function acceptAuthor(value: unknown): MoodAuthor | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const rec = value as Record<string, unknown>;
  const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 60) : '';
  const avatar = typeof rec.avatar === 'string' ? rec.avatar.trim().slice(0, 50_000) : '';
  const email = typeof rec.email === 'string' ? rec.email.trim().slice(0, 120) : undefined;
  if (!name && !avatar) return undefined;
  return { name: name || 'Deltagare', avatar, ...(email ? { email } : {}) };
}

function acceptParticipants(value: unknown): MoodParticipant[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list: MoodParticipant[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id.slice(0, 64) : '';
    const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 60) : '';
    const avatar = typeof rec.avatar === 'string' ? rec.avatar.trim().slice(0, 50_000) : '';
    if (!id || !name) continue;
    list.push({
      id,
      name,
      avatar,
      email: typeof rec.email === 'string' ? rec.email.trim().slice(0, 120) : undefined,
      themes: Array.isArray(rec.themes) ? rec.themes.filter((t) => typeof t === 'string').slice(0, 3) : undefined,
      joinedAt: typeof rec.joinedAt === 'string' ? rec.joinedAt.slice(0, 50) : new Date().toISOString()
    });
  }
  return list.length > 0 ? list : undefined;
}

export function youtubeEmbed(ref: string) {
  return YOUTUBE.test(ref) ? `https://www.youtube-nocookie.com/embed/${ref}` : '';
}

export function youtubePoster(ref: string) {
  return YOUTUBE.test(ref) ? `https://i.ytimg.com/vi/${ref}/hqdefault.jpg` : '';
}

export function vimeoEmbed(ref: string) {
  return VIMEO.test(ref) ? `https://player.vimeo.com/video/${ref}?title=0&byline=0&portrait=0` : '';
}

function acceptComments(value: unknown): MoodComment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list: MoodComment[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id.slice(0, 64) : '';
    const pieceId = typeof rec.pieceId === 'string' ? rec.pieceId.slice(0, 64) : '';
    const text = typeof rec.text === 'string' ? rec.text.trim().slice(0, 1000) : '';
    const author = acceptAuthor(rec.author);
    if (!id || !text) continue;
    list.push({
      id,
      pieceId,
      author: author || { name: 'Deltagare', avatar: '' },
      text,
      createdAt: typeof rec.createdAt === 'string' ? rec.createdAt.slice(0, 50) : new Date().toISOString()
    });
    if (list.length >= 500) break;
  }
  return list.length > 0 ? list : undefined;
}

function acceptPiece(value: unknown): MoodPiece | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' && ID.test(record.id) ? record.id : '';
  if (!id) return null;
  const author = acceptAuthor(record.author);
  const comments = acceptComments(record.comments);
  const rawLikedBy = Array.isArray(record.likedBy)
    ? record.likedBy.filter((s): s is string => typeof s === 'string' && s.length <= 100).slice(0, 500)
    : undefined;
  const likes = typeof record.likes === 'number' && Number.isFinite(record.likes)
    ? Math.max(0, Math.floor(record.likes))
    : (rawLikedBy ? rawLikedBy.length : undefined);

  if (record.kind === 'note') {
    const rawColor = typeof record.color === 'string' ? record.color : 'yellow';
    const color: MoodColor = ['yellow', 'sand', 'moss', 'sky', 'rose'].includes(rawColor)
      ? (rawColor as MoodColor)
      : 'yellow';
    return {
      id,
      kind: 'note',
      src: '',
      clip: '',
      ref: '',
      color,
      x: clamp(Number(record.x), 0, 92),
      y: clamp(Number(record.y), 0, 100_000),
      w: clamp(Number(record.w), 14, 72),
      tilt: clamp(Number(record.tilt), -8, 8),
      caption: typeof record.caption === 'string' ? record.caption.trim().slice(0, CAPTION_LIMIT) : '',
      ...(author ? { author } : {}),
      ...(likes !== undefined ? { likes } : {}),
      ...(rawLikedBy && rawLikedBy.length > 0 ? { likedBy: rawLikedBy } : {}),
      ...(comments ? { comments } : {})
    };
  }

  const rawSrc = typeof record.src === 'string' ? record.src : '';
  const link = record.kind === 'image' && (rawSrc === '' || rawSrc.startsWith('asset:'))
    ? { kind: 'image' as const, src: '', clip: '' as const, ref: '' }
    : readLink(rawSrc);
  if (!link) return null;
  if (record.kind !== undefined && record.kind !== link.kind) return null;
  const clip = link.clip;
  const ref = link.ref;
  return {
    id,
    kind: link.kind,
    src: link.src,
    clip,
    ref,
    x: clamp(Number(record.x), 0, 92),
    y: clamp(Number(record.y), 0, 100_000),
    w: clamp(Number(record.w), 16, 72),
    tilt: clamp(Number(record.tilt), -8, 8),
    caption: typeof record.caption === 'string' ? record.caption.trim().slice(0, CAPTION_LIMIT) : '',
    ...(author ? { author } : {}),
    ...(likes !== undefined ? { likes } : {}),
    ...(rawLikedBy && rawLikedBy.length > 0 ? { likedBy: rawLikedBy } : {}),
    ...(comments ? { comments } : {})
  };
}

function asHttps(text: string): URL | null {
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:') return null;
  if (!url.hostname.includes('.')) return null;
  return url;
}

function youtubeId(url: URL) {
  const host = url.hostname.replace(/^www\./, '');
  let raw = '';
  if (host === 'youtu.be') raw = url.pathname.split('/').filter(Boolean)[0] ?? '';
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') raw = url.searchParams.get('v') ?? '';
    else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') raw = parts[1] ?? '';
    }
  }
  return YOUTUBE.test(raw) ? raw : '';
}

function vimeoId(url: URL) {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return '';
  const parts = url.pathname.split('/').filter(Boolean);
  const raw = parts[0] === 'video' ? parts[1] ?? '' : parts[0] ?? '';
  return VIMEO.test(raw) ? raw : '';
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
