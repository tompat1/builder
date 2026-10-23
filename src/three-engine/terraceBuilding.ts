import * as THREE from 'three';
import {
  buildingWallTop,
  saunaFacing,
  saunaHeaterUV,
  type CabinWall,
  type TerraceBuildingRoof,
  type SaunaColor,
  type SaunaDoor,
  type SaunaDoorWall,
  type SaunaWindow,
  type SaunaWindowPlacement,
  type SaunaWindowSize,
  SAUNA_DOOR_WALLS
} from '../outside/terrace';

export interface TerraceCabinOptions {
  bX: number;
  bW: number;
  bD: number;
  deckTop: number;
  outward: number;
  type: 'sauna' | 'shed';
  isLeft: boolean;
  /** Quarter turns of the sauna room. The shed ignores this. */
  turn: number;
  roof: TerraceBuildingRoof;
  roofMat: THREE.Material;
  /** Drop the yard wall so the room can be seen from the interior view. */
  openFront: boolean;
  /** Door connects directly to a house door opening on the shared wall */
  houseDoor?: { along: number; width?: number; head?: number } | null;
  /** Door model choice for the sauna */
  doorId?: SaunaDoor;
  /** Override which cabin wall gets the primary door. */
  doorWall?: SaunaDoorWall;
  /** Add a second door on the yard wall. */
  yardDoor?: boolean;
  /** Window model choice for the sauna */
  windowId?: SaunaWindow;
  /** Window placement wall */
  windowPlacement?: SaunaWindowPlacement;
  /** Window size scaling: compact, standard, or large */
  windowSize?: SaunaWindowSize;
  /** Exterior facade color/material for the sauna */
  colorId?: SaunaColor;
  /** Main house exterior color */
  houseColorHex?: string;
  /** Main house corner boards color */
  houseCornerHex?: string;
  /** Main house window casing/framing color */
  houseCasingHex?: string;
}

type WallHole = { from: number; to: number; sill: number; head: number };

/**
 * Boarded sauna or shed. Wall tops follow the roof, and the roof bites into
 * that line so the joint does not open into a gap.
 */
