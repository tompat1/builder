import test from 'node:test';
import assert from 'node:assert/strict';
import { floorAreaSqMeters } from '../src/store/area.ts';
import {
  CONCRETE_STOREY_TOP_M,
  clampPaabyggnadPlan,
  paabyggnadLoftAreas,
  panelOnConcrete
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

  const tooSmall = clampPaabyggnadPlan('depth', 5200, 4000, 5000);
  assert.equal(tooSmall.width, 5200);
  assert.equal(tooSmall.depth, 5200);
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

test('only panels on the 520 cm concrete faces count as the old house', () => {
  assert.equal(panelOnConcrete('front', -1.95, 2.5875, 1.3), true);
  assert.equal(panelOnConcrete('front', 0, 3.36, 1.3), false);
  assert.equal(panelOnConcrete('left', -2.5875, 0, 1.72), true);
  assert.equal(panelOnConcrete('left', -2.5875, 2.79, 2.23), false);
});
