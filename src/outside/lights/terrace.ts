/**
 * Recessed LED deck lights for terraces — warm dots along the outer edges,
 * spaced like common DIY deck-light kits (about 50–100 cm centres).
 */

/** Target centre-to-centre spacing along a free edge. */
export const TERRACE_DECK_LIGHT_SPACING_M = 0.75;

/** Hard minimum between two deck lights (matches house fixture clearance). */
export const TERRACE_DECK_LIGHT_MIN_SPACING_M = 0.5;

/** Soft maximum — edges longer than this still fill evenly, just denser. */
export const TERRACE_DECK_LIGHT_MAX_SPACING_M = 1.0;

/** Inset from the deck rim so the ring sits on a full board. */
export const TERRACE_DECK_LIGHT_EDGE_INSET_M = 0.14;

/** Corner keep-out so front/side runs do not stack two lights. */
export const TERRACE_DECK_LIGHT_CORNER_CLEAR_M = 0.45;

export interface TerraceDeckLightLocal {
  /** Along the wall (terrace local X). */
  x: number;
  /** Outward from the wall (terrace local Z, already signed). */
  z: number;
}

export interface TerraceDeckLightLayoutOpts {
  /** Deck width along the house wall. */
  width: number;
  /** Deck projection from the wall. */
  depth: number;
  /** Local X of the deck centre (door shift). */
  along?: number;
  /** +1 or −1 — same outward used when building the deck. */
  outward?: number;
  openLeft?: boolean;
  openRight?: boolean;
  spacing?: number;
}

/**
 * Evenly space points along [lo, hi], keeping end inset and ~target spacing.
 */
export function spacedAlongEdge(
  lo: number,
  hi: number,
  spacing = TERRACE_DECK_LIGHT_SPACING_M,
  endInset = TERRACE_DECK_LIGHT_EDGE_INSET_M
): number[] {
  const span = hi - lo;
  if (span < endInset * 2 + 0.2) return [];
  const innerLo = lo + endInset;
  const innerHi = hi - endInset;
  const inner = innerHi - innerLo;
  if (inner < 0.15) return [(innerLo + innerHi) / 2];

  const target = Math.min(
    TERRACE_DECK_LIGHT_MAX_SPACING_M,
    Math.max(TERRACE_DECK_LIGHT_MIN_SPACING_M, spacing)
  );
  const count = Math.max(1, Math.round(inner / target) + 1);
  if (count === 1) return [(innerLo + innerHi) / 2];

  const step = inner / (count - 1);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(innerLo + step * i);
  return out;
}

/**
 * Local deck-light positions on the front rim and open side rims.
 * Coordinates match `addTerrace` local space (x along wall, z outward).
 */
export function terraceDeckLightLocals(opts: TerraceDeckLightLayoutOpts): TerraceDeckLightLocal[] {
  const {
    width,
    depth,
    along = 0,
    outward = 1,
    openLeft = true,
    openRight = true,
    spacing = TERRACE_DECK_LIGHT_SPACING_M
  } = opts;
  if (width < 0.8 || depth < 0.6) return [];

  const left = along - width / 2;
  const right = along + width / 2;
  const frontZ = outward * (depth - TERRACE_DECK_LIGHT_EDGE_INSET_M);
  const sideStart = TERRACE_DECK_LIGHT_CORNER_CLEAR_M;
  const sideEnd = Math.max(sideStart + 0.2, depth - TERRACE_DECK_LIGHT_CORNER_CLEAR_M);
  const cornerClear = TERRACE_DECK_LIGHT_CORNER_CLEAR_M;

  const points: TerraceDeckLightLocal[] = [];
  const push = (x: number, z: number) => {
    if (
      points.some(
        (p) =>
          Math.hypot(p.x - x, p.z - z) < TERRACE_DECK_LIGHT_MIN_SPACING_M - 0.02
      )
    ) {
      return;
    }
    points.push({ x, z });
  };

  // Front (outer) edge — skip the outermost corners when a side run continues.
  const frontXs = spacedAlongEdge(left, right, spacing);
  for (const x of frontXs) {
    if (openLeft && x < left + cornerClear) continue;
    if (openRight && x > right - cornerClear) continue;
    push(x, frontZ);
  }

  if (openLeft) {
    const zs = spacedAlongEdge(sideStart, sideEnd, spacing);
    const x = left + TERRACE_DECK_LIGHT_EDGE_INSET_M;
    for (const zAbs of zs) push(x, outward * zAbs);
  }
  if (openRight) {
    const zs = spacedAlongEdge(sideStart, sideEnd, spacing);
    const x = right - TERRACE_DECK_LIGHT_EDGE_INSET_M;
    for (const zAbs of zs) push(x, outward * zAbs);
  }

  return points;
}
