import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DISPLAY_DEFAULTS,
  loadDisplayPrefs,
  saveDisplayPrefs,
  DEFAULT_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  SINGLE_COLUMN_PANEL_WIDTH,
  isSingleColumnPanelWidth,
  clampPanelWidth,
  loadPanelWidth,
  savePanelWidth,
  MIN_PANEL_HEIGHT,
  PANEL_HEIGHT_CHROME,
  maxPanelHeight,
  clampPanelHeight,
  loadPanelHeight,
  savePanelHeight
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

  // Default is 410; min is one option column
  assert.equal(loadPanelWidth(1280), DEFAULT_PANEL_WIDTH);
  assert.equal(DEFAULT_PANEL_WIDTH, 410);
  assert.equal(MIN_PANEL_WIDTH, 200);
  assert.equal(SINGLE_COLUMN_PANEL_WIDTH, 320);
  assert.equal(isSingleColumnPanelWidth(200), true);
  assert.equal(isSingleColumnPanelWidth(320), true);
  assert.equal(isSingleColumnPanelWidth(321), false);

  // Clamping
  assert.equal(clampPanelWidth(100, 1280), MIN_PANEL_WIDTH);
  assert.equal(clampPanelWidth(200, 1280), 200);
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

test('desktop panel height defaults to fill, clamps to one nav row, and persists', () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value)
  };

  assert.equal(MIN_PANEL_HEIGHT, 88);
  assert.equal(maxPanelHeight(800), 800 - PANEL_HEIGHT_CHROME);
  assert.equal(loadPanelHeight(800), maxPanelHeight(800));

  assert.equal(clampPanelHeight(50, 800), MIN_PANEL_HEIGHT);
  assert.equal(clampPanelHeight(400, 800), 400);
  assert.equal(clampPanelHeight(9999, 800), maxPanelHeight(800));

  savePanelHeight(280);
  assert.equal(saved.get('builder:panel-height'), '280');
  assert.equal(loadPanelHeight(800), 280);

  saved.set('builder:panel-height', '40');
  assert.equal(loadPanelHeight(800), MIN_PANEL_HEIGHT);
  saved.set('builder:panel-height', 'invalid');
  assert.equal(loadPanelHeight(800), maxPanelHeight(800));
});
