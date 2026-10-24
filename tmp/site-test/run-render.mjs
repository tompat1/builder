#!/usr/bin/env node
/** Live smoke test: rynell-style 2-image site render against the deployed worker. */
import { readFileSync, writeFileSync } from 'node:fs';
import { sitePrompt } from '../../workers/render.js';

const WORKER = process.env.VITE_CLOUDFLARE_WORKER_URL
  || 'https://builder-knowledge.thomasrynell.workers.dev';

function dataUrl(path) {
  const bytes = readFileSync(path);
  const b64 = bytes.toString('base64');
  const kind = path.endsWith('.png') ? 'png' : 'jpeg';
  const url = `data:image/${kind};base64,${b64}`;
  if (url.length > 270_000) throw new Error(`too large ${path} ${url.length}`);
  return url;
}

const garden = dataUrl(new URL('./garden.jpg', import.meta.url).pathname);
const house = dataUrl(new URL('./house-plate.jpg', import.meta.url).pathname);

const facts =
  'Must include these attached outdoor parts from the 3D house: a wooden terrace deck on the back with an attached compact natural timber sauna cabin and a round cedar hot tub with flue. Roof: single-slope mono-pitch shed roof (pulpettak). Dark green timber cladding, white trim. Stugan V4 scale.';

const placement = { x: 48, y: 72 };
const facing = 'back';
const houseWidthPercent = 55;
const prompt = sitePrompt(facts, 2, placement, facing, houseWidthPercent);

console.log('worker', WORKER);
console.log('garden bytes', garden.length, 'house bytes', house.length);
console.log('prompt:\n', prompt);

const started = Date.now();
const response = await fetch(`${WORKER.replace(/\/$/, '')}/api/render`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:5173'
  },
  body: JSON.stringify({
    parts: [],
    images: [garden, house],
    facts,
    revision: false,
    originalParts: [],
    scene: {
      mode: 'site',
      placement,
      houseWidthPercent,
      aspectRatio: 768 / 432,
      facing
    }
  })
});

const elapsed = Date.now() - started;
const text = await response.text();
console.log('status', response.status, 'ms', elapsed, 'bodyChars', text.length);

if (!response.ok) {
  console.error(text.slice(0, 800));
  process.exit(1);
}

let data;
try {
  data = JSON.parse(text);
} catch {
  console.error('non-json', text.slice(0, 400));
  process.exit(1);
}

if (typeof data.image !== 'string' || !data.image.startsWith('data:image')) {
  console.error('bad payload keys', Object.keys(data), String(data.error || data.message || '').slice(0, 200));
  process.exit(1);
}

const match = data.image.match(/^data:image\/(\w+);base64,(.+)$/);
const ext = match?.[1] === 'png' ? 'png' : 'jpg';
const out = new URL(`./result-live.${ext}`, import.meta.url).pathname;
writeFileSync(out, Buffer.from(match[2], 'base64'));
writeFileSync(new URL('./result-live.meta.json', import.meta.url).pathname, JSON.stringify({
  status: response.status,
  elapsedMs: elapsed,
  prompt,
  imageBytes: Buffer.from(match[2], 'base64').byteLength,
  imagePath: out
}, null, 2));
console.log('wrote', out);
