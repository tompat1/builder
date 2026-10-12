import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDoorCanopyLayout } from '../src/outside/canopy.ts';

test('a door canopy on an interior bay has symmetric overhang and brackets', () => {
  const layout = computeDoorCanopyLayout({
    doorX: 0,
    doorWidth: 1.0,
    panelWidth: 1.5,
    cornerSide: null
  });

  assert.equal(layout.left, -0.78);
  assert.equal(layout.right, 0.78);
  assert.equal(layout.width, 1.56);
  assert.equal(layout.canopyX, 0);
  assert.equal(layout.fasciaWidth, 1.58);
  assert.equal(layout.leftBracketX, -0.68);
  assert.equal(layout.rightBracketX, 0.68);
});

test('a door canopy on a left corner bay does not glitch into the corner trim', () => {
  // In Attefallshus 30m2 (front wall: 4 bays, panelWidth = 1.51m), corner clearance is 0.185m
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: 0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'left'
  });

  // Corner of building is at -panelWidth / 2 = -0.755
  // Corner trim (145mm face + thickness & reveal) ends around -0.585
  // With 0.185 clearance: minX = -0.755 + 0.185 = -0.570
  assert.equal(layout.left, -0.57);
  // Fascia (left - 0.01) stops cleanly around -0.58, leaving a reveal before corner trim
  const fasciaLeft = layout.canopyX - layout.fasciaWidth / 2;
  assert.ok(Math.abs(fasciaLeft - (-0.58)) < 1e-3);

  // Left bracket has at least 60mm inset from the left canopy edge and stays clear of corner
  assert.ok(layout.leftBracketX >= layout.left + 0.06);
  assert.ok(layout.leftBracketX > -0.55);

  // Right side remains unconstrained with full overhang
  assert.equal(layout.right, 0.8425);
});

test('a door canopy on a right corner bay clamps its right edge away from the corner', () => {
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: -0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'right'
  });

  const maxX = 0.57;
  assert.equal(layout.right, maxX);
  const fasciaRight = layout.canopyX + layout.fasciaWidth / 2;
  assert.ok(Math.abs(fasciaRight - (maxX + 0.01)) < 1e-3);
  assert.ok(layout.rightBracketX <= layout.right - 0.06);
});
