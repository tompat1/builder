import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HOUSE_LIGHTS,
  DAYLIGHT_MODES,
  acceptDaylightMode,
  fixtureLightIntensity,
  nightGainForHour,
  parseHouseLights
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

test('evening and night hours darken the sky; fixtures brighten with nightGain', () => {
  assert.equal(nightGainForHour(12, 0.8), 0);
  assert.ok(nightGainForHour(18.5, 0.2) > 0);
  assert.ok(nightGainForHour(20.5, 0.01) >= 0.9);
  assert.equal(nightGainForHour(12, 0.01), 1);

  const day = fixtureLightIntensity(0.7, 0);
  const night = fixtureLightIntensity(0.7, 1);
  assert.ok(night > day);
  assert.ok(day > 0);
});

test('Outside lights UI and store wiring are present', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const store = fs.readFileSync(path.join(root, 'src/store/useConfigStore.ts'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'src/three-engine/HouseScene.ts'), 'utf8');
  const overlay = fs.readFileSync(path.join(root, 'src/components/OptionsGrid.vue'), 'utf8');
  const tools = fs.readFileSync(path.join(root, 'src/components/ToolSet.vue'), 'utf8');

  assert.match(store, /setHouseLight/);
  assert.match(store, /setDaylightMode/);
  assert.match(store, /houseLights/);
  assert.match(scene, /buildHouseLights/);
  assert.match(scene, /fixtureLights/);
  assert.match(overlay, /option-light-\$\{light\.key\}/);
  assert.match(overlay, /HOUSE_LIGHT_OPTIONS/);
  assert.match(tools, /daylight-\$\{mode\.id\}/);
  assert.match(tools, /daylightMoon/);
  assert.match(tools, /setDaylightMode/);
});
