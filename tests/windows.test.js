import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOOR_CORNER_CLEARANCE_M,
  DOOR_OVERHANG_WALL_EXTRA_M,
  NARROW_TALL,
  containWindowInPanel,
  fittedDoorOpening,
  fittedWideDoorOpening,
  fittedWindowOpening,
  narrowTallPane,
  openingClearOfRoof,
  overlightHeight,
  overlightItem,
  portraitPane
} from '../src/three-engine/windowFit.ts';

test('a portrait panorama in a tall panel stays portrait inside the smaller pane', () => {
  const pane = portraitPane(1.86, 2.3, true);

  assert.ok(pane.height > pane.width);
  assert.ok(pane.height <= 1.7);
  assert.ok(pane.width <= 0.9);
  assert.ok(pane.sill < 0.2);
});

test('a portrait panorama in a wide short panel stays narrow enough to remain portrait', () => {
  const pane = portraitPane(3.2, 1.4, false);

  assert.ok(pane.height > pane.width);
  assert.ok(pane.width < 1.4);
});

test('repositioning a door to an empty bay moves the door and empties the source bay', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'door', itemId: 'STEHAG', canAcceptDoor: true },
    'front-1': { id: 'front-1', wall: 'front', index: 1, type: 'empty', canAcceptDoor: true },
    'front-1u': { id: 'front-1u', wall: 'front', index: 1, type: 'empty', canAcceptDoor: false, isUpper: true }
  };

  const moved = moveWallSlot(slots, 'front-0', 'front-1');
  assert.equal(moved, true);
  assert.equal(slots['front-0'].type, 'empty');
  assert.equal(slots['front-0'].itemId, undefined);
  assert.equal(slots['front-1'].type, 'door');
  assert.equal(slots['front-1'].itemId, 'STEHAG');
});

test('dragging a door to an upper clerestory bay is rejected', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'door', itemId: 'STEHAG', canAcceptDoor: true },
    'front-0u': { id: 'front-0u', wall: 'front', index: 0, type: 'empty', canAcceptDoor: false, isUpper: true }
  };

  const moved = moveWallSlot(slots, 'front-0', 'front-0u');
  assert.equal(moved, false);
  assert.equal(slots['front-0'].type, 'door');
  assert.equal(slots['front-0u'].type, 'empty');
});

test('swapping a door and a window between two bays exchanges their positions', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'door', itemId: 'STEHAG', canAcceptDoor: true },
    'front-1': { id: 'front-1', wall: 'front', index: 1, type: 'window', itemId: 'standard-single', canAcceptDoor: true }
  };

  const moved = moveWallSlot(slots, 'front-0', 'front-1');
  assert.equal(moved, true);
  assert.equal(slots['front-0'].type, 'window');
  assert.equal(slots['front-0'].itemId, 'standard-single');
  assert.equal(slots['front-1'].type, 'door');
  assert.equal(slots['front-1'].itemId, 'STEHAG');
});

test('moving a slot item to the same bay is a no-op returning false', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'door', itemId: 'STEHAG', canAcceptDoor: true }
  };

  const moved = moveWallSlot(slots, 'front-0', 'front-0');
  assert.equal(moved, false);
  assert.equal(slots['front-0'].type, 'door');
});

test('moving a window to an upper bay is permitted', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'window', itemId: 'standard-single', canAcceptDoor: true },
    'front-0u': { id: 'front-0u', wall: 'front', index: 0, type: 'empty', canAcceptDoor: false, isUpper: true }
  };

  const moved = moveWallSlot(slots, 'front-0', 'front-0u');
  assert.equal(moved, true);
  assert.equal(slots['front-0'].type, 'empty');
  assert.equal(slots['front-0u'].type, 'window');
  assert.equal(slots['front-0u'].itemId, 'standard-single');
});

test('the low window above a hinged door is an overlight, not a 10×12 tilt window', () => {
  assert.equal(overlightItem('standard-single', true, 'LERVIK'), 'overlight');
  assert.equal(overlightItem('standard-single', true, 'STEHAG'), 'overlight');
  assert.equal(overlightItem('standard-single', false, 'LERVIK'), 'standard-single');
  assert.equal(overlightItem('standard-single', true, 'SKJUTDORR'), 'standard-single');
  assert.equal(overlightItem('panorama', true, 'LERVIK'), 'panorama');
});

