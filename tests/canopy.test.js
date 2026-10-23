import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDoorCanopyLayout, isDoorCoveredByAddition } from '../src/outside/canopy.ts';
import {
  acceptRoofOverhangVersion,
  cornerBoardRoofTrimDropM,
  fasciaEavesDropM,
  FASCIA_EAVES_DROP_BLACK_M,
  FASCIA_EAVES_DROP_WHITE_M,
  recessedSoffitLightCenterY,
  roofBeamsAlongDepthForOverhang,
  usesBlackFasciaCasing,
  usesOverhangSideWalls,
  usesPlankSoffitOverhang,
  usesSoffitCanopyFraming,
  usesTimberCanopyFraming
} from '../src/outside/roofOverhang.ts';

test('a recessed soffit light is embedded with only its trim reveal below the soffit', () => {
  const roofThickness = 0.1;
  const soffitThickness = 0.018;
  const fixtureDepth = 0.012;
  const reveal = 0.0015;
  const undersideY = -roofThickness / 2 - soffitThickness;
  const centreY = recessedSoffitLightCenterY(
    roofThickness,
    soffitThickness,
    fixtureDepth,
    reveal
  );

  assert.ok(centreY > undersideY, 'the fixture body should sit inside the soffit');
  assert.equal(centreY - fixtureDepth / 2, undersideY - reveal);
});

test('a door canopy on an interior bay has symmetric overhang and brackets', () => {
  const layout = computeDoorCanopyLayout({
    doorX: 0,
    doorWidth: 1.0,
    panelWidth: 1.5,
    cornerSide: null
  });

  assert.equal(layout.left, -0.78);
  assert.equal(layout.right, 0.78);
  assert.equal(layout.width, 1.56);
  assert.equal(layout.canopyX, 0);
  assert.equal(layout.fasciaWidth, 1.58);
  assert.equal(layout.leftBracketX, -0.68);
  assert.equal(layout.rightBracketX, 0.68);
});

test('a door canopy on a left corner bay stays centered on the door with symmetric overhang', () => {
  // In Attefallshus 30m2 (front wall: 4 bays, panelWidth = 1.51m), corner clearance is 0.185m
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: 0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'left'
  });

  // Canopy is strictly centered over the door
  assert.equal(layout.canopyX, 0.0625);
  assert.equal(layout.left, -0.57);
  assert.equal(layout.right, 0.695);
  assert.equal(layout.width, 1.265);

  // Overhangs are equal on both sides of the door (0.1325m)
  const leftOverhang = (0.0625 - 0.5) - layout.left;
  const rightOverhang = layout.right - (0.0625 + 0.5);
  assert.ok(Math.abs(leftOverhang - rightOverhang) < 1e-4);

  // Fascia (width + 0.02) is also centered on the door
  assert.equal(layout.fasciaWidth, 1.285);

  // Left and right brackets are placed symmetrically relative to door center
  assert.equal(layout.leftBracketX, -0.51);
  assert.equal(layout.rightBracketX, 0.635);
  assert.ok(Math.abs((layout.canopyX - layout.leftBracketX) - (layout.rightBracketX - layout.canopyX)) < 1e-4);
});

test('a door canopy on a right corner bay stays centered on the door with symmetric overhang', () => {
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: -0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'right'
  });

  // Canopy is strictly centered over the door
  assert.equal(layout.canopyX, -0.0625);
  assert.equal(layout.left, -0.695);
  assert.equal(layout.right, 0.57);
  assert.equal(layout.width, 1.265);

  // Overhangs are equal on both sides of the door
  const leftOverhang = (-0.0625 - 0.5) - layout.left;
  const rightOverhang = layout.right - (-0.0625 + 0.5);
  assert.ok(Math.abs(leftOverhang - rightOverhang) < 1e-4);

  // Brackets are symmetric relative to door center
  assert.equal(layout.leftBracketX, -0.635);
  assert.equal(layout.rightBracketX, 0.51);
  assert.ok(Math.abs((layout.canopyX - layout.leftBracketX) - (layout.rightBracketX - layout.canopyX)) < 1e-4);
});

test('a door covered by a sauna or terrace roof skips the door canopy', () => {
  // Front wall has a door at -1.2m on a 6.0m house, and a sauna is placed on the left
  const coveredBySauna = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: -1.2,
    doorWidth: 1.0,
    wallSpan: 6.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: false,
        building: 'sauna',
        buildingPlacement: 'left',
        buildingSize: 'standard'
      }
    ],
    wallDoorsAlong: [-1.2]
  });
  assert.equal(coveredBySauna, true);

  // Door terrace with sauna directly covers the door
  const doorTerraceSauna = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 0,
    doorWidth: 1.0,
    wallSpan: 5.0,
    terraces: [
      {
        side: 'front',
        span: 'door',
        roof: false,
        building: 'sauna'
      }
    ]
  });
  assert.equal(doorTerraceSauna, true);

  // Terrace with roof covers the door
  const coveredByRoof = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 1.0,
    doorWidth: 1.0,
    wallSpan: 5.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: true
      }
    ]
  });
  assert.equal(coveredByRoof, true);

  // Door on a different side or well clear of a compact sauna on an open terrace keeps its canopy
  const openDeckDoor = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 2.2,
    doorWidth: 1.0,
    wallSpan: 6.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: false,
        building: 'sauna',
        buildingPlacement: 'left',
        buildingSize: 'compact'
      }
    ],
    wallDoorsAlong: [-2.0, 2.2]
  });
  assert.equal(openDeckDoor, false);
});