export function addTerraceCabin(group: THREE.Group, options: TerraceCabinOptions) {
  const { bX, bW, bD, deckTop, outward, type, isLeft, turn, roof, roofMat, openFront, houseDoor } = options;
  const sauna = type === 'sauna';
  const colorId = options.colorId ?? 'natural';
  const doorId: SaunaDoor = options.doorId ?? (sauna ? 'glass' : 'solid');
  const doorWallOpt =
    options.doorWall && SAUNA_DOOR_WALLS.includes(options.doorWall) ? options.doorWall : null;
  const yardDoor = options.yardDoor === true && doorWallOpt !== 'yard';
  const windowId: SaunaWindow = options.windowId ?? 'standard';
  const windowPlacement: SaunaWindowPlacement = options.windowPlacement ?? 'yard';
  const windowSize: SaunaWindowSize = options.windowSize ?? 'standard';

  let baseColorHex = sauna ? '#c4a574' : '#8d8478';
  if (sauna) {
    if (colorId === 'svart') baseColorHex = '#27282b';
    else if (colorId === 'falurod') baseColorHex = '#842621';
    else if (colorId === 'gra') baseColorHex = '#5e656d';
    else if (colorId === 'vit') baseColorHex = '#ede9df';
    else if (colorId === 'match' && options.houseColorHex) baseColorHex = options.houseColorHex;
    else if (colorId === 'natural') baseColorHex = '#c4a574';
  }

  const col = new THREE.Color(baseColorHex);
  const outerMat = new THREE.MeshStandardMaterial({
    color: col,
    roughness: 0.74,
    metalness: 0.02
  });
  const altMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(0.88),
    roughness: 0.76,
    metalness: 0.02
  });
  const recessMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(0.55),
    roughness: 0.86
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#f3e0c4' : '#d5cbbd',
    roughness: 0.62
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(0.72),
    roughness: 0.55,
    metalness: 0.04
  });

  const isMatchHouse = sauna && colorId === 'match';
  const cornerMat = isMatchHouse && options.houseCornerHex
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color(options.houseCornerHex),
        roughness: 0.58,
        metalness: 0.02
      })
    : trimMat;

  const casingMat = isMatchHouse && (options.houseCasingHex || options.houseCornerHex)
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color(options.houseCasingHex ?? options.houseCornerHex!),
        roughness: 0.58,
        metalness: 0.02
      })
    : trimMat;
  const metalMat = new THREE.MeshStandardMaterial({ color: '#1e242b', roughness: 0.28, metalness: 0.86 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#e7f2f4' : '#b7c3ce',
    roughness: 0.06,
    metalness: 0.15,
    transparent: true,
    opacity: sauna ? 0.16 : 0.55,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const topAt = (t: number) => deckTop + buildingWallTop(roof, bD, t);
  const yardTop = openFront ? Math.min(topAt(1), deckTop + 1.02) : topAt(1);

  const x0 = bX - bW / 2;
  const x1 = bX + bW / 2;
  const houseZ = 0;
  const yardZ = outward * bD;

  let facing = sauna && houseDoor
    ? { bench: (isLeft ? 'right' : 'left') as CabinWall, window: 'yard' as CabinWall, door: 'house' as CabinWall }
    : (sauna && turn ? saunaFacing(turn, isLeft) : saunaFacing(0, isLeft));
  if (sauna && doorWallOpt) {
    facing = { ...facing, door: doorWallOpt };
  }
  const walls = cabinWalls(x0, x1, houseZ, yardZ, outward, bD, topAt, yardTop);

  const doorWallIds: CabinWall[] = [facing.door];
  if (sauna && yardDoor && facing.door !== 'yard') doorWallIds.push('yard');

  // Window holes — skip walls that already carry a door unless we can split the span.
  const windowHoles: Partial<Record<CabinWall, WallHole | null>> = {};
  if (windowId !== 'none' && windowPlacement !== 'none') {
    const candidateWalls: CabinWall[] = [];
    if (windowPlacement === 'yard' || windowPlacement === 'both') {
      candidateWalls.push(facing.window);
    }
    if (windowPlacement === 'side' || windowPlacement === 'both') {
      const sideWall: CabinWall = isLeft ? 'right' : 'left';
      if (!candidateWalls.includes(sideWall)) candidateWalls.push(sideWall);
    }
    for (const wId of candidateWalls) {
      if (wId === 'house') continue;
      const sharesDoor = doorWallIds.includes(wId);
      // Keep a window beside a door on the same wall (offset toward the far end).
      const targetAlong = sharesDoor ? wallFractionAlong(walls[wId], 0.28) : undefined;
      windowHoles[wId] = openingOn(
        walls[wId],
        'window',
        bD,
        deckTop,
        outward,
        openFront,
        targetAlong,
        undefined,
        windowId,
        windowSize
      );
    }
  }

  const doorOpenings: { wall: CabinWall; hole: WallHole }[] = [];
  for (const wallId of doorWallIds) {
    const isPrimary = wallId === facing.door;
    const targetAlong =
      isPrimary && wallId === 'house' && houseDoor
        ? houseDoor.along
        : doorWallIds.length > 1 && wallId === 'yard'
          ? wallFractionAlong(walls[wallId], 0.72)
          : windowHoles[wallId]
            ? wallFractionAlong(walls[wallId], 0.72)
            : undefined;
    const targetWidth = isPrimary && wallId === 'house' && houseDoor ? houseDoor.width : undefined;
    const hole = openingOn(walls[wallId], 'door', bD, deckTop, outward, openFront, targetAlong, targetWidth);
    if (hole) doorOpenings.push({ wall: wallId, hole });
  }

  for (const wall of Object.values(walls)) {
    const holes: WallHole[] = [];
    const windowHere = windowHoles[wall.id] ?? null;
    if (windowHere) holes.push(windowHere);
    for (const entry of doorOpenings) {
      if (entry.wall === wall.id) holes.push(entry.hole);
    }
    addCladWall(group, {
      along: wall.along,
      from: wall.from,
      to: wall.to,
      face: wall.face,
      faceSign: wall.faceSign,
      yBase: deckTop,
      top: wall.top,
      outerMat,
      altMat,
      recessMat,
      innerMat,
      trimMat: casingMat,
      holes,
      frameHole: windowHere != null,
      windowId: windowHere != null ? windowId : undefined,
      windowHole: windowHere
    });
  }

  addCornerPosts(group, cornerMat, deckTop, x0, x1, houseZ, yardZ, topAt, yardTop);
  addRoof(group, {
    bX,
    bW,
    bD,
    outward,
    roof,
    deckTop,
    topAt,
    roofMat,
    innerMat,
    trimMat: cornerMat
  });
  addFloor(group, innerMat, bX, bW, bD, deckTop, outward);

  if (sauna) {
    addSaunaInterior(group, {
      bX,
      bW,
      bD,
      x0,
      deckTop,
      outward,
      bench: facing.bench,
      window: facing.window,
      door: facing.door,
      doorOnRight: isLeft,
      topAt,
      innerMat,
      metalMat,
      trimMat
    });
  }

  const isGlass = doorId === 'glass';
  for (const entry of doorOpenings) {
    const doorWall = walls[entry.wall];
    addDoor(group, {
      normal: doorWall.along === 'z' ? 'x' : 'z',
      face: doorWall.face,
      sign: doorWall.faceSign,
      along: (entry.hole.from + entry.hole.to) / 2,
      sill: entry.hole.sill,
      head: entry.hole.head,
      width: Math.abs(entry.hole.to - entry.hole.from),
      glass: isGlass,
      doorType: doorId,
      sauna,
      glassMat,
      trimMat: casingMat,
      leafMat: isGlass ? glassMat : outerMat
    });
  }
}

interface CabinWallSpec {
  id: CabinWall;
  along: 'x' | 'z';
  from: number;
  to: number;
  face: number;
  faceSign: number;
  top: (along: number) => number;
}

function wallFractionAlong(wall: { from: number; to: number }, fraction: number): number {
  const lo = Math.min(wall.from, wall.to);
  const hi = Math.max(wall.from, wall.to);
  return lo + (hi - lo) * fraction;
}

function cabinWalls(
  x0: number,
  x1: number,
  houseZ: number,
  yardZ: number,
  outward: number,
  bD: number,
  topAt: (t: number) => number,
  yardTop: number
): Record<CabinWall, CabinWallSpec> {
  const zFrom = Math.min(houseZ, yardZ);
  const zTo = Math.max(houseZ, yardZ);
  const sideTop = (z: number) => topAt((z * outward) / bD);
  return {
    house: { id: 'house', along: 'x', from: x0, to: x1, face: houseZ, faceSign: -outward, top: () => topAt(0) },
    yard: { id: 'yard', along: 'x', from: x0, to: x1, face: yardZ, faceSign: outward, top: () => yardTop },
    left: { id: 'left', along: 'z', from: zFrom, to: zTo, face: x0, faceSign: -1, top: sideTop },
    right: { id: 'right', along: 'z', from: zFrom, to: zTo, face: x1, faceSign: 1, top: sideTop }
  };
}

function openingOn(
  wall: CabinWallSpec,
  kind: 'door' | 'window',
  depth: number,
  deckTop: number,
  outward: number,
  openFront: boolean,
  targetAlong?: number,
  targetWidth?: number,
  windowId: SaunaWindow = 'standard',
  windowSize: SaunaWindowSize = 'standard'
) {
  if (openFront && wall.id === 'yard') return null;
  if (kind === 'window') return windowOnWall(wall, deckTop, windowId, windowSize, targetAlong);
  if (wall.along === 'z') {
    const door = doorHole(depth, deckTop, (along) => wall.top(outward * along));
    if (!door) return null;
    return { from: outward * door.from, to: outward * door.to, sill: door.sill, head: door.head };
  }
  return doorOnSpan(wall.from, wall.to, deckTop, wall.top((wall.from + wall.to) / 2), targetAlong, targetWidth);
}

function windowOnWall(
  wall: CabinWallSpec,
  deckTop: number,
  windowId: SaunaWindow = 'standard',
  windowSize: SaunaWindowSize = 'standard',
  targetAlong?: number
) {
  if (windowId === 'none') return null;
  const lo = Math.min(wall.from, wall.to);
  const hi = Math.max(wall.from, wall.to);
  const span = hi - lo;
  if (span < 0.6) return null;

  let width = Math.min(1.05, span - 0.5);
  let sill = deckTop + 0.72;
  let head = deckTop + 1.68;

  if (windowId === 'panorama') {
    width = Math.min(1.4, span - 0.28);
    sill = deckTop + 0.42;
    head = deckTop + 1.84;
  } else if (windowId === 'frost') {
    width = Math.min(1.2, span - 0.36);
    sill = deckTop + 1.28;
    head = deckTop + 1.70;
  }

  // Adjust width and height by windowSize preset
  if (windowSize === 'compact') {
    width = Math.max(0.48, width * 0.75);
    sill = Math.min(head - 0.35, sill + 0.10);
  } else if (windowSize === 'large') {
    width = Math.min(span - 0.2, width * 1.25);
    sill = Math.max(deckTop + 0.35, sill - 0.08);
  }

  // When sharing a wall with a door, shrink so both openings fit.
  if (targetAlong != null) width = Math.min(width, Math.max(0.55, span * 0.42));

  let mid = targetAlong != null ? targetAlong : (lo + hi) / 2;
  const minMid = lo + width / 2 + 0.05;
  const maxMid = hi - width / 2 - 0.05;
  if (minMid <= maxMid) mid = Math.max(minMid, Math.min(maxMid, mid));
  const clearance = Math.min(wall.top(mid - width / 2), wall.top(mid + width / 2));
  head = Math.min(head, clearance - 0.06);
  if (head - sill < 0.3) return null;
  return { from: mid - width / 2, to: mid + width / 2, sill, head };
}

function doorOnSpan(
  from: number,
  to: number,
  deckTop: number,
  wallTop: number,
  targetAlong?: number,
  targetWidth?: number
) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  let width = targetWidth != null ? targetWidth : Math.min(0.74, hi - lo - 0.4);
  if (width > hi - lo - 0.1) width = hi - lo - 0.1;
  if (width < 0.4) return null;
  const head = deckTop + Math.min(1.92, wallTop - deckTop - 0.06);
  if (head - deckTop < 1.55) return null;
  let mid = targetAlong != null ? targetAlong : (lo + hi) / 2;
  const minMid = lo + width / 2 + 0.05;
  const maxMid = hi - width / 2 - 0.05;
  if (minMid <= maxMid) {
    mid = Math.max(minMid, Math.min(maxMid, mid));
  }
  return { from: mid - width / 2, to: mid + width / 2, sill: deckTop + 0.02, head };
}

