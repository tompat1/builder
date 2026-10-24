import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptHouseWidthPercent,
  siteHouseRect
} from '../src/services/sitePhotoPrep.ts';

test('house draft rect uses the requested width and grounds its bottom at the pin', () => {
  const rect = siteHouseRect({ x: 50, y: 70 }, 1000, 800, 60, 1.5);
  assert.deepEqual(rect, { x: 200, y: 160, width: 600, height: 400 });
  assert.equal(rect.y + rect.height, 560);
  assert.equal(acceptHouseWidthPercent(12), 20);
  assert.equal(acceptHouseWidthPercent(96), 90);
  assert.equal(acceptHouseWidthPercent(undefined), 55);
});

test('house draft keeps scale at photo edges instead of silently shrinking', () => {
  const rect = siteHouseRect({ x: 5, y: 90 }, 1000, 800, 60, 1);
  assert.equal(rect.x, -250);
  assert.equal(rect.width, 600);
  assert.equal(rect.y + rect.height, 720);
});
