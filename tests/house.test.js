import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptHouse } from '../workers/house.js';

test('a house config is stored only as a bounded object', () => {
  const saved = acceptHouse({ config: { buildingWidth: 6040, wallSlots: { front: { itemId: 'STEHAG' } } } });
  assert.match(saved, /6040/);
  assert.equal(acceptHouse({ config: [] }), null);
  assert.equal(acceptHouse({}), null);
  assert.equal(acceptHouse({ config: { note: 'x'.repeat(100_001) } }), null);
});
