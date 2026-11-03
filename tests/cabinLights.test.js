import test from 'node:test';
import assert from 'node:assert/strict';
import { placeFacadeSconcesAlongWall } from '../src/outside/houseLights.ts';
import {
  CABIN_HOUSE_WALL_CLEARANCE_M,
  CABIN_LIGHT_STANDOFF_M,
  cabinExteriorLightLocals,
  cabinHouseWallBlock
} from '../src/outside/lights/cabin.ts';

test('cabin footprint blocks the shared house wall so sconces cannot sit behind it', () => {
  const cabin = { bX: -1.4, bW: 2.2, bD: 2.0, isLeft: true };
  const block = cabinHouseWallBlock(cabin);
  assert.equal(block.x, -1.4);
  assert.ok(block.width >= cabin.bW + CABIN_HOUSE_WALL_CLEARANCE_M);

  const spots = placeFacadeSconcesAlongWall({
    wallLength: 8,
    openings: [block],
    count: 2
  });
  assert.equal(spots.length, 2);
  for (const x of spots) {
    assert.ok(
      Math.abs(x - block.x) >= block.width / 2 - 0.02,
      `house sconce at ${x} still sits on the cabin block`
    );
  }
});

test('cabin lights mount on the deck-facing side and the yard wall', () => {
  const locals = cabinExteriorLightLocals({
    bX: -1.5,
    bW: 2.2,
    bD: 2.0,
    outward: 1,
    isLeft: true
  });
  assert.ok(locals.length >= 2);

  const side = locals.find((p) => Math.abs(p.rotYOffset - Math.PI / 2) < 1e-9);
  assert.ok(side);
  assert.ok(side.x > -1.5 + 1.1);
  assert.ok(side.z > 0.4 && side.z < 2.0);

  const yard = locals.filter((p) => p.rotYOffset === 0);
  assert.ok(yard.length >= 1);
  for (const p of yard) {
    assert.ok(Math.abs(p.z - (2.0 + CABIN_LIGHT_STANDOFF_M)) < 1e-9);
    assert.ok(Math.abs(p.x - -1.5) <= 1.1);
  }
});

test('cabin on the right faces its open-deck light toward the left', () => {
  const locals = cabinExteriorLightLocals({
    bX: 1.6,
    bW: 2.0,
    bD: 1.8,
    outward: 1,
    isLeft: false
  });
  const side = locals.find((p) => Math.abs(p.rotYOffset + Math.PI / 2) < 1e-9);
  assert.ok(side);
  assert.ok(side.x < 1.6);
});

test('object-aware cabin lights are wired into the house scene', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');
  assert.match(scene, /cabinExteriorLightLocals/);
  assert.match(scene, /cabinHouseWallBlock/);
  assert.match(scene, /cabinBlocksByWall/);
});
