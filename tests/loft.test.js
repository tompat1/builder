import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERIOR_FLOOR_TOP,
  LOFT_FLOORBOARD,
  LOFT_JOIST,
  LOFT_MIN_ABOVE_FLOOR,
  doorFrameTop,
  loftJoistTop,
  loftStairRun,
  loftStairTreads,
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
