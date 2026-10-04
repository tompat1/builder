import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptHouse, acceptHouseName } from '../workers/house.js';

test('a house config is stored only as a bounded object', () => {
  const saved = acceptHouse({ config: { buildingWidth: 6040, wallSlots: { front: { itemId: 'STEHAG' } } } });
  assert.match(saved, /6040/);
  assert.equal(acceptHouse({ config: [] }), null);
  assert.equal(acceptHouse({}), null);
  assert.equal(acceptHouse({ config: { note: 'x'.repeat(100_001) } }), null);
});

test('a saved house needs a short name', () => {
  assert.equal(acceptHouseName('  Röda huset  '), 'Röda huset');
  assert.equal(acceptHouseName('   '), null);
  assert.equal(acceptHouseName('x'.repeat(81)), null);
});
