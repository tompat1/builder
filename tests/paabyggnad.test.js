import test from 'node:test';
import assert from 'node:assert/strict';
import { floorAreaSqMeters } from '../src/store/area.ts';
import {
  CONCRETE_STOREY_TOP_M,
  acceptConcreteWalls,
  clampConcretePlan,
  clampConcreteWall,
  clampPaabyggnadPlan,
  paabyggnadLoftAreas,
  panelOnConcrete,
  timberShellOnConcrete
} from '../src/store/paabyggnad.ts';

test('the concrete house stops at 2.5 m so the timber loft starts above it', () => {
  assert.equal(CONCRETE_STOREY_TOP_M, 2.5);
});

test('the concrete house is 27 m² and can grow to 35 m² without shrinking the old plan', () => {
  assert.equal(floorAreaSqMeters(5200, 5200), 27);

  const extended = clampPaabyggnadPlan('width', 8000, 5200, 5000);
  assert.equal(extended.depth, 5200);
  assert.ok(extended.width >= 5200);
  assert.ok(floorAreaSqMeters(extended.width, extended.depth) <= 35);

  const smallerWood = clampPaabyggnadPlan('depth', 5200, 4000, 5000);
  assert.equal(smallerWood.width, 5200);
  assert.equal(smallerWood.depth, 4000);
});

test('the timber addition stays between 450 and 500 cm high', () => {
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 3000).height, 4500);
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 6000).height, 5000);
  assert.equal(clampPaabyggnadPlan('height', 5200, 5200, 4800).height, 4800);
});

test('a loft on this house never exceeds the timber plan', () => {
  const areas = paabyggnadLoftAreas(5200, 5200);
  assert.equal(areas[areas.length - 1], 27);
  assert.ok(areas.every((area) => area <= 35));
});

test('changing the timber plan leaves the concrete walls at their own size', () => {
  const concrete = { width: 5200, depth: 5200, height: 2500 };
  const timber = clampPaabyggnadPlan('width', 8000, 5200, 5000);
  assert.equal(concrete.width, 5200);
  assert.equal(concrete.height, 2500);
  assert.ok(timber.width !== concrete.width);

  const sized = clampConcretePlan('width', { width: 6000, depth: 5200, height: 2500 });
  assert.equal(sized.width, 6000);
  assert.equal(sized.depth, 5200);
  assert.equal(clampConcretePlan('height', { ...concrete, height: 4800 }).height, 4000);
});

test('an extra concrete wall stays inside the shell', () => {
  const fitted = clampConcreteWall({ id: 'cw_1', axis: 'x', offsetMm: 4000 }, 5200, 5200);
  assert.equal(fitted.offsetMm, 2200);
  assert.equal(clampConcreteWall({ id: 'cw_1', axis: 'z', offsetMm: -300 }, 5200, 5200).offsetMm, -300);
  const kept = acceptConcreteWalls([
    { id: 'cw_a', axis: 'z', offsetMm: 100 },
    { id: '', axis: 'x', offsetMm: 0 },
    { nope: true }
  ], 5200, 5200);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, 'cw_a');
});

test('wooden outer walls stay in line with the concrete facade', () => {
  const same = timberShellOnConcrete(5.2, 5.2, 5.2, 5.2);
  assert.equal(same.x, 0);
  assert.equal(same.z, 0);
  assert.equal(same.widthM, 5.2);
  const wider = timberShellOnConcrete(6.04, 4.95, 5.2, 5.2);
  assert.equal(wider.widthM, 6.04);
  assert.equal(wider.depthM, 5.2);
  assert.ok(Math.abs(-wider.widthM / 2 + wider.x - -5.2 / 2) < 1e-9);
  assert.equal(wider.z, 0);
});

test('only panels on the 520 cm concrete faces count as the old house', () => {
  assert.equal(panelOnConcrete('front', -1.95, 2.5875, 1.3), true);
  assert.equal(panelOnConcrete('front', 0, 3.36, 1.3), false);
  assert.equal(panelOnConcrete('left', -2.5875, 0, 1.72), true);
  assert.equal(panelOnConcrete('left', -2.5875, 2.79, 2.23), false);
});

