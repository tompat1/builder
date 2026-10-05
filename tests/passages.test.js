import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSourceUrl, chunkText, htmlToText, pageTitle, rankPassages } from '../workers/passages.js';
import { acceptSource } from '../workers/sources.js';

const husverket = 'https://husverket.se/hus/attefallshus/?cam=attefallshus_performance&gad_source=1&gad_campaignid=23825484958&gbraid=0AAAAADe5bpgn5QvRhtAGufctW1P7EdnoJ&gclid=Cj0KCQjw8ofWBhCHARIsANBj4Lv8e19Hravf4g5YwNGYt3c5LsBFRHg5UMRnaSV1Ipf4kYsF2aXNzzUaAvNJEALw_wcB';

test('a campaign link keeps the page and drops the tracking', () => {
  assert.equal(acceptSource(husverket), husverket);
  assert.equal(canonicalSourceUrl(husverket), 'https://husverket.se/hus/attefallshus/');
  assert.equal(canonicalSourceUrl('https://www.byggahus.se/'), 'https://www.byggahus.se/');
  assert.equal(canonicalSourceUrl('http://example.com'), '');
});

test('page text drops tags and scripts', () => {
  const html = '<html><head><title>Attefall &amp; regler</title><style>p{}</style></head><body><script>alert(1)</script><p>Nyckelfärdigt attefallshus 25–50 m².</p></body></html>';
  assert.equal(pageTitle(html, 'fallback'), 'Attefall & regler');
  const text = htmlToText(html);
  assert.match(text, /Nyckelfärdigt attefallshus/);
  assert.doesNotMatch(text, /alert|style/);
  const withMenu = '<nav>Hem Hus</nav><header>Meny</header><p>Vi erbjuder välplanerade attefallshus.</p><footer>Kontakt</footer>';
  const article = htmlToText(withMenu);
  assert.match(article, /välplanerade attefallshus/);
  assert.doesNotMatch(article, /Hem Hus|Meny|Kontakt/);
});

test('a long page becomes overlapping passages', () => {
  const sentence = 'Attefallshuset kan vara 25 till 50 kvadratmeter. ';
  const chunks = chunkText(sentence.repeat(40));
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 700));
  assert.deepEqual(chunkText('för kort'), []);
  assert.equal(chunkText('www.byggahus.se. Referenssida sparad för husfrågor.').length, 1);
});

test('a question finds the reference passage without the exact heading', () => {
  const ranked = rankPassages([
    { title: 'Husbyggaren', url: 'https://www.husbyggaren.se/', text: 'Artiklar om fukt, tak och byggregler.' },
    { title: 'Attefallshus 25–50 kvm', url: 'https://husverket.se/hus/attefallshus/', text: 'Nyckelfärdiga attefallshus mellan 25 och 50 kvadratmeter.' },
    { title: 'Träguiden', url: 'https://www.traguiden.se/', text: 'Konstruktionsvirke och panel.' }
  ], 'Hur stort får ett nyckelfärdigt attefallshus vara?');
  assert.equal(ranked[0].url, 'https://husverket.se/hus/attefallshus/');
  assert.deepEqual(rankPassages([], 'attefall'), []);
});

test('a short question word does not pull an unrelated page', () => {
  const ranked = rankPassages([
    { title: 'Svenska Skalhus', url: 'https://svenskaskalhus.se/', text: 'Vad ingår i ett skalhus?' },
    { title: 'Trossbotten', url: 'https://sv.wikipedia.org/wiki/Trossbotten', text: 'Trossbotten är utrymmet mellan golvbjälkarna.' }
  ], 'Vad är en trossbotten?');
  assert.deepEqual(ranked.map((passage) => passage.title), ['Trossbotten']);
});

test('nearby passages come from different pages', () => {
  const ranked = rankPassages([
    { title: 'Husverket', url: 'https://husverket.se/hus/attefallshus/', text: 'Nyckelfärdigt attefallshus.' },
    { title: 'Husverket igen', url: 'https://husverket.se/hus/attefallshus/', text: 'Ett attefallshus till.' },
    { title: 'Byggbeskrivningar', url: 'https://www.byggbeskrivningar.se/utvandigt/attefallshuset/', text: 'Attefallshuset i byggbeskrivningen.' }
  ], 'attefallshus');
  assert.deepEqual(ranked.map((passage) => passage.url), [
    'https://www.byggbeskrivningar.se/utvandigt/attefallshuset/',
    'https://husverket.se/hus/attefallshus/'
  ]);
});