function doorHole(depth: number, deckTop: number, topAtAlong: (along: number) => number) {
  const from = Math.max(0.2, depth * 0.32);
  const to = Math.min(depth - 0.14, from + 0.74);
  if (to - from < 0.55) return null;
  const clearance = Math.min(topAtAlong(from), topAtAlong(to)) - deckTop;
  const head = deckTop + Math.min(1.92, clearance - 0.06);
  if (head - deckTop < 1.55) return null;
  return { from, to, sill: deckTop + 0.02, head };
}

/** Room coordinates: along is 0 away from the door and 1 at the door; into is 0 at the benches and 1 at the window. */
function roomPoint(along: number, into: number, bench: CabinWall, doorOnRight: boolean) {
  if (bench === 'house') return doorOnRight ? { u: along, v: into } : { u: 1 - along, v: into };
  if (bench === 'yard') return doorOnRight ? { u: 1 - along, v: 1 - into } : { u: along, v: 1 - into };
  if (bench === 'left') return doorOnRight ? { u: into, v: 1 - along } : { u: into, v: along };
  return doorOnRight ? { u: 1 - into, v: along } : { u: 1 - into, v: 1 - along };
}

interface CladWall {
  along: 'x' | 'z';
  from: number;
  to: number;
  face: number;
  faceSign: number;
  yBase: number;
  top: (along: number) => number;
  outerMat: THREE.Material;
  altMat: THREE.Material;
  recessMat: THREE.Material;
  innerMat: THREE.Material;
  trimMat: THREE.Material;
  holes: WallHole[];
  frameHole: boolean;
  windowId?: SaunaWindow;
  windowHole?: WallHole | null;
}

