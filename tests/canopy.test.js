import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDoorCanopyLayout, isDoorCoveredByAddition } from '../src/outside/canopy.ts';

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

test('a door canopy on a left corner bay stays centered on the door with symmetric overhang', () => {
  // In Attefallshus 30m2 (front wall: 4 bays, panelWidth = 1.51m), corner clearance is 0.185m
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: 0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'left'
  });

  // Canopy is strictly centered over the door
  assert.equal(layout.canopyX, 0.0625);
  assert.equal(layout.left, -0.57);
  assert.equal(layout.right, 0.695);
  assert.equal(layout.width, 1.265);

  // Overhangs are equal on both sides of the door (0.1325m)
  const leftOverhang = (0.0625 - 0.5) - layout.left;
  const rightOverhang = layout.right - (0.0625 + 0.5);
  assert.ok(Math.abs(leftOverhang - rightOverhang) < 1e-4);

  // Fascia (width + 0.02) is also centered on the door
  assert.equal(layout.fasciaWidth, 1.285);

  // Left and right brackets are placed symmetrically relative to door center
  assert.equal(layout.leftBracketX, -0.51);
  assert.equal(layout.rightBracketX, 0.635);
  assert.ok(Math.abs((layout.canopyX - layout.leftBracketX) - (layout.rightBracketX - layout.canopyX)) < 1e-4);
});

test('a door canopy on a right corner bay stays centered on the door with symmetric overhang', () => {
  const panelWidth = 1.51;
  const layout = computeDoorCanopyLayout({
    doorX: -0.0625,
    doorWidth: 1.0,
    panelWidth,
    cornerSide: 'right'
  });

  // Canopy is strictly centered over the door
  assert.equal(layout.canopyX, -0.0625);
  assert.equal(layout.left, -0.695);
  assert.equal(layout.right, 0.57);
  assert.equal(layout.width, 1.265);

  // Overhangs are equal on both sides of the door
  const leftOverhang = (-0.0625 - 0.5) - layout.left;
  const rightOverhang = layout.right - (-0.0625 + 0.5);
  assert.ok(Math.abs(leftOverhang - rightOverhang) < 1e-4);

  // Brackets are symmetric relative to door center
  assert.equal(layout.leftBracketX, -0.635);
  assert.equal(layout.rightBracketX, 0.51);
  assert.ok(Math.abs((layout.canopyX - layout.leftBracketX) - (layout.rightBracketX - layout.canopyX)) < 1e-4);
});

test('a door covered by a sauna or terrace roof skips the door canopy', () => {
  // Front wall has a door at -1.2m on a 6.0m house, and a sauna is placed on the left
  const coveredBySauna = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: -1.2,
    doorWidth: 1.0,
    wallSpan: 6.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: false,
        building: 'sauna',
        buildingPlacement: 'left',
        buildingSize: 'standard'
      }
    ],
    wallDoorsAlong: [-1.2]
  });
  assert.equal(coveredBySauna, true);

  // Door terrace with sauna directly covers the door
  const doorTerraceSauna = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 0,
    doorWidth: 1.0,
    wallSpan: 5.0,
    terraces: [
      {
        side: 'front',
        span: 'door',
        roof: false,
        building: 'sauna'
      }
    ]
  });
  assert.equal(doorTerraceSauna, true);

  // Terrace with roof covers the door
  const coveredByRoof = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 1.0,
    doorWidth: 1.0,
    wallSpan: 5.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: true
      }
    ]
  });
  assert.equal(coveredByRoof, true);

  // Door on a different side or well clear of a compact sauna on an open terrace keeps its canopy
  const openDeckDoor = isDoorCoveredByAddition({
    doorWall: 'front',
    doorAlong: 2.2,
    doorWidth: 1.0,
    wallSpan: 6.0,
    terraces: [
      {
        side: 'front',
        span: 'full',
        roof: false,
        building: 'sauna',
        buildingPlacement: 'left',
        buildingSize: 'compact'
      }
    ],
    wallDoorsAlong: [-2.0, 2.2]
  });
  assert.equal(openDeckDoor, false);
});
