/** Inner face of the 145 mm studs, behind 25 mm cladding. */
export const SHELL_INSET = 0.17;

/** Pull a nearby edge onto the shell so a corner room loses that partition. */
export const SHELL_SNAP = 0.2;

/** An edge this close to the shell is treated as the outer wall. */
export const SHELL_TOUCH = 0.04;

export interface RoomBox {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface ShellSides {
  left: boolean;
  right: boolean;
  front: boolean;
  back: boolean;
}

export interface RoomWallRun {
  size: number;
  center: number;
}

/**
 * Front and back walls own each corner. Side walls butt into them so two
 * shortened walls never leave a square hole where they meet.
 */
export function roomWallRuns(w: number, d: number, open: ShellSides, wallThick = 0.1) {
  const run = (length: number, trimStart: number, trimEnd: number): RoomWallRun => ({
    size: Math.max(length - trimStart - trimEnd, 0.05),
    center: (trimStart - trimEnd) / 2
  });
  return {
    front: run(w, 0, 0),
    back: run(w, 0, 0),
    left: run(d, open.back ? 0 : wallThick, open.front ? 0 : wallThick),
    right: run(d, open.back ? 0 : wallThick, open.front ? 0 : wallThick)
  };
}

export interface PlacedRoom {
  type: string;
  w: number;
  d: number;
  x: number;
  y: number;
  z: number;
  wallsVisible: boolean;
}

/** Restore room data while defaulting older saved rooms to their original closed state. */
export function acceptPlacedRooms(value: unknown): Record<string, PlacedRoom> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const rooms: Record<string, PlacedRoom> = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const numbers = [row.w, row.d, row.x, row.y, row.z].map(Number);
    if (typeof row.type !== 'string' || numbers.some((item) => !Number.isFinite(item))) continue;
    rooms[id] = {
      type: row.type,
      w: numbers[0],
      d: numbers[1],
      x: numbers[2],
      y: numbers[3],
      z: numbers[4],
      wallsVisible: row.wallsVisible !== false
    };
  }
  return rooms;
}

export function innerHalf(widthM: number, depthM: number) {
  return {
    hx: Math.max(widthM / 2 - SHELL_INSET, 0.5),
    hz: Math.max(depthM / 2 - SHELL_INSET, 0.5)
  };
}

