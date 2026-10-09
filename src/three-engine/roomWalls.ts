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

/** Shrink and shift a room so it stays inside the stud line, snapping near edges flush. */
export function fitRoom(box: RoomBox, hx: number, hz: number): RoomBox {
  const maxW = Math.max(hx * 2, 0);
  const maxD = Math.max(hz * 2, 0);
  const minW = Math.min(1, maxW);
  const minD = Math.min(1, maxD);

  let left = box.x - box.w / 2;
  let right = box.x + box.w / 2;
  let back = box.z - box.d / 2;
  let front = box.z + box.d / 2;

  if (Math.abs(left + hx) <= SHELL_SNAP) left = -hx;
  if (Math.abs(right - hx) <= SHELL_SNAP) right = hx;
  if (Math.abs(back + hz) <= SHELL_SNAP) back = -hz;
  if (Math.abs(front - hz) <= SHELL_SNAP) front = hz;

  let w = right - left;
  let d = front - back;
  if (!Number.isFinite(w) || w <= 0) w = box.w;
  if (!Number.isFinite(d) || d <= 0) d = box.d;
  w = Math.min(Math.max(w, minW), maxW);
  d = Math.min(Math.max(d, minD), maxD);

  const leftPinned = Math.abs(left + hx) <= 1e-6;
  const rightPinned = Math.abs(right - hx) <= 1e-6;
  const backPinned = Math.abs(back + hz) <= 1e-6;
  const frontPinned = Math.abs(front - hz) <= 1e-6;

  let x = leftPinned && rightPinned
    ? 0
    : leftPinned
      ? -hx + w / 2
      : rightPinned
        ? hx - w / 2
        : clamp((left + right) / 2, -hx + w / 2, hx - w / 2);
  let z = backPinned && frontPinned
    ? 0
    : backPinned
      ? -hz + d / 2
      : frontPinned
        ? hz - d / 2
        : clamp((back + front) / 2, -hz + d / 2, hz - d / 2);

  x = clamp(x, -hx + w / 2, hx - w / 2);
  z = clamp(z, -hz + d / 2, hz - d / 2);
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
