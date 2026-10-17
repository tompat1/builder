import test from 'node:test';
import assert from 'node:assert/strict';
import { measureLengthMm, nextMeasure, MEASURE_CURSOR } from '../src/measure/length.ts';

test('a ruler reads the straight distance in millimetres', () => {
  assert.equal(measureLengthMm({ x: 0, y: 0, z: 0 }, { x: 1.5, y: 0, z: 0 }), 1500);
  assert.equal(measureLengthMm({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 2 }), 2000);
  assert.equal(measureLengthMm({ x: 0, y: 0, z: 0 }, { x: 0.3, y: 0.4, z: 0 }), 500);
});

test('the second click finishes the ruler and a later click starts a new one', () => {
  const first = nextMeasure(null, null, { x: 0, y: 0, z: 0 });
  assert.deepEqual(first, { start: { x: 0, y: 0, z: 0 }, end: null });
  const tooClose = nextMeasure(first.start, first.end, { x: 0.002, y: 0, z: 0 });
  assert.equal(tooClose.end, null);
  const done = nextMeasure(first.start, first.end, { x: 1, y: 0, z: 0 });
  assert.equal(done.end?.x, 1);
  const again = nextMeasure(done.start, done.end, { x: 0, y: 2, z: 0 });
  assert.deepEqual(again, { start: { x: 0, y: 2, z: 0 }, end: null });
});

test('measuring tape uses a precision + crosshair cursor', () => {
  assert.ok(typeof MEASURE_CURSOR === 'string');
  assert.ok(MEASURE_CURSOR.includes('crosshair'));
  assert.ok(MEASURE_CURSOR.includes('data:image/svg+xml'));
});

test('measures distance between ground level and terrace deck surface', () => {
  // Ground level y = 0, standard terrace deck top y = 0.28
  const groundPoint = { x: 0, y: 0, z: 3.5 };
  const deckPoint = { x: 0, y: 0.28, z: 3.5 };
  assert.equal(measureLengthMm(groundPoint, deckPoint), 280);

  // Deck depth measurement from wall facade (z = 2.4) to terrace outer rim (z = 4.2)
  const wallBase = { x: 1.0, y: 0.28, z: 2.4 };
  const terraceRim = { x: 1.0, y: 0.28, z: 4.2 };
  assert.equal(measureLengthMm(wallBase, terraceRim), 1800);

  // Ground level to door canopy roof (y = 2.45, outward projection 0.92)
  const groundInFront = { x: 0, y: 0, z: 3.32 };
  const canopyEdge = { x: 0, y: 2.45, z: 3.32 };
  assert.equal(measureLengthMm(groundInFront, canopyEdge), 2450);
});
