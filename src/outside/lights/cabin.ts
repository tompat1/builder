/**
 * Object-aware exterior lights for terrace cabins (sauna / shed).
 * House-wall sconces must not sit behind a cabin — they move onto its exposed walls.
 */

/** How far the fixture sits off the cabin cladding. */
export const CABIN_LIGHT_STANDOFF_M = 0.04;

/** Default keep-out past the cabin footprint on the shared house wall. */
export const CABIN_HOUSE_WALL_CLEARANCE_M = 0.5;

/** Opening span along a wall (doors, windows) — mirrors houseLights.WallOpeningSpan. */
export interface CabinWallOpening {
  x: number;
  width: number;
}

/** Block on the shared house wall covering the cabin footprint. */
export function cabinHouseWallBlock(
  cabin: { bX: number; bW: number },
  clearance = CABIN_HOUSE_WALL_CLEARANCE_M
): CabinWallOpening {
  return {
    x: cabin.bX,
    width: Math.max(cabin.bW + clearance * 2, cabin.bW + 0.2)
  };
}

export interface CabinExteriorLightLocal {
  /** Along the terrace wall (local X). */
  x: number;
  /** Outward from the house (local Z, already signed). */
  z: number;
  /** Added to the terrace door.rotY for the fixture yaw. */
  rotYOffset: number;
}

function overlapsOpening(x: number, openings: CabinWallOpening[], clearance: number) {
  for (const o of openings) {
    const half = o.width / 2 + clearance;
    if (x >= o.x - half && x <= o.x + half) return true;
  }
  return false;
}

/** Even yard-face seeds, nudged off openings. */
function yardFaceSeeds(
  bX: number,
  bW: number,
  openings: CabinWallOpening[],
  count: number
): number[] {
  const half = bW / 2;
  const lo = bX - half + 0.3;
  const hi = bX + half - 0.3;
  if (hi <= lo) return [bX];

  const seeds: number[] = [];
  if (count <= 1) seeds.push((lo + hi) / 2);
  else {
    for (let i = 1; i <= count; i++) seeds.push(lo + ((hi - lo) * i) / (count + 1));
  }

  const placed: number[] = [];
  for (const seed of seeds) {
    let x = seed;
    if (overlapsOpening(x, openings, 0.25)) {
      const left = openings.reduce((best, o) => {
        const edge = o.x - o.width / 2 - 0.3;
        return edge < seed && edge >= lo && !overlapsOpening(edge, openings, 0.25)
          ? edge
          : best;
      }, null as number | null);
      const right = openings.reduce((best, o) => {
        const edge = o.x + o.width / 2 + 0.3;
        return edge > seed && edge <= hi && !overlapsOpening(edge, openings, 0.25)
          ? edge
          : best;
      }, null as number | null);
      if (left == null && right == null) continue;
      if (left == null) x = right!;
      else if (right == null) x = left;
      else x = Math.abs(left - seed) <= Math.abs(right - seed) ? left : right;
    }
    if (placed.every((p) => Math.abs(p - x) >= 0.45)) placed.push(x);
  }
  return placed;
}

/**
 * Mount points on exposed cabin walls — never the shared house face.
 * Prefers the deck-facing side (toward open deck / hot tub) and the yard face.
 */
export function cabinExteriorLightLocals(opts: {
  bX: number;
  bW: number;
  bD: number;
  outward: number;
  isLeft: boolean;
  /** The open-deck side carries a window or door, so keep fixtures off it. */
  deckSideBlocked?: boolean;
  /** The yard face carries a window or door, so keep fixtures off it. */
  yardFaceBlocked?: boolean;
  /** Yard-face openings in the same along-wall space as `bX` (doors / windows). */
  yardOpenings?: CabinWallOpening[];
}): CabinExteriorLightLocal[] {
  const { bX, bW, bD, outward, isLeft } = opts;
  if (bW < 0.9 || bD < 0.9) return [];

  const standoff = CABIN_LIGHT_STANDOFF_M;
  const points: CabinExteriorLightLocal[] = [];

  // Side wall looking toward the open deck / hot tub.
  if (!opts.deckSideBlocked) {
    const sideX = isLeft ? bX + bW / 2 + standoff : bX - bW / 2 - standoff;
    const sideDepth = Math.min(bD * 0.55, Math.max(0.55, bD - 0.35));
    points.push({
      x: sideX,
      z: outward * sideDepth,
      rotYOffset: isLeft ? Math.PI / 2 : -Math.PI / 2
    });
  }

  // Yard face — one or two washers on free cladding.
  if (!opts.yardFaceBlocked) {
    const yardZ = outward * (bD + standoff);
    for (const x of yardFaceSeeds(bX, bW, opts.yardOpenings ?? [], bW > 2.3 ? 2 : 1)) {
      points.push({ x, z: yardZ, rotYOffset: 0 });
    }
  }

  return points;
}