function addCladWall(group: THREE.Group, wall: CladWall) {
  const span = wall.to - wall.from;
  if (span < 0.2) return;
  const inset = 0.034;
  const from = wall.from + inset;
  const to = wall.to - inset;
  const run = to - from;
  if (run < 0.2) return;
  const count = Math.max(2, Math.round(run / 0.12));
  const step = run / count;
  const faceT = 0.02;
  const recessT = 0.012;
  const holes = wall.holes
    .map((hole) => snapHole(hole, from, step))
    .filter((hole): hole is WallHole => hole != null);
  for (let index = 0; index < count; index += 1) {
    const a0 = from + index * step;
    const a1 = a0 + step;
    const proud = index % 2 === 0 ? wall.outerMat : wall.altMat;
    const hole = holes.find((h) => overlaps(a0, a1, h.from, h.to)) ?? null;
    for (const segment of slopedSegments(wall, a0, a1, hole)) {
      addSlopedBoard(group, wall, segment, wall.face, recessT, wall.recessMat, false);
      addSlopedBoard(
        group,
        wall,
        insetSegment(segment, 0.004),
        wall.face + wall.faceSign * (recessT / 2 + faceT / 2),
        faceT,
        proud,
        true
      );
      addSlopedBoard(group, wall, insetSegment(segment, 0.005), wall.face - wall.faceSign * 0.07, 0.014, wall.innerMat, false);
    }
  }
  if (wall.frameHole && wall.windowHole) {
    const framed = snapHole(wall.windowHole, from, step);
    if (framed) addOpeningFrame(group, wall, framed, wall.trimMat, wall.windowId);
  }
}

function snapHole(hole: WallHole | null | undefined, origin: number, step: number): WallHole | null {
  if (!hole) return null;
  const snap = (value: number) => origin + Math.round((value - origin) / step) * step;
  const from = snap(Math.min(hole.from, hole.to));
  const to = snap(Math.max(hole.from, hole.to));
  if (to - from < 0.2) return null;
  return { from, to, sill: hole.sill, head: hole.head };
}

interface BoardSegment {
  from: number;
  to: number;
  bottom: number;
  top0: number;
  top1: number;
}

function slopedSegments(wall: CladWall, from: number, to: number, hole: WallHole | null): BoardSegment[] {
  const top0 = wall.top(from);
  const top1 = wall.top(to);
  if (!hole || !overlaps(from, to, hole.from, hole.to) || hole.head - hole.sill < 0.2) {
    return [{ from, to, bottom: wall.yBase, top0, top1 }];
  }
  const parts: BoardSegment[] = [];
  if (hole.sill - wall.yBase > 0.04) {
    parts.push({
      from,
      to,
      bottom: wall.yBase,
      top0: Math.min(hole.sill, top0),
      top1: Math.min(hole.sill, top1)
    });
  }
  if (Math.min(top0, top1) - hole.head > 0.04) {
    parts.push({ from, to, bottom: hole.head, top0, top1 });
  }
  return parts;
}

function insetSegment(segment: BoardSegment, amount: number): BoardSegment {
  return { ...segment, from: segment.from + amount, to: segment.to - amount };
}

