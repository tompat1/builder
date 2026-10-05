import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_KEYWORDS, rankEntries } from '../src/knowledge/match.js';
import { SELECTION_PAGES } from '../workers/catalog.js';
import { acceptResource } from '../workers/resources.js';
import { acceptSource } from '../workers/sources.js';
import { parseEntryId, readPayload } from '../workers/select.js';

const pages = Object.entries(PAGE_KEYWORDS).map(([id, keywords]) => ({ id, keywords }));
const known = new Set(pages.map((page) => page.id));

function best(query) {
  return rankEntries(pages, query)[0]?.entry.id ?? null;
}

test('local concierge picks a stored page and does not guess', () => {
  assert.equal(best('Behövs bygglov?'), 'permit');
  assert.equal(best('Hur är attefallshuset byggt?'), 'attefall-shell');
  assert.equal(best('Hur stor är luftspalten?'), 'panel-air');
  assert.equal(best('Vilken panel är standard?'), 'cladding');
  assert.equal(best('Var sitter det vita blecket?'), 'belt');
  assert.equal(best('Hur är ytterväggen uppbyggd?'), 'shell-wall');
  assert.equal(best('Vad ingår i ett skalhus?'), 'delivery');
  assert.equal(best('Vad betyder nyckelfärdigt?'), 'delivery');
  assert.equal(best('Vilken skiva är bäst och billigast för innerväggar bakom gipset?'), 'inner-board');
  assert.equal(best('Vilken färg har soffan?'), null);
  assert.equal(best('   '), null);
});

test('the worker may only choose a page the hub can show', () => {
  const hubIds = Object.keys(PAGE_KEYWORDS).sort();
  const workerIds = SELECTION_PAGES.map((page) => page.id).sort();
  assert.deepEqual(workerIds, hubIds);
  assert.equal(new Set(workerIds).size, workerIds.length);
});

test('Workers AI contributes a page id, not the sentence', () => {
  assert.equal(parseEntryId(readPayload({ response: { entryId: 'permit', answer: 'invented law' } }), known), 'permit');
  assert.equal(parseEntryId(readPayload({ response: '{"entryId":"belt"}' }), known), 'belt');
  assert.equal(
    parseEntryId(readPayload({ choices: [{ message: { content: '```json\n{"entryId":"panel-air"}\n```' } }] }), known),
    'panel-air'
  );
  assert.equal(parseEntryId(readPayload({ response: { entryId: '' } }), known), null);
  assert.equal(parseEntryId(readPayload({ response: { entryId: 'sofa' } }), known), null);
  assert.equal(parseEntryId(readPayload({ response: 'The metal sits at 2.70 m.' }), known), null);
  assert.equal(parseEntryId(readPayload(null), known), null);
});

test('an admin page gets a safe id and can be found by its words', () => {
  const row = acceptResource({
    title: 'Syllpapp',
    body: 'Syllpappen ligger under syllen och stoppar fukt från plinten.',
    keywords: 'syllpapp, fukt',
    linkHref: 'https://www.traguiden.se/'
  });
  assert.equal(row.id, 'extra-syllpapp');
  assert.deepEqual(row.keywords, ['syllpapp', 'fukt']);
  assert.equal(acceptResource({ title: 'A', body: 'För kort.' }), null);
  assert.equal(acceptResource({ title: 'Syllpapp', body: 'Ett svar som räcker.', linkHref: 'http://example.com' }), null);
  const search = `https://www.google.com/search?q=${'standardmatt+'.repeat(40)}`;
  const found = acceptResource({
    title: 'Finns det några standardmått som är mer ekonomiska',
    body: 'Ja, det finns tydliga geometriska principer och standardmått som gör ett hus mer ekonomiskt att bygga.',
    keywords: '',
    linkHref: search
  });
  assert.equal(found.linkHref, search);
  assert.ok(found.keywords.includes('standardmått'));
  assert.equal(acceptResource({
    title: 'Syllpapp',
    body: 'Ett svar som räcker.',
    linkHref: `https://example.com/${'a'.repeat(2000)}`
  }), null);
  const ranked = rankEntries([
    { id: 'permit', keywords: ['bygglov'] },
    { id: row.id, keywords: row.keywords }
  ], 'Hur läggs syllpapp?');
  assert.equal(ranked[0].entry.id, 'extra-syllpapp');
});

test('a reference site must be a plain https address', () => {
  assert.equal(acceptSource('https://www.traguiden.se'), 'https://www.traguiden.se/');
  assert.equal(acceptSource({ url: 'https://www.traguiden.se/utvandigt/' }), 'https://www.traguiden.se/utvandigt/');
  assert.equal(acceptSource('http://example.com'), null);
  assert.equal(acceptSource('https://user:secret@example.com'), null);
});

test('live Cloudflare worker chooses a page', { skip: process.env.KNOWLEDGE_WORKER_LIVE !== '1' }, async () => {
  const base = process.env.VITE_CLOUDFLARE_WORKER_URL || 'https://builder-knowledge.thomasrynell.workers.dev';
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.ai, true);

  const response = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ question: 'Behövs bygglov?', lang: 'sv' })
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.entryId, 'permit');
  assert.equal(body.answer, undefined);
});
