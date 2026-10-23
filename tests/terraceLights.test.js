import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TERRACE_DECK_LIGHT_MIN_SPACING_M,
  TERRACE_DECK_LIGHT_SPACING_M,
  spacedAlongEdge,
  terraceDeckLightLocals
} from '../src/outside/lights/terrace.ts';

test('spacedAlongEdge keeps 50–100 cm centres on a free run', () => {
  const pts = spacedAlongEdge(0, 4, TERRACE_DECK_LIGHT_SPACING_M);
  assert.ok(pts.length >= 3);
  for (let i = 1; i < pts.length; i++) {
    const gap = pts[i] - pts[i - 1];
    assert.ok(gap >= TERRACE_DECK_LIGHT_MIN_SPACING_M - 0.05);
    assert.ok(gap <= 1.15);
  }
});

test('terrace deck lights sit on the front rim and open sides', () => {
  const locals = terraceDeckLightLocals({
    width: 4,
    depth: 2.4,
    along: 0,
    outward: 1,
    openLeft: true,
    openRight: true
  });
  assert.ok(locals.length >= 4);
  const front = locals.filter((p) => Math.abs(p.z - (2.4 - 0.14)) < 0.02);
  assert.ok(front.length >= 2);
  for (let i = 1; i < locals.length; i++) {
    for (let j = 0; j < i; j++) {
      const dist = Math.hypot(locals[i].x - locals[j].x, locals[i].z - locals[j].z);
      assert.ok(
        dist >= TERRACE_DECK_LIGHT_MIN_SPACING_M - 0.05,
        `lights too close: ${dist.toFixed(2)} m`
      );
    }
  }
});

test('closed side does not get a side run of deck lights', () => {
  const locals = terraceDeckLightLocals({
    width: 3.5,
    depth: 2,
    openLeft: false,
    openRight: true,
    outward: 1
  });
  const frontZ = 2 - 0.14;
  // Side runs sit inset from the rim, not on the front edge.
  const leftSide = locals.filter(
    (p) => p.x < -3.5 / 2 + 0.25 && Math.abs(p.z - frontZ) > 0.05
  );
  assert.equal(leftSide.length, 0);
  const rightSide = locals.filter(
    (p) => p.x > 3.5 / 2 - 0.25 && Math.abs(p.z - frontZ) > 0.05
  );
  assert.ok(rightSide.length >= 1);
});

test('terrace lights option is wired in store, scene, and extras UI', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const store = fs.readFileSync(path.join(root, 'src/store/useConfigStore.ts'), 'utf8');
  const lights = fs.readFileSync(path.join(root, 'src/outside/houseLights.ts'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');
  const overlay = fs.readFileSync(path.join(root, 'src/components/OptionsGrid.vue'), 'utf8');
  const i18n = fs.readFileSync(path.join(root, 'src/i18n/index.ts'), 'utf8');

  assert.match(lights, /terraceLights/);
  assert.match(store, /terraceLights: 4200/);
  assert.match(scene, /terraceDeckLightLocals/);
  assert.match(scene, /terrace-deck-/);
  assert.match(overlay, /terraceLights/);
  assert.match(i18n, /terraceLightsBody/);
});