function addSlopedBoard(
  group: THREE.Group,
  wall: CladWall,
  segment: BoardSegment,
  faceCenter: number,
  thick: number,
  mat: THREE.Material,
  shadow: boolean
) {
  const { from, to, bottom, top0, top1 } = segment;
  if (to - from < 0.012 || Math.min(top0, top1) - bottom < 0.03) return;
  const shape = new THREE.Shape();
  shape.moveTo(from, bottom);
  shape.lineTo(to, bottom);
  shape.lineTo(to, top1);
  shape.lineTo(from, top0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  geo.translate(0, 0, -thick / 2);
  if (wall.along === 'z') geo.rotateY(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  if (wall.along === 'x') mesh.position.z = faceCenter;
  else mesh.position.x = faceCenter;
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function overlaps(a0: number, a1: number, b0: number, b1: number) {
  const from = Math.min(a0, a1);
  const to = Math.max(a0, a1);
  const holeFrom = Math.min(b0, b1);
  const holeTo = Math.max(b0, b1);
  return Math.min(to, holeTo) - Math.max(from, holeFrom) > 0.01;
}

function addBoard(
  group: THREE.Group,
  wall: CladWall,
  along: number,
  span: number,
  y: number,
  height: number,
  face: number,
  thick: number,
  mat: THREE.Material,
  shadow: boolean
) {
  const size: [number, number, number] = wall.along === 'x' ? [span, height, thick] : [thick, height, span];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  if (wall.along === 'x') mesh.position.set(along, y, face);
  else mesh.position.set(face, y, along);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function addOpeningFrame(
  group: THREE.Group,
  wall: CladWall,
  hole: { from: number; to: number; sill: number; head: number },
  trim: THREE.Material,
  windowId: SaunaWindow = 'standard'
) {
  const from = Math.min(hole.from, hole.to);
  const to = Math.max(hole.from, hole.to);
  const width = to - from;
  const height = hole.head - hole.sill;
  const mid = (from + to) / 2;
  const y = (hole.sill + hole.head) / 2;
  const face = wall.face + wall.faceSign * 0.02;
  const casing = 0.045;
  const depth = 0.04;
  const rails: [number, number, number][] = [
    [width + casing * 2, casing, depth],
    [width + casing * 2, casing, depth],
    [casing, height, depth],
    [casing, height, depth]
  ];
  const places: [number, number][] = [
    [mid, hole.head + casing / 2],
    [mid, hole.sill - casing / 2],
    [from - casing / 2, y],
    [to + casing / 2, y]
  ];
  rails.forEach((size, index) => {
    const [along, yy] = places[index];
    addBoard(group, wall, along, size[0], yy, size[1], face, depth, trim, true);
  });

  const isFrost = windowId === 'frost';
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(
      wall.along === 'x' ? width - 0.04 : 0.012,
      height - 0.04,
      wall.along === 'x' ? 0.012 : width - 0.04
    ),
    new THREE.MeshStandardMaterial({
      color: isFrost ? '#d6e4e8' : '#e7f2f4',
      roughness: isFrost ? 0.45 : 0.06,
      metalness: isFrost ? 0.05 : 0.12,
      transparent: true,
      opacity: isFrost ? 0.85 : 0.22,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  if (wall.along === 'x') glass.position.set(mid, y, face);
  else glass.position.set(face, y, mid);
  group.add(glass);

  if (windowId === 'sprojat') {
    const barThick = 0.022;
    const barDepth = 0.02;
    addBoard(group, wall, mid, width - 0.04, y, barThick, face + wall.faceSign * 0.01, barDepth, trim, true);
    addBoard(group, wall, mid, barThick, y, height - 0.04, face + wall.faceSign * 0.01, barDepth, trim, true);
  }
}

function addCornerPosts(
  group: THREE.Group,
  trim: THREE.Material,
  deckTop: number,
  x0: number,
  x1: number,
  houseZ: number,
  yardZ: number,
  topAt: (t: number) => number,
  yardTop: number
) {
  const posts: [number, number, number][] = [
    [x0, houseZ, topAt(0)],
    [x1, houseZ, topAt(0)],
    [x0, yardZ, yardTop],
    [x1, yardZ, yardTop]
  ];
  for (const [x, z, top] of posts) {
    const height = top - deckTop;
    if (height < 0.2) continue;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, 0.07), trim);
    post.position.set(x, deckTop + height / 2, z);
    post.castShadow = true;
    group.add(post);
  }
}

function addMonoPitchRoof(
  group: THREE.Group,
  spec: {
    bX: number;
    bW: number;
    bD: number;
    outward: number;
    deckTop: number;
    topAt: (t: number) => number;
    roofMat: THREE.Material;
    innerMat: THREE.Material;
    trimMat: THREE.Material;
  }
) {
  const { bX, bW, outward, topAt, roofMat, innerMat, trimMat } = spec;
  const z0 = 0;
  const y0 = topAt(0);
  const z1 = outward * spec.bD;
  const y1 = topAt(1);

  const dz = z1 - z0;
  const dy = y1 - y0;
  const span = Math.hypot(dz, dy) || 0.001;
  const tz = dz / span;
  const ty = dy / span;

  // Normal vector pointing upward/outward from roof surface
  const ny = Math.abs(tz);
  const nz = -ty * Math.sign(tz);

  const overhangSide = 0.06;
  const roofW = bW + overhangSide * 2;
  const overhangHouse = 0.005;
  const overhangYard = 0.12;

  const zStart = z0 - tz * overhangHouse;
  const yStart = y0 - ty * overhangHouse;
  const zEnd = z1 + tz * overhangYard;
  const yEnd = y1 + ty * overhangYard;
  const slopeLen = span + overhangHouse + overhangYard;

  const roofThick = 0.06;
  const bargeT = 0.024;
  const fasciaT = 0.024;
  const fasciaH = 0.11;
  const copingH = 0.012;
  const copingOverhang = 0.035;

  // Powder-coated metal sheet material matching the big house standing-seam / flashing style
  const metalFlashingMat = new THREE.MeshStandardMaterial({
    color: '#2a3036',
    roughness: 0.38,
    metalness: 0.72
  });

  // 1. Ceiling underside inside cabin
  addRotatedRoofBeam(
    group,
    bX,
    bW - 0.08,
    0.016,
    z0 + tz * 0.04,
    y0 + ty * 0.04,
    z1 - tz * 0.04,
    y1 - ty * 0.04,
    -(roofThick / 2 + 0.008) * ny,
    -(roofThick / 2 + 0.008) * nz,
    innerMat,
    false
  );

  // 2. Main roof slab with metal cladding texture / roof material
  addRotatedRoofBeam(
    group,
    bX,
    roofW,
    roofThick,
    zStart,
    yStart,
    zEnd,
    yEnd,
    (roofThick / 2) * ny,
    (roofThick / 2) * nz,
    roofMat,
    true
  );

  // 3. Side bargeboards (vindskivor) - run flush from house wall to front fascia with even edges
  const liftY = (roofThick / 2 - fasciaH / 2 + 0.01) * ny;
  const liftZ = (roofThick / 2 - fasciaH / 2 + 0.01) * nz;

  for (const sign of [-1, 1]) {
    addRotatedRoofBeam(
      group,
      bX + sign * (roofW / 2 + bargeT / 2),
      bargeT,
      fasciaH,
      zStart,
      yStart,
      zEnd,
      yEnd,
      liftY,
      liftZ,
      trimMat,
      true
    );
  }

  // 4. Front fascia (takfotsbräda) - width caps roof and both bargeboards with even edges
  const fasciaWidth = roofW + bargeT * 2 + 0.004;
  const frontZStart = zEnd;
  const frontYStart = yEnd;
  const frontZEnd = zEnd + tz * fasciaT;
  const frontYEnd = yEnd + ty * fasciaT;

  addRotatedRoofBeam(
    group,
    bX,
    fasciaWidth,
    fasciaH,
    frontZStart,
    frontYStart,
    frontZEnd,
    frontYEnd,
    liftY,
    liftZ,
    trimMat,
    true
  );

  // 5. Metal verge trims (krönplåt / vindskivebeslag) along left and right edges
  const copingLiftY = (roofThick + copingH / 2 + 0.002) * ny;
  const copingLiftZ = (roofThick + copingH / 2 + 0.002) * nz;

  for (const sign of [-1, 1]) {
    addRotatedRoofBeam(
      group,
      bX + sign * (roofW / 2 + bargeT / 2 - copingOverhang / 2),
      bargeT + copingOverhang,
      copingH,
      zStart,
      yStart,
      frontZEnd,
      frontYEnd,
      copingLiftY,
      copingLiftZ,
      metalFlashingMat,
      true
    );
  }

  // 6. Front metal eave drip edge / coping (takfotsbeslag / dropplåt)
  addRotatedRoofBeam(
    group,
    bX,
    roofW + bargeT * 2 + 0.01,
    copingH,
    zEnd - tz * copingOverhang,
    yEnd - ty * copingOverhang,
    frontZEnd + tz * 0.01,
    frontYEnd + ty * 0.01,
    copingLiftY,
    copingLiftZ,
    metalFlashingMat,
    true
  );

  // 7. Metal wall apron flashing (vägganslutningsplåt) sealing the roof/walls section
  const wallFlashing = new THREE.Mesh(
    new THREE.BoxGeometry(roofW + bargeT * 2 + 0.04, 0.16, 0.14),
    metalFlashingMat
  );
  wallFlashing.position.set(bX, y0 + 0.05, z0 + outward * 0.05);
  wallFlashing.rotation.x = -Math.atan2(yEnd - yStart, zEnd - zStart);
  wallFlashing.castShadow = true;
  group.add(wallFlashing);
}

function addRotatedRoofBeam(
  group: THREE.Group,
  x: number,
  width: number,
  thick: number,
  zStart: number,
  yStart: number,
  zEnd: number,
  yEnd: number,
  liftY: number,
  liftZ: number,
  mat: THREE.Material,
  shadow = true
) {
  const len = Math.hypot(zEnd - zStart, yEnd - yStart);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(width, 0.01), thick, len), mat);
  mesh.position.set(x, (yStart + yEnd) / 2 + liftY, (zStart + zEnd) / 2 + liftZ);
  mesh.rotation.x = -Math.atan2(yEnd - yStart, zEnd - zStart);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRoof(
  group: THREE.Group,
  spec: {
    bX: number;
    bW: number;
    bD: number;
    outward: number;
    roof: TerraceBuildingRoof;
    deckTop: number;
    topAt: (t: number) => number;
    roofMat: THREE.Material;
    innerMat: THREE.Material;
    trimMat: THREE.Material;
  }
) {
  if (spec.roof !== 'gable') {
    addMonoPitchRoof(group, spec);
    return;
  }

  const { bX, bW, outward, topAt, roofMat, innerMat, trimMat } = spec;
  const yardZ = outward * spec.bD;
  const planes: [number, number, number, number, number, number][] = [
    [0, topAt(0), yardZ / 2, topAt(0.5), 0.04, 0.06],
    [yardZ / 2, topAt(0.5), yardZ, topAt(1), 0.06, 0.16]
  ];
  for (const [z0, y0, z1, y1, extraHouse, extraYard] of planes) {
    addRoofSlab(group, bX, bW - 0.1, z0, y0, z1, y1, 0.02, 0.02, 0.018, 0.012, innerMat);
    addRoofSlab(group, bX, bW + 0.18, z0, y0, z1, y1, extraHouse + 0.01, extraYard + 0.02, 0.026, -0.006, roofMat);
  }
  const barge = (z0: number, y0: number, z1: number, y1: number, extra0: number, extra1: number) => {
    addRoofSlab(group, bX - bW / 2 - 0.02, 0.06, z0, y0, z1, y1, extra0, extra1, 0.14, 0.07, trimMat);
    addRoofSlab(group, bX + bW / 2 + 0.02, 0.06, z0, y0, z1, y1, extra0, extra1, 0.14, 0.07, trimMat);
  };
  barge(0, topAt(0), yardZ / 2, topAt(0.5), 0.04, 0.04);
  barge(yardZ / 2, topAt(0.5), yardZ, topAt(1), 0.04, 0.16);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.28, 0.055, 0.18), trimMat);
  ridge.position.set(bX, topAt(0.5) + 0.02, yardZ / 2);
  ridge.castShadow = true;
  group.add(ridge);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.22, 0.16, 0.028), trimMat);
  fascia.position.set(bX, topAt(1) + 0.02, yardZ + outward * 0.015);
  fascia.castShadow = true;
  group.add(fascia);
  const flashing = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.08, 0.16, 0.012), trimMat);
  flashing.position.set(bX, topAt(0) + 0.06, -outward * 0.006);
  group.add(flashing);
}

