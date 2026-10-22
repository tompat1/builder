/** Top of the interior floor slab. The mesh is centred at 0.275 m and is 50 mm thick. */
export const INTERIOR_FLOOR_TOP = 0.3;

/** Wall studs stand on the slab. Door sills share this height. */
export const WALL_BASE = 0.25;

/** Ground-floor rooms sit on the slab. Anything higher was placed on the loft deck. */
export const LOFT_ROOM_MIN_Y = 1;

export function isLoftRoom(y: number) {
  return y > LOFT_ROOM_MIN_Y;
}

/** The interior overview ghosts the loft. The loft view keeps the deck solid. */
export function loftIsGhosted(
  viewMode: 'utsida' | 'insida' | 'blueprint',
  editingLoftRoom: boolean,
  loftView = false
) {
  return viewMode === 'insida' && !loftView && !editingLoftRoom;
}

/**
 * Loft wall studs are architectural framing inside the exterior walls.
 * They are hidden by default behind wall finishes / drywall, and only show
 * when the user explicitly clicks the view studs control (hiding inner walls).
 */
export function loftWallStudsVisible(
  showInnerWalls: boolean,
  viewMode: 'utsida' | 'insida' | 'blueprint',
  loftCutaway = false
): boolean {
  if (showInnerWalls) return false;
  return viewMode === 'insida' || loftCutaway;
}

/** Walking surface of the loft, measured up from the interior floor. */
export const LOFT_MIN_ABOVE_FLOOR = 2.5;

/** 45×195 mm loft joists. They hang below the deck. */
export const LOFT_JOIST = 0.195;

/** 28 mm floorboards on top of the joists. */
export const LOFT_FLOORBOARD = 0.028;

/** Head casing above a door opening. */
export const DOOR_CASING_HEAD = 0.1;

/**
 * Top of a door opening, in metres above the scene origin.
 * Matches the lower-panel door fit: at most 2.1 m tall, standing on the wall base.
 */
export function doorOpeningHead(wallHeight: number): number {
  const fullH = Math.max(0, wallHeight - WALL_BASE);
  const belt = wallHeight >= 4.5 ? 2.7 - WALL_BASE : 2.15;
  const lowerH = Math.min(belt, fullH);
  const doorH = Math.min(2.1, Math.max(1.7, lowerH - 0.085 - 0.06));
  return WALL_BASE + doorH;
}

/** Top of the door's upper frame, including the head casing. */
export function doorFrameTop(wallHeight: number): number {
  return doorOpeningHead(wallHeight) + DOOR_CASING_HEAD;
}

/**
 * Height of the joist tops. Floorboards sit on this, so the walking surface is
 * at least 2.5 m above the interior floor, and the joists clear the door frame.
 */
export function loftJoistTop(wallHeight: number): number {
  const walk = INTERIOR_FLOOR_TOP + LOFT_MIN_ABOVE_FLOOR;
  const forDeck = walk - LOFT_FLOORBOARD;
  const forDoor = doorFrameTop(wallHeight) + LOFT_JOIST;
  return Math.max(forDeck, forDoor);
}

/** Walking surface: joist tops plus the floorboards. */
export function loftWalkY(wallHeight: number): number {
  return loftJoistTop(wallHeight) + LOFT_FLOORBOARD;
}

/** Y rotation that turns a left-hand loft into one against the front or back wall. */
export function loftEndRotation(placement: 'fram' | 'bak') {
  return placement === 'fram' ? Math.PI / 2 : -Math.PI / 2;
}

/** A point built as a left loft, with width and depth swapped, landed in the house. */
export function loftEndPoint(placement: 'fram' | 'bak', x: number, z: number) {
  const turn = loftEndRotation(placement);
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  return { x: x * c + z * s, z: -x * s + z * c };
}

/** Keep the loft stair near the original 58° pitch while it reaches into the open room. */
export function loftStairRun(rise: number, clearDistance: number): number {
  const preferred = rise / Math.tan((58 * Math.PI) / 180);
  const limit = Math.max(0.9, clearDistance - 0.2);
  return Math.min(Math.max(preferred, 0.9), limit);
}

/** Treads between the floor and the loft, with risers near 190 mm. */
export function loftStairTreads(rise: number): number {
  const risers = Math.max(6, Math.round(rise / 0.19));
  return Math.max(5, risers - 1);
}

