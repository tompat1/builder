/** Picture from a prompt and up to four reference images. The result is a picture. */

const MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const DATA_URL = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

export function renderPrompt(prompt, facts, imageCount) {
  const idea = String(prompt ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!idea) return '';
  const note = String(facts ?? '').replace(/\s+/g, ' ').trim().slice(0, 360);
  const parts = [
    'Photoreal exterior of a small Swedish timber house, standing on a lawn, daylight.',
    idea
  ];
  if (note) parts.push(`Build facts: ${note}`);
  if (imageCount > 0) parts.push('Follow the uploaded photos and sketches.');
  return parts.join(' ');
}

export function decodeImages(images) {
  if (!Array.isArray(images)) return [];
  const blobs = [];
  for (const item of images.slice(0, 4)) {
    if (typeof item !== 'string' || item.length > 280000) continue;
    const match = item.match(DATA_URL);
    if (!match) continue;
    const raw = atob(match[2].replace(/\s/g, ''));
    if (raw.length < 32 || raw.length > 200000) continue;
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    const type = match[1] === 'jpg' ? 'jpeg' : match[1];
    blobs.push(new Blob([bytes], { type: `image/${type}` }));
  }
  return blobs;
}

function bytesToBase64(bytes) {
  let binary = '';
  const size = 0x4000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return btoa(binary);
}

function mime(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  return 'image/jpeg';
}

async function readStream(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function asBytes(result) {
  if (!result) return null;
  if (result instanceof Uint8Array) return result;
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (typeof result === 'string') {
    const payload = result.startsWith('data:image') ? result.slice(result.indexOf(',') + 1) : result;
    const raw = atob(payload);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return bytes;
  }
  if (typeof Response !== 'undefined' && result instanceof Response) {
    return new Uint8Array(await result.arrayBuffer());
  }
  if (typeof result.getReader === 'function') return readStream(result);
  if (result.image) return asBytes(result.image);
  return null;
}

async function pictureBytes(result) {
  const bytes = await asBytes(result);
  if (!bytes || bytes[0] !== 0x7b) return bytes;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed.image ? asBytes(parsed.image) : bytes;
  } catch {
    return bytes;
  }
}

export async function handleRender(request, env, headers) {
  if (request.method !== 'POST') return json({ error: 'render' }, 405, headers);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'render' }, 400, headers);
  }

  const images = decodeImages(body?.images);
  const prompt = renderPrompt(body?.prompt, body?.facts, images.length);
  if (!prompt) return json({ error: 'render' }, 400, headers);

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', '1024');
  form.append('height', '768');
  images.forEach((blob, index) => {
    form.append(`input_image_${index}`, blob, `ref-${index}.jpg`);
  });
  const formResponse = new Response(form);

  try {
    const result = await env.AI.run(MODEL, {
      multipart: {
        body: formResponse.body,
        contentType: formResponse.headers.get('content-type')
      }
    });
    const bytes = await pictureBytes(result);
    if (!bytes || bytes.length < 32) return json({ error: 'render' }, 502, headers);
    return json({ image: `data:${mime(bytes)};base64,${bytesToBase64(bytes)}` }, 200, headers);
  } catch {
    return json({ error: 'render' }, 502, headers);
  }
}
