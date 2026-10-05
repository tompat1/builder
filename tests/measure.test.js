import test from 'node:test';
import assert from 'node:assert/strict';
import { measureLengthMm, nextMeasure } from '../src/measure/length.ts';

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
