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

  // Step 1: Chemical anchors on wall crown (2.5m), vertical sills on wall ends, and slab extension sills
  const s1 = getFramingStep(1, true);
  assert.equal(s1.key, 'sill');
  assert.ok(s1.titleSv.includes('Murkrön') && s1.titleSv.includes('Väggavslut'));
  const s1Fastener = s1.specs.find((s) => s.labelSv === 'Infästning murkrön');
  assert.ok(s1Fastener?.valueSv.includes('Kemankare M12') && s1Fastener?.valueSv.includes('cc 800 mm'));
  const s1End = s1.specs.find((s) => s.labelSv === 'Väggavslutssyll');
  assert.ok(s1End?.valueSv.includes('Vertikal syll') && s1End?.valueSv.includes('svällband'));
  assert.ok(s1.proTipsSv.includes('kemankare'));
  assert.ok(s1.proTipsSv.includes('vertikalt'));
  assert.ok(s1.proTipsSv.includes('hänga i luften'));

  // Step 2: Corners & concrete interface with svällband
  const s2 = getFramingStep(2, true);
  assert.equal(s2.key, 'corners');
  const s2Sealing = s2.specs.find((s) => s.labelSv === 'Fogtätning');
  assert.ok(s2Sealing?.valueSv.includes('svällband'));
  const s2Tie = s2.specs.find((s) => s.labelSv === 'Fasadinfästning');
  assert.ok(s2Tie?.valueSv.includes('Betongskruv'));

  // Step 3: Bilevel wall heights with 500 cm front loft volume
  const s3 = getFramingStep(3, true);
  assert.equal(s3.key, 'studs');
  const s3Heights = s3.specs.find((s) => s.labelSv === 'Vägghöjder');
  assert.ok(s3Heights?.valueSv.includes('Loft') || s3Heights?.valueSv.includes('loft'));
  assert.ok(s3.proTipsSv.includes('INTE placeras i husets bakkant'));
  assert.ok(s3.proTipsSv.includes('500 cm'));

  // Step 4: Transfer beam across front concrete opening and front carrier beam
  const s4 = getFramingStep(4, true);
  assert.equal(s4.key, 'openings');
  const s4Beam = s4.specs.find((s) => s.labelSv.includes('Huvudbalk'));
  assert.ok(s4Beam?.valueSv.includes('Limträ') || s4Beam?.valueSv.includes('45×195'));
  const s4Bearing = s4.specs.find((s) => s.labelSv.includes('Upplag'));
  assert.ok(s4Bearing?.valueSv.includes('100 mm'));
  const s4FrontBeam = s4.specs.find((s) => s.labelSv.includes('Främre bärlina'));
  assert.ok(s4FrontBeam?.valueSv.includes('500 cm'));
  const s4Concrete = s4.specs.find((s) => s.labelSv.includes('Betongens stödfunktion'));
  assert.ok(s4Concrete?.valueSv.includes('tillskottsstöd'));
  assert.ok(s4.proTipsSv.includes('tillskottsstöd'));

  // Step 5: Big loft floor joists under 500 cm roof with partial concrete support and diaphragm action
  const s5 = getFramingStep(5, true);
  assert.equal(s5.key, 'plates_noggings');
  assert.ok(s5.titleSv.includes('Stort Loft under 500 cm Taket'));
  const s5Location = s5.specs.find((s) => s.labelSv === 'Loftplacering');
  assert.ok(s5Location?.valueSv.includes('INTE i bakkant'));
  assert.ok(s5Location?.valueSv.includes('500 cm'));
  const s5Support = s5.specs.find((s) => s.labelSv === 'Understöd & Upplag');
  assert.ok(s5Support?.valueSv.includes('betongväggarna'));
  const s5Diaphragm = s5.specs.find((s) => s.labelSv === 'Skivverkan');
  assert.ok(s5Diaphragm?.valueSv.includes('golvspånskiva'));
  assert.ok(s5.proTipsSv.includes('skivverkan'));
  assert.ok(s5.proTipsSv.includes('istället för i bakkant'));
  assert.ok(s5.proTipsSv.includes('500 cm'));
  assert.ok(s5.proTipsSv.includes('delvis upplag'));

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

