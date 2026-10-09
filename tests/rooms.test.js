import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitRoom,
  innerHalf,
  roomInsideShell,
  shellSides
} from '../src/three-engine/roomWalls.ts';

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
