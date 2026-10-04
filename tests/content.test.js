import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptEntry, contentKey } from '../workers/content.js';

test('content keys stay inside the two locales', () => {
  assert.equal(contentKey('sv', 'header.save'), 'sv:header.save');
  assert.equal(contentKey('en', 'catalog.size-30.name'), 'en:catalog.size-30.name');
  assert.equal(contentKey('de', 'header.save'), null);
  assert.equal(contentKey('sv', 'header:save'), null);
  assert.equal(contentKey('sv', '../secret'), null);
});

test('only short text and image data urls are stored', () => {
  assert.deepEqual(acceptEntry({ locale: 'sv', key: 'header.save', kind: 'text', value: 'Spara' }), {
    key: 'sv:header.save',
    kind: 'text',
    value: 'Spara'
  });
  assert.equal(acceptEntry({ locale: 'sv', key: 'header.save', kind: 'text', value: 'x'.repeat(8001) }), null);
  assert.equal(acceptEntry({ locale: 'sv', key: 'picture.size.size-30', kind: 'image', value: 'data:image/png;base64,aaaa' }).kind, 'image');
  assert.equal(acceptEntry({ locale: 'sv', key: 'picture.size.size-30', kind: 'image', value: 'https://example.com/a.png' }), null);
});