test('an overlight stays a low wide pane', () => {
  const height = overlightHeight(1.08);
  assert.ok(height < 0.5);
  assert.ok(height > 0.3);
  assert.ok(height < 1.08);
});

test('a 10×21 door keeps its width when a corner bay shrinks to 1.2 m', () => {
  const door = fittedDoorOpening('LERVIK', 1.2, 'left');
  assert.ok(door.width >= 0.95, `door narrowed to ${door.width}`);
  assert.ok(door.width <= 1);
  const left = door.shift - door.width / 2;
  const right = door.shift + door.width / 2;
  assert.ok(left >= -1.2 / 2 + 0.16);
  assert.ok(right <= 1.2 / 2 + 0.001);
});

test('a window under a steeper roof moves down and stays clear of the low side', () => {
  const panelHeight = 3.2;
  const slope = Math.tan((12 * Math.PI) / 180);
  const opening = { winW: 1.2, winH: 1.1, winY: 0.7, x: 0, sill: 1.4, head: 2.5 };
  const moved = openingClearOfRoof(opening, panelHeight, slope);
  const half = panelHeight / 2;
  const lowRoof = half + Math.min(-0.6, 0.6) * slope;
  const head = moved.winY + moved.winH / 2;
  assert.ok(head <= lowRoof - 0.3 + 1e-6);
  assert.equal(moved.winH, opening.winH);
  assert.ok(moved.winY < opening.winY);
  assert.ok(Math.abs((moved.sill ?? 0) - (opening.sill - (opening.winY - moved.winY))) < 1e-9);
});

test('a window already clear of the roof, and one on a level wall, stays put', () => {
  const clear = { winW: 1, winH: 0.8, winY: -0.4, x: 0, sill: 0.9, head: 1.7 };
  assert.equal(openingClearOfRoof(clear, 3, 0.2), clear);
  const high = { winW: 1, winH: 0.6, winY: 0.8 };
  assert.equal(openingClearOfRoof(high, 3, 0), high);
});

test('a door keeps its sill and shortens when the roof would cut the head', () => {
  const door = { winW: 1, winH: 2.1, winY: 0.2, x: 0.4, sill: 0.25, head: 2.35 };
  const fitted = openingClearOfRoof(door, 2.3, 0.35, { pinSill: true, minHeight: 0.9 });
  assert.equal(fitted.sill, door.sill);
  assert.ok(fitted.winH < door.winH);
  const half = 2.3 / 2;
  const lowRoof = half + Math.min(0.4 - 0.5, 0.4 + 0.5) * 0.35;
  assert.ok(fitted.winY + fitted.winH / 2 <= lowRoof - 0.3 + 1e-6);
});

test('a door on a wider bay stays a 10×21, and a slider stays a 20×21', () => {
  const corner = fittedDoorOpening('STEHAG', 1.51, 'left');
  assert.equal(corner.width, 1);
  assert.ok(Math.abs(corner.shift - (DOOR_CORNER_CLEARANCE_M - 0.045) / 2) < 1e-9);
  const right = fittedDoorOpening('STEHAG', 1.51, 'right');
  assert.equal(right.shift, -corner.shift);
  assert.equal(fittedDoorOpening('LERVIK', 1.2, null).width, 1);
  assert.equal(fittedDoorOpening('BASTUDORR', 1.2, null).width, 0.9);
  assert.equal(fittedDoorOpening('SKJUTDORR', 2.4, null).width, 2);
  assert.equal(fittedDoorOpening('SVANSHALL', 2.2, null).width, 1.6);
});

