/** Top of the interior floor slab. The mesh is centred at 0.275 m and is 50 mm thick. */
export const INTERIOR_FLOOR_TOP = 0.3;

/** Wall studs stand on the slab. Door sills share this height. */
export const WALL_BASE = 0.25;

/** Ground-floor rooms sit on the slab. Anything higher was placed on the loft deck. */
export const LOFT_ROOM_MIN_Y = 1;

export function isLoftRoom(y: number) {
  return y > LOFT_ROOM_MIN_Y;
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

/** Keep the loft stair near the original 58° pitch as the rise grows. */
export function loftStairRun(rise: number, interiorDepth: number): number {
  const preferred = rise / Math.tan((58 * Math.PI) / 180);
  // Leave deck behind the well, and air between the bottom step and the front wall.
  const limit = Math.max(0.9, interiorDepth - 0.95);
  return Math.min(Math.max(preferred, 0.9), limit);
}

/** Treads between the floor and the loft, with risers near 190 mm. */
export function loftStairTreads(rise: number): number {
  const risers = Math.max(6, Math.round(rise / 0.19));
  return Math.max(5, risers - 1);
}

/** Clear floor opening at the inner/front corner where the stair meets the loft. */
export function loftStairOpening(
  type: 'straight' | 'curved',
  sectionWidth: number,
  loftDepth: number,
  run = 1.45
): { width: number; depth: number } {
  const sideClear = 0.2;
  if (type === 'curved') {
    const side = Math.min(1.4, Math.max(1.1, Math.min(sectionWidth - 0.35, loftDepth - 0.7)));
    return {
      width: Math.min(side, Math.max(0.9, sectionWidth - sideClear)),
      depth: Math.min(side, Math.max(0.95, loftDepth - 0.45))
    };
  }
  const wanted = Math.max(run + 0.22, 1.05);
  const depth = Math.min(wanted, Math.max(0.85, loftDepth - 0.45));
  const width = Math.min(0.86, Math.max(0.72, sectionWidth - 0.35));
  return {
    width: Math.min(width, Math.max(0.6, sectionWidth - sideClear)),
    depth
  };
}

export interface StraightLoftStair {
  x: number;
  width: number;
  /** Bottom step, toward the front wall. */
  zBottom: number;
  /** Top landing, on the edge of the loft deck. */
  zTop: number;
  yBottom: number;
  yTop: number;
}

/**
 * Straight flight inside the front well. The top is the deck edge, so the
 * last step is onto the loft instead of into the wall or under the joists.
 */
export function straightLoftStair(args: {
  frontZ: number;
  edgeX: number;
  /** +1 when the open floor is toward +X. */
  openSign: number;
  opening: { width: number; depth: number };
  run: number;
  rise: number;
}): StraightLoftStair {
  const width = Math.min(0.58, Math.max(0.48, args.opening.width - 0.16));
  const zTop = args.frontZ - args.opening.depth;
  const zBottom = Math.min(args.frontZ - 0.12, zTop + args.run);
  return {
    x: args.edgeX - args.openSign * (args.opening.width / 2),
    width,
    zBottom,
    zTop,
    yBottom: INTERIOR_FLOOR_TOP,
    yTop: INTERIOR_FLOOR_TOP + args.rise
  };
}

export interface CurvedLoftStair {
  centerX: number;
  centerZ: number;
  radius: number;
  /** Top step points toward the deck (−Z). */
  topAngle: number;
  sweep: number;
  /** +1 winds so the bottom step faces the open floor. */
  direction: number;
  yBottom: number;
  yTop: number;
}

/** Spiral kept inside the well, with the top step at the deck edge. */
export function curvedLoftStair(args: {
  frontZ: number;
  edgeX: number;
  openSign: number;
  opening: { width: number; depth: number };
  rise: number;
}): CurvedLoftStair {
  const headerZ = args.frontZ - args.opening.depth;
  const radius = Math.max(
    0.36,
    Math.min(0.5, args.opening.width / 2 - 0.1, args.opening.depth / 2 - 0.08)
  );
  const centerZ = Math.min(headerZ + radius, args.frontZ - radius - 0.08);
  return {
    centerX: args.edgeX - args.openSign * (args.opening.width / 2),
    centerZ,
    radius,
    topAngle: -Math.PI / 2,
    sweep: Math.PI * 1.15,
    direction: args.openSign,
    yBottom: INTERIOR_FLOOR_TOP,
    yTop: INTERIOR_FLOOR_TOP + args.rise
  };
}
