import * as THREE from 'three';
import { buildingWallTop, type TerraceBuildingRoof } from '../outside/terrace';

export interface TerraceCabinOptions {
  bX: number;
  bW: number;
  bD: number;
  deckTop: number;
  outward: number;
  type: 'sauna' | 'shed';
  isLeft: boolean;
  roof: TerraceBuildingRoof;
  roofMat: THREE.Material;
  /** Drop the yard wall so the room can be seen from the interior view. */
  openFront: boolean;
}

/**
 * Boarded sauna or shed. Wall tops follow the roof, and the roof bites into
 * that line so the joint does not open into a gap.
 */
export function addTerraceCabin(group: THREE.Group, options: TerraceCabinOptions) {
  const { bX, bW, bD, deckTop, outward, type, isLeft, roof, roofMat, openFront } = options;
  const sauna = type === 'sauna';
  const outerMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#c4a574' : '#8d8478',
    roughness: 0.74,
    metalness: 0.02
  });
  const altMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#b08a5e' : '#7a7268',
    roughness: 0.76,
    metalness: 0.02
  });
  const recessMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#6e4e32' : '#3f3a34',
    roughness: 0.86
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#f3e0c4' : '#d5cbbd',
    roughness: 0.62
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#8c6538' : '#4a4339',
    roughness: 0.55,
    metalness: 0.04
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: '#1e242b', roughness: 0.28, metalness: 0.86 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: sauna ? '#e7f2f4' : '#b7c3ce',
    roughness: 0.06,
    metalness: 0.15,
    transparent: true,
    opacity: sauna ? 0.12 : 0.55,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const topAt = (t: number) => deckTop + buildingWallTop(roof, bD, t);
  const yardT = 1;
  const houseT = 0;
  const yardTop = openFront ? Math.min(topAt(yardT), deckTop + 1.02) : topAt(yardT);

  const x0 = bX - bW / 2;
  const x1 = bX + bW / 2;
  const houseZ = 0;
  const yardZ = outward * bD;

  addCladWall(group, {
    along: 'x',
    from: x0,
    to: x1,
    face: yardZ,
    faceSign: outward,
    yBase: deckTop,
    top: () => yardTop,
    outerMat,
    altMat,
    recessMat,
    innerMat,
    trimMat,
    hole: openFront ? null : windowHole(bX, bW, deckTop, yardTop)
  });
  addCladWall(group, {
    along: 'x',
    from: x0,
    to: x1,
    face: houseZ,
    faceSign: -outward,
    yBase: deckTop,
    top: () => topAt(houseT),
    outerMat,
    altMat,
    recessMat,
    innerMat,
    trimMat,
    hole: null
  });

  const doorSide = isLeft ? 1 : -1;
  const doorX = isLeft ? x1 : x0;
  const door = doorHole(bD, deckTop, (along) => topAt(along / bD));
  for (const side of [-1, 1] as const) {
    const atDoor = side === doorSide;
    addCladWall(group, {
      along: 'z',
      from: Math.min(houseZ, yardZ),
      to: Math.max(houseZ, yardZ),
      face: side < 0 ? x0 : x1,
      faceSign: side,
      yBase: deckTop,
      top: (z) => topAt((z * outward) / bD),
      outerMat,
      altMat,
      recessMat,
      innerMat,
      trimMat,
      hole: atDoor && door ? { from: outward * door.from, to: outward * door.to, sill: door.sill, head: door.head } : null
    });
  }

  addCornerPosts(group, trimMat, deckTop, x0, x1, houseZ, yardZ, topAt, yardTop);
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
    trimMat
  });
  addFloor(group, innerMat, bX, bW, bD, deckTop, outward);

  if (sauna) {
    addSaunaInterior(group, {
      bX,
      bW,
      bD,
      deckTop,
      outward,
      isLeft,
      topAt,
      innerMat,
      metalMat,
      trimMat
    });
  }

  if (door) {
    addDoor(group, {
      x: doorX,
      sign: doorSide,
      z: outward * ((door.from + door.to) / 2),
      sill: door.sill,
      head: door.head,
      width: door.to - door.from,
      glass: sauna,
      glassMat,
      trimMat,
      leafMat: sauna ? glassMat : outerMat
    });
  }
}

