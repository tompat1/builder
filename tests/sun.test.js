import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compassAxes,
  formatSunHour,
  headingForFacing,
  sunPlacement
} from '../src/three-engine/sunPosition.ts';

test('a south-facing front takes the noon sun', () => {
  const sun = sunPlacement(12, headingForFacing('south'));
  assert.ok(sun.altitude > 0.4);
  assert.ok(sun.y > 0.4);
  assert.ok(sun.z > 0.7);
  assert.ok(Math.abs(sun.x) < 0.05);
  assert.ok(Math.abs(Math.hypot(sun.x, sun.y, sun.z) - 1) < 1e-6);
});

test('morning and afternoon sit east and west of a south-facing front', () => {
  const morning = sunPlacement(8, 180);
  const afternoon = sunPlacement(16, 180);
  assert.ok(morning.x > 0.4);
  assert.ok(morning.y > 0);
  assert.ok(afternoon.x < -0.4);
  assert.ok(afternoon.y > 0);
});

test('noon is behind the front when the front faces north', () => {
  const sun = sunPlacement(12, 0);
  assert.ok(sun.z < -0.7);
  assert.ok(sun.y > 0.4);
});

test('the sun is down outside the equinox day', () => {
  assert.ok(sunPlacement(5, 180).altitude < 0);
  assert.ok(sunPlacement(20, 180).altitude < 0);
  assert.ok(sunPlacement(7, 180).altitude > 0);
  assert.ok(sunPlacement(17, 180).altitude > 0);
});

test('east is on the right when looking at a south-facing front', () => {
  const { north, east } = compassAxes(180);
  assert.ok(north.z < -0.9);
  assert.ok(east.x > 0.9);
});

test('the clock labels quarter hours', () => {
  assert.equal(formatSunHour(12), '12:00');
  assert.equal(formatSunHour(13.25), '13:15');
  assert.equal(formatSunHour(5), '05:00');
});
