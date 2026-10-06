import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { extractPdfImages, extractPdfText, hasMeasures, readDrawing } from '../src/import/drawing.js';
import { fitImageSize } from '../src/import/imageSize.js';
import { decodeImages, renderPrompt, revisePrompt } from '../workers/render.js';

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

  const raised = readDrawing('6040 x 3500 sadeltak med extra takhöjd 14 grader');
  assert.equal(raised.roof, 'sadeltak14');
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

test('a pictured sheet still keeps a separate measurement line', async () => {
  const picture = new Uint8Array(1200);
  picture[0] = 0xff;
  picture[1] = 0xd8;
  picture.set(new TextEncoder().encode('(9999 mm)'), 20);
  const sentence = '(Bredd 6040 mm Djup 3500 mm Hojd 4200 mm)';
  const compressed = deflateSync(Buffer.from(sentence));
  const pictureHead = new TextEncoder().encode('1 0 obj\n<< /Subtype /Image /Filter /DCTDecode /Length 1200 >>\nstream\n');
  const textHead = new TextEncoder().encode('\nendstream\nendobj\n2 0 obj\n<< /Filter /FlateDecode /Length 8 >>\nstream\n');
  const tail = new TextEncoder().encode('\nendstream\nendobj\n%%EOF');
  const bytes = new Uint8Array(pictureHead.length + picture.length + textHead.length + compressed.length + tail.length);
  let offset = 0;
  bytes.set(pictureHead, offset);
  offset += pictureHead.length;
  bytes.set(picture, offset);
  offset += picture.length;
  bytes.set(textHead, offset);
  offset += textHead.length;
  bytes.set(compressed, offset);
  offset += compressed.length;
  bytes.set(tail, offset);

  const text = await extractPdfText(bytes);
  assert.match(text, /6040/);
  assert.doesNotMatch(text, /9999/);
  assert.equal(extractPdfImages(bytes).length, 1);
});

test('a building area and its side measures set the rectangle', () => {
  const reading = readDrawing(`R= RÅGLAS FÖNSTER
7500
4000
3878
4000
2475
25°
BYGGNADSAREA (BYA)30.0 m²`);
  assert.equal(reading.width, 7500);
  assert.equal(reading.depth, 4000);
  assert.equal(reading.height, 4000);
  assert.equal(reading.roof, null);
  assert.equal(reading.window, null);
});

test('font codes in a drawing become the measurement text', async () => {
  const cmap = '1 beginbfchar <0001> <0037> <0002> <0035> <0003> <0030> endbfchar';
  const content = 'BT /F1 12 Tf [<0001><0002><0003><0003>] TJ ET';
  const pdf = `%PDF-1.4
1 0 obj
<< /Font << /F1 2 0 R >> >>
endobj
2 0 obj
<< /ToUnicode 3 0 R /Type /Font >>
endobj
3 0 obj
<< /Length ${cmap.length} >>
stream
${cmap}
endstream
endobj
4 0 obj
<< /Length ${content.length} >>
stream
${content}
endstream
endobj
`;
  const text = await extractPdfText(new TextEncoder().encode(pdf));
  assert.match(text, /7500/);
});

test('a title block in metres sets the rectangular house', () => {
  const reading = readDrawing('BYGGNADSMÅTT: 10,0 x 3,0 meter\nTAKHÖJD: 3,7 meter\nTAK: 27°');
  assert.equal(reading.width, 10000);
  assert.equal(reading.depth, 3000);
  assert.equal(reading.height, 3700);
  assert.equal(reading.roof, null);
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

test('a picture prompt keeps the house and drops people', () => {
  const prompt = renderPrompt(
    'a red house with two women in bikinis kissing on a beach',
    '',
    0
  );
  assert.match(prompt, /a red house/);
  assert.match(prompt, /Show only the house/);
  assert.doesNotMatch(prompt, /women|bikini|kiss|beach/i);
  const onlyPeople = renderPrompt('two women kissing on a beach', 'Falu red cladding.', 0);
  assert.match(onlyPeople, /Swedish timber house/);
  assert.match(onlyPeople, /Falu red cladding/);
  assert.doesNotMatch(onlyPeople, /women|kiss|beach/i);
});

test('a correction revises the previous picture', () => {
  const prompt = revisePrompt('  Taket ska vara platt  ', 'Ett hus med papptak');
  assert.match(prompt, /Taket ska vara platt/);
  assert.match(prompt, /previous picture/);
  assert.match(prompt, /follow the change/);
  assert.match(prompt, /Ett hus med papptak/);
  assert.match(prompt, /Show only the house/);
  assert.equal(revisePrompt('   ', 'hus'), '');
  const cleaned = revisePrompt('add two women kissing', 'a red house with a woman on the steps');
  assert.match(cleaned, /Show only the house/);
  assert.doesNotMatch(cleaned, /women|woman|kiss/i);
});

test('the picture model receives at most four reference images', () => {
  const image = `data:image/png;base64,${Buffer.alloc(40, 7).toString('base64')}`;
  assert.equal(decodeImages([image, image, image, image, image]).length, 4);
  assert.equal(decodeImages([image, image]).length, 2);
});

test('reference photos stay inside the picture model size', () => {
  const wide = fitImageSize(4000, 200);
  const small = fitImageSize(64, 48);
  const photo = fitImageSize(3000, 2000);
  for (const size of [wide, small, photo]) {
    assert.ok(size.width >= 64 && size.height >= 64);
    assert.ok(size.width <= 480 && size.height <= 480);
  }
  assert.equal(photo.width, 480);
  assert.equal(small.height, 64);
});
