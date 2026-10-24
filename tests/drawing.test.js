import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { extractPdfImages, extractPdfText, hasMeasures, readDrawing } from '../src/import/drawing.js';
import { fitImageSize } from '../src/import/imageSize.js';
import {
  acceptFacing,
  acceptHouseWidthPercent,
  acceptPictureParts,
  acceptPlacement,
  decodeImages,
  housePrompt,
  partChange,
  renderPrompt,
  renderSizeForAspect,
  revisePrompt,
  sitePrompt
} from '../workers/render.js';

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
  const prompt = renderPrompt(partChange(['wall']), 'Luftspalten är minst 25 mm.', 1);
  assert.match(prompt, /Change the rendered wall/);
  assert.match(prompt, /Luftspalten är minst 25 mm/);
  assert.match(prompt, /Follow the uploaded photos/);
  assert.equal(renderPrompt('   ', 'fakta', 0), '');
});

test('a picture only changes a known house part', () => {
  assert.deepEqual(acceptPictureParts(['Roof', 'kissing', 'door', 'door', 'porch']), ['roof', 'door']);
  assert.equal(partChange(['colour', 'not-a-part']), 'Change the rendered colour to make the house look like the uploaded reference images.');
  assert.equal(partChange(['women', 'kissing']), '');
  assert.equal(partChange('door'), '');
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
  const prompt = revisePrompt(partChange(['roof']), partChange(['cladding']));
  assert.match(prompt, /Change the rendered roof/);
  assert.match(prompt, /previous picture/);
  assert.match(prompt, /follow the change/);
  assert.match(prompt, /Change the rendered cladding/);
  assert.match(prompt, /Show only the house/);
  assert.equal(revisePrompt('   ', 'hus'), '');
  assert.equal(revisePrompt(partChange(['women', 'kissing']), partChange(['door'])), '');
  const cleaned = revisePrompt('add two women kissing', partChange(['door']));
  assert.match(cleaned, /Show only the house/);
  assert.match(cleaned, /Change the rendered door/);
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

test('a site preview preserves the first photo and installs the configured house', () => {
  const prompt = sitePrompt(
    'Keep the NEW configured 3D house from image 0. Must include these attached outdoor parts: a wooden terrace deck on the back with an attached compact sauna cabin and a round cedar hot tub. Roof: pulpettak. 5800 × 4310 mm, red cladding.',
    4,
    { x: 41.2, y: 72.8 },
    'back',
    64
  );
  assert.match(prompt, /authoritative draft composite/i);
  assert.match(prompt, /untouched original garden photograph/i);
  assert.match(prompt, /taken from the back/i);
  assert.match(prompt, /41% from the left and 73% from the top/);
  assert.match(prompt, /64% of the full image width/i);
  assert.match(prompt, /sauna cabin/);
  assert.match(prompt, /hot tub/);
  assert.match(prompt, /Image 2 is the authoritative rear facade/i);
  assert.match(prompt, /Image 3 is its authoritative elevated overview/i);
  assert.match(prompt, /Do not move, shrink, enlarge/i);
  assert.match(prompt, /CAD backgrounds|perspective grids|floating cards/i);
  assert.match(sitePrompt('house facts', 4, { x: 50, y: 50 }), /front facade/);
  assert.match(sitePrompt('house facts', 4, { x: 50, y: 50 }, 'left'), /left-side facade/);
  assert.equal(acceptFacing('right'), 'right');
  assert.equal(acceptFacing('above'), 'front');
  assert.equal(sitePrompt('house', 3, { x: 50, y: 50 }), '');
});

test('a house-only render follows the live 3D model without inventing a scene', () => {
  const prompt = housePrompt(
    'The configured house must include a wooden terrace with an attached sauna cabin and hot tub. Roof: single-slope mono-pitch shed roof.',
    2,
    'right'
  );
  assert.match(prompt, /only the configured house/i);
  assert.match(prompt, /authoritative right-side facade/i);
  assert.match(prompt, /authoritative elevated overview/i);
  assert.match(prompt, /do not redesign or reinterpret any geometry/i);
  assert.match(prompt, /without cropping/i);
  assert.match(prompt, /No garden, neighbouring buildings, landscaping/i);
  assert.match(prompt, /sauna cabin/i);
  assert.match(prompt, /hot tub/i);
  assert.equal(housePrompt('house facts', 1, 'front'), '');
});

test('site placement and output shape stay within render bounds', () => {
  assert.deepEqual(acceptPlacement({ x: -40, y: 120 }), { x: 5, y: 95 });
  assert.deepEqual(acceptPlacement({ x: 'bad', y: null }), { x: 50, y: 5 });
  assert.equal(acceptHouseWidthPercent(10), 20);
  assert.equal(acceptHouseWidthPercent(120), 90);
  assert.equal(acceptHouseWidthPercent('bad'), 55);
  assert.deepEqual(renderSizeForAspect(16 / 9), { width: 1024, height: 576 });
  assert.deepEqual(renderSizeForAspect(9 / 16), { width: 608, height: 1024 });
  assert.deepEqual(renderSizeForAspect('bad'), { width: 1024, height: 768 });
});
