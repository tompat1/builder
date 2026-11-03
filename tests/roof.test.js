import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PULPET_ORIENTATIONS,
  acceptPulpetOrientation,
  eaveLiftMm,
  gablePitchDegrees,
  isGableRoof,
  isWidthFallPulpet,
  wallPlateHeightM
} from '../src/store/roof.ts';
import { roofPlateY } from '../src/three-engine/roofClearance.ts';

test('the extra-height gable is 14 degrees and lifts the eaves', () => {
  assert.equal(gablePitchDegrees('sadeltak'), 22);
  assert.equal(gablePitchDegrees('sadeltak14'), 14);
  assert.equal(eaveLiftMm('sadeltak'), 0);
  assert.equal(eaveLiftMm('sadeltak14'), 400);
  assert.equal(eaveLiftMm('pulpettak'), 0);
  assert.equal(isGableRoof('sadeltak14'), true);
  assert.equal(isGableRoof('flackt'), false);
});

test('wall plate height derives from total building height from ground to highest roof point', () => {
  const totalH = 4.0;
  const depth = 4.95;
  const sadelPlate = wallPlateHeightM('sadeltak', depth, totalH);
  const sadel14Plate = wallPlateHeightM('sadeltak14', depth, totalH);
  const pulpetPlate = wallPlateHeightM('pulpettak', depth, totalH);
  const flacktPlate = wallPlateHeightM('flackt', depth, totalH);

  // 14-degree gable has lower pitch rise than 22-degree gable, giving higher eaves
  assert.ok(sadel14Plate > sadelPlate);
  assert.ok(sadel14Plate - sadelPlate >= 0.35 && sadel14Plate - sadelPlate <= 0.45);

  // All wall plates stay under total height
  assert.ok(sadelPlate < totalH);
  assert.ok(pulpetPlate < totalH);
  assert.ok(flacktPlate < totalH);

  // Total height to roof peak equals totalH
  const sadelRise = Math.tan((22 * Math.PI) / 180) * (depth / 2);
  assert.ok(Math.abs(sadelPlate + sadelRise + 0.085 - totalH) < 1e-4);
});

test('pulpet orientation helpers validate all four cardinal high-wall directions', () => {
  assert.deepEqual(PULPET_ORIENTATIONS, ['south', 'north', 'east', 'west']);
  assert.equal(acceptPulpetOrientation('south'), 'south');
  assert.equal(acceptPulpetOrientation('north'), 'north');
  assert.equal(acceptPulpetOrientation('east'), 'east');
  assert.equal(acceptPulpetOrientation('west'), 'west');
  assert.equal(acceptPulpetOrientation('invalid', 'east'), 'east');
  assert.equal(acceptPulpetOrientation(undefined), 'south');

  assert.equal(isWidthFallPulpet('south'), false);
  assert.equal(isWidthFallPulpet('north'), false);
  assert.equal(isWidthFallPulpet('east'), true);
  assert.equal(isWidthFallPulpet('west'), true);
});

test('roofPlateY mirrors shed slope when high wall is anchored at the back (north)', () => {
  const depth = 4.0;
  const wallTop = 4.5;
  const frontHigh = { kind: 'shed', degrees: 12, anchor: 'front', minRear: 2.4 };
  const backHigh = { kind: 'shed', degrees: 12, anchor: 'back', minRear: 2.4 };

  // Front (+depth/2) is higher than back (-depth/2) for front-anchored shed
  assert.ok(roofPlateY(frontHigh, depth, wallTop, depth / 2) > roofPlateY(frontHigh, depth, wallTop, -depth / 2));
  // Back (-depth/2) is higher than front (+depth/2) for back-anchored shed
  assert.ok(roofPlateY(backHigh, depth, wallTop, -depth / 2) > roofPlateY(backHigh, depth, wallTop, depth / 2));
  assert.ok(
    Math.abs(
      roofPlateY(frontHigh, depth, wallTop, depth / 2) -
        roofPlateY(backHigh, depth, wallTop, -depth / 2)
    ) < 1e-6
  );
});

test('roof panel exposes all four pulpet orientations and wires them to store and 3D scene', () => {
  const optionsGrid = readFileSync(new URL('../src/components/OptionsGrid.vue', import.meta.url), 'utf8');
  const store = readFileSync(new URL('../src/store/useConfigStore.ts', import.meta.url), 'utf8');
  const canvas = readFileSync(new URL('../src/components/HouseCanvas.vue', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../src/three-engine/HouseScene.ts', import.meta.url), 'utf8');

  assert.match(optionsGrid, /data-testid="pulpet-orientation-group"/);
  assert.match(optionsGrid, /:id="`option-pulpet-\$\{dir\}`"/);
  assert.match(optionsGrid, /store\.setPulpetOrientation\(dir\)/);
  assert.match(store, /const setPulpetOrientation = \(orientation: PulpetOrientation\)/);
  assert.match(store, /pulpetOrientation\.value = 'east'/);
  assert.match(canvas, /pulpetOrientation: store\.pulpetOrientation/);
  assert.match(scene, /private pulpetFallSign\(\): 1 \| -1/);
});

test('3D dimensions draw both width and depth lines outside any terrace deck and do not let outsideAddition occlude labels', () => {
  const overlay = readFileSync(new URL('../src/components/DimensionOverlay.vue', import.meta.url), 'utf8');
  const store = readFileSync(new URL('../src/store/useConfigStore.ts', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../src/three-engine/HouseScene.ts', import.meta.url), 'utf8');

  assert.match(overlay, /id="dim-front-annotation"/);
  assert.match(overlay, /id="dim-depth-annotation"/);
  assert.match(overlay, /store\.dimensions\.depth/);
  assert.match(store, /depth: \{ x: 0, y: 0, visible: false \}/);
  assert.match(scene, /this\.dimensionAnchors\.set\('widthFront'/);
  assert.match(scene, /this\.dimensionAnchors\.set\('widthDeck'/);
  assert.match(scene, /this\.dimensionAnchors\.set\('depthLeft'/);
  assert.match(scene, /this\.dimensionAnchors\.set\('depthRight'/);
  assert.match(scene, /if \(cur\.userData\?\.outsideAddition\) return false;/);
});
