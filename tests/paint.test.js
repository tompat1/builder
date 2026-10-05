import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cmykToRgb,
  lookupRal,
  nearestRal,
  normalizeHex,
  parseCustomPaint,
  parseSavedPaints,
  rgbToCmyk,
  rgbToHex
} from '../src/color/paint.ts';

test('a facade colour keeps one hex across the written forms', () => {
  assert.equal(normalizeHex('#ABC'), '#aabbcc');
  assert.equal(normalizeHex('383E42'), '#383e42');
  assert.equal(normalizeHex('nope'), null);
  const rgb = { r: 56, g: 62, b: 66 };
  assert.equal(rgbToHex(rgb), '#383e42');
  const cmyk = rgbToCmyk(rgb);
  const back = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
  assert.ok(Math.abs(back.r - rgb.r) <= 2);
  assert.ok(Math.abs(back.g - rgb.g) <= 2);
  assert.ok(Math.abs(back.b - rgb.b) <= 2);
});

test('a RAL Classic code sets the screen colour and an unknown code does not', () => {
  assert.equal(lookupRal('RAL 7016')?.hex, '#383e42');
  assert.equal(lookupRal('1234'), null);
  assert.equal(nearestRal('#383e42').code, '7016');
  assert.equal(nearestRal('#383e42').distance, 0);
  const nearby = nearestRal('#45a3e1');
  assert.match(nearby.code, /^\d{4}$/);
  assert.ok(nearby.distance > 1);
  const saved = parseCustomPaint({ hex: '#383e42', system: 'ral', ral: '7016', pantone: '19-4052 TCX' });
  assert.deepEqual(saved, { hex: '#383e42', system: 'ral', ral: '7016', pantone: '19-4052 TCX' });
  assert.equal(parseCustomPaint({ hex: 'nope' }), null);
});

test('saved custom colours stay in the gallery when another swatch is the active one', () => {
  const gallery = parseSavedPaints([
    { id: 'paint-a', hex: '#22676c', system: 'hex', ral: '7012', pantone: '' },
    { id: 'paint-b', hex: '#383e42', system: 'ral', ral: '7016', pantone: '' },
    { id: 'paint-a', hex: '#aabbcc', system: 'hex', ral: '', pantone: '' }
  ]);
  assert.deepEqual(gallery.map((paint) => paint.id), ['paint-a', 'paint-b']);
  const older = parseSavedPaints(undefined, { hex: '#383e42', system: 'ral', ral: '7016', pantone: '' });
  assert.equal(older.length, 1);
  assert.equal(older[0].hex, '#383e42');
  assert.equal(parseSavedPaints([], { hex: '#383e42', system: 'ral', ral: '7016', pantone: '' }).length, 0);
});