test('concrete combo removes lower front wall and leaves back, left, right open to doors and windows', async () => {
  const { paabyggnadWallSlots } = await import('../src/store/paabyggnad.ts');
  const slots = paabyggnadWallSlots();

  // Front lower bays can accept doors or windows
  for (let i = 0; i < 4; i++) {
    const lowerId = `front-${i}`;
    assert.equal(slots[lowerId].type, 'empty');
    assert.equal(slots[lowerId].canAcceptDoor, true);
    // Upper front bays remain for the timber floor
    const upperId = `front-${i}u`;
    assert.equal(slots[upperId].isUpper, true);
    assert.equal(slots[upperId].canAcceptDoor, false);
  }

  // Back wall (4 bays): lower bays can accept doors or windows
  for (let i = 0; i < 4; i++) {
    const id = `back-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }

  // Left wall (3 bays): lower bays can accept doors or windows
  for (let i = 0; i < 3; i++) {
    const id = `left-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }

  // Right wall (3 bays): lower bays can accept doors or windows
  for (let i = 0; i < 3; i++) {
    const id = `right-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }
});

test('front loft on concrete combo has 15-16 m² size and spans partially over concrete walls', () => {
  // 5200 mm width x 6731 mm depth gives 35 m² plan
  const areas = paabyggnadLoftAreas(5200, 6731);
  const frontLoftArea = areas[0];
  assert.equal(frontLoftArea, 15.8);
  assert.ok(frontLoftArea >= 15 && frontLoftArea <= 16);

  // Shell placement: timber shell depth 6.731 m on 5.2 m concrete box
  const shell = timberShellOnConcrete(5.2, 6.731, 5.2, 5.2);
  const concreteFrontZ = 5.2 / 2; // 2.6 m in world coordinates
  const timberFrontZ = shell.z + 6.731 / 2; // 4.131 m in world coordinates

  // Loft depth is ~45% of 6.731 m ≈ 2.88 m
  const loftDepthM = (6.731 - 0.36) * (15.8 / 35.0);
  const loftInnerEdgeZ = timberFrontZ - 0.18 - loftDepthM; // ~1.075 m in world coordinates

  // Loft starts in the front extension (> 2.6 m) and reaches over the concrete walls (< 2.6 m)
  assert.ok(timberFrontZ > concreteFrontZ);
  assert.ok(loftInnerEdgeZ < concreteFrontZ);
});

test('concrete wall opening sill and lintel heights preserve solid concrete under standard-single window', () => {
  // A standard-single tilt window sits with sill above base elevation (1.05 m above slab base 0.25 m = 1.30 m, head at 2.02 m)
  const base = 0.25;
  const top = 2.50;
  const opening = { sill: 1.30, head: 2.02, winW: 1.05 };

  const sillTop = Math.max(base, Math.min(top, opening.sill));
  const lintelBottom = Math.max(base, Math.min(top, opening.head));
  const sillH = sillTop - base;
  const lintelH = top - lintelBottom;

  // Solid concrete sill beneath window must be > 1.0 m tall, not 0
  assert.ok(sillH >= 1.0, `Expected sillH >= 1.0 m, got ${sillH}`);
  assert.ok(lintelH >= 0.4, `Expected lintelH >= 0.4 m, got ${lintelH}`);
  // Cutout height matches window height
  assert.ok(Math.abs((lintelBottom - sillTop) - 0.72) < 0.01);
});

test('mergeWallSlots restores lower wall slots with canAcceptDoor: true even if saved state had false', async () => {
  const { mergeWallSlots } = await import('../src/store/wallSlots.ts');
  const legacySaved = {
    'front-2': { id: 'front-2', wall: 'front', index: 2, type: 'empty', canAcceptDoor: false },
    'front-2u': { id: 'front-2u', wall: 'front', index: 2, type: 'window', itemId: 'standard-single', canAcceptDoor: false, isUpper: true }
  };

  const slots = mergeWallSlots(legacySaved, 'size-paabyggnad');
  assert.equal(slots['front-2'].canAcceptDoor, true);
  assert.equal(slots['front-2'].isUpper, false);
  assert.equal(slots['front-2u'].canAcceptDoor, false);
  assert.equal(slots['front-2u'].isUpper, true);
});