function addRoofSlab(
  group: THREE.Group,
  x: number,
  width: number,
  z0: number,
  y0: number,
  z1: number,
  y1: number,
  extra0: number,
  extra1: number,
  thick: number,
  sink: number,
  mat: THREE.Material
) {
  let aZ = z0;
  let aY = y0;
  let bZ = z1;
  let bY = y1;
  let e0 = extra0;
  let e1 = extra1;
  if (aZ > bZ) {
    [aZ, bZ] = [bZ, aZ];
    [aY, bY] = [bY, aY];
    [e0, e1] = [e1, e0];
  }
  const dz = bZ - aZ;
  const dy = bY - aY;
  const span = Math.hypot(dz, dy) || 0.001;
  const tz = dz / span;
  const ty = dy / span;
  const zStart = aZ - tz * e0;
  const yStart = aY - ty * e0;
  const zEnd = bZ + tz * e1;
  const yEnd = bY + ty * e1;
  const len = span + e0 + e1;
  let nz = -(yEnd - yStart);
  let ny = zEnd - zStart;
  const nlen = Math.hypot(ny, nz) || 1;
  ny /= nlen;
  nz /= nlen;
  if (ny < 0) {
    ny = -ny;
    nz = -nz;
  }
  const lift = thick / 2 - sink;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(width, 0.02), thick, len), mat);
  mesh.position.set(x, (yStart + yEnd) / 2 + ny * lift, (zStart + zEnd) / 2 + nz * lift);
  mesh.rotation.x = -Math.atan2(yEnd - yStart, zEnd - zStart);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function addFloor(
  group: THREE.Group,
  mat: THREE.Material,
  bX: number,
  bW: number,
  bD: number,
  deckTop: number,
  outward: number
) {
  const boards = Math.max(2, Math.round((bD - 0.16) / 0.12));
  const depth = (bD - 0.16) / boards;
  for (let index = 0; index < boards; index += 1) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.18, 0.028, depth - 0.008), mat);
    board.position.set(bX, deckTop + 0.02, outward * (0.08 + depth * (index + 0.5)));
    board.receiveShadow = true;
    group.add(board);
  }
}

