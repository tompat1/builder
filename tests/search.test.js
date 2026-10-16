import test from 'node:test';
import assert from 'node:assert/strict';
import { completionSuffix, fold, matchSearch } from '../src/search/match.ts';

const docs = [
  {
    id: 'custom-colour',
    topic: 'colour',
    title: 'Custom colour',
    hint: 'Choose on the palette',
    keywords: 'egen kulör blanda färg custom colour custom color mix mixing hex ral pantone color colour färg kulör',
    lead: true,
    boost: 48
  },
  {
    id: 'falu',
    topic: 'colour',
    title: 'Falu red',
    hint: 'Traditional Swedish distemper paint',
    keywords: 'falu rödfärg color colour färg kulör paint',
    lead: false
  },
  {
    id: 'custom-size',
    topic: 'size',
    title: 'Custom size',
    hint: 'Width, length, and height in centimetres.',
    keywords: 'egna mått custom size bredd längd höjd width length height',
    lead: true,
    boost: 48
  },
  {
    id: 'mood',
    topic: 'tools',
    title: 'Mood board',
    hint: 'Drop pictures and clips',
    keywords: 'moodboard tavla inspiration',
    lead: true
  },
  {
    id: 'shop',
    topic: 'shop',
    title: 'Shop',
    hint: 'Made for your everyday',
    keywords: 'merch butik',
    lead: true
  }
];

test('search folds Swedish letters', () => {
  assert.equal(fold('Färg'), 'farg');
  assert.equal(fold('Kulör'), 'kulor');
});

test('colour search leads with custom mixing', () => {
  const hits = matchSearch(docs, 'color', 'all');
  assert.equal(hits[0].id, 'custom-colour');
  assert.ok(hits.some((hit) => hit.id === 'falu'));
});

test('swedish colour words find the palette', () => {
  assert.equal(matchSearch(docs, 'färg', 'all')[0].id, 'custom-colour');
  assert.equal(matchSearch(docs, 'kulör', 'all')[0].id, 'custom-colour');
});

test('custom size needs both words', () => {
  assert.equal(matchSearch(docs, 'custom size', 'all')[0].id, 'custom-size');
  assert.equal(matchSearch(docs, 'egna mått', 'all')[0].id, 'custom-size');
});

test('a topic pill limits the list', () => {
  const hits = matchSearch(docs, '', 'shop');
  assert.deepEqual(hits.map((hit) => hit.id), ['shop']);
});

test('an empty search shows the lead items', () => {
  const hits = matchSearch(docs, '', 'all');
  assert.ok(hits.every((hit) => hit.lead));
  assert.equal(hits.length, 4);
});

test('completion continues the title', () => {
  assert.equal(completionSuffix('Custom colour', 'cus'), 'tom colour');
  assert.equal(completionSuffix('Custom colour', 'red'), '');
});
