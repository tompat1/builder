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
  assert.equal(loadDisplayPrefs().mood, true);
  assert.deepEqual(loadDisplayPrefs(), DISPLAY_DEFAULTS);
  saveDisplayPrefs({ dimensions: true, notes: true, sun: false, mood: false });
  assert.equal(loadDisplayPrefs().dimensions, true);
  assert.equal(loadDisplayPrefs().notes, true);
  assert.equal(loadDisplayPrefs().sun, false);
  assert.equal(loadDisplayPrefs().mood, false);
  saved.set('builder.display', '{');
  assert.equal(loadDisplayPrefs().dimensions, false);
  assert.equal(loadDisplayPrefs().mood, true);
});

test('legacy unversioned display prefs migrate mood to default true', () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value)
  };
  saved.set('builder.display', JSON.stringify({ dimensions: true, notes: false, sun: false, mood: false }));
  const loaded = loadDisplayPrefs();
  assert.equal(loaded.dimensions, true);
  assert.equal(loaded.mood, true);
});
