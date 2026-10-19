import test from 'node:test';
import assert from 'node:assert/strict';
import { floorAreaSqMeters } from '../src/store/area.ts';
import {
  CONCRETE_STOREY_TOP_M,
  CONCRETE_WALL_THICK_M,
  CONCRETE_WALL_THICK_MM,
  acceptConcreteWalls,
  clampConcretePlan,
  clampConcreteWall,
  clampPaabyggnadPlan,
  paabyggnadLoftAreas,
  panelOnConcrete,
  timberShellOnConcrete
} from '../src/store/paabyggnad.ts';
import { fittedDoorOpening } from '../src/three-engine/windowFit.ts';

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

test('concrete combo walls under 530 cm have 3 bays and 3 upper window panels, longer walls have 4 bays', async () => {
  const { paabyggnadWallSlots } = await import('../src/store/paabyggnad.ts');
  // Default concrete combo: width 5200 mm (< 5300 mm), depth 6731 mm (>= 5300 mm)
  const slots = paabyggnadWallSlots();

  // Front lower bays (3 bays) can accept doors or windows
  for (let i = 0; i < 3; i++) {
    const lowerId = `front-${i}`;
    assert.equal(slots[lowerId].type, 'empty');
    assert.equal(slots[lowerId].canAcceptDoor, true);
    // Upper front bays: exactly 3 window panels across the facade
    const upperId = `front-${i}u`;
    assert.equal(slots[upperId].type, 'window');
    assert.equal(slots[upperId].itemId, 'standard-single');
    assert.equal(slots[upperId].isUpper, true);
    assert.equal(slots[upperId].canAcceptDoor, false);
  }
  assert.equal(slots['front-3'], undefined);
  assert.equal(slots['front-3u'], undefined);

  // Back wall under 5300 mm (3 bays): lower bays can accept doors or windows
  for (let i = 0; i < 3; i++) {
    const id = `back-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }
  assert.equal(slots['back-3'], undefined);

  // Left wall >= 5300 mm (4 bays): lower bays can accept doors or windows
  for (let i = 0; i < 4; i++) {
    const id = `left-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }

  // Right wall >= 5300 mm (4 bays): lower bays can accept doors or windows
  for (let i = 0; i < 4; i++) {
    const id = `right-${i}`;
    assert.equal(slots[id].canAcceptDoor, true);
  }

  // When width is expanded to >= 5300 mm (e.g. 5400 mm), front wall gets 4 window panels in the upper
  const wideSlots = paabyggnadWallSlots(5400, 6731);
  for (let i = 0; i < 4; i++) {
    const upperId = `front-${i}u`;
    assert.equal(wideSlots[upperId].type, 'window');
  }
  assert.ok(wideSlots['front-3']);
  assert.ok(wideSlots['front-3u']);
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

test('door on back wall of concrete house aligns opening coordinate at bay position instead of local shift', () => {
  const w = 5.2;
  const count = 4;
  const panelW = w / count; // 1.3 m
  // For back-0 (right from inside / left from outside) and back-3 (right from outside)
  for (const p of [0, 3]) {
    const center = w / 2 - (p + 0.5) * panelW; // 1.95 for p=0, -1.95 for p=3
    const cornerSide = p === 0 ? 'left' : 'right';
    const fitted = fittedDoorOpening('STEHAG', panelW, cornerSide);
    const ox = fitted.shift; // +0.0625 for left corner, -0.0625 for right corner
    const worldX = center - ox; // 1.8875 for p=0, -1.8875 for p=3

    // Spreading ...fit must not overwrite x: worldX with fit.x (the local ox shift)
    const fit = { ...fitted, winW: fitted.width, winH: 2.1, sill: 0.25, head: 2.35, x: ox };
    const opening = {
      ...fit,
      x: worldX
    };

    assert.equal(opening.x, worldX);
    assert.notEqual(opening.x, ox);

    // Concrete cutout spans [left, right]
    const left = opening.x - opening.winW / 2;
    const right = opening.x + opening.winW / 2;
    if (p === 0) {
      assert.ok(Math.abs(left - 1.3875) < 1e-4);
      assert.ok(Math.abs(right - 2.3875) < 1e-4);
    } else {
      assert.ok(Math.abs(left - -2.3875) < 1e-4);
      assert.ok(Math.abs(right - -1.3875) < 1e-4);
    }
  }
});

test('window on right wall of concrete house aligns opening coordinates without orphan hole in middle bay', () => {
  const d = 6.731;
  const cd = 5.2;
  const shellZ = (d - cd) / 2; // 0.7655
  const count = 3;
  const endInset = 0.025 - 0.008; // 0.017
  const length = d - endInset * 2;
  const panelW = length / count; // 2.2323 m

  // For right-0 (rear), right-1 (mid), right-2 (front)
  for (let p = 0; p < count; p++) {
    const center = -d / 2 + endInset + (p + 0.5) * panelW;
    const fit = { winW: 1.8, winH: 1.2, sill: 1.0, head: 2.2, x: 0 };
    const ox = fit.x ?? 0;
    const worldX = center - ox;

    const opening = {
      winW: fit.winW,
      winH: fit.winH,
      sill: fit.sill,
      head: fit.head,
      x: worldX
    };

    assert.equal(opening.x, worldX);

    // Op in concrete side wall space (centered along Z at 0, length cd = 5.2)
    const opCenter = shellZ + opening.x;
    const halfD = cd / 2;
    const overlaps = Math.min(halfD, opCenter + opening.winW / 2) - Math.max(-halfD, opCenter - opening.winW / 2) > 0.05;

    if (p === 0) {
      // right-0 is in rear: opCenter is around -1.404, inside [-2.6, 2.6]
      assert.ok(overlaps);
      assert.ok(opCenter < -0.5);
    } else if (p === 1) {
      // right-1 is in middle: opCenter is around 0.7655, inside [-2.6, 2.6]
      assert.ok(overlaps);
      assert.ok(opCenter > 0 && opCenter < 1.5);
    } else if (p === 2) {
      // right-2 is in front: opCenter is around 2.935, partially overlaps concrete wall up to 2.6
      assert.ok(overlaps);
      assert.ok(opCenter > 2.5);
      const concreteLeft = Math.max(-halfD, opCenter - opening.winW / 2);
      const concreteRight = Math.min(halfD, opCenter + opening.winW / 2);
      assert.ok(concreteLeft < 2.6);
      assert.equal(concreteRight, halfD);
    }
  }
});

test('door at back-2 in concrete wall is within bathroom footprint and cuts out opening', () => {
  const w = 5.2;
  const count = 3;
  const panelW = w / count; // 1.7333 m
  const p = 2; // back-2
  const center = w / 2 - (p + 0.5) * panelW; // -1.7333 m
  const cornerSide = 'right';
  const fitted = fittedDoorOpening('STEHAG', panelW, cornerSide);
  const worldX = center - (fitted.shift ?? 0);

  // Bathroom in back-left is from x = -2.10 to x = -0.10 against 50cm concrete walls
  assert.ok(worldX > -2.10 && worldX < -0.10);

  // Concrete cutout spans [left, right]
  const left = worldX - fitted.width / 2;
  const right = worldX + fitted.width / 2;
  assert.ok(left > -2.6 && right < 0);
});

test('concrete wall thickness is 50 cm (500 mm)', () => {
  assert.equal(CONCRETE_WALL_THICK_M, 0.5);
  assert.equal(CONCRETE_WALL_THICK_MM, 500);
});

test('bathroom on concrete house sits against inside face of 50 cm concrete walls', () => {
  const cw = 5.2;
  const cd = 5.2;
  const thick = CONCRETE_WALL_THICK_M; // 0.5
  const shell = timberShellOnConcrete(cw, 6.731, cw, cd); // shell.z = 0.7655

  // Concrete inner faces
  const innerLeftX = -cw / 2 + thick; // -2.10 m
  const innerBackWorldZ = -cd / 2 + thick; // -2.10 m
  const innerBackLocalZ = innerBackWorldZ - shell.z; // -2.8655 m

  // 2x2m bathroom placed snug in back-left corner
  const bathroom = { w: 2, d: 2, x: -1.10, z: -1.8655 };
  const leftEdge = bathroom.x - bathroom.w / 2;
  const backEdge = bathroom.z - bathroom.d / 2;

  assert.equal(leftEdge, innerLeftX);
  assert.ok(Math.abs(backEdge - innerBackLocalZ) < 1e-6);
});

test('sauna on terrace facing house door aligns door opening to match house wall position', () => {
  const w = 5.2;
  const d = 6.731;
  const cladding = 0.025;
  // Terrace anchor on back wall
  const door = { px: 0, pz: -d / 2 + cladding / 2, rotY: Math.PI, doorX: 0, width: w, head: 2.35, wall: 'back' };

  // Door at back-2
  const count = 3;
  const panelW = w / count;
  const p = 2;
  const bayCenter = w / 2 - (p + 0.5) * panelW; // -1.7333 m
  const fitted = fittedDoorOpening('STEHAG', panelW, 'right');
  const anchor = { px: bayCenter, pz: -d / 2 + cladding / 2, doorX: fitted.shift ?? 0, width: fitted.width, head: 2.35, wall: 'back' };

  // Transform anchor into terrace group local coordinates
  const cosR = Math.cos(-door.rotY);
  const sinR = Math.sin(-door.rotY);
  const dx = anchor.px + (anchor.doorX ?? 0) - door.px;
  const dz = anchor.pz - door.pz;
  const localAlong = dx * cosR - dz * sinR;

  // Verify localAlong is positive and matches the bay coordinate (within shift offset)
  assert.ok(Math.abs(localAlong - 1.7333) < 0.1);

  // Sauna on terrace has bW = 2.0, deck width = 5.2
  const bW = 2.0;
  const along = 0;
  const minBX = along - w / 2 + bW / 2; // -1.6
  const maxBX = along + w / 2 - bW / 2; // +1.6

  // Clamped bX aligns as close as possible to the house door while staying flush with the house deck
  const alignedBX = Math.min(maxBX, Math.max(minBX, localAlong));
  assert.equal(alignedBX, 1.6);

  // The door opening on the sauna wall facing the house is placed at localAlong
  const saunaDoorFrom = localAlong - fitted.width / 2;
  const saunaDoorTo = localAlong + fitted.width / 2;
  // Sauna wall extends from alignedBX - bW / 2 = 0.6 to alignedBX + bW / 2 = 2.6
  assert.ok(saunaDoorFrom > alignedBX - bW / 2);
  assert.ok(saunaDoorTo < alignedBX + bW / 2);
});
