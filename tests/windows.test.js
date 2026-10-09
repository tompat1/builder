import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitPane } from '../src/three-engine/windowFit.ts';

test('a portrait panorama fills a tall upper panel and stays taller than it is wide', () => {
  const pane = portraitPane(1.86, 2.3, true);

  assert.ok(pane.height > pane.width);
  assert.ok(pane.height > 1.7);
  assert.ok(pane.width > 1.2);
  assert.ok(pane.sill < 0.2);
});

test('a portrait panorama in a wide short panel stays narrow enough to remain portrait', () => {
  const pane = portraitPane(3.2, 1.4, false);

  assert.ok(pane.height > pane.width);
  assert.ok(pane.width < 1.4);
});