test('a sliding door on a front corner bay keeps clear of the corner and overhang wall', () => {
  const panelWidth = 1.8;
  const mid = fittedWideDoorOpening({
    leafSpanM: 3,
    panelWidth,
    hostIndex: 1,
    partnerIndex: 2,
    panelCount: 4
  });
  assert.equal(mid.width, 3);
  assert.ok(Math.abs(mid.xHost - panelWidth / 2) < 1e-9);

  const leftCorner = fittedWideDoorOpening({
    leafSpanM: 3,
    panelWidth,
    hostIndex: 0,
    partnerIndex: 1,
    panelCount: 4
  });
  const leftEdge = panelWidth / 2 + leftCorner.xHost - leftCorner.width / 2;
  assert.ok(leftEdge >= DOOR_CORNER_CLEARANCE_M - 1e-9);
  assert.ok(leftCorner.xHost > panelWidth / 2 - 1e-9, 'door shifts away from the left corner');

  const overhangClear = DOOR_CORNER_CLEARANCE_M + DOOR_OVERHANG_WALL_EXTRA_M;
  const leftOverhang = fittedWideDoorOpening({
    leafSpanM: 3,
    panelWidth,
    hostIndex: 0,
    partnerIndex: 1,
    panelCount: 4,
    cornerClearanceM: overhangClear
  });
  const leftOverhangEdge = panelWidth / 2 + leftOverhang.xHost - leftOverhang.width / 2;
  assert.ok(leftOverhangEdge >= overhangClear - 1e-9);
  assert.ok(leftOverhang.xHost >= leftCorner.xHost - 1e-9);

  const rightCorner = fittedWideDoorOpening({
    leafSpanM: 3,
    panelWidth,
    hostIndex: 3,
    partnerIndex: 2,
    panelCount: 4
  });
  const rightDoorRight = (3 + 0.5) * panelWidth + rightCorner.xHost + rightCorner.width / 2;
  assert.ok(rightDoorRight <= 4 * panelWidth - DOOR_CORNER_CLEARANCE_M + 1e-9);
  assert.ok(rightCorner.xHost < -panelWidth / 2 + 1e-9, 'door shifts away from the right corner');
});

test('a narrow-tall window stays narrow and tall with standard modular 6×18 proportions', () => {
  assert.equal(NARROW_TALL, 'narrow-tall');
  const pane = narrowTallPane(1.8, 2.3, false);

  assert.equal(pane.width, 0.54);
  assert.ok(pane.height >= 1.6);
  assert.ok(pane.height > pane.width * 2.8);
  assert.equal(pane.sill, 0.36);
  assert.equal(pane.shift, 0);
});

test('a narrow-tall window in a wooden overhang bay stays fully inside the wooden portion and clear of the concrete facade', () => {
  // Panel width 2.23m, concrete spans from 0.398m to 1.116m (wood is from -1.116m to 0.398m)
  const panelW = 2.232;
  const woodSpan = { from: -panelW / 2, to: 0.398 };
  const pane = narrowTallPane(panelW, 2.3, false, woodSpan, 'left');

  assert.ok(pane.width <= 0.54);
  // Total window opening bounds: [pane.shift - pane.width / 2, pane.shift + pane.width / 2]
  const leftEdge = pane.shift - pane.width / 2;
  const rightEdge = pane.shift + pane.width / 2;
  // Casing bounds (90mm on each side)
  const casingLeft = leftEdge - 0.09;
  const casingRight = rightEdge + 0.09;

  // Casing must clear the left corner clearance (170mm from panel edge)
  assert.ok(casingLeft >= -panelW / 2 + 0.165);
  // Casing must clear the concrete seam (at 0.398m)
  assert.ok(casingRight <= woodSpan.to);
});

test('readDrawing recognizes narrow-tall windows from swedish and english descriptions', async () => {
  const { readDrawing } = await import('../src/import/drawing.js');
  const swedish = readDrawing('Attefallshus 6x5m med smalt fonster och sadeltak');
  assert.equal(swedish.window, 'narrow-tall');

  const english = readDrawing('House with narrow window and flat roof');
  assert.equal(english.window, 'narrow-tall');
});

