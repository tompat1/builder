import test from 'node:test';
import assert from 'node:assert/strict';
import { coversQuestion } from '../workers/passages.js';
import { acceptWebItems, citedSources, readWebAnswer, wikiItems, wikiQuery } from '../workers/web.js';

test('a stored attefall passage covers the question', () => {
  const covered = coversQuestion([
    {
      title: 'Attefallshus 25–50 kvm',
      url: 'https://husverket.se/hus/attefallshus/',
      text: 'Nyckelfärdiga attefallshus mellan 25 och 50 kvadratmeter.'
    }
  ], 'Hur stort får ett attefallshus vara?');
  assert.equal(covered, true);
});

test('an unrelated page does not cover a screw question', () => {
  assert.equal(coversQuestion([
    { title: 'Pulpettak', url: '', text: 'Taklutningen är tolv grader.' }
  ], 'Vilken skruvlängd passar till liggande ytterpanel?'), false);
  assert.equal(coversQuestion([
    { title: 'Utvändigt', url: '', text: 'Liggande ytterpanel och stående panel.' }
  ], 'Vilken skruvlängd passar till liggande ytterpanel?'), false);
  assert.equal(coversQuestion([], 'Vilken skruvlängd passar till liggande ytterpanel?'), false);
});

test('web hits keep https pages and drop the rest', () => {
  const items = acceptWebItems({
    items: [
      { url: 'https://www.traguiden.se/konstruktion/skruv/', title: 'Skruv i panel', description: 'Träguiden beskriver skruvlängd för liggande panel.' },
      { url: 'http://example.com/insecure', title: 'Osäker', description: 'En lång beskrivning som ändå ska bort.' },
      { url: 'https://example.com/empty', title: 'Kort', description: '' }
    ]
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://www.traguiden.se/konstruktion/skruv/');
});

test('a Wikipedia search uses the distinctive words', () => {
  assert.equal(
    wikiQuery('Vilken skruvlängd passar till liggande ytterpanel?'),
    'vilken skruvlängd passar liggande ytterpanel'
  );
});

test('a Wikipedia search becomes a source page', () => {
  const items = wikiItems({
    query: {
      search: [
        { title: 'Träpanel', snippet: '<span>Stående och liggande träpanel</span> fästs med skruv.' }
      ]
    }
  }, 'sv');
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://sv.wikipedia.org/wiki/Tr%C3%A4panel');
  assert.match(items[0].description, /liggande träpanel/);
  assert.deepEqual(wikiItems({ query: { search: [] } }, 'sv'), []);
});

test('a web reply cites the page it names', () => {
  const items = [
    { title: 'Trossbotten', url: 'https://sv.wikipedia.org/wiki/Trossbotten', description: 'Utrymmet mellan golvbjälkarna.' },
    { title: 'Sportpalatset, Stockholm', url: 'https://sv.wikipedia.org/wiki/Sportpalatset,_Stockholm', description: 'En byggnad i Stockholm.' }
  ];
  const cited = citedSources('Trossbotten är utrymmet mellan golvbjälkarna.', items);
  assert.deepEqual(cited.map((item) => item.title), ['Trossbotten']);
  assert.deepEqual(citedSources('Ett utrymme mellan golvbjälkarna i ett hus.', items).map((item) => item.title), ['Trossbotten']);
});

test('a web reply is a short sentence or nothing', () => {
  assert.equal(readWebAnswer({ response: { answer: 'Träguiden anger skruv genom panelen.' } }).includes('Träguiden'), true);
  assert.equal(readWebAnswer({ response: { answer: '' } }), '');
  assert.equal(readWebAnswer({ response: { answer: 'x'.repeat(700) } }), '');
});
