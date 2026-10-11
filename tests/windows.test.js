import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitPane } from '../src/three-engine/windowFit.ts';

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
