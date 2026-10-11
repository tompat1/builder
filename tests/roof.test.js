import test from 'node:test';
import assert from 'node:assert/strict';
import { eaveLiftMm, gablePitchDegrees, isGableRoof, wallPlateHeightM } from '../src/store/roof.ts';

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
