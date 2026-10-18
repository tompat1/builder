import test from 'node:test';
import assert from 'node:assert/strict';
import { NARROW_TALL, fittedDoorOpening, narrowTallPane, openingClearOfRoof, overlightHeight, overlightItem, portraitPane } from '../src/three-engine/windowFit.ts';

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
  assert.ok(Math.abs(corner.shift - (0.170 - 0.045) / 2) < 1e-9);
  const right = fittedDoorOpening('STEHAG', 1.51, 'right');
  assert.equal(right.shift, -corner.shift);
  assert.equal(fittedDoorOpening('LERVIK', 1.2, null).width, 1);
  assert.equal(fittedDoorOpening('SKJUTDORR', 2.4, null).width, 2);
  assert.equal(fittedDoorOpening('SVANSHALL', 2.2, null).width, 1.6);
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
