import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSEMBLY_LAYERS,
  ASSEMBLY_LAYERS_TOTAL,
  getAssemblyLayer
} from '../src/construction/assemblyLayers.ts';

test('assembly layers peel outside to inside in six steps', () => {
  assert.equal(ASSEMBLY_LAYERS_TOTAL, 6);
  assert.equal(ASSEMBLY_LAYERS.length, 6);
  const keys = ASSEMBLY_LAYERS.map((l) => l.key);
  assert.deepEqual(keys, ['cladding', 'membrane', 'insulation', 'frame', 'lining', 'roof']);
  ASSEMBLY_LAYERS.forEach((layer, idx) => {
    assert.equal(layer.step, idx + 1);
    assert.ok(layer.assemblySv.length >= 3);
    assert.ok(layer.assemblyEn.length >= 3);
    assert.ok(layer.specs.length >= 2);
    assert.ok(layer.tipsSv.length > 10);
  });
});

test('getAssemblyLayer clamps like the framing guide', () => {
  assert.equal(getAssemblyLayer(1).key, 'cladding');
  assert.equal(getAssemblyLayer(0).key, 'cladding');
  assert.equal(getAssemblyLayer(6).key, 'roof');
  assert.equal(getAssemblyLayer(99).key, 'roof');
});