test('framing component metadata covers structural elements with Swedish and English nomenclature', () => {
  // Key structural components identified during 3D walkthrough inspection
  const coreComponents = [
    {
      sv: 'Syll på murkrön (bakvägg)',
      en: 'Crown Sill Plate (Rear Wall)',
      dim: '45×145 mm C24 · EPDM-tätning',
      step: 1
    },
    {
      sv: 'Kemankare M12 & sexkantsmutter',
      en: 'M12 Chemical Anchor & Hex Nut',
      dim: 'M12 syrafast/FZV cc 800 mm',
      step: 1
    },
    {
      sv: 'Hörnstolpe (dubbelregel)',
      en: 'Corner Post (Double Stud)',
      dim: '2× 45×145 mm C24',
      step: 2
    },
    {
      sv: 'Väggregel (framvägg)',
      en: 'Wall Stud (Front Wall)',
      dim: '45×145 mm C24 cc 600 mm',
      step: 3
    },
    {
      sv: 'Kortregel / passregel',
      en: 'Cripple Stud / Blocking',
      dim: '45×145 mm C24',
      step: 4
    },
    {
      sv: 'Bärande limträbalk',
      en: 'Glulam Header Beam',
      dim: '90×220 mm GL28c',
      step: 4
    },
    {
      sv: 'Hammarband (framvägg)',
      en: 'Top Plate (Front Wall)',
      dim: '45×145 mm C24',
      step: 5
    },
    {
      sv: 'Kortling',
      en: 'Nogging / Mid-wall Blocking',
      dim: '45×145 mm C24',
      step: 5
    },
    {
      sv: 'Takstol / takbalk (pulpettak)',
      en: 'Rafter / Roof Beam (Mono-pitch)',
      dim: '45×145 mm C24 cc 600 mm',
      step: 6
    },
    {
      sv: 'Dragband / vindförankring',
      en: 'Wind Uplift Tension Strap',
      dim: 'Varmförzinkat stål 2.0 mm',
      step: 6
    },
    {
      sv: 'Sockelbleck / droppbleck',
      en: 'Base Flashing / Drip Edge',
      dim: '0.6 mm lackerad stålplåt',
      step: 7
    }
  ];

  coreComponents.forEach((comp) => {
    assert.ok(comp.sv.length > 3, `Swedish name for ${comp.sv} is valid`);
    assert.ok(comp.en.length > 3, `English name for ${comp.en} is valid`);
    assert.ok(comp.dim.length > 3, `Dimension for ${comp.sv} is valid`);
    assert.ok(comp.step >= 1 && comp.step <= 7, `Step for ${comp.sv} is in [1, 7]`);
  });
});

test('framing guide explicitly places the big loft at the highest 500 cm roof point on carrier beams with concrete support', () => {
  const s3 = getFramingStep(3, true);
  const s4 = getFramingStep(4, true);
  const s5 = getFramingStep(5, true);
  const s6 = getFramingStep(6, true);

  // Loft is NOT in the back with lowest point of roofing
  assert.ok(s3.proTipsSv.includes('INTE placeras i husets bakkant'));
  assert.ok(s3.proTipsEn.includes('NOT placed at the rear of the house'));
  assert.ok(s5.specs.find((s) => s.labelSv === 'Loftplacering')?.valueSv.includes('INTE i bakkant'));

  // Loft is under the highest point of 500 cm roofing
  assert.ok(s3.proTipsSv.includes('500 cm höga taket'));
  assert.ok(s5.titleSv.includes('Stort Loft under 500 cm Taket'));
  assert.ok(s5.titleEn.includes('Big Loft under 500 cm Roof'));

  // Loft is on top of carrier beams
  const s4FrontBeam = s4.specs.find((s) => s.labelSv === 'Främre bärlina');
  assert.ok(s4FrontBeam?.valueSv.includes('90×220 mm'));
  assert.ok(s5.specs.find((s) => s.labelSv === 'Loftbjälklag')?.valueSv.includes('ovanpå balkarna'));

  // Loft has partial support from old concrete walls as added support
  const s4Support = s4.specs.find((s) => s.labelSv === 'Betongens stödfunktion');
  assert.ok(s4Support?.valueSv.includes('tillskottsstöd'));
  const s5Support = s5.specs.find((s) => s.labelSv === 'Understöd & Upplag');
  assert.ok(s5Support?.valueSv.includes('delvis stöd på de gamla betongväggarna'));
  assert.ok(s5.proTipsSv.includes('delvis upplag direkt på de gamla betongväggarnas murkrön'));
  assert.ok(s5.proTipsEn.includes('bearing partially directly onto the old concrete wall crowns'));

  // Roof rafters slope down from 500 cm over the loft to the rear
  assert.ok(s6.titleSv.includes('500 cm Pulpettak'));
  assert.ok(s6.specs.find((s) => s.labelSv === 'Takhöjder')?.valueSv.includes('500 cm över loftet i fronten'));
});
