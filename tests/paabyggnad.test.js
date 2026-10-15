import test from 'node:test';
import assert from 'node:assert/strict';
import { floorAreaSqMeters } from '../src/store/area.ts';
import {
  CONCRETE_STOREY_TOP_M,
  acceptConcreteWalls,
  clampConcretePlan,
  clampConcreteWall,
  clampPaabyggnadPlan,
  paabyggnadLoftAreas,
  panelOnConcrete,
  timberShellOnConcrete
} from '../src/store/paabyggnad.ts';

test('the concrete house stops at 2.5 m so the timber loft starts above it', () => {
  assert.equal(CONCRETE_STOREY_TOP_M, 2.5);
});

test('the concrete house is 27 m² and can grow to 35 m² without shrinking the old plan', () => {
  assert.equal(floorAreaSqMeters(5200, 5200), 27);

  const extended = clampPaabyggnadPlan('width', 8000, 5200, 5000);
  assert.equal(extended.depth, 5200);
  assert.ok(extended.width >= 5200);
  assert.ok(floorAreaSqMeters(extended.width, extended.depth) <= 35);

  const smallerWood = clampPaabyggnadPlan('depth', 5200, 4000, 5000);
  assert.equal(smallerWood.width, 5200);
  assert.equal(smallerWood.depth, 4000);
});

test('the timber addition stays between 450 and 500 cm high', () => {
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 3000).height, 4500);
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 6000).height, 5000);
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 4800).height, 4800);
});

test('a loft on this house never exceeds the timber plan', () => {
  const areas = paabyggnadLoftAreas(5200, 5200);
  assert.equal(areas[areas.length - 1], 27);
  assert.ok(areas.every((area) => area <= 35));
});

test('changing the timber plan leaves the concrete walls at their own size', () => {
  const concrete = { width: 5200, depth: 5200, height: 2500 };
  const timber = clampPaabyggnadPlan('width', 8000, 5200, 5000);
  assert.equal(concrete.width, 5200);
  assert.equal(concrete.height, 2500);
  assert.ok(timber.width !== concrete.width);

  const sized = clampConcretePlan('width', { width: 6000, depth: 5200, height: 2500 });
  assert.equal(sized.width, 6000);
  assert.equal(sized.depth, 5200);
  assert.equal(clampConcretePlan('height', { ...concrete, height: 4800 }).height, 4000);
});

test('an extra concrete wall stays inside the shell', () => {
  const fitted = clampConcreteWall({ id: 'cw_1', axis: 'x', offsetMm: 4000 }, 5200, 5200);
  assert.equal(fitted.offsetMm, 2200);
  assert.equal(clampConcreteWall({ id: 'cw_1', axis: 'z', offsetMm: -300 }, 5200, 5200).offsetMm, -300);
  const kept = acceptConcreteWalls([
    { id: 'cw_a', axis: 'z', offsetMm: 100 },
    { id: '', axis: 'x', offsetMm: 0 },
    { nope: true }
  ], 5200, 5200);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, 'cw_a');
});

test('wooden outer walls stay in line with the concrete facade', () => {
  const same = timberShellOnConcrete(5.2, 5.2, 5.2, 5.2);
  assert.equal(same.x, 0);
  assert.equal(same.z, 0);
  assert.equal(same.widthM, 5.2);
  const wider = timberShellOnConcrete(6.04, 4.95, 5.2, 5.2);
  assert.equal(wider.widthM, 6.04);
  assert.equal(wider.depthM, 5.2);
  assert.ok(Math.abs(-wider.widthM / 2 + wider.x - -5.2 / 2) < 1e-9);
  assert.equal(wider.z, 0);
});

test('only panels on the 520 cm concrete faces count as the old house', () => {
  assert.equal(panelOnConcrete('front', -1.95, 2.5875, 1.3), true);
  assert.equal(panelOnConcrete('front', 0, 3.36, 1.3), false);
  assert.equal(panelOnConcrete('left', -2.5875, 0, 1.72), true);
  assert.equal(panelOnConcrete('left', -2.5875, 2.79, 2.23), false);
});
