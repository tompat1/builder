import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { auditPublicImages, convertPublicImages, leftovers, rewriteText } from '../scripts/lib/public-images.mjs';
import { encodeWebp } from '../scripts/convert-images.mjs';

const sample = [
  "import { exportRenderedImage } from './exportService';",
  "exportRenderedImage(canvas, 'modular-hus-3d.png');",
  "link.download = 'husbild.jpg';",
  'accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"',
  "form.append(`input_image_${index}`, blob, `ref-${index}.jpg`);",
  "assert.equal(value, 'https://example.com/a.png');",
  "image: '/merch/07.jpg',",
  '<img :src="`/merch/cta/${ctaProduct.id}.png`" />'
].join('\n');

const targets = [
  { url: '/merch/07.jpg', webpUrl: '/merch/07.webp', ext: '.jpg', dirUrl: '/merch' },
  { url: '/merch/cta/cap-graphite.png', webpUrl: '/merch/cta/cap-graphite.webp', ext: '.png', dirUrl: '/merch/cta' }
];

test('relink rewrites shop paths and the merch-card template', () => {
  const next = rewriteText(sample, targets);
  assert.match(next, /image: '\/merch\/07\.webp'/);
  assert.match(next, /\/merch\/cta\/\$\{ctaProduct\.id\}\.webp/);
  assert.match(next, /modular-hus-3d\.png/);
  assert.match(next, /husbild\.jpg/);
  assert.match(next, /image\/png/);
  assert.match(next, /ref-\$\{index\}\.jpg/);
  assert.match(next, /example\.com\/a\.png/);
  assert.deepEqual(leftovers(next, targets), []);
});

test('a concatenated path blocks the conversion', () => {
  const broken = "'/merch/cta/' + id + '.png'";
  assert.equal(leftovers(rewriteText(broken, targets), targets).length, 1);
});

async function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'builder-images-'));
  fs.mkdirSync(path.join(root, 'public/merch/cta'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/brand'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/site'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/views'), { recursive: true });
  await sharp({
    create: { width: 4, height: 4, channels: 4, background: { r: 255, g: 90, b: 0, alpha: 0.4 } }
  }).png().toFile(path.join(root, 'public/merch/cta/cap.png'));
  await sharp({
    create: { width: 4, height: 4, channels: 3, background: { r: 10, g: 20, b: 30 } }
  }).jpeg().toFile(path.join(root, 'public/merch/07.jpg'));
  fs.writeFileSync(path.join(root, 'public/brand/landing.webp'), 'kept-webp');
  fs.writeFileSync(path.join(root, 'public/brand/landing.jpg'), 'unused-jpeg');
  fs.writeFileSync(path.join(root, 'src/site/merch.ts'), "export const MERCH = [{ id: 'cap', image: '/merch/07.jpg' }];\n");
  fs.writeFileSync(path.join(root, 'src/views/LandingView.vue'), '<img :src="`/merch/cta/${ctaProduct.id}.png`" />\n');
  fs.writeFileSync(path.join(root, 'src/services-note.ts'), "exportRenderedImage(canvas, 'modular-hus-3d.png');\n");
  return root;
}

test('conversion writes webp, relinks, and keeps an existing webp', async () => {
  const root = await fixture();
  const result = await convertPublicImages({ root, encode: encodeWebp });
  assert.equal(result.converted, 2);
  assert.equal(result.dropped, 1);
  assert.equal(fs.existsSync(path.join(root, 'public/merch/07.jpg')), false);
  assert.equal(fs.existsSync(path.join(root, 'public/merch/cta/cap.png')), false);
  assert.equal(fs.existsSync(path.join(root, 'public/brand/landing.jpg')), false);
  assert.equal(fs.readFileSync(path.join(root, 'public/brand/landing.webp'), 'utf8'), 'kept-webp');
  const merch = fs.readFileSync(path.join(root, 'src/site/merch.ts'), 'utf8');
  const landing = fs.readFileSync(path.join(root, 'src/views/LandingView.vue'), 'utf8');
  assert.match(merch, /\/merch\/07\.webp/);
  assert.match(landing, /\/merch\/cta\/\$\{ctaProduct\.id\}\.webp/);
  assert.match(fs.readFileSync(path.join(root, 'src/services-note.ts'), 'utf8'), /modular-hus-3d\.png/);
  const card = await sharp(path.join(root, 'public/merch/cta/cap.webp')).metadata();
  assert.equal(card.format, 'webp');
  assert.equal(card.hasAlpha, true);
  assert.deepEqual(auditPublicImages(root), []);
});

test('a newer linked source replaces the old webp', async () => {
  const root = await fixture();
  const webp = path.join(root, 'public/merch/07.webp');
  fs.writeFileSync(webp, 'old-webp');
  const past = new Date(Date.now() - 60_000);
  fs.utimesSync(webp, past, past);
  await convertPublicImages({ root, encode: encodeWebp });
  assert.equal(fs.readFileSync(webp, 'utf8').includes('old-webp'), false);
  assert.equal((await sharp(webp).metadata()).format, 'webp');
});

test('the site public folder stays webp', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.deepEqual(auditPublicImages(root), []);
});

test('conversion leaves the tree alone when a link cannot move', async () => {
  const root = await fixture();
  fs.writeFileSync(path.join(root, 'src/views/LandingView.vue'), "const src = '/merch/cta/' + id + '.png';\n");
  await assert.rejects(() => convertPublicImages({ root, encode: encodeWebp }));
  assert.equal(fs.existsSync(path.join(root, 'public/merch/cta/cap.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'public/merch/07.jpg')), true);
  assert.match(fs.readFileSync(path.join(root, 'src/site/merch.ts'), 'utf8'), /\/merch\/07\.jpg/);
});
