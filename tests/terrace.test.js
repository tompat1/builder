import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TERRACE_DEPTHS,
  acceptTerraces,
  saunaFacing,
  buildingWallTop,
  terraceAdditionLayout,
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

test('a terrace can include a sauna, shed, and hot tub — cabin and tub can coexist', () => {
  const base = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false });
  const withSauna = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna' });
  const withShed = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'shed' });
  const withHotTub = terracePrice({ side: 'front', depth: 2.2, span: 'door', roof: false, hotTub: true });
  const withBoth = terracePrice({
    side: 'front',
    depth: 2.2,
    span: 'full',
    roof: false,
    building: 'sauna',
    hotTub: true
  });
  assert.equal(withSauna, base + 48000);
  assert.equal(withShed, base + 32000);
  assert.equal(withHotTub, terracePrice({ side: 'front', depth: 2.2, span: 'door', roof: false }) + 42000);
  assert.equal(
    withBoth,
    terracePrice({ side: 'front', depth: 2.2, span: 'full', roof: false, building: 'sauna' }) + 42000
  );

  const terraces = acceptTerraces([
    { side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingPlacement: 'left' },
    { side: 'left', depth: 2.4, span: 'full', roof: true, building: 'shed', buildingPlacement: 'right' },
    { side: 'back', depth: 2.2, span: 'door', roof: false, building: 'hot-tub', buildingPlacement: 'left' },
    { side: 'right', depth: 1.8, span: 'door', roof: false, building: 'invalid', buildingPlacement: 'middle' }
  ]);
  assert.equal(terraces[0].building, 'sauna');
  assert.equal(terraces[0].buildingPlacement, 'left');
  assert.equal(terraces[1].building, 'shed');
  assert.equal(terraces[1].buildingPlacement, 'right');
  assert.equal(terraces[2].building, undefined);
  assert.equal(terraces[2].hotTub, true);
  assert.equal(terraces[2].buildingPlacement, 'left');
  assert.equal(terraces[3].building, undefined);
  assert.equal(terraces[3].buildingPlacement, undefined);

  const both = acceptTerraces([
    { side: 'front', depth: 2.4, span: 'full', roof: false, building: 'sauna', hotTub: true, buildingPlacement: 'right' }
  ]);
  assert.equal(both[0].building, 'sauna');
  assert.equal(both[0].hotTub, true);

  const resetTerraces = acceptTerraces([
    { side: 'back', depth: 3, span: 'full', roof: false, building: 'none' }
  ]);
  assert.equal(resetTerraces[0].building, 'none');
});

test('sauna and hot tub sit on opposite ends of the terrace', () => {
  const both = terraceAdditionLayout({
    along: 0,
    width: 8,
    depth: 2.4,
    building: 'sauna',
    buildingPlacement: 'left',
    hotTub: true
  });
  assert.ok(both.cabin);
  assert.ok(both.hotTub);
  assert.equal(both.cabin.isLeft, true);
  assert.equal(both.hotTub.isLeft, false);
  assert.ok(both.cabin.bX + both.cabin.bW / 2 <= both.hotTub.bX - both.hotTub.bW / 2 + 1e-9);

  const tubOnly = terraceAdditionLayout({
    along: 0,
    width: 6,
    depth: 2.2,
    buildingPlacement: 'right',
    hotTub: true
  });
  assert.equal(tubOnly.cabin, null);
  assert.ok(tubOnly.hotTub);
  assert.equal(tubOnly.hotTub.isLeft, false);
});

test('wooden hot tub keeps 1 m clear of the house wall', async () => {
  const { HOT_TUB_MIN_DEPTH_M } = await import('../src/outside/terrace.ts');
  const {
    HOT_TUB_WALL_CLEARANCE_M,
    hotTubPlacementFromWall
  } = await import('../src/three-engine/terraceHotTub.ts');

  assert.equal(HOT_TUB_WALL_CLEARANCE_M, 1);
  assert.ok(HOT_TUB_MIN_DEPTH_M >= HOT_TUB_WALL_CLEARANCE_M + 2);

  const layout = terraceAdditionLayout({
    along: 0,
    width: 6,
    depth: HOT_TUB_MIN_DEPTH_M,
    buildingPlacement: 'right',
    hotTub: true
  });
  assert.ok(layout.hotTub);
  const { radius, centreFromWall } = hotTubPlacementFromWall(layout.hotTub.bW, layout.hotTub.bD);
  const wallGap = centreFromWall - radius;
  assert.ok(Math.abs(wallGap - HOT_TUB_WALL_CLEARANCE_M) < 1e-9);
  assert.ok(centreFromWall + radius <= layout.hotTub.bD + 1e-9);
});

