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
  loftStairTreads
} from '../src/three-engine/loftLevel.ts';

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
