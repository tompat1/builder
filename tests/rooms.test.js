import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptPlacedRooms,
  fitRoom,
  innerHalf,
  roomInsideShell,
  roomWallRuns,
  shellSides,
  bedroomBedPlacement
} from '../src/three-engine/roomWalls.ts';
import { loftDeckBounds } from '../src/three-engine/loftLevel.ts';

const attefall = innerHalf(6.25, 5.12);

test('a bathroom dropped in a corner stays inside and drops the two outer walls', () => {
  const fitted = fitRoom({ x: -3, z: -2.2, w: 2, d: 2 }, attefall.hx, attefall.hz);
  const sides = shellSides(fitted, attefall.hx, attefall.hz);

  assert.ok(roomInsideShell(fitted, attefall.hx, attefall.hz));
  assert.equal(sides.left, true);
  assert.equal(sides.back, true);
  assert.equal(sides.right, false);
  assert.equal(sides.front, false);
  assert.ok(Math.abs(fitted.x - fitted.w / 2 + attefall.hx) < 1e-6);
  assert.ok(Math.abs(fitted.z - fitted.d / 2 + attefall.hz) < 1e-6);
});

test('a room in the middle of the plan keeps every partition', () => {
  const fitted = fitRoom({ x: 0.2, z: -0.1, w: 2, d: 2 }, attefall.hx, attefall.hz);
  const sides = shellSides(fitted, attefall.hx, attefall.hz);

  assert.deepEqual(sides, { left: false, right: false, front: false, back: false });
  assert.equal(fitted.w, 2);
  assert.equal(fitted.d, 2);
  assert.ok(roomInsideShell(fitted, attefall.hx, attefall.hz));
});

test('a room larger than the interior shrinks to the stud line and opens every side', () => {
  const fitted = fitRoom({ x: 0.4, z: -0.2, w: 8, d: 7 }, attefall.hx, attefall.hz);
  const sides = shellSides(fitted, attefall.hx, attefall.hz);

  assert.ok(roomInsideShell(fitted, attefall.hx, attefall.hz));
  assert.ok(Math.abs(fitted.w - attefall.hx * 2) < 1e-6);
  assert.ok(Math.abs(fitted.d - attefall.hz * 2) < 1e-6);
  assert.deepEqual(sides, { left: true, right: true, front: true, back: true });
});

test('an edge just inside the shell snaps flush and that partition is removed', () => {
  const gap = 0.12;
  const fitted = fitRoom(
    { x: -attefall.hx + gap + 1, z: 0, w: 2, d: 2 },
    attefall.hx,
    attefall.hz
  );
  const sides = shellSides(fitted, attefall.hx, attefall.hz);

  assert.equal(sides.left, true);
  assert.equal(sides.right, false);
  assert.ok(Math.abs(fitted.x - fitted.w / 2 + attefall.hx) < 1e-6);
  assert.ok(roomInsideShell(fitted, attefall.hx, attefall.hz));
});

test('an edge clear of the shell keeps its partition', () => {
  const fitted = fitRoom({ x: -0.4, z: 0, w: 2, d: 2 }, attefall.hx, attefall.hz);
  const sides = shellSides(fitted, attefall.hx, attefall.hz);

  assert.equal(sides.left, false);
  assert.ok(fitted.x - fitted.w / 2 > -attefall.hx + 0.2);
});

test('fitting a room twice does not move it again', () => {
  const once = fitRoom({ x: -3, z: 1.4, w: 2.4, d: 1.8 }, attefall.hx, attefall.hz);
  const twice = fitRoom(once, attefall.hx, attefall.hz);

  assert.deepEqual(twice, once);
  assert.ok(roomInsideShell(twice, attefall.hx, attefall.hz));
});

test('saved rooms keep the wall toggle and older rooms default to walls', () => {
  const rooms = acceptPlacedRooms({
    bedroom_1: { type: 'bedroom', w: 3, d: 3, x: 0, y: 2.8, z: 0, wallsVisible: false },
    storage_1: { type: 'storage', w: 1.5, d: 1.5, x: 1, y: 0.3, z: 1 }
  });

  assert.equal(rooms.bedroom_1.wallsVisible, false);
  assert.equal(rooms.storage_1.wallsVisible, true);
});

test('room partitions meet at closed corners without leaving a square gap', () => {
  const closed = roomWallRuns(3, 2, { left: false, right: false, front: false, back: false });
  assert.deepEqual(closed.front, { size: 3, center: 0 });
  assert.deepEqual(closed.back, { size: 3, center: 0 });
  assert.ok(Math.abs(closed.left.size - 1.8) < 1e-9);
  assert.ok(Math.abs(closed.right.size - 1.8) < 1e-9);
  assert.equal(closed.left.center, 0);
  assert.equal(closed.right.center, 0);

  const openFront = roomWallRuns(3, 2, { left: false, right: false, front: true, back: false });
  assert.ok(Math.abs(openFront.left.size - 1.9) < 1e-9);
  assert.equal(openFront.left.center, 0.05);
});