/** Clear floor opening at either end of the inner loft edge. */
export function loftStairOpening(
  type: 'straight' | 'curved',
  sectionWidth: number,
  loftDepth: number
): { width: number; depth: number } {
  const sideClear = 0.2;
  if (type === 'curved') {
    const side = Math.min(1.4, Math.max(1.1, Math.min(sectionWidth - 0.35, loftDepth - 0.7)));
    return {
      width: Math.min(side, Math.max(0.9, sectionWidth - sideClear)),
      depth: Math.min(side, Math.max(0.95, loftDepth - 0.45))
    };
  }
  // Depth along the loft edge is the clear stair width; 1.06 → ~0.9 m treads.
  const width = Math.min(1.1, Math.max(0.85, sectionWidth - 0.35));
  const depth = Math.min(1.06, Math.max(0.9, Math.min(1.06, loftDepth - 0.45)));
  return {
    width: Math.min(width, Math.max(0.85, sectionWidth - sideClear)),
    depth: Math.min(depth, Math.max(0.9, loftDepth - sideClear))
  };
}

export interface StraightLoftStair {
  /** Bottom step in the open room. */
  xBottom: number;
  /** Top landing inside the loft opening. */
  xTop: number;
  z: number;
  width: number;
  yBottom: number;
  yTop: number;
}

/**
 * Straight flight from the loft opening into the room. The top lands inside
 * the deck edge and the bottom projects perpendicular to the loft, not toward
 * the nearest exterior wall.
 */
export function straightLoftStair(args: {
  edgeX: number;
  /** +1 when the open floor is toward +X. */
  openSign: number;
  stairZ: number;
  opening: { width: number; depth: number };
  run: number;
  rise: number;
}): StraightLoftStair {
  // Standard clear width ≈ 900 mm when the loft opening allows it.
  const width = Math.min(0.9, Math.max(0.48, args.opening.depth - 0.16));
  const xTop = args.edgeX - args.openSign * args.opening.width;
  return {
    xBottom: xTop + args.openSign * args.run,
    xTop,
    z: args.stairZ,
    width,
    yBottom: INTERIOR_FLOOR_TOP,
    yTop: INTERIOR_FLOOR_TOP + args.rise
  };
}

export interface CurvedLoftStair {
  centerX: number;
  centerZ: number;
  radius: number;
  /** Top step points into the loft deck. */
  topAngle: number;
  sweep: number;
  /** +1 winds so the bottom step faces the open floor. */
  direction: number;
  yBottom: number;
  yTop: number;
}

/** Spiral kept inside the well, with the top step at the deck edge. */
export function curvedLoftStair(args: {
  edgeX: number;
  openSign: number;
  stairZ: number;
  opening: { width: number; depth: number };
  rise: number;
}): CurvedLoftStair {
  const radius = Math.max(
    0.36,
    Math.min(0.5, args.opening.width / 2 - 0.1, args.opening.depth / 2 - 0.08)
  );
  return {
    centerX: args.edgeX - args.openSign * (args.opening.width - radius),
    centerZ: args.stairZ,
    radius,
    topAngle: args.openSign > 0 ? Math.PI : 0,
    sweep: Math.PI * 1.15,
    direction: args.openSign,
    yBottom: INTERIOR_FLOOR_TOP,
    yTop: INTERIOR_FLOOR_TOP + args.rise
  };
}

export interface LoftBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  loftDepth: number;
}

/** Compute the footprint bounding box for rooms placed on the loft deck. */
export function loftDeckBounds(
  widthM: number,
  depthM: number,
  loftAreaSqMeters: number,
  placement: 'fram' | 'bak' | 'vanster' | 'hoger' = 'vanster',
  isTwoLofts = false,
  isConcrete = false
): LoftBounds {
  const wt = 0.18;
  const hx = Math.max(widthM / 2 - wt, 0.5);
  const hz = Math.max(depthM / 2 - wt, 0.5);

  const endOn = !isTwoLofts && (placement === 'fram' || placement === 'bak');
  const w = endOn ? depthM : widthM;
  const interiorW = w - wt * 2;

  const houseAreaRef = isConcrete
    ? (widthM * depthM)
    : (widthM === 4.8 ? 13.7
      : widthM === 5.8 ? 22.8
      : widthM === 8.0 ? 36.5
      : 27.38);

  const areaFraction = Math.min(1.0, Math.max(0.25, loftAreaSqMeters / houseAreaRef));

  if (isTwoLofts) {
    const eachW = Math.min(interiorW * 0.42, (interiorW * areaFraction) / 2);
    return {
      minX: -hx,
      maxX: hx,
      minZ: -hz,
      maxZ: hz,
      loftDepth: eachW
    };
  }

  const loftW = interiorW * areaFraction;

  if (placement === 'fram') {
    return {
      minX: -hx,
      maxX: hx,
      minZ: hz - loftW,
      maxZ: hz,
      loftDepth: loftW
    };
  }
  if (placement === 'bak') {
    return {
      minX: -hx,
      maxX: hx,
      minZ: -hz,
      maxZ: -hz + loftW,
      loftDepth: loftW
    };
  }
  if (placement === 'hoger') {
    return {
      minX: hx - loftW,
      maxX: hx,
      minZ: -hz,
      maxZ: hz,
      loftDepth: loftW
    };
  }
  return {
    minX: -hx,
    maxX: -hx + loftW,
    minZ: -hz,
    maxZ: hz,
    loftDepth: loftW
  };
}