test('a sauna interior turns a quarter at a time and stays one room', () => {
  const kept = acceptTerraces([
    { side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingTurn: 2 },
    { side: 'left', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingTurn: 4 },
    { side: 'back', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingTurn: 0 }
  ]);
  assert.equal(kept[0].buildingTurn, 2);
  assert.equal(kept[1].buildingTurn, undefined);
  assert.equal(kept[2].buildingTurn, undefined);

  for (const doorOnRight of [true, false]) {
    for (let turn = 0; turn < 4; turn += 1) {
      const room = saunaFacing(turn, doorOnRight);
      const again = saunaFacing(turn + 4, doorOnRight);
      assert.deepEqual(again, room);
      assert.notEqual(room.window, room.bench);
      assert.notEqual(room.door, room.bench);
      assert.notEqual(room.door, room.window);
    }
  }
  assert.deepEqual(saunaFacing(0, true), { bench: 'house', window: 'yard', door: 'right' });
  assert.deepEqual(saunaFacing(1, true), { bench: 'left', window: 'right', door: 'house' });
});

test('sauna heater sits in the window corner opposite the benches, clear of the door', async () => {
  const { saunaFacing, saunaHeaterUV } = await import('../src/outside/terrace.ts');

  const near = (value, target) => Math.abs(value - target) < 1e-9;
  const onWall = (coord, wall) => {
    if (wall === 'house') return near(coord.v, 0.16);
    if (wall === 'yard') return near(coord.v, 0.84);
    if (wall === 'left') return near(coord.u, 0.16);
    return near(coord.u, 0.84);
  };
  const clearOfDoor = (coord, door) => {
    if (door === 'house') return coord.v > 0.4;
    if (door === 'yard') return coord.v < 0.6;
    if (door === 'left') return coord.u > 0.4;
    return coord.u < 0.6;
  };

  for (const doorOnRight of [true, false]) {
    for (let turn = 0; turn < 4; turn += 1) {
      const facing = saunaFacing(turn, doorOnRight);
      const heater = saunaHeaterUV(facing);
      assert.equal(onWall(heater, facing.window), true, `turn ${turn} window`);
      assert.equal(clearOfDoor(heater, facing.door), true, `turn ${turn} door`);
      // Opposite the bench wall (not sitting on the benches).
      if (facing.bench === 'house') assert.ok(heater.v > 0.5);
      if (facing.bench === 'yard') assert.ok(heater.v < 0.5);
      if (facing.bench === 'left') assert.ok(heater.u > 0.5);
      if (facing.bench === 'right') assert.ok(heater.u < 0.5);
    }
  }

  // Linked house-door layout: benches on a side wall, window to the yard.
  const linked = saunaHeaterUV({ bench: 'left', window: 'yard', door: 'house' });
  assert.ok(near(linked.u, 0.84));
  assert.ok(near(linked.v, 0.84));
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

test('a sauna accepts a door wall, yard door, and drops unknown door walls', () => {
  const kept = acceptTerraces([
    {
      side: 'front',
      depth: 2.2,
      span: 'full',
      roof: false,
      building: 'sauna',
      buildingDoorWall: 'left',
      buildingYardDoor: true
    },
    {
      side: 'back',
      depth: 2.2,
      span: 'full',
      roof: false,
      building: 'sauna',
      buildingDoorWall: 'porch',
      buildingYardDoor: 'yes'
    }
  ]);
  assert.equal(kept[0].buildingDoorWall, 'left');
  assert.equal(kept[0].buildingYardDoor, true);
  assert.equal(kept[1].buildingDoorWall, undefined);
  assert.equal(kept[1].buildingYardDoor, undefined);
});

test('a sauna accepts custom door, window, placement, and color, and drops unknown values', () => {
  const terraces = acceptTerraces([
    {
      side: 'front',
      depth: 1.8,
      span: 'door',
      roof: false,
      building: 'sauna',
      buildingColor: 'falurod',
      buildingDoor: 'lervik',
      buildingWindow: 'sprojat',
      buildingWindowPlacement: 'both'
    },
    {
      side: 'left',
      depth: 2.4,
      span: 'full',
      roof: false,
      building: 'sauna',
      buildingColor: 'purple',
      buildingDoor: 'revolving',
      buildingWindow: 'stained_glass',
      buildingWindowPlacement: 'roof'
    }
  ]);
  assert.equal(terraces[0].buildingColor, 'falurod');
  assert.equal(terraces[0].buildingDoor, 'lervik');
  assert.equal(terraces[0].buildingWindow, 'sprojat');
  assert.equal(terraces[0].buildingWindowPlacement, 'both');

  assert.equal(terraces[1].buildingColor, undefined);
  assert.equal(terraces[1].buildingDoor, undefined);
  assert.equal(terraces[1].buildingWindow, undefined);
  assert.equal(terraces[1].buildingWindowPlacement, undefined);
});

test('sauna color can be changed and preserves valid choices', () => {
  const [initial] = acceptTerraces([{
    side: 'back',
    depth: 1.8,
    span: 'door',
    roof: false,
    building: 'sauna',
    buildingColor: 'natural'
  }]);
  assert.equal(initial.buildingColor, 'natural');

  const [updated] = acceptTerraces([{
    ...initial,
    buildingColor: 'falurod'
  }]);
  assert.equal(updated.buildingColor, 'falurod');

  const [matched] = acceptTerraces([{
    ...initial,
    buildingColor: 'match'
  }]);
  assert.equal(matched.buildingColor, 'match');
});

test('choosing roof low and updating sauna size preserves both roof and size', () => {
  const [deckWithLowRoof] = acceptTerraces([{
    side: 'front',
    depth: 2.0,
    span: 'full',
    roof: false,
    building: 'sauna',
    buildingRoof: 'low',
    buildingSize: 'standard'
  }]);
  assert.equal(deckWithLowRoof.buildingRoof, 'low');
  assert.equal(deckWithLowRoof.buildingSize, 'standard');

  const [updatedCompact] = acceptTerraces([{
    ...deckWithLowRoof,
    buildingSize: 'compact'
  }]);
  assert.equal(updatedCompact.buildingRoof, 'low');
  assert.equal(updatedCompact.buildingSize, 'compact');

  const [updatedLarge] = acceptTerraces([{
    ...deckWithLowRoof,
    buildingSize: 'large'
  }]);
  assert.equal(updatedLarge.buildingRoof, 'low');
  assert.equal(updatedLarge.buildingSize, 'large');
});

test('sauna accepts building size and window size choices', () => {
  const terraces = acceptTerraces([
    {
      side: 'front',
      depth: 2.4,
      span: 'full',
      roof: true,
      building: 'sauna',
      buildingSize: 'compact',
      buildingWindowSize: 'large'
    },
    {
      side: 'back',
      depth: 1.8,
      span: 'door',
      roof: false,
      building: 'sauna',
      buildingSize: 'large',
      buildingWindowSize: 'compact'
    },
    {
      side: 'left',
      depth: 1.8,
      span: 'door',
      roof: false,
      building: 'sauna',
      buildingSize: 'invalid_size',
      buildingWindowSize: 'invalid_win_size'
    }
  ]);

  assert.equal(terraces[0].buildingSize, 'compact');
  assert.equal(terraces[0].buildingWindowSize, 'large');
  assert.equal(terraces[1].buildingSize, 'large');
  assert.equal(terraces[1].buildingWindowSize, 'compact');
  assert.equal(terraces[2].buildingSize, undefined);
  assert.equal(terraces[2].buildingWindowSize, undefined);
});

test('terracePrice scales correctly with sauna building size', () => {
  const base = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false });
  const compact = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingSize: 'compact' });
  const standard = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingSize: 'standard' });
  const large = terracePrice({ side: 'front', depth: 1.8, span: 'door', roof: false, building: 'sauna', buildingSize: 'large' });

  assert.equal(compact, base + 42000);
  assert.equal(standard, base + 48000);
  assert.equal(large, base + 56000);
});

