import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeTerraces,
  siteHouseFacts,
  terraceOverhangBySide
} from '../src/services/siteHouseFacts.ts';
import { calculateFacingPose, calculateOverviewPose } from '../src/three-engine/cameraFlight.ts';

test('site house facts put terrace, sauna, and hot tub before the size line', () => {
  const facts = siteHouseFacts({
    sizeName: 'Påbyggnad',
    widthMm: 5800,
    depthMm: 5200,
    heightMm: 6200,
    roofType: 'pulpettak',
    roofCovering: 'metal',
    wallDesc: 'upper timber cladding',
    terraces: [
      {
        side: 'back',
        depth: 2.4,
        building: 'sauna',
        buildingColor: 'natural',
        hotTub: true
      }
    ]
  });
  assert.match(facts, /configured house must include these attached outdoor parts/i);
  assert.match(facts, /sauna cabin/i);
  assert.match(facts, /hot tub/i);
  assert.match(facts, /pulpettak/i);
  assert.ok(facts.indexOf('sauna') < facts.indexOf('Påbyggnad'));
});

test('terrace overhang tracks deck depth per side', () => {
  assert.deepEqual(
    terraceOverhangBySide([
      { side: 'back', depth: 2.4 },
      { side: 'front', depth: 1.2 }
    ]),
    { front: 1.2, back: 2.4, left: 0, right: 0 }
  );
});

test('facing and overview cameras pull back for deep terraces', () => {
  const tight = calculateFacingPose('back', 6000, 5000, 5000);
  const wide = calculateFacingPose('back', 6000, 5000, 5000, { back: 3.2 });
  assert.ok(Math.abs(wide.cameraPosition[2]) > Math.abs(tight.cameraPosition[2]));
  const overview = calculateOverviewPose(6000, 5000, 5000, { back: 3.2 });
  assert.ok(overview.cameraPosition[1] > 4);
  assert.ok(overview.cameraPosition[0] > 0 && overview.cameraPosition[2] > 0);
});

test('describeTerraces covers every deck', () => {
  const text = describeTerraces([
    { side: 'front', depth: 1.2 },
    { side: 'back', depth: 2.4, building: 'shed', hotTub: true }
  ]);
  assert.match(text, /front/);
  assert.match(text, /shed/);
  assert.match(text, /hot tub/);
});