test('roof overhang v1 timber, v2 post soffit, v3 framed side walls', () => {
  assert.equal(acceptRoofOverhangVersion(undefined), 'v1');
  assert.equal(acceptRoofOverhangVersion('v2'), 'v2');
  assert.equal(acceptRoofOverhangVersion('v3'), 'v3');
  assert.equal(acceptRoofOverhangVersion('nope'), 'v1');

  assert.equal(usesTimberCanopyFraming('v1', 3), true);
  assert.equal(usesTimberCanopyFraming('v2', 3), false);
  assert.equal(usesTimberCanopyFraming('v3', 3), false);
  assert.equal(usesSoffitCanopyFraming('v2', 3), true);
  assert.equal(usesSoffitCanopyFraming('v3', 3), false);
  assert.equal(usesPlankSoffitOverhang('v2', 3), true);
  assert.equal(usesPlankSoffitOverhang('v3', 3), true);
  assert.equal(usesBlackFasciaCasing('v3', 3), true);
  assert.equal(usesBlackFasciaCasing('v2', 3), false);
  assert.equal(usesOverhangSideWalls('v3', 3), true);
  assert.equal(usesOverhangSideWalls('v2', 3), false);
  assert.equal(usesTimberCanopyFraming('v1', 0.4), false);

  assert.equal(roofBeamsAlongDepthForOverhang('v1', true), false);
  assert.equal(roofBeamsAlongDepthForOverhang('v2', true), true);
  assert.equal(roofBeamsAlongDepthForOverhang('v3', true), false);
  assert.equal(roofBeamsAlongDepthForOverhang('v3', false), false);
});

test('corner boards stop under the fascia eaves drop (no poke-through at roof joints)', () => {
  assert.equal(fasciaEavesDropM(false), FASCIA_EAVES_DROP_WHITE_M);
  assert.equal(fasciaEavesDropM(true), FASCIA_EAVES_DROP_BLACK_M);

  // Width-fall (Stugan): trim drop must match the fascia band, not a 2 cm stub.
  assert.equal(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: true,
      roofType: 'pulpettak',
      blackFasciaCasing: false
    }),
    FASCIA_EAVES_DROP_WHITE_M
  );
  assert.equal(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: true,
      roofType: 'pulpettak',
      blackFasciaCasing: true
    }),
    FASCIA_EAVES_DROP_BLACK_M
  );
  assert.ok(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: true,
      roofType: 'pulpettak',
      blackFasciaCasing: false
    }) > 0.02,
    'width-fall boards must clear the fascia height, not sit inside it'
  );

  assert.equal(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: false,
      roofType: 'pulpettak',
      blackFasciaCasing: false
    }),
    FASCIA_EAVES_DROP_WHITE_M
  );
  assert.equal(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: false,
      roofType: 'flackt',
      blackFasciaCasing: false
    }),
    0.13
  );
  assert.equal(
    cornerBoardRoofTrimDropM({
      roofFallsAlongWidth: false,
      roofType: 'sadeltak',
      blackFasciaCasing: false
    }),
    0.06
  );
});

test('HouseScene wires all three overhang versions', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');
  const store = fs.readFileSync(path.join(root, 'src/store/useConfigStore.ts'), 'utf8');
  const overlay = fs.readFileSync(path.join(root, 'src/components/OptionsGrid.vue'), 'utf8');

  assert.match(scene, /addSouthCanopyFraming/);
  assert.match(scene, /addSouthSoffitCanopyPost/);
  assert.match(scene, /addSouthOverhangSideWalls/);
  assert.match(scene, /usesBlackFasciaCasing/);
  assert.match(scene, /cornerBoardRoofTrimDropM/);
  assert.match(scene, /fasciaEavesDropM/);
  assert.match(scene, /roofBeamsAlongDepthForOverhang/);
  assert.doesNotMatch(scene, /widthFall \? 0\.02/);
  assert.match(scene, /Takbjälke \(utsprång norr→söder\)/);
  assert.match(scene, /Takstol \/ takbalk \(pulpettak öst→väst\)/);
  assert.match(store, /setRoofEdge/);
  assert.match(overlay, /setRoofEdge\('overhang'\)/);
  assert.match(overlay, /setRoofEdge\('flush'\)/);
  assert.match(overlay, /setRoofEdge\('none'\)/);
  assert.match(overlay, /setRoofEdge\('v1'\)/);
  assert.match(overlay, /setRoofEdge\('v2'\)/);
  assert.match(overlay, /setRoofEdge\('v3'\)/);
  assert.match(overlay, /roofSpecialOverhangs/);
  assert.match(overlay, /roofNoOverhang/);
});

test('roof edge choices map to overhangs; specials are deep south only', async () => {
  const {
    roofOverhangsForEdge,
    flushRoofForEdge,
    roofEdgeFromLegacy,
    acceptRoofEdgeChoice
  } = await import('../src/outside/roofOverhang.ts');

  assert.equal(acceptRoofEdgeChoice('none'), 'none');
  assert.equal(flushRoofForEdge('none'), true);
  assert.equal(flushRoofForEdge('flush'), true);
  assert.equal(flushRoofForEdge('overhang'), false);
  assert.equal(flushRoofForEdge('v1'), false);

  assert.equal(roofOverhangsForEdge('overhang'), undefined);
  assert.deepEqual(roofOverhangsForEdge('none'), { front: 0, back: 0, left: 0, right: 0 });
  assert.deepEqual(roofOverhangsForEdge('flush'), { front: 0.02, back: 0.02, left: 0.02, right: 0.02 });
  assert.deepEqual(roofOverhangsForEdge('v2'), { front: 3.0, back: 0, left: 0, right: 0 });

  assert.equal(roofEdgeFromLegacy(true, 'v1', false), 'flush');
  assert.equal(roofEdgeFromLegacy(false, 'v3', true), 'v3');
  assert.equal(roofEdgeFromLegacy(false, undefined, false), 'overhang');
});