test('a standard window placed in a narrow wooden overhang bay adapts to a custom-fitted window size that stays clear of concrete and corner', () => {
  const panelW = 2.232;
  const woodSpan = { from: -panelW / 2, to: 0.398 };
  const fitted = fittedWindowOpening('standard-single', panelW, 2.3, 0.25, false, false, 'left', woodSpan);

  // Standard window is normally 1.05m wide, but in a narrow space it adapts
  assert.ok(fitted.winW <= 1.05);
  assert.ok(fitted.winW >= 0.3);

  const casingSide = fitted.casingSide ?? 0.09;
  const leftCasing = fitted.x - fitted.winW / 2 - casingSide;
  const rightCasing = fitted.x + fitted.winW / 2 + casingSide;

  // Must stay clear of the left corner board (170mm clearance)
  assert.ok(leftCasing >= -panelW / 2 + 0.165);
  // Must stay clear of concrete facade
  assert.ok(rightCasing <= woodSpan.to);
});

test('a window that already fits its bay is not moved or resized', () => {
  const fitted = fittedWindowOpening('standard-single', 2.2, 2.4, 0.25, false, false, null, null);
  const again = containWindowInPanel(fitted, 2.2, 2.4, null, null, 0);
  assert.equal(again, fitted);
});

test('a transom on a short upper wall is lowered and shortened so the head board stays under the fascia', () => {
  const panelH = 0.58;
  const raw = fittedWindowOpening('overlight', 1.9, panelH, 2.2, true, false, null, null);
  const half = panelH / 2;
  const rawHeadBoard = raw.winY + raw.winH / 2 + 0.085;
  assert.ok(rawHeadBoard > half - 0.16, 'the unfitted transom should run past the wall');

  const fitted = containWindowInPanel(raw, 1.9, panelH, null, null, 0);
  const headBoard = fitted.winY + fitted.winH / 2 + 0.085;
  const sillBoard = fitted.winY - fitted.winH / 2 - 0.065;
  assert.ok(headBoard <= half - 0.16 + 1e-6);
  assert.ok(sillBoard >= -half - 1e-6);
  assert.ok(fitted.winH < raw.winH);
  assert.ok(fitted.winH > 0.12);
  assert.equal(containWindowInPanel(fitted, 1.9, panelH, null, null, 0), fitted);
});

test('moving a window onto another bay marks it to fit that wall', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'window', itemId: 'panorama', canAcceptDoor: true },
    'front-1': { id: 'front-1', wall: 'front', index: 1, type: 'empty', canAcceptDoor: true }
  };

  assert.equal(moveWallSlot(slots, 'front-0', 'front-1'), true);
  assert.equal(slots['front-1'].fitToWall, true);
  assert.equal(slots['front-0'].fitToWall, undefined);
});

test('a panorama or mullioned window in a tight wooden overhang adapts to custom size with intact proportions', () => {
  // A narrow 60cm overhang
  const panelW = 1.68;
  const woodSpan = { from: 0.24, to: panelW / 2 };
  const fitted = fittedWindowOpening('sprojat', panelW, 2.3, 0.25, false, false, 'right', woodSpan);

  assert.ok(fitted.winW <= 0.45);
  assert.ok(fitted.winW >= 0.2);
  assert.ok(fitted.winH > fitted.winW); // elegant proportioned height

  const casingSide = fitted.casingSide ?? 0.08;
  const leftCasing = fitted.x - fitted.winW / 2 - casingSide;
  const rightCasing = fitted.x + fitted.winW / 2 + casingSide;

  assert.ok(leftCasing >= woodSpan.from);
  assert.ok(rightCasing <= panelW / 2 - 0.165);
});

test('garage wall slots configure front gate and entry openings', async () => {
  const { garageWallSlots, defaultDimensionsForSize } = await import('../src/store/wallSlots.ts');
  const slots = garageWallSlots();
  assert.equal(slots['front-0'].type, 'gate');
  assert.equal(slots['front-0'].itemId, 'overhead-white');
  assert.equal(slots['right-1'].type, 'door');
  assert.equal(slots['left-1'].type, 'window');

  const dims = defaultDimensionsForSize('size-garage');
  assert.equal(dims.widthMm, 6000);
  assert.equal(dims.depthMm, 6000);
});

