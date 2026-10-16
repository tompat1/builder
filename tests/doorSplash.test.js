import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDER_MARK_DOOR, createDoorRig, svgPath } from '../src/splash/doorGeometry.ts';
import {
  cubicBezier,
  doorAngleAt,
  LATCH_ANGLE,
  LATCH_END_MS,
  LATCH_START_MS,
  OPEN_ANGLE,
  SWING_END_MS,
  SWING_START_MS
} from '../src/splash/doorMotion.ts';

test('door rig generates accurate geometry from brand aperture', () => {
  const rig = createDoorRig(BUILDER_MARK_DOOR);
  assert.ok(rig.width > 100 && rig.width < 120, 'door width in expected isometric range');
  assert.equal(rig.height, 182, 'door height matches vector aperture height');

  // Closed door state (angle 0)
  const f0 = rig.frame(0);
  assert.equal(f0.reveal, 0, 'closed door reveals no interior');
  assert.equal(f0.swing, 0, 'closed door has zero swing projection');
  assert.equal(f0.shadow, '', 'closed door casts no external shadow');
  assert.equal(f0.behind.length, 0, 'no occluded faces behind wall when closed');
  assert.equal(f0.front.length, 1, 'closed door renders a single flush face');
  assert.equal(f0.front[0].fill, '#ffffff', 'front face is clean brand white');
  assert.equal(f0.front[0].d, svgPath(BUILDER_MARK_DOOR.aperture));

  // Swung door state (angle 90)
  const f90 = rig.frame(90);
  assert.equal(f90.reveal, 1, 'fully open door reveals interior');
  assert.equal(Math.round(f90.swing), 1, 'perpendicular door has full swing');
  assert.ok(f90.shadow.startsWith('M'), 'open door casts polygon shadow');
  assert.ok(f90.front.length >= 2, 'open door displays 3D front faces');
  assert.ok(f90.behind.length >= 1, 'occluded back of door clipped through aperture');
});

test('cubic bezier solver evaluates endpoints and monotonic progression', () => {
  const ease = cubicBezier(0.5, 0, 0.18, 1);
  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  assert.ok(ease(0.2) < ease(0.5));
  assert.ok(ease(0.5) < ease(0.8));
});

test('door motion curve follows architectural timing synced to audio envelope', () => {
  assert.equal(doorAngleAt(0), 0);
  assert.equal(doorAngleAt(LATCH_START_MS), 0);
  assert.equal(Math.round(doorAngleAt(LATCH_END_MS) * 10) / 10, LATCH_ANGLE);
  assert.equal(Math.round(doorAngleAt(SWING_START_MS) * 10) / 10, LATCH_ANGLE);
  assert.equal(Math.round(doorAngleAt(SWING_END_MS)), OPEN_ANGLE);
  assert.equal(doorAngleAt(SWING_END_MS + 500), OPEN_ANGLE);

  // Monotonic opening
  const a1 = doorAngleAt(SWING_START_MS + 200);
  const a2 = doorAngleAt(SWING_START_MS + 800);
  const a3 = doorAngleAt(SWING_START_MS + 1400);
  assert.ok(a1 > LATCH_ANGLE);
  assert.ok(a2 > a1);
  assert.ok(a3 > a2);
  assert.ok(OPEN_ANGLE > a3);
});
