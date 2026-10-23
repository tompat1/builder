import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HOUSE_LIGHTS,
  DAYLIGHT_MODES,
  DEFAULT_FIXTURE_POWER_STEP,
  FIXTURE_CLEARANCE_M,
  FIXTURE_POWER_STEPS,
  acceptDaylightMode,
  evenWallSeeds,
  facadeSconceCountForWall,
  fixtureLightIntensity,
  formatFixturePowerLabel,
  nightGainForHour,
  nextFixturePowerStep,
  nudgeOffOpenings,
  parseHouseLights,
  placeDoorSconceBeside,
  placeFacadeSconcesAlongWall
} from '../src/outside/houseLights.ts';

test('house lights default to facade washers on and other fixtures off', () => {
  assert.deepEqual(DEFAULT_HOUSE_LIGHTS, {
    facadeLights: true,
    doorLight: false,
    ledStrips: false,
    gardenLights: false
  });
  assert.deepEqual(parseHouseLights(undefined), DEFAULT_HOUSE_LIGHTS);
  assert.equal(parseHouseLights({ doorLight: true, ledStrips: 1 }).doorLight, true);
  assert.equal(parseHouseLights({ doorLight: true }).ledStrips, false);
  assert.equal(parseHouseLights({ facadeLights: false }).facadeLights, false);
});

test('daylight mode accepts sun, moon, and neutral', () => {
  assert.deepEqual([...DAYLIGHT_MODES], ['sun', 'moon', 'neutral']);
  assert.equal(acceptDaylightMode('moon'), 'moon');
  assert.equal(acceptDaylightMode('neutral'), 'neutral');
  assert.equal(acceptDaylightMode('nope'), 'sun');
});

test('evening and night hours darken the sky; fixtures are off by day and bright at night', () => {
  assert.equal(nightGainForHour(12, 0.8), 0);
  assert.ok(nightGainForHour(18.5, 0.2) > 0);
  assert.ok(nightGainForHour(20.5, 0.01) >= 0.9);
  assert.equal(nightGainForHour(12, 0.01), 1);

  assert.equal(fixtureLightIntensity(0.7, 0), 0);
  assert.equal(fixtureLightIntensity(0.7, 0.02), 0);
  const night = fixtureLightIntensity(0.7, 1);
  assert.ok(night > 0.5);
  assert.ok(fixtureLightIntensity(0.7, 1, 1) > fixtureLightIntensity(0.7, 1, 0.4));
});

test('fixture power cycles four modern LED steps with W · lm · K readout', () => {
  assert.equal(FIXTURE_POWER_STEPS.length, 4);
  assert.equal(DEFAULT_FIXTURE_POWER_STEP, 1);
  assert.equal(nextFixturePowerStep(0), 1);
  assert.equal(nextFixturePowerStep(1), 2);
  assert.equal(nextFixturePowerStep(2), 3);
  assert.equal(nextFixturePowerStep(3), 0);
  assert.equal(formatFixturePowerLabel(1), '7 W · 700 lm · 3000 K');
  assert.match(formatFixturePowerLabel(0), /3 W · 300 lm/);
  assert.match(formatFixturePowerLabel(2), /12 W · 1200 lm/);
  assert.match(formatFixturePowerLabel(3), /15 W · 1500 lm/);
});

test('front wall gets two sconces; other walls scale with length', () => {
  assert.equal(facadeSconceCountForWall('front', 8), 2);
  assert.equal(facadeSconceCountForWall('front', 4), 2);
  assert.equal(facadeSconceCountForWall('back', 5), 2);
  assert.equal(facadeSconceCountForWall('left', 8), 3);
  const seeds = evenWallSeeds(2, -2.4, 2.4);
  assert.equal(seeds.length, 2);
  assert.ok(Math.abs(seeds[0] - -0.8) < 1e-9);
  assert.ok(Math.abs(seeds[1] - 0.8) < 1e-9);
});

test('fixture clearance is 50 cm from openings and between lights', () => {
  assert.equal(FIXTURE_CLEARANCE_M, 0.5);
  const door = { x: -1.2, width: 1.0 };
  const slider = { x: 1.4, width: 2.4 };
  const spots = placeFacadeSconcesAlongWall({
    wallLength: 8,
    openings: [door, slider],
    count: 2
  });
  assert.equal(spots.length, 2);
  assert.ok(Math.abs(spots[1] - spots[0]) >= FIXTURE_CLEARANCE_M - 0.01);
  for (const x of spots) {
    for (const opening of [door, slider]) {
      const edge = opening.width / 2;
      assert.ok(
        Math.abs(x - opening.x) >= edge + FIXTURE_CLEARANCE_M - 0.02,
        `sconce at ${x} closer than 50 cm to opening at ${opening.x}`
      );
    }
  }
});

test('nudgeOffOpenings moves a seed onto free cladding next to the opening', () => {
  const openings = [{ x: 0, width: 2 }];
  const left = nudgeOffOpenings(0, openings, -4, 4, FIXTURE_CLEARANCE_M);
  assert.ok(left != null);
  assert.ok(Math.abs(left) >= 1 + FIXTURE_CLEARANCE_M - 0.02);
  assert.equal(nudgeOffOpenings(-2.5, openings, -4, 4, FIXTURE_CLEARANCE_M), -2.5);
});

test('door sconce sits beside the leaf, not on the door centre', () => {
  const openings = [{ x: 0, width: 1 }];
  const beside = placeDoorSconceBeside(0, 1, -4, 4, openings);
  assert.ok(beside != null);
  assert.ok(Math.abs(beside) >= 0.5 + FIXTURE_CLEARANCE_M - 0.01);
  assert.ok(Math.abs(beside) < 2);
});

test('Outside lights UI and store wiring are present', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const store = fs.readFileSync(path.join(root, 'src/store/useConfigStore.ts'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');
  const lighting = fs.readFileSync(path.join(root, 'src/three-engine/lighting.ts'), 'utf8');
  const overlay = fs.readFileSync(path.join(root, 'src/components/OptionsGrid.vue'), 'utf8');
  const tools = fs.readFileSync(path.join(root, 'src/components/ToolSet.vue'), 'utf8');

  assert.match(store, /setHouseLight/);
  assert.match(store, /setDaylightMode/);
  assert.match(store, /houseLights/);
  assert.match(scene, /buildHouseLights/);
  assert.match(scene, /fixtureLights/);
  assert.match(scene, /FIXTURE_CLEARANCE_M/);
  assert.match(scene, /cycleFixturePower/);
  assert.match(scene, /onFixturePowerReadout/);
  assert.match(lighting, /createStarfield/);
  assert.match(lighting, /syncStarfield/);
  const canvas = fs.readFileSync(path.join(root, 'src/components/HouseCanvas.vue'), 'utf8');
  assert.match(canvas, /fixture-power-readout/);
  assert.match(canvas, /onFixturePowerReadout/);
  assert.match(overlay, /option-light-\$\{light\.key\}/);
  assert.match(overlay, /HOUSE_LIGHT_OPTIONS/);
  assert.match(tools, /daylight-\$\{mode\.id\}/);
  assert.match(tools, /daylightMoon/);
  assert.match(tools, /setDaylightMode/);
});
