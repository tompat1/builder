import test from 'node:test';
import assert from 'node:assert/strict';
import { fittedDoorOpening, overlightHeight, overlightItem, portraitPane } from '../src/three-engine/windowFit.ts';

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
