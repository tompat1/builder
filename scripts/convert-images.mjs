import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { convertPublicImages, formatMegabytes, WEBP_QUALITY } from './lib/public-images.mjs';

export async function encodeWebp(from, to) {
  await sharp(from).webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 4 }).toFile(to);
}

async function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const result = await convertPublicImages({ root, encode: encodeWebp });
  if (result.converted === 0 && result.dropped === 0 && result.relinked.length === 0) return;
  const parts = [`Converted ${result.converted} to WebP`];
  if (result.dropped > 0) parts.push(`removed ${result.dropped} unused originals beside an existing WebP`);
  if (result.relinked.length > 0) parts.push(`relinked ${result.relinked.join(', ')}`);
  parts.push(`saved ${formatMegabytes(result.savedBytes)}`);
  console.log(`${parts.join('. ')}.`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