test('dragging a gate to an upper clerestory bay is rejected while ground bay moves are allowed', async () => {
  const { moveWallSlot } = await import('../src/store/slotMove.ts');
  const slots = {
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'gate', itemId: 'overhead-white', canAcceptDoor: true },
    'front-1': { id: 'front-1', wall: 'front', index: 1, type: 'empty', canAcceptDoor: true },
    'front-1u': { id: 'front-1u', wall: 'front', index: 1, type: 'empty', canAcceptDoor: false, isUpper: true }
  };

  assert.equal(moveWallSlot(slots, 'front-0', 'front-1u'), false);
  assert.equal(slots['front-0'].type, 'gate');

  assert.equal(moveWallSlot(slots, 'front-0', 'front-1'), true);
  assert.equal(slots['front-1'].type, 'gate');
  assert.equal(slots['front-0'].type, 'empty');
});

function makeFrontBand(types) {
  /** @type {Record<string, import('../src/store/wallSlots.ts').WallSlot>} */
  const slots = {};
  for (let i = 0; i < types.length; i += 1) {
    const t = types[i];
    slots[`front-${i}`] = {
      id: `front-${i}`,
      wall: 'front',
      index: i,
      type: t.type,
      itemId: t.itemId,
      canAcceptDoor: true,
      coveredBy: t.coveredBy,
      windowRhythm: t.windowRhythm,
      fitToWall: t.fitToWall
    };
  }
  return slots;
}

test('alignWindowsOnBand consolidates loose windows into one rhythm host with no leftover panes', async () => {
  const {
    alignWindowsOnBand,
    windowRowOnBand,
    clearWindowsOnBand
  } = await import('../src/store/wallSlots.ts');
  const {
    rhythmOpeningsAlongRun,
    rhythmOpeningForPanel,
    rhythmOpeningsForPanel,
    rhythmOpeningsDoNotOverlap
  } = await import('../src/three-engine/windowFit.ts');

  const slots = makeFrontBand([
    { type: 'window', itemId: 'standard-single' },
    { type: 'empty' },
    { type: 'window', itemId: 'standard-single' },
    { type: 'window', itemId: 'standard-single' }
  ]);

  const before = windowRowOnBand(slots, 'front', 4, false);
  assert.equal(before.count, 3);
  assert.equal(before.aligned, false);

  const result = alignWindowsOnBand(slots, 'front', 4, 2, false);
  assert.equal(result.ok, true);
  assert.equal(result.count, 3);
  assert.equal(result.hostId, 'front-0');

  const hosts = Object.values(slots).filter((s) => s.windowRhythm);
  assert.equal(hosts.length, 1);
  assert.equal(hosts[0].windowRhythm, 3);
  assert.equal(hosts[0].type, 'window');
  assert.equal(hosts[0].itemId, 'standard-single');

  const loose = Object.values(slots).filter(
    (s) => s.type === 'window' && !s.windowRhythm
  );
  assert.equal(loose.length, 0, 'no orphan window panes after Align');

  for (const s of Object.values(slots)) {
    if (s.id === result.hostId) {
      assert.equal(s.coveredBy, undefined);
      continue;
    }
    assert.equal(s.type, 'empty');
    assert.equal(s.coveredBy, result.hostId);
    assert.equal(s.windowRhythm, undefined);
    assert.equal(s.itemId, undefined);
  }

  const after = windowRowOnBand(slots, 'front', 4, false);
  assert.equal(after.aligned, true);
  assert.equal(after.count, 3);
  assert.equal(after.hostId, result.hostId);

  // Geometry: three bay-centred panes (no seam straddles), exactly three feature owners.
  const panelWidth = 1.5;
  const along = rhythmOpeningsAlongRun(4, 3, panelWidth, 1.0, 0.32);
  assert.equal(along.length, 3);
  assert.equal(rhythmOpeningsDoNotOverlap(along), true);
  const drawn = [];
  for (let i = 0; i < 4; i += 1) {
    const mapped = rhythmOpeningForPanel(along, 0, 4, i, panelWidth);
    if (mapped?.drawFeature) drawn.push(mapped);
    // Each intersecting panel owns its pane entirely — no cut-only seam halves.
    assert.ok(rhythmOpeningsForPanel(along, 0, 4, i, panelWidth).every((o) => o.drawFeature));
  }
  assert.equal(drawn.length, 3);

  // Second Align is a no-op once already aligned.
  const again = alignWindowsOnBand(slots, 'front', 4, 1, false);
  assert.equal(again.ok, false);
  assert.equal(again.hostId, result.hostId);

  // clearWindowsOnBand must not wipe a sliding-door neighbour on the same band.
  const withSlider = makeFrontBand([
    { type: 'door', itemId: 'SKJUTDORR' },
    { type: 'empty', coveredBy: 'front-0' },
    { type: 'window', itemId: 'standard-single' },
    { type: 'window', itemId: 'standard-single' }
  ]);
  clearWindowsOnBand(withSlider, 'front', 4, false);
  assert.equal(withSlider['front-0'].type, 'door');
  assert.equal(withSlider['front-0'].itemId, 'SKJUTDORR');
  assert.equal(withSlider['front-1'].coveredBy, 'front-0');
  assert.equal(withSlider['front-2'].type, 'empty');
  assert.equal(withSlider['front-3'].type, 'empty');
});

