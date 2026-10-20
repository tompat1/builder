import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISPLAY_DEFAULTS,
  loadDisplayPrefs,
  saveDisplayPrefs,
  DEFAULT_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  clampPanelWidth,
  loadPanelWidth,
  savePanelWidth
} from '../src/services/displayPrefs.ts';

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

test('desktop panel width loads default, clamps bounds, and persists', () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value)
  };

  // Default is 410
  assert.equal(loadPanelWidth(1280), DEFAULT_PANEL_WIDTH);
  assert.equal(DEFAULT_PANEL_WIDTH, 410);
  assert.equal(MIN_PANEL_WIDTH, 380);

  // Clamping
  assert.equal(clampPanelWidth(200, 1280), MIN_PANEL_WIDTH);
  assert.equal(clampPanelWidth(600, 1280), 600);
  assert.equal(clampPanelWidth(1500, 1280), MAX_PANEL_WIDTH);
  assert.equal(clampPanelWidth(900, 1000), 880); // 1000 - 120 = 880

  // Save and load
  savePanelWidth(560);
  assert.equal(saved.get('builder:panel-width'), '560');
  assert.equal(loadPanelWidth(1280), 560);

  // Corrupt or out-of-bounds saved values clamp safely
  saved.set('builder:panel-width', '100');
  assert.equal(loadPanelWidth(1280), MIN_PANEL_WIDTH);
  saved.set('builder:panel-width', 'invalid');
  assert.equal(loadPanelWidth(1280), DEFAULT_PANEL_WIDTH);
});