test('acceptTerraces accepts custom depth within [0.8, 6.0] and handles out-of-range values', () => {
  const terraces = acceptTerraces([
    { side: 'front', depth: 2.1, span: 'door', roof: false },
    { side: 'right', depth: 3.5, span: 'full', roof: true },
    { side: 'back', depth: 0.8, span: 'door', roof: false },
    { side: 'left', depth: 6.0, span: 'full', roof: false }
  ]);

  assert.equal(terraces[0].depth, 2.1);
  assert.equal(terraces[1].depth, 3.5);
  assert.equal(terraces[2].depth, 0.8);
  assert.equal(terraces[3].depth, 6.0);

  const outOfRange = acceptTerraces([
    { side: 'front', depth: 0.4, span: 'door' },
    { side: 'back', depth: 10.5, span: 'door' }
  ]);
  assert.equal(outOfRange[0].depth, 1.8);
  assert.equal(outOfRange[1].depth, 1.8);
});

test('custom terrace depths calculate accurate proportional pricing and flush boards', () => {
  const price24 = terracePrice({ side: 'left', depth: 2.4, span: 'full', roof: false });
  const price36 = terracePrice({ side: 'left', depth: 3.6, span: 'full', roof: false });
  const price48 = terracePrice({ side: 'left', depth: 4.8, span: 'full', roof: false });

  assert.ok(price36 > price24);
  assert.ok(price48 > price36);
  assert.equal(price48, price24 * 2);

  for (const customD of [1.5, 2.1, 3.7, 4.2, 5.8]) {
    const layout = terraceBoardLayout(customD);
    const firstEdge = layout.centers[0] - layout.depth / 2;
    const lastEdge = layout.centers.at(-1) + layout.depth / 2;
    assert.ok(Math.abs(firstEdge) < 1e-10);
    assert.ok(Math.abs(lastEdge - customD) < 1e-10);
  }
});