export interface LoftRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface LoftRoomBox {
  x: number;
  z: number;
  w: number;
  d: number;
  wallsVisible?: boolean;
}

/**
 * Stair floor opening in house-local coordinates for a side loft (vanster / hoger).
 * Front/back decks use the same numbers before the host rotation is applied.
 */
export function loftStairClearRect(args: {
  edgeX: number;
  openSign: 1 | -1;
  stairZ: number;
  opening: { width: number; depth: number };
}): LoftRect {
  const towardLoft = -args.openSign;
  const x0 = args.edgeX;
  const x1 = args.edgeX + towardLoft * args.opening.width;
  return {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minZ: args.stairZ - args.opening.depth / 2,
    maxZ: args.stairZ + args.opening.depth / 2
  };
}

/** Stair keep-out on the deck from loft bounds and stair options (no scene required). */
export function loftStairClearOnDeck(args: {
  loft: LoftBounds;
  placement: 'fram' | 'bak' | 'vanster' | 'hoger';
  stairPosition: 'front' | 'middle' | 'back';
  stairType: 'straight' | 'curved';
  hasStair: boolean;
}): LoftRect | null {
  if (!args.hasStair) return null;
  const { loft, placement } = args;
  const spanX = loft.maxX - loft.minX;
  const spanZ = loft.maxZ - loft.minZ;
  const sectionW = Math.min(spanX, spanZ);
  const loftEdge = Math.max(spanX, spanZ);
  const opening = loftStairOpening(args.stairType, sectionW, loftEdge);
  const endSign = args.stairPosition === 'back' ? -1 : 1;
  const sideLoft = placement === 'vanster' || placement === 'hoger';

  if (sideLoft) {
    const openSign: 1 | -1 = placement === 'vanster' ? 1 : -1;
    const edgeX = placement === 'vanster' ? loft.maxX : loft.minX;
    const stairZ = args.stairPosition === 'middle'
      ? (loft.minZ + loft.maxZ) / 2
      : endSign * ((loft.maxZ - loft.minZ) / 2 - opening.depth / 2);
    return loftStairClearRect({ edgeX, openSign, stairZ, opening });
  }

  const openSign: 1 | -1 = placement === 'fram' ? -1 : 1;
  const edgeZ = placement === 'fram' ? loft.minZ : loft.maxZ;
  const stairX = args.stairPosition === 'middle'
    ? (loft.minX + loft.maxX) / 2
    : endSign * ((loft.maxX - loft.minX) / 2 - opening.depth / 2);
  const towardLoft = -openSign;
  const z0 = edgeZ;
  const z1 = edgeZ + towardLoft * opening.width;
  return {
    minX: stairX - opening.depth / 2,
    maxX: stairX + opening.depth / 2,
    minZ: Math.min(z0, z1),
    maxZ: Math.max(z0, z1)
  };
}

/**
 * Grow a loft bedroom to fill the deck zone that contains the click, keeping the
 * stair opening clear. Walls replace the guard rail on the open edge.
 */
