import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRAMING_STEPS,
  FRAMING_STEPS_TOTAL,
  getFramingStep
} from '../src/construction/framingWalkthrough.ts';

test('framing walkthrough defines all 7 authentic Swedish timber construction steps', () => {
  assert.equal(FRAMING_STEPS_TOTAL, 7);
  assert.equal(FRAMING_STEPS.length, 7);

  const expectedKeys = [
    'sill',
    'corners',
    'studs',
    'openings',
    'plates_noggings',
    'trusses',
    'inspection'
  ];

  FRAMING_STEPS.forEach((stepDef, idx) => {
    assert.equal(stepDef.step, idx + 1);
    assert.equal(stepDef.key, expectedKeys[idx]);
    assert.ok(stepDef.titleSv.length > 5);
    assert.ok(stepDef.titleEn.length > 5);
    assert.ok(stepDef.subtitleSv.length > 5);
    assert.ok(stepDef.subtitleEn.length > 5);
    assert.ok(stepDef.proTipsSv.length > 20);
    assert.ok(stepDef.proTipsEn.length > 20);
    assert.equal(stepDef.specs.length, 4);
    assert.equal(stepDef.checklistSv.length, 3);
    assert.equal(stepDef.checklistEn.length, 3);
  });
});

test('getFramingStep safely clamps and returns valid step metadata', () => {
  assert.equal(getFramingStep(1).key, 'sill');
  assert.equal(getFramingStep(0).key, 'sill'); // Clamps underflow
  assert.equal(getFramingStep(-5).key, 'sill');
  assert.equal(getFramingStep(7).key, 'inspection');
  assert.equal(getFramingStep(8).key, 'inspection'); // Clamps overflow
  assert.equal(getFramingStep(99).key, 'inspection');
  assert.equal(getFramingStep(3.4).key, 'studs'); // Rounds float
});

test('timber framing specifications meet Swedish standard SS-EN 1995-1-1 requirements', () => {
  // Step 1: Syll
  const sill = getFramingStep(1);
  const sillDim = sill.specs.find((s) => s.labelSv === 'Virkesdimension');
  assert.ok(sillDim?.valueSv.includes('45×145 mm C24'));
  const sillFastener = sill.specs.find((s) => s.labelSv === 'Infästning');
  assert.ok(sillFastener?.valueSv.includes('Expanderbult M10 cc 1200 mm'));
  const sillMoisture = sill.specs.find((s) => s.labelSv === 'Fuktskydd');
  assert.ok(sillMoisture?.valueSv.includes('EPDM-syllisolering'));

  // Step 3: Studs cc 600 mm
  const studs = getFramingStep(3);
  const studSpacing = studs.specs.find((s) => s.labelSv === 'cc-avstånd');
  assert.ok(studSpacing?.valueSv.includes('600 mm'));

  // Step 4: Headers
  const openings = getFramingStep(4);
  const headerBeam = openings.specs.find((s) => s.labelSv === 'Avväxlingsbalk');
  assert.ok(headerBeam?.valueSv.includes('45×195 mm'));

  // Step 6: Trusses / Rafters
  const trusses = getFramingStep(6);
  const trussProfile = trusses.specs.find((s) => s.labelSv === 'Takstolsprofil');
  assert.ok(trussProfile?.valueSv.includes('45×195 mm C24 / Fackverk cc 600'));
});