function addSaunaInterior(
  group: THREE.Group,
  spec: {
    bX: number;
    bW: number;
    bD: number;
    x0: number;
    deckTop: number;
    outward: number;
    bench: CabinWall;
    window: CabinWall;
    door: CabinWall;
    doorOnRight: boolean;
    topAt: (t: number) => number;
    innerMat: THREE.Material;
    metalMat: THREE.Material;
    trimMat: THREE.Material;
  }
) {
  const { bW, bD, x0, deckTop, outward, bench, window, door, doorOnRight, topAt, innerMat, metalMat } = spec;
  const alongWall = bench === 'house' || bench === 'yard';
  const span = (alongWall ? bW : bD) - 0.28;
  const intoLen = alongWall ? bD : bW;
  const place = (along: number, into: number) => {
    const point = roomPoint(along, into, bench, doorOnRight);
    return { x: x0 + point.u * bW, z: outward * point.v * bD, v: point.v };
  };
  const benchBox = (into: number, thick: number, long: number, y: number, mat: THREE.Material) => {
    const at = place(0.5, into);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(alongWall ? long : thick, 0.04, alongWall ? thick : long),
      mat
    );
    mesh.position.set(at.x, y, at.z);
    mesh.castShadow = true;
    group.add(mesh);
  };
  benchBox(0.24, 0.46, span, deckTop + 0.86, innerMat);
  const slatLong = (alongWall ? bW : bD) - 0.32;
  for (let index = 0; index < 4; index += 1) {
    const into = 0.16 + (index * 0.09) / intoLen;
    const at = place(0.5, into);
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(alongWall ? slatLong : 0.07, 0.012, alongWall ? 0.07 : slatLong),
      spec.trimMat
    );
    slat.position.set(at.x, deckTop + 0.89, at.z);
    group.add(slat);
  }
  benchBox(0.42, 0.36, span, deckTop + 0.46, innerMat);

  // Window-wall corner opposite the benches — never in the door leaf.
  const heater = saunaHeaterUV({ bench, window, door });
  const stoveAt = {
    x: x0 + heater.u * bW,
    z: outward * heater.v * bD,
    v: heater.v
  };
  const stove = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.42), metalMat);
  stove.position.set(stoveAt.x, deckTop + 0.3, stoveAt.z);
  stove.castShadow = true;
  group.add(stove);
  const stones = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), spec.trimMat);
  stones.position.set(stoveAt.x, deckTop + 0.6, stoveAt.z);
  group.add(stones);

  const roofY = topAt(stoveAt.v);
  const pipeTop = roofY + 0.4;
  const pipeBase = deckTop + 0.55;
  const pipeLen = Math.max(0.4, pipeTop - pipeBase);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, pipeLen, 16), metalMat);
  pipe.position.set(stoveAt.x, (pipeBase + pipeTop) / 2, stoveAt.z);
  pipe.castShadow = true;
  group.add(pipe);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.05, 16), metalMat);
  cap.position.set(stoveAt.x, pipeTop, stoveAt.z);
  cap.castShadow = true;
  group.add(cap);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), metalMat);
  collar.position.set(stoveAt.x, roofY + 0.02, stoveAt.z);
  collar.rotation.x = Math.atan2(topAt(stoveAt.v + 0.05) - topAt(stoveAt.v - 0.05), outward * bD * 0.1);
  group.add(collar);
}

