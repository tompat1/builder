import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { useHouseRenderStore } from '../src/store/useHouseRenderStore.ts';

test('house renders retain the latest image independently for every view', () => {
  setActivePinia(createPinia());
  const renders = useHouseRenderStore();

  renders.remember('front', 'data:image/jpeg;base64,front-first');
  renders.remember('right', 'data:image/jpeg;base64,right');

  assert.equal(renders.latest.front, 'data:image/jpeg;base64,front-first');
  assert.equal(renders.latest.right, 'data:image/jpeg;base64,right');
  assert.deepEqual(renders.readyFacings, ['front', 'right']);

  renders.remember('front', 'data:image/jpeg;base64,front-latest');

  assert.equal(renders.latest.front, 'data:image/jpeg;base64,front-latest');
  assert.equal(renders.latest.right, 'data:image/jpeg;base64,right');
  assert.deepEqual(renders.readyFacings, ['front', 'right']);
});