test('fitRoom clamps a room within custom loft deck bounds', () => {
  const loftBounds = {
    minX: -2.42,
    maxX: 2.42,
    minZ: 0.20,
    maxZ: 3.18
  };
  // Trying to place a room beyond the front wall or behind the railing
  const roomPastFront = fitRoom({ x: 0, z: 4.5, w: 2.4, d: 2.8 }, 2.42, 3.18, loftBounds);
  assert.ok(roomPastFront.z + roomPastFront.d / 2 <= loftBounds.maxZ + 1e-6);
  assert.ok(roomPastFront.z - roomPastFront.d / 2 >= loftBounds.minZ - 1e-6);

  const roomBehindRailing = fitRoom({ x: 0, z: -1.0, w: 2.4, d: 2.8 }, 2.42, 3.18, loftBounds);
  assert.ok(roomBehindRailing.z - roomBehindRailing.d / 2 >= loftBounds.minZ - 1e-6);
  assert.ok(roomBehindRailing.z + roomBehindRailing.d / 2 <= loftBounds.maxZ + 1e-6);
});

test('two bedrooms fit side-by-side on the front loft without overlapping', () => {
  const loft = loftDeckBounds(5.2, 6.731, 16.4, 'fram', false, true);
  assert.ok(loft.minX < 0 && loft.maxX > 0);
  assert.ok(loft.minZ > 0); // Front loft stays in front half
  assert.ok(loft.maxZ > loft.minZ);

  const bed1 = fitRoom(
    { x: -1.21, z: 1.69, w: 2.4, d: 2.8 },
    loft.maxX,
    loft.maxZ,
    loft
  );
  const bed2 = fitRoom(
    { x: 1.21, z: 1.69, w: 2.4, d: 2.8 },
    loft.maxX,
    loft.maxZ,
    loft
  );

  // Both bedrooms stay on the loft deck
  assert.ok(bed1.x - bed1.w / 2 >= loft.minX - 1e-6);
  assert.ok(bed1.x + bed1.w / 2 <= 1e-6); // Left bedroom stays on left half
  assert.ok(bed2.x - bed2.w / 2 >= -1e-6); // Right bedroom stays on right half
  assert.ok(bed2.x + bed2.w / 2 <= loft.maxX + 1e-6);

  // Front edges do not poke past front wall
  assert.ok(bed1.z + bed1.d / 2 <= loft.maxZ + 1e-6);
  assert.ok(bed2.z + bed2.d / 2 <= loft.maxZ + 1e-6);

  // Back edges do not fall behind loft deck
  assert.ok(bed1.z - bed1.d / 2 >= loft.minZ - 1e-6);
  assert.ok(bed2.z - bed2.d / 2 >= loft.minZ - 1e-6);
});

test('bedroomBedPlacement keeps beds strictly inside room and shell bounds without protruding', () => {
  const shell = innerHalf(5.2, 6.731);

  // Front bedroom with open.front = true (touching front exterior wall)
  const roomW = 2.41;
  const roomD = 2.876;
  const openFrontSides = { left: true, right: false, back: false, front: true };
  const place = { x: 1.215, y: 2.8, z: 1.748 };

  const layout = bedroomBedPlacement(roomW, roomD, openFrontSides, place, shell);

  // The bed front face inside the room is pulled back from the front window wall
  assert.ok(layout.bedZ + layout.bedD / 2 <= roomD / 2 - 0.20);

  // The bed world coordinate stays strictly inside the house shell envelope
  const worldFront = place.z + layout.bedZ + layout.bedD / 2;
  const worldBack = place.z + layout.bedZ - layout.bedD / 2;
  assert.ok(worldFront <= shell.hz - 0.15);
  assert.ok(worldBack >= -shell.hz + 0.15);

  const worldRight = place.x + layout.bedX + layout.bedW / 2;
  const worldLeft = place.x + layout.bedX - layout.bedW / 2;
  assert.ok(worldRight <= shell.hx - 0.15);
  assert.ok(worldLeft >= -shell.hx + 0.15);

  // Headboard sits against the interior back partition (-roomD / 2), leaving ample walking space
  assert.ok(layout.bedZ - layout.bedD / 2 >= -roomD / 2 + 0.05);
});

test('bedroomBedPlacement orients bed sideways when room is wider than deep', () => {
  const shallowRoom = bedroomBedPlacement(
    2.4,
    2.0,
    { left: false, right: false, back: true, front: false }
  );
  // In a shallow room (d=2.0, w=2.4), bed is oriented sideways (2.0m wide along wall, 1.6m deep)
  assert.equal(shallowRoom.bedW, 2.0);
  assert.equal(shallowRoom.bedD, 1.6);
});
