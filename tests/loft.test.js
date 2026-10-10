import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERIOR_FLOOR_TOP,
  LOFT_FLOORBOARD,
  LOFT_JOIST,
  LOFT_MIN_ABOVE_FLOOR,
  doorFrameTop,
  loftEndPoint,
  loftIsGhosted,
  loftJoistTop,
  curvedLoftStair,
  loftStairOpening,
  loftStairRun,
  loftStairTreads,
  straightLoftStair,
  isLoftRoom
} from '../src/three-engine/loftLevel.ts';
import {
  ceilingStations,
  heightAt,
  loftCeilingY,
  roofPlateY,
  sliceStations
} from '../src/three-engine/roofClearance.ts';

test('the loft deck is at least 2.5 m above the interior floor and above the door frame', () => {
  const wall = 5;
  const joistTop = loftJoistTop(wall);
  const walkingSurface = joistTop + LOFT_FLOORBOARD;
  const joistUnderside = joistTop - LOFT_JOIST;
  const frame = doorFrameTop(wall);

  assert.ok(walkingSurface >= INTERIOR_FLOOR_TOP + LOFT_MIN_ABOVE_FLOOR - 1e-9);
  assert.ok(Math.abs(walkingSurface - (INTERIOR_FLOOR_TOP + 2.5)) < 1e-9);
  assert.ok(joistUnderside > frame);
  assert.ok(frame > 2.3);
});

test('a room on the loft deck counts as a loft room, and a ground-floor room does not', () => {
  assert.equal(isLoftRoom(INTERIOR_FLOOR_TOP), false);
  assert.equal(isLoftRoom(loftJoistTop(5) + LOFT_FLOORBOARD), true);
});

test('the interior loft is solid only while a loft room is being edited', () => {
  assert.equal(loftIsGhosted('insida', false), true);
  assert.equal(loftIsGhosted('insida', true), false);
  assert.equal(loftIsGhosted('insida', false, true), false);
  assert.equal(loftIsGhosted('utsida', false), false);
  assert.equal(loftIsGhosted('blueprint', false), false);
});

const pulpet = { kind: 'shed', degrees: 12, anchor: 'front', minRear: 2.4 };
const gable = { kind: 'gable', degrees: 22 };
const lowGable = { kind: 'gable', degrees: 14 };

test('a loft ceiling follows the mono-pitch roof and stays under the plate', () => {
  const depth = 4.95;
  const wall = 5;
  const front = roofPlateY(pulpet, depth, wall, depth / 2);
  const rear = roofPlateY(pulpet, depth, wall, -depth / 2);
  const drop = Math.tan((12 * Math.PI) / 180) * depth;

  assert.ok(Math.abs(front - wall) < 1e-6);
  assert.ok(Math.abs(rear - (wall - drop)) < 1e-6);
  assert.ok(loftCeilingY(pulpet, depth, wall, 0) < roofPlateY(pulpet, depth, wall, 0));
  assert.ok(loftCeilingY(pulpet, depth, wall, 1) > loftCeilingY(pulpet, depth, wall, -1));
});

test('a gable loft ceiling peaks at the ridge and meets both eaves', () => {
  const depth = 5;
  const wall = 5;
  const ridge = roofPlateY(gable, depth, wall, 0);
  const eave = roofPlateY(gable, depth, wall, depth / 2);

  assert.ok(Math.abs(eave - wall) < 1e-6);
  assert.ok(Math.abs(roofPlateY(gable, depth, wall, -depth / 2) - wall) < 1e-6);
  assert.ok(ridge > eave);
  assert.equal(roofPlateY(gable, depth, wall, 0.8), roofPlateY(gable, depth, wall, -0.8));
  assert.ok(loftCeilingY(lowGable, depth, wall + 0.4, 0) > wall + 0.4);
});