test('alignWindowsOnBand on an upper band keeps lower openings untouched', async () => {
  const { alignWindowsOnBand, windowRowOnBand } = await import('../src/store/wallSlots.ts');
  const slots = {
    'left-0': { id: 'left-0', wall: 'left', index: 0, type: 'window', itemId: 'panorama', canAcceptDoor: true },
    'left-1': { id: 'left-1', wall: 'left', index: 1, type: 'window', itemId: 'panorama', canAcceptDoor: true },
    'left-2': { id: 'left-2', wall: 'left', index: 2, type: 'empty', canAcceptDoor: true },
    'left-0u': { id: 'left-0u', wall: 'left', index: 0, type: 'window', itemId: 'standard-single', canAcceptDoor: false, isUpper: true },
    'left-1u': { id: 'left-1u', wall: 'left', index: 1, type: 'window', itemId: 'standard-single', canAcceptDoor: false, isUpper: true },
    'left-2u': { id: 'left-2u', wall: 'left', index: 2, type: 'empty', canAcceptDoor: false, isUpper: true }
  };

  const result = alignWindowsOnBand(slots, 'left', 3, 0, true);
  assert.equal(result.ok, true);
  assert.equal(result.count, 2);
  assert.equal(slots['left-0u'].windowRhythm, 2);
  assert.equal(slots['left-1u'].coveredBy, 'left-0u');
  assert.equal(slots['left-2u'].coveredBy, 'left-0u');
  // Lower band unchanged.
  assert.equal(slots['left-0'].type, 'window');
  assert.equal(slots['left-1'].type, 'window');
  assert.equal(slots['left-0'].windowRhythm, undefined);
  assert.equal(windowRowOnBand(slots, 'left', 3, false).aligned, false);
});

