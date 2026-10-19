import test from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_DEFAULTS, loadDisplayPrefs, saveDisplayPrefs } from '../src/services/displayPrefs.ts';

test('measurements stay hidden until the device asks for them', () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value)
  };
  assert.equal(loadDisplayPrefs().dimensions, false);
  assert.deepEqual(loadDisplayPrefs(), DISPLAY_DEFAULTS);
  saveDisplayPrefs({ dimensions: true, notes: true, sun: false, mood: false });
  assert.equal(loadDisplayPrefs().dimensions, true);
  assert.equal(loadDisplayPrefs().notes, true);
  assert.equal(loadDisplayPrefs().sun, false);
  saved.set('builder.display', '{');
  assert.equal(loadDisplayPrefs().dimensions, false);
});