function windowHole(bX: number, bW: number, deckTop: number, wallTop: number) {
  const width = Math.min(1.05, bW - 0.5);
  const sill = deckTop + 0.72;
  const head = deckTop + 1.68;
  if (width < 0.4 || head > wallTop - 0.08 || sill < deckTop + 0.4) return null;
  return { from: bX - width / 2, to: bX + width / 2, sill, head };
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
  hole: { from: number; to: number; sill: number; head: number } | null;
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
  const hole = snapHole(wall.hole, from, step);
  let framedHole = false;
  for (let index = 0; index < count; index += 1) {
    const a0 = from + index * step;
    const a1 = a0 + step;
    const proud = index % 2 === 0 ? wall.outerMat : wall.altMat;
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
  if (hole && wall.along === 'x' && !framedHole) {
    framedHole = true;
    addOpeningFrame(group, wall, hole, wall.trimMat);
  }
}

function snapHole(hole: CladWall['hole'], origin: number, step: number): CladWall['hole'] {
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

function slopedSegments(wall: CladWall, from: number, to: number, hole: CladWall['hole']): BoardSegment[] {
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
  trim: THREE.Material
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
  if (wall.along === 'x') {
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.012),
      new THREE.MeshStandardMaterial({
        color: '#e7f2f4',
        roughness: 0.06,
        metalness: 0.12,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    glass.material.side = THREE.DoubleSide;
    glass.position.set(mid, y, face);
    group.add(glass);
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
  const { bX, bW, outward, topAt, roofMat, innerMat, trimMat } = spec;
  const yardZ = outward * spec.bD;
  const gable = spec.roof === 'gable';
  const planes: [number, number, number, number, number, number][] = gable
    ? [
        [0, topAt(0), yardZ / 2, topAt(0.5), 0.04, 0.06],
        [yardZ / 2, topAt(0.5), yardZ, topAt(1), 0.06, 0.16]
      ]
    : [[0, topAt(0), yardZ, topAt(1), 0.04, 0.16]];
  for (const [z0, y0, z1, y1, extraHouse, extraYard] of planes) {
    addRoofSlab(group, bX, bW - 0.1, z0, y0, z1, y1, 0.02, 0.02, 0.018, 0.012, innerMat);
    addRoofSlab(group, bX, bW + 0.18, z0, y0, z1, y1, extraHouse + 0.01, extraYard + 0.02, 0.026, -0.006, roofMat);
  }
  const barge = (z0: number, y0: number, z1: number, y1: number, extra0: number, extra1: number) => {
    addRoofSlab(group, bX - bW / 2 - 0.02, 0.06, z0, y0, z1, y1, extra0, extra1, 0.14, 0.07, trimMat);
    addRoofSlab(group, bX + bW / 2 + 0.02, 0.06, z0, y0, z1, y1, extra0, extra1, 0.14, 0.07, trimMat);
  };
  if (gable) {
    barge(0, topAt(0), yardZ / 2, topAt(0.5), 0.04, 0.04);
    barge(yardZ / 2, topAt(0.5), yardZ, topAt(1), 0.04, 0.16);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.28, 0.055, 0.18), trimMat);
    ridge.position.set(bX, topAt(0.5) + 0.02, yardZ / 2);
    ridge.castShadow = true;
    group.add(ridge);
  } else {
    barge(0, topAt(0), yardZ, topAt(1), 0.04, 0.16);
  }
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
    deckTop: number;
    outward: number;
    isLeft: boolean;
    topAt: (t: number) => number;
    innerMat: THREE.Material;
    metalMat: THREE.Material;
    trimMat: THREE.Material;
  }
) {
  const { bX, bW, bD, deckTop, outward, isLeft, topAt, innerMat, metalMat } = spec;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.28, 0.04, 0.46), innerMat);
  upper.position.set(bX, deckTop + 0.86, outward * (bD * 0.24));
  upper.castShadow = true;
  group.add(upper);
  const upperSlats = 4;
  for (let index = 0; index < upperSlats; index += 1) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.32, 0.012, 0.07), spec.trimMat);
    slat.position.set(bX, deckTop + 0.89, outward * (bD * 0.16 + index * 0.09));
    group.add(slat);
  }
  const lower = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.28, 0.04, 0.36), innerMat);
  lower.position.set(bX, deckTop + 0.46, outward * (bD * 0.42));
  lower.castShadow = true;
  group.add(lower);

  const stoveX = isLeft ? bX - bW * 0.28 : bX + bW * 0.28;
  const stoveZ = outward * (bD * 0.62);
  const stove = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.42), metalMat);
  stove.position.set(stoveX, deckTop + 0.3, stoveZ);
  stove.castShadow = true;
  group.add(stove);
  const stones = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), spec.trimMat);
  stones.position.set(stoveX, deckTop + 0.6, stoveZ);
  group.add(stones);

  const t = 0.62;
  const roofY = topAt(t);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, roofY - deckTop + 0.35, 16), metalMat);
  pipe.position.set(stoveX, (deckTop + 0.55 + roofY + 0.35) / 2, stoveZ);
  pipe.castShadow = true;
  group.add(pipe);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.05, 16), metalMat);
  cap.position.set(stoveX, roofY + 0.4, stoveZ);
  cap.castShadow = true;
  group.add(cap);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), metalMat);
  collar.position.set(stoveX, roofY + 0.02, stoveZ);
  collar.rotation.x = Math.atan2(topAt(t + 0.05) - topAt(t - 0.05), outward * bD * 0.1);
  group.add(collar);
}

function addDoor(
  group: THREE.Group,
  spec: {
    x: number;
    sign: number;
    z: number;
    sill: number;
    head: number;
    width: number;
    glass: boolean;
    glassMat: THREE.Material;
    trimMat: THREE.Material;
    leafMat: THREE.Material;
  }
) {
  const height = spec.head - spec.sill;
  const y = (spec.sill + spec.head) / 2;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, height + 0.06, spec.width + 0.08), spec.trimMat);
  frame.position.set(spec.x + spec.sign * 0.02, y, spec.z);
  frame.castShadow = true;
  group.add(frame);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.02, height - 0.04, spec.width - 0.04), spec.leafMat);
  leaf.position.set(spec.x + spec.sign * 0.035, y + 0.01, spec.z);
  leaf.castShadow = !spec.glass;
  group.add(leaf);
  if (spec.glass) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 10), spec.trimMat);
    handle.position.set(spec.x + spec.sign * 0.05, spec.sill + 0.95, spec.z + spec.width * 0.28);
    group.add(handle);
  }
}
