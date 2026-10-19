import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TERRACE_DEPTHS,
  acceptTerraces,
  buildingWallTop,
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
  const widest = terracePrice({ side: 'front', depth: 5, span: 'door', roof: false });
  assert.ok(shallow < 28400);
  assert.ok(deep > 28400);
  assert.ok(widest > deep);
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

test('a sauna keeps its roof, and an unknown roof is dropped', () => {
  const terraces = acceptTerraces([
    { side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingRoof: 'gable' },
    { side: 'left', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingRoof: 'flat' }
  ]);
  assert.equal(terraces[0].buildingRoof, 'gable');
  assert.equal(terraces[1].buildingRoof, undefined);
});

test('sauna wall tops meet the chosen roof with no open joint', () => {
  const depth = 2.1;
  for (const roof of ['pulpet', 'low', 'gable']) {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((t) => buildingWallTop(roof, depth, t));
    for (const height of samples) assert.ok(height >= 2.05 - 1e-9);
    if (roof === 'gable') {
      assert.ok(samples[2] > samples[0]);
      assert.equal(samples[0], samples[4]);
    } else {
      assert.ok(samples[0] > samples[4]);
    }
  }
  const lowRise = buildingWallTop('low', depth, 0) - buildingWallTop('low', depth, 1);
  assert.ok(Math.abs(lowRise - depth * Math.tan((3 * Math.PI) / 180)) < 1e-9);
  const pulpetRise = buildingWallTop('pulpet', depth, 0) - buildingWallTop('pulpet', depth, 1);
  assert.ok(pulpetRise > lowRise);
});