export function maximizeLoftBedroom(args: {
  x: number;
  z: number;
  loft: LoftBounds;
  stair?: LoftRect | null;
}): { x: number; z: number; w: number; d: number } {
  const { loft } = args;
  const spanX = loft.maxX - loft.minX;
  const spanZ = loft.maxZ - loft.minZ;
  if (spanX < 0.4 || spanZ < 0.4) {
    return { x: args.x, z: args.z, w: Math.max(spanX, 0.5), d: Math.max(spanZ, 0.5) };
  }

  const stair = args.stair;
  const alongX = spanX >= spanZ;
  const zones: LoftRect[] = [];

  if (stair) {
    if (alongX) {
      // Long axis is X (front/back loft): split left/right of the stair.
      if (stair.minX > loft.minX + 0.35) {
        zones.push({ minX: loft.minX, maxX: stair.minX, minZ: loft.minZ, maxZ: loft.maxZ });
      }
      if (stair.maxX < loft.maxX - 0.35) {
        zones.push({ minX: stair.maxX, maxX: loft.maxX, minZ: loft.minZ, maxZ: loft.maxZ });
      }
    } else {
      // Long axis is Z (side loft): split front/back of the stair.
      if (stair.minZ > loft.minZ + 0.35) {
        zones.push({ minX: loft.minX, maxX: loft.maxX, minZ: loft.minZ, maxZ: stair.minZ });
      }
      if (stair.maxZ < loft.maxZ - 0.35) {
        zones.push({ minX: loft.minX, maxX: loft.maxX, minZ: stair.maxZ, maxZ: loft.maxZ });
      }
    }
  }

  if (zones.length === 0) {
    zones.push({ minX: loft.minX, maxX: loft.maxX, minZ: loft.minZ, maxZ: loft.maxZ });
  }

  const contains = (zone: LoftRect) =>
    args.x >= zone.minX && args.x <= zone.maxX && args.z >= zone.minZ && args.z <= zone.maxZ;
  let zone = zones.find(contains) ?? zones[0];
  let best = Infinity;
  for (const candidate of zones) {
    const cx = (candidate.minX + candidate.maxX) / 2;
    const cz = (candidate.minZ + candidate.maxZ) / 2;
    const dist = (args.x - cx) ** 2 + (args.z - cz) ** 2;
    if (dist < best) {
      best = dist;
      zone = candidate;
    }
  }

  const w = Math.max(0.9, zone.maxX - zone.minX);
  const d = Math.max(0.9, zone.maxZ - zone.minZ);
  return {
    w,
    d,
    x: (zone.minX + zone.maxX) / 2,
    z: (zone.minZ + zone.maxZ) / 2
  };
}

const OPEN_EDGE_TOL = 0.22;

/**
 * Along-edge spans where a walled loft bedroom replaces the guard rail.
 * `along` is Z for side lofts and X for front/back lofts (house-local).
 */
export function loftRailBlockedSpans(
  rooms: LoftRoomBox[],
  loft: LoftBounds,
  placement: 'fram' | 'bak' | 'vanster' | 'hoger'
): { min: number; max: number }[] {
  const spans: { min: number; max: number }[] = [];
  const sideLoft = placement === 'vanster' || placement === 'hoger';
  for (const room of rooms) {
    if (room.wallsVisible === false) continue;
    const left = room.x - room.w / 2;
    const right = room.x + room.w / 2;
    const back = room.z - room.d / 2;
    const front = room.z + room.d / 2;
    if (sideLoft) {
      const onOpenEdge = placement === 'vanster'
        ? right >= loft.maxX - OPEN_EDGE_TOL
        : left <= loft.minX + OPEN_EDGE_TOL;
      if (!onOpenEdge) continue;
      if (front - back < 0.2) continue;
      spans.push({ min: back, max: front });
    } else {
      const onOpenEdge = placement === 'fram'
        ? back <= loft.minZ + OPEN_EDGE_TOL
        : front >= loft.maxZ - OPEN_EDGE_TOL;
      if (!onOpenEdge) continue;
      if (right - left < 0.2) continue;
      spans.push({ min: left, max: right });
    }
  }
  return mergeSpans(spans);
}

/** Subtract blocked spans from a rail segment; returns remaining pieces. */
export function subtractRailSpans(
  railMin: number,
  railMax: number,
  blocked: { min: number; max: number }[]
): { min: number; max: number }[] {
  let pieces = [{ min: railMin, max: railMax }];
  for (const gap of blocked) {
    const next: { min: number; max: number }[] = [];
    for (const piece of pieces) {
      if (gap.max <= piece.min || gap.min >= piece.max) {
        next.push(piece);
        continue;
      }
      if (gap.min > piece.min + 0.05) next.push({ min: piece.min, max: gap.min });
      if (gap.max < piece.max - 0.05) next.push({ min: gap.max, max: piece.max });
    }
    pieces = next;
  }
  return pieces.filter((p) => p.max - p.min > 0.08);
}

function mergeSpans(spans: { min: number; max: number }[]): { min: number; max: number }[] {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.min - b.min);
  const out: { min: number; max: number }[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.min <= last.max + 0.04) last.max = Math.max(last.max, cur.max);
    else out.push({ ...cur });
  }
  return out;
}
