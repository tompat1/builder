import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRAMING_STEPS,
  FRAMING_STEPS_CONCRETE_COMBO,
  FRAMING_STEPS_TOTAL,
  getFramingStep,
  getFramingSteps
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

test('concrete combo framing guide accounts for existing concrete walls, dual sills, chemical anchors, and uplift ties', () => {
  const steps = getFramingSteps(true);
  assert.equal(steps.length, 7);
  assert.equal(FRAMING_STEPS_CONCRETE_COMBO.length, 7);

  // Step 1: Chemical anchors on wall crown (2.5m) and slab extension sills
  const s1 = getFramingStep(1, true);
  assert.equal(s1.key, 'sill');
  assert.ok(s1.titleSv.includes('Murkrön') || s1.titleSv.includes('Syll'));
  const s1Fastener = s1.specs.find((s) => s.labelSv === 'Infästning murkrön');
  assert.ok(s1Fastener?.valueSv.includes('Kemankare M12'));
  const s1Moisture = s1.specs.find((s) => s.labelSv === 'Fuktskydd');
  assert.ok(s1Moisture?.valueSv.includes('EPDM'));
  assert.ok(s1.proTipsSv.includes('kemankare'));
  assert.ok(s1.proTipsSv.includes('hänga i luften')); // mentions sills following walls and never hanging in air!

  // Step 2: Corners & concrete interface with svällband
  const s2 = getFramingStep(2, true);
  assert.equal(s2.key, 'corners');
  const s2Sealing = s2.specs.find((s) => s.labelSv === 'Fogtätning');
  assert.ok(s2Sealing?.valueSv.includes('svällband'));
  const s2Tie = s2.specs.find((s) => s.labelSv === 'Fasadinfästning');
  assert.ok(s2Tie?.valueSv.includes('Betongskruv'));

  // Step 3: Bilevel wall heights
  const s3 = getFramingStep(3, true);
  assert.equal(s3.key, 'studs');
  const s3Heights = s3.specs.find((s) => s.labelSv === 'Vägghöjder');
  assert.ok(s3Heights?.valueSv.includes('Loft'));

  // Step 4: Transfer beam across front concrete opening
  const s4 = getFramingStep(4, true);
  assert.equal(s4.key, 'openings');
  const s4Beam = s4.specs.find((s) => s.labelSv === 'Huvudbalk');
  assert.ok(s4Beam?.valueSv.includes('Limträ') || s4Beam?.valueSv.includes('45×195'));
  const s4Bearing = s4.specs.find((s) => s.labelSv === 'Upplagslängd');
  assert.ok(s4Bearing?.valueSv.includes('100 mm'));

  // Step 5: Loft floor joists and horizontal diaphragm action (skivverkan)
  const s5 = getFramingStep(5, true);
  assert.equal(s5.key, 'plates_noggings');
  const s5Diaphragm = s5.specs.find((s) => s.labelSv === 'Skivverkan');
  assert.ok(s5Diaphragm?.valueSv.includes('golvspånskiva'));
  assert.ok(s5.proTipsSv.includes('skivverkan'));

  // Step 6: Mono-pitch rafters and wind uplift tension straps into concrete mass
  const s6 = getFramingStep(6, true);
  assert.equal(s6.key, 'trusses');
  const s6Uplift = s6.specs.find((s) => s.labelSv === 'Vindförankring');
  assert.ok(s6Uplift?.valueSv.includes('Dragband'));
  assert.ok(s6.proTipsSv.includes('betonghusets'));

  // Step 7: Final inspection with base drip flashing (sockelbleck) and air barrier sealing
  const s7 = getFramingStep(7, true);
  assert.equal(s7.key, 'inspection');
  const s7Air = s7.specs.find((s) => s.labelSv === 'Lufttätning');
  assert.ok(s7Air?.valueSv.includes('ångbroms'));
  assert.ok(s7.proTipsSv.includes('sockelbleck'));
});

test('standard houses never receive concrete combo steps or text', () => {
  const stdSteps = getFramingSteps(false);
  assert.equal(stdSteps.length, 7);
  stdSteps.forEach((s) => {
    assert.ok(!s.titleSv.includes('Murkrön'));
    assert.ok(!s.specs.some((spec) => spec.labelSv === 'Infästning murkrön'));
    assert.ok(!s.specs.some((spec) => spec.labelSv === 'Fogtätning' && spec.valueSv.includes('svällband')));
    assert.ok(!s.proTipsSv.includes('betongväggarna'));
  });
});