test('a loft wall picks up the ridge when the room crosses it', () => {
  const stations = ceilingStations(gable, -1.2, 0.8, 0.2);
  assert.deepEqual(stations, [-1.2, -0.2, 0.8]);
  assert.deepEqual(ceilingStations(pulpet, -1.2, 0.8, 0.2), [-1.2, 0.8]);

  const profile = [
    { at: -1, top: 1.2 },
    { at: 0, top: 2 },
    { at: 1, top: 1.2 }
  ];
  assert.equal(heightAt(profile, 0.5), 1.6);
  const door = sliceStations(profile, -0.4, 0.4);
  assert.equal(door.length, 3);
  assert.equal(door[1].at, 0);
  assert.equal(door[0].top, heightAt(profile, -0.4));
});

test('a taller rise keeps a walkable stair inside the room', () => {
  const rise = loftJoistTop(5) - 0.275;
  const run = loftStairRun(rise, 3.14);
  const treads = loftStairTreads(rise);
  const angle = Math.atan2(rise, run) * (180 / Math.PI);

  assert.ok(angle < 62);
  assert.ok(angle > 50);
  assert.ok(run < 3.14);
  assert.ok(treads >= 10);
});

test('each stair type gets a floor opening that fits inside the loft', () => {
  const straight = loftStairOpening('straight', 2.4, 4.5);
  const curved = loftStairOpening('curved', 2.4, 4.5);

  assert.ok(straight.width < 2.4);
  assert.ok(straight.depth < 4.5);
  assert.ok(curved.width > straight.width);
  assert.ok(curved.depth > straight.depth);
  assert.ok(curved.depth < 4.5);

  const compact = loftStairOpening('curved', 1.2, 1.5);
  assert.ok(compact.width < 1.2);
  assert.ok(compact.depth < 1.5);
});

test('a front loft sits on the front wall, and a back loft sits on the back wall', () => {
  const depth = 4.95;
  const wall = 0.18;
  const outer = -depth / 2 + wall;
  const front = loftEndPoint('fram', outer, 0);
  const back = loftEndPoint('bak', outer, 0);
  assert.ok(Math.abs(front.z - (depth / 2 - wall)) < 1e-6);
  assert.ok(Math.abs(front.x) < 1e-6);
  assert.ok(Math.abs(back.z - (-depth / 2 + wall)) < 1e-6);
  assert.ok(Math.abs(back.x) < 1e-6);
});

test('the straight stair lands on the deck and descends into the open room', () => {
  const interiorD = 3.14;
  const rise = 2.5;
  const run = loftStairRun(rise, 3.2);
  const opening = loftStairOpening('straight', 2.3, interiorD);
  const edgeX = -0.4;
  const stairZ = interiorD / 2 - opening.depth / 2;
  const stair = straightLoftStair({
    edgeX,
    openSign: 1,
    stairZ,
    opening,
    run,
    rise
  });

  assert.equal(stair.xTop, edgeX - opening.width);
  assert.ok(stair.xBottom > edgeX);
  assert.equal(stair.z, stairZ);
  assert.ok(stair.yTop - stair.yBottom === rise);
});

test('front and back stair positions mirror along the loft edge', () => {
  const interiorD = 3.14;
  const frontZ = interiorD / 2;
  const opening = loftStairOpening('curved', 2.3, interiorD);
  const frontStairZ = frontZ - opening.depth / 2;
  const backStairZ = -frontStairZ;
  const front = curvedLoftStair({
    edgeX: -0.2,
    openSign: 1,
    stairZ: frontStairZ,
    opening,
    rise: 2.5
  });
  const back = curvedLoftStair({
    edgeX: -0.2,
    openSign: 1,
    stairZ: backStairZ,
    opening,
    rise: 2.5
  });
  const topX = front.centerX + Math.cos(front.topAngle) * front.radius;
  const openingInnerX = -0.2 - opening.width;

  assert.ok(Math.abs(topX - openingInnerX) < 0.15);
  assert.equal(front.centerZ, -back.centerZ);
  assert.ok(front.centerZ + front.radius < frontZ);
  assert.ok(back.centerZ - back.radius > -frontZ);
  assert.ok(front.yTop - front.yBottom === 2.5);
});