export function roomFootprint(roomType: string) {
  if (roomType === 'bedroom') return { w: 3, d: 3 };
  if (roomType === 'kitchen') return { w: 3, d: 2 };
  if (roomType === 'storage') return { w: 1.5, d: 1.5 };
  return { w: 2, d: 2 };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Shrink and shift a room so it stays inside the stud line (or loft deck bounds), snapping near edges flush. */
export function fitRoom(box: RoomBox, hx: number, hz: number, bounds?: RoomBounds): RoomBox {
  const minX = bounds ? bounds.minX : -hx;
  const maxX = bounds ? bounds.maxX : hx;
  const minZ = bounds ? bounds.minZ : -hz;
  const maxZ = bounds ? bounds.maxZ : hz;

  const maxW = Math.max(maxX - minX, 0);
  const maxD = Math.max(maxZ - minZ, 0);
  const minW = Math.min(1, maxW);
  const minD = Math.min(1, maxD);

  let left = box.x - box.w / 2;
  let right = box.x + box.w / 2;
  let back = box.z - box.d / 2;
  let front = box.z + box.d / 2;

  if (Math.abs(left - minX) <= SHELL_SNAP) left = minX;
  if (Math.abs(right - maxX) <= SHELL_SNAP) right = maxX;
  if (Math.abs(back - minZ) <= SHELL_SNAP) back = minZ;
  if (Math.abs(front - maxZ) <= SHELL_SNAP) front = maxZ;

  let w = right - left;
  let d = front - back;
  if (!Number.isFinite(w) || w <= 0) w = box.w;
  if (!Number.isFinite(d) || d <= 0) d = box.d;
  w = Math.min(Math.max(w, minW), maxW);
  d = Math.min(Math.max(d, minD), maxD);

  const leftPinned = Math.abs(left - minX) <= 1e-6;
  const rightPinned = Math.abs(right - maxX) <= 1e-6;
  const backPinned = Math.abs(back - minZ) <= 1e-6;
  const frontPinned = Math.abs(front - maxZ) <= 1e-6;

  let x = leftPinned && rightPinned
    ? (minX + maxX) / 2
    : leftPinned
      ? minX + w / 2
      : rightPinned
        ? maxX - w / 2
        : clamp((left + right) / 2, minX + w / 2, maxX - w / 2);
  let z = backPinned && frontPinned
    ? (minZ + maxZ) / 2
    : backPinned
      ? minZ + d / 2
      : frontPinned
        ? maxZ - d / 2
        : clamp((back + front) / 2, minZ + d / 2, maxZ - d / 2);

  x = clamp(x, minX + w / 2, maxX - w / 2);
  z = clamp(z, minZ + d / 2, maxZ - d / 2);
  return { x, z, w, d };
}

export function shellSides(box: RoomBox, hx: number, hz: number): ShellSides {
  return {
    left: box.x - box.w / 2 <= -hx + SHELL_TOUCH,
    right: box.x + box.w / 2 >= hx - SHELL_TOUCH,
    back: box.z - box.d / 2 <= -hz + SHELL_TOUCH,
    front: box.z + box.d / 2 >= hz - SHELL_TOUCH
  };
}

export function roomInsideShell(box: RoomBox, hx: number, hz: number) {
  return box.x - box.w / 2 >= -hx - 1e-6
    && box.x + box.w / 2 <= hx + 1e-6
    && box.z - box.d / 2 >= -hz - 1e-6
    && box.z + box.d / 2 <= hz + 1e-6;
}

export interface BedLayout {
  bedW: number;
  bedD: number;
  bedX: number;
  bedZ: number;
}

/**
 * Positions and dimensions a bed securely inside a bedroom:
 * - Prevents beds from ever poking through outer shell walls or window facades
 * - Places headboard against interior partition walls
 * - Maintains generous clearance from exterior walls and windows
 * - Clamps bed coordinates to remain strictly within room and shell envelope
 */
export function bedroomBedPlacement(
  w: number,
  d: number,
  open: ShellSides,
  place?: { x?: number; y?: number; z?: number },
  shellLimits?: { hx: number; hz: number }
): BedLayout {
  const wallThick = 0.1;
  const wallInset = 0.12;
  const availW = Math.max(0.6, w - (open.left ? wallInset : wallThick) - (open.right ? wallInset : wallThick) - 0.04);
  const availD = Math.max(0.8, d - (open.back ? wallInset : wallThick) - (open.front ? wallInset : wallThick) - 0.04);

  // Standard double bed (1.6m wide x 2.0m deep) or sideways (2.0m wide x 1.4-1.6m deep) if room is wider than deep
  const sideways = availW >= 2.0 && availD < 2.2;
  const bedW = sideways ? Math.min(2.0, availW) : Math.min(1.6, availW);
  const bedD = sideways ? Math.min(1.6, availD) : Math.min(2.0, availD);

  const minX = -w / 2 + bedW / 2 + (open.left ? wallInset : wallThick + 0.02);
  const maxX = w / 2 - bedW / 2 - (open.right ? wallInset : wallThick + 0.02);
  let bedX = Math.min(maxX, Math.max(minX, 0));

  // Headboard sits against the interior partition or back wall, leaving walking space in front of the window
  const minZ = -d / 2 + bedD / 2 + (open.back ? wallInset : wallThick + 0.02);
  const maxZ = d / 2 - bedD / 2 - (open.front ? 0.25 : wallThick + 0.02);

  let bedZ = minZ;
  if (open.front && !open.back) {
    // Front window wall: keep bed against the back partition
    bedZ = minZ;
  } else if (open.back && !open.front) {
    bedZ = minZ;
  } else {
    bedZ = Math.min(maxZ, Math.max(minZ, (minZ + maxZ) / 2));
  }
  bedZ = Math.min(maxZ, Math.max(minZ, bedZ));

  // Strict absolute safeguard against house shell bounds
  if (place && shellLimits) {
    if (Number.isFinite(place.z)) {
      const maxAllowedZ = shellLimits.hz - 0.15;
      const minAllowedZ = -shellLimits.hz + 0.15;
      const worldFront = place.z! + bedZ + bedD / 2;
      if (worldFront > maxAllowedZ) {
        bedZ -= (worldFront - maxAllowedZ);
      }
      const worldBack = place.z! + bedZ - bedD / 2;
      if (worldBack < minAllowedZ) {
        bedZ += (minAllowedZ - worldBack);
      }
    }
    if (place.x !== undefined && Number.isFinite(place.x)) {
      const maxAllowedX = shellLimits.hx - 0.15;
      const minAllowedX = -shellLimits.hx + 0.15;
      const worldRight = place.x + bedX + bedW / 2;
      if (worldRight > maxAllowedX) {
        bedX -= (worldRight - maxAllowedX);
      }
      const worldLeft = place.x - bedX - bedW / 2;
      if (worldLeft < minAllowedX) {
        bedX += (minAllowedX - worldLeft);
      }
    }
  }

  return { bedW, bedD, bedX, bedZ };
}
