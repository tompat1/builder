import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptTerraces, terracePrice, terracesFromLegacy } from '../src/outside/terrace.ts';

test('a door deck and a full covered side keep their catalog prices', () => {
  assert.equal(terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false }), 28400);
  assert.equal(terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: true }), 42600);
  assert.equal(terracePrice({ side: 'left', depth: 2.4, span: 'full', roof: true }), 72600);
  assert.equal(terracePrice({ side: 'left', depth: 2.4, span: 'full', roof: false }), 58400);
});

test('a deeper deck costs more, and a shallower one costs less', () => {
  const shallow = terracePrice({ side: 'front', depth: 1.2, span: 'door', roof: false });
  const deep = terracePrice({ side: 'front', depth: 3, span: 'door', roof: false });
  assert.ok(shallow < 28400);
  assert.ok(deep > 28400);
});

test('old houses become one terrace, and a full side wins over a door deck', () => {
  assert.deepEqual(terracesFromLegacy({ terrace: true, terraceCeiling: true }), [
    { side: 'front', depth: 1.8, span: 'door', roof: true }
  ]);
  assert.deepEqual(
    terracesFromLegacy({ terrace: true, bigTerrace: true, terraceSide: 'left' }),
    [{ side: 'left', depth: 2.4, span: 'full', roof: true }]
  );
  assert.deepEqual(terracesFromLegacy({}), []);
});

test('a saved list keeps one terrace per side', () => {
  const terraces = acceptTerraces([
    { side: 'front', depth: 3, span: 'full', roof: true },
    { side: 'front', depth: 1.2, span: 'door', roof: false },
    { side: 'back', depth: 9, span: 'nope', roof: 1 },
    { side: 'up', depth: 1.8 }
  ]);
  assert.equal(terraces.length, 2);
  assert.equal(terraces[0].depth, 3);
  assert.equal(terraces[1].side, 'back');
  assert.equal(terraces[1].depth, 1.8);
  assert.equal(terraces[1].span, 'door');
  assert.equal(terraces[1].roof, false);
});