function addDoor(
  group: THREE.Group,
  spec: {
    normal: 'x' | 'z';
    face: number;
    sign: number;
    along: number;
    sill: number;
    head: number;
    width: number;
    glass: boolean;
    doorType?: SaunaDoor;
    sauna?: boolean;
    glassMat: THREE.Material;
    trimMat: THREE.Material;
    leafMat: THREE.Material;
  }
) {
  const height = spec.head - spec.sill;
  const y = (spec.sill + spec.head) / 2;
  const frameSize: [number, number, number] = spec.normal === 'x'
    ? [0.04, height + 0.06, spec.width + 0.08]
    : [spec.width + 0.08, height + 0.06, 0.04];
  const leafSize: [number, number, number] = spec.normal === 'x'
    ? [0.02, height - 0.04, spec.width - 0.04]
    : [spec.width - 0.04, height - 0.04, 0.02];
  const frame = new THREE.Mesh(new THREE.BoxGeometry(...frameSize), spec.trimMat);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(...leafSize), spec.leafMat);
  if (spec.normal === 'x') {
    frame.position.set(spec.face + spec.sign * 0.02, y, spec.along);
    leaf.position.set(spec.face + spec.sign * 0.035, y + 0.01, spec.along);
  } else {
    frame.position.set(spec.along, y, spec.face + spec.sign * 0.02);
    leaf.position.set(spec.along, y + 0.01, spec.face + spec.sign * 0.035);
  }
  frame.castShadow = true;
  leaf.castShadow = !spec.glass;
  group.add(frame);
  group.add(leaf);

  if (spec.doorType === 'lervik') {
    const slitSize: [number, number, number] = spec.normal === 'x'
      ? [0.024, height * 0.65, 0.12]
      : [0.12, height * 0.65, 0.024];
    const slit = new THREE.Mesh(new THREE.BoxGeometry(...slitSize), spec.glassMat);
    if (spec.normal === 'x') slit.position.set(spec.face + spec.sign * 0.036, y + 0.05, spec.along);
    else slit.position.set(spec.along, y + 0.05, spec.face + spec.sign * 0.036);
    group.add(slit);
  } else if (spec.doorType === 'stehag') {
    const barW = spec.width - 0.06;
    const barH = height - 0.06;
    const barThick = 0.02;
    const vSize: [number, number, number] = spec.normal === 'x'
      ? [0.024, barH, barThick]
      : [barThick, barH, 0.024];
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(...vSize), spec.trimMat);
    if (spec.normal === 'x') vBar.position.set(spec.face + spec.sign * 0.04, y + 0.01, spec.along);
    else vBar.position.set(spec.along, y + 0.01, spec.face + spec.sign * 0.04);
    group.add(vBar);
    for (const dy of [-barH * 0.22, barH * 0.22]) {
      const hSize: [number, number, number] = spec.normal === 'x'
        ? [0.024, barThick, barW]
        : [barW, barThick, 0.024];
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(...hSize), spec.trimMat);
      if (spec.normal === 'x') hBar.position.set(spec.face + spec.sign * 0.04, y + dy + 0.01, spec.along);
      else hBar.position.set(spec.along, y + dy + 0.01, spec.face + spec.sign * 0.04);
      group.add(hBar);
    }
  }

  if (spec.sauna || spec.glass) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 10), spec.trimMat);
    if (spec.normal === 'x') handle.position.set(spec.face + spec.sign * 0.05, spec.sill + 0.95, spec.along + spec.width * 0.28);
    else handle.position.set(spec.along + spec.width * 0.28, spec.sill + 0.95, spec.face + spec.sign * 0.05);
    group.add(handle);
  }
}
