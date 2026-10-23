import test from 'node:test';
import assert from 'node:assert/strict';
import { oldStructureClearRect } from '../src/services/sitePhotoPrep.ts';

test('old-structure clear rect sits above the ground-contact pin', () => {
  const rect = oldStructureClearRect({ x: 50, y: 70 }, 1000, 800);
  assert.ok(rect.w > 400);
  assert.ok(rect.h > 300);
  assert.ok(rect.y + rect.h * 0.85 > (70 / 100) * 800 - 40);
  assert.ok(rect.y < (70 / 100) * 800);
  assert.ok(rect.x >= 0 && rect.x + rect.w <= 1000);
});

test('clear rect stays inside the photo for edge pins', () => {
  const left = oldStructureClearRect({ x: 5, y: 90 }, 640, 480);
  const right = oldStructureClearRect({ x: 95, y: 20 }, 640, 480);
  assert.equal(left.x, 0);
  assert.ok(left.x + left.w <= 640);
  assert.ok(right.x + right.w <= 640);
  assert.ok(right.y >= 0);
});
