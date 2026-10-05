import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptHouse, acceptHouseName } from '../workers/house.js';
import { acceptHouseThumb } from '../src/services/houseThumb.ts';

test('a house config is stored only as a bounded object', () => {
  const saved = acceptHouse({ config: { buildingWidth: 6040, wallSlots: { front: { itemId: 'STEHAG' } } } });
  assert.match(saved, /6040/);
  assert.equal(acceptHouse({ config: [] }), null);
  assert.equal(acceptHouse({}), null);
  assert.equal(acceptHouse({ config: { note: 'x'.repeat(100_001) } }), null);
});

test('a house thumb is a short jpeg picture', () => {
  const jpeg = `data:image/jpeg;base64,${Buffer.alloc(48, 7).toString('base64')}`;
  assert.equal(acceptHouseThumb(jpeg), jpeg);
  assert.equal(acceptHouseThumb('data:image/png;base64,aaaa'), '');
  assert.equal(acceptHouseThumb(`${jpeg}${'A'.repeat(24_000)}`), '');
});

test('a saved house needs a short name', () => {
  assert.equal(acceptHouseName('  Röda huset  '), 'Röda huset');
  assert.equal(acceptHouseName('   '), null);
  assert.equal(acceptHouseName('x'.repeat(81)), null);
});
