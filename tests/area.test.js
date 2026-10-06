import test from 'node:test';
import assert from 'node:assert/strict';
import { floorAreaSqMeters } from '../src/store/area.ts';

test('floor area follows width times length', () => {
  assert.equal(floorAreaSqMeters(6040, 3503), 21.2);
  assert.equal(floorAreaSqMeters(6040, 4900), 29.6);
  assert.equal(floorAreaSqMeters(8000, 5000), 40);
});
