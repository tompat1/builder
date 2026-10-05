import test from 'node:test';
import assert from 'node:assert/strict';
import { coversQuestion } from '../workers/passages.js';
import { acceptWebItems, readWebAnswer } from '../workers/web.js';

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

test('a web reply is a short sentence or nothing', () => {
  assert.equal(readWebAnswer({ response: { answer: 'Träguiden anger skruv genom panelen.' } }).includes('Träguiden'), true);
  assert.equal(readWebAnswer({ response: { answer: '' } }), '');
  assert.equal(readWebAnswer({ response: { answer: 'x'.repeat(700) } }), '');
});
