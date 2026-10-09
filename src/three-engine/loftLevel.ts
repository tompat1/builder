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

/** Keep the loft stair near the original 58° pitch as the rise grows. */
export function loftStairRun(rise: number, interiorDepth: number): number {
  const preferred = rise / Math.tan((58 * Math.PI) / 180);
  const limit = Math.max(0.9, interiorDepth - 0.55);
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
  loftDepth: number
): { width: number; depth: number } {
  const targetWidth = type === 'curved' ? 1.35 : 0.75;
  const targetDepth = type === 'curved' ? 1.35 : 1.1;
  return {
    width: Math.min(targetWidth, Math.max(0.55, sectionWidth - 0.25)),
    depth: Math.min(targetDepth, Math.max(0.8, loftDepth - 0.5))
  };
}
