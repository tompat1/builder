import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TERRACE_DEPTHS,
  acceptTerraces,
  terraceBoardLayout,
  terracePrice,
  terracesFromLegacy
} from '../src/outside/terrace.ts';

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

test('terrace boards meet without gaps and finish flush at both edges', () => {
  for (const depth of TERRACE_DEPTHS) {
    const layout = terraceBoardLayout(depth);
    const firstEdge = layout.centers[0] - layout.depth / 2;
    const lastEdge = layout.centers.at(-1) + layout.depth / 2;

    assert.ok(Math.abs(firstEdge) < 1e-10);
    assert.ok(Math.abs(lastEdge - depth) < 1e-10);
    for (let index = 1; index < layout.centers.length; index += 1) {
      const previousEdge = layout.centers[index - 1] + layout.depth / 2;
      const nextEdge = layout.centers[index] - layout.depth / 2;
      assert.ok(Math.abs(previousEdge - nextEdge) < 1e-10);
    }
  }
});

test('a terrace can include a sauna or shed as an additional building', () => {
  const base = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false });
  const withSauna = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna' });
  const withShed = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'shed' });
  assert.equal(withSauna, base + 48000);
  assert.equal(withShed, base + 32000);

  const terraces = acceptTerraces([
    { side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingPlacement: 'left' },
    { side: 'left', depth: 2.4, span: 'full', roof: true, building: 'shed', buildingPlacement: 'right' },
    { side: 'back', depth: 1.8, span: 'door', roof: false, building: 'invalid', buildingPlacement: 'middle' }
  ]);
  assert.equal(terraces[0].building, 'sauna');
  assert.equal(terraces[0].buildingPlacement, 'left');
  assert.equal(terraces[1].building, 'shed');
  assert.equal(terraces[1].buildingPlacement, 'right');
  assert.equal(terraces[2].building, undefined);
  assert.equal(terraces[2].buildingPlacement, undefined);

  const resetTerraces = acceptTerraces([
    { side: 'back', depth: 3, span: 'full', roof: false, building: 'none' }
  ]);
  assert.equal(resetTerraces[0].building, 'none');
});
