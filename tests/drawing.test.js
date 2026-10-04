import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { extractPdfText, hasMeasures, readDrawing } from '../src/import/drawing.js';
import { renderPrompt } from '../workers/render.js';

test('a labelled drawing sets the rectangular house', () => {
  const reading = readDrawing('Bredd 6040 mm Djup 3500 mm Höjd 4200 mm pulpettak takpapp pardörr fönster');
  assert.equal(reading.width, 6040);
  assert.equal(reading.depth, 3500);
  assert.equal(reading.height, 4200);
  assert.equal(reading.roof, 'pulpettak');
  assert.equal(reading.covering, 'felt');
  assert.equal(reading.door, 'SVANSHALL');
  assert.equal(reading.window, 'standard-single');
  assert.equal(hasMeasures(reading), true);
});

test('a pair of measurements is enough, and a sheet with no numbers changes nothing', () => {
  const pair = readDrawing('6040 x 3500 sadeltak');
  assert.equal(pair.width, 6040);
  assert.equal(pair.depth, 3500);
  assert.equal(pair.roof, 'sadeltak');
  assert.equal(pair.height, null);

  const meters = readDrawing('6,04 x 3,50');
  assert.equal(meters.width, 6040);
  assert.equal(meters.depth, 3500);

  const wide = readDrawing('Bredd 15000 mm');
  assert.equal(wide.width, 12000);

  const board = readDrawing('Bredd 400 mm');
  assert.equal(board.width, null);
  assert.equal(hasMeasures(board), false);

  const blank = readDrawing('ingen ritning');
  assert.equal(hasMeasures(blank), false);
  assert.equal(blank.roof, null);
  assert.equal(blank.door, null);
});

test('a compressed PDF still yields the measurement text', async () => {
  const sentence = '(Bredd 5800 mm Langd 4310 mm Hojd 3600 mm)';
  const compressed = deflateSync(Buffer.from(sentence));
  const head = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Filter /FlateDecode /Length 8 >>\nstream\n');
  const tail = new TextEncoder().encode('\nendstream\nendobj\n%%EOF');
  const bytes = new Uint8Array(head.length + compressed.length + tail.length);
  bytes.set(head, 0);
  bytes.set(compressed, head.length);
  bytes.set(tail, head.length + compressed.length);

  const text = await extractPdfText(bytes);
  const reading = readDrawing(text);
  assert.match(text, /5800/);
  assert.equal(reading.width, 5800);
  assert.equal(reading.depth, 4310);
  assert.equal(reading.height, 3600);
});

test('the picture prompt keeps the idea and a short knowledge note', () => {
  const prompt = renderPrompt('  rött hus med stående panel  ', 'Luftspalten är minst 25 mm.', 1);
  assert.match(prompt, /rött hus med stående panel/);
  assert.match(prompt, /Luftspalten är minst 25 mm/);
  assert.match(prompt, /Follow the uploaded photos/);
  assert.equal(renderPrompt('   ', 'fakta', 0), '');
});