test('Align UI path is only alignWallWindows → alignWindowsOnBand', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const root = path.resolve(import.meta.dirname, '..');
  const overlay = fs.readFileSync(path.join(root, 'src/components/PanelSlotOverlay.vue'), 'utf8');
  const store = fs.readFileSync(path.join(root, 'src/store/useConfigStore.ts'), 'utf8');
  const wallSlots = fs.readFileSync(path.join(root, 'src/store/wallSlots.ts'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');

  assert.match(overlay, /store\.alignWallWindows\(/);
  assert.doesNotMatch(overlay, /setWallWindowRhythm\(/);
  assert.doesNotMatch(overlay, /alignWindowsOnBand\(/);
  assert.match(overlay, /onWindowPointerDown/);
  assert.match(overlay, /overlayCardEl\.value\.contains\(target\)/);
  assert.match(overlay, /store\.deselectSlot\(\)/);

  assert.match(store, /alignWindowsOnBand\(wallSlots\.value/);
  assert.match(wallSlots, /export function alignWindowsOnBand/);
  // One export of the core Align implementation.
  assert.equal((wallSlots.match(/export function alignWindowsOnBand/g) || []).length, 1);
  // Renderer resolves every seam-crossing rhythm pane, not one opening per panel.
  assert.match(scene, /rhythmOpeningsForPanel/);
  assert.match(scene, /addCladdingAroundOpenings/);
  assert.match(scene, /windowRhythmOpeningsForPanel/);
  // Sloped holes must stay under the eave (half-frame / fascia light-leak guard).
  assert.match(scene, /clampRectHoleToSlopedRoof/);
});

test('sloped cladding holes stay under the roof line so eaves are not notched', async () => {
  const { clampRectHoleToSlopedRoof } = await import('../src/three-engine/windowFit.ts');
  const panelHeight = 3.2;
  const slope = Math.tan((10 * Math.PI) / 180);
  const half = panelHeight / 2;
  // Opening head deliberately above the low side of the roof across the bay.
  const left = -0.6;
  const right = 0.6;
  const bottom = 0.2;
  const top = half + 0.1;
  const clamped = clampRectHoleToSlopedRoof(left, right, bottom, top, panelHeight, slope);
  assert.ok(clamped);
  const roofLow = half + Math.min(left * slope, right * slope) - 0.012;
  assert.ok(clamped.top <= roofLow + 1e-9);
  assert.equal(clamped.bottom, bottom);
  // Fully above the roof → no hole (avoids ExtrudeGeometry eave notches).
  assert.equal(
    clampRectHoleToSlopedRoof(left, right, roofLow + 0.05, roofLow + 0.4, panelHeight, slope),
    null
  );
  // Level wall leaves the rectangle alone.
  const level = clampRectHoleToSlopedRoof(-0.5, 0.5, -0.4, 0.5, 3, 0);
  assert.deepEqual(level, { bottom: -0.4, top: 0.5 });
});

test('Align rhythm snaps panes into whole bays so frames never cross seams', async () => {
  const {
    evenBayIndicesForRhythm,
    rhythmOpeningsAlongRun,
    rhythmOpeningsForPanel,
    openingSpansPastPanel,
    rhythmOpeningsDoNotOverlap,
    clipOpeningToPanel
  } = await import('../src/three-engine/windowFit.ts');

  assert.deepEqual(evenBayIndicesForRhythm(4, 3), [0, 2, 3]);
  assert.deepEqual(evenBayIndicesForRhythm(3, 3), [0, 1, 2]);
  assert.deepEqual(evenBayIndicesForRhythm(4, 2), [0, 3]);

  const panelWidth = 1.5;
  const along = rhythmOpeningsAlongRun(4, 3, panelWidth, 1.05, 0.32);
  assert.equal(along.length, 3);
  assert.equal(rhythmOpeningsDoNotOverlap(along), true);
  // Bay centres: 0.75, 3.75, 5.25
  assert.ok(Math.abs(along[0].along - 0.75) < 1e-9);
  assert.ok(Math.abs(along[1].along - 3.75) < 1e-9);
  assert.ok(Math.abs(along[2].along - 5.25) < 1e-9);

  for (let i = 0; i < 4; i += 1) {
    const panes = rhythmOpeningsForPanel(along, 0, 4, i, panelWidth);
    for (const pane of panes) {
      assert.equal(pane.drawFeature, true);
      assert.equal(openingSpansPastPanel(pane, panelWidth), false);
    }
  }

  // Wide pane fallback may still straddle — clip helper stays available for the renderer.
  const wide = { x: -0.75, winW: 1.05 };
  assert.equal(openingSpansPastPanel(wide, panelWidth), true);
  const clipped = clipOpeningToPanel(wide, panelWidth);
  assert.ok(clipped);
  assert.ok(clipped.winW < wide.winW);
});

test('Step 1 and Step 2 allow independent 1..4 window slot counts on upper and lower floors and arrange windows equally with safe corner margins', async () => {
  const {
    createWallSlots,
    bandSlotCountForWall,
    slotsOnWallBand,
    resizeWallBandSlots,
    fillWindowsOnBand,
    mergeWallSlots
  } = await import('../src/store/wallSlots.ts');

  const slots = createWallSlots(6000, 6000);
  assert.equal(bandSlotCountForWall('front', true, 6000, 6000, slots), 4);
  assert.equal(bandSlotCountForWall('front', false, 6000, 6000, slots), 4);

  // Suppose the user had two windows in front-1u and front-2u (middle bays) and emptied front-0u and front-3u
  slots['front-0u'].type = 'empty';
  slots['front-0u'].itemId = undefined;
  slots['front-1u'].type = 'window';
  slots['front-1u'].itemId = 'standard-single';
  slots['front-2u'].type = 'window';
  slots['front-2u'].itemId = 'standard-single';
  slots['front-3u'].type = 'empty';
  slots['front-3u'].itemId = undefined;

  // Step 1: User selects 2 window slots on the upper floor of the front facade
  resizeWallBandSlots(slots, 'front', true, 2, 6000, 6000);
  assert.equal(bandSlotCountForWall('front', true, 6000, 6000, slots), 2);
  // Ground floor of the same facade stays at 4 slots independently
  assert.equal(bandSlotCountForWall('front', false, 6000, 6000, slots), 4);

  const upperSlots = slotsOnWallBand(slots, 'front', true, 6000, 6000);
  assert.equal(upperSlots.length, 2);
  assert.equal(upperSlots[0].id, 'front-0u');
  assert.equal(upperSlots[1].id, 'front-1u');
  // Both placed windows are preserved in the 2 equally spaced slots
  assert.equal(upperSlots[0].type, 'window');
  assert.equal(upperSlots[1].type, 'window');
  assert.equal(slots['front-2u'], undefined);
  assert.equal(slots['front-3u'], undefined);

  // Step 1 on ground floor: User selects 3 slots on the back ground floor and fills them
  resizeWallBandSlots(slots, 'back', false, 3, 6000, 6000);
  fillWindowsOnBand(slots, 'back', false, 'sprojat', 6000, 6000);
  assert.equal(bandSlotCountForWall('back', false, 6000, 6000, slots), 3);
  assert.equal(bandSlotCountForWall('back', true, 6000, 6000, slots), 4);
  for (let i = 0; i < 3; i += 1) {
    assert.equal(slots[`back-${i}`].type, 'window');
    assert.equal(slots[`back-${i}`].itemId, 'sprojat');
  }
  assert.equal(slots['back-3'], undefined);

  // mergeWallSlots preserves the independent per-band slot counts
  const merged = mergeWallSlots(slots, 'size-cube', 6000, 6000);
  assert.equal(bandSlotCountForWall('front', true, 6000, 6000, merged), 2);
  assert.equal(bandSlotCountForWall('front', false, 6000, 6000, merged), 4);
  assert.equal(bandSlotCountForWall('back', false, 6000, 6000, merged), 3);

  // Verify 3D window geometry for 1, 2, 3, and 4 slots on a 6.0 m wall:
  // Every window in a row has identical width & height, centered x = 0 in its slot,
  // equal center-to-center and edge-to-edge spacing, and safe corner margins (>= 170 mm to casing).
  const wallLength = 6.0;
  for (const count of [1, 2, 3, 4]) {
    const pw = wallLength / count;
    const fittedRow = [];
    for (let i = 0; i < count; i += 1) {
      const corner = count === 1 ? 'both' : i === 0 ? 'left' : i === count - 1 ? 'right' : null;
      const fit = fittedWindowOpening('standard-single', pw, 1.1, 2.4, true, false, corner, null);
      assert.equal(fit.x, 0, `slot ${i} of ${count} must be centered at x = 0`);
      const casing = fit.casingSide ?? 0.09;
      const outerMargin = pw / 2 - (fit.winW / 2 + casing);
      assert.ok(outerMargin >= 0.17 - 1e-6, `slot ${i} of ${count} keeps safe corner margin (${outerMargin})`);
      fittedRow.push({
        center: -wallLength / 2 + (i + 0.5) * pw + fit.x,
        winW: fit.winW,
        winH: fit.winH
      });
    }
    for (let i = 1; i < fittedRow.length; i += 1) {
      assert.ok(Math.abs(fittedRow[i].winW - fittedRow[0].winW) < 1e-9, 'equal window widths across row');
      assert.ok(Math.abs(fittedRow[i].winH - fittedRow[0].winH) < 1e-9, 'equal window heights across row');
      const spacing = fittedRow[i].center - fittedRow[i - 1].center;
      assert.ok(Math.abs(spacing - pw) < 1e-9, 'equal center-to-center spacing across row');
    }
  }
});
