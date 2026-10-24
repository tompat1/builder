/** Picture from a prompt. The model accepts four reference images. */

const MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const MODEL_IMAGES = 4;
const DATA_URL = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/;
const FIGURE = /\b(?:women|woman|womans|girls?|boys?|lad(?:y|ies)|people|persons?|humans?|couples?|kids?|children|child|bab(?:y|ies)|guys?|bikinis?|swimsuits?|swimwear|lingerie|nudes?|naked|topless|kiss(?:ing|es|ed)?|portraits?|selfies?|sexy|erotic|kvinnor|kvinna|tjejer|tjej|flickor|flicka|pojkar|pojke|killar|kille|personer|människor|människa|barn|bebisar|bebis|männen|mannen|karlar|karl|män|bikini|kyssande|kyssas|kyssar|kysste|kyss|nakna|naken|badkläder|underkläder)\b/i;
const HOUSE_ONLY = 'Show only the house. No people, faces, bodies, or animals.';
const NO_FIGURES = 'Do not add people, faces, bodies, vehicles, or animals.';
const PICTURE_PARTS = ['door', 'window', 'roof', 'stair', 'colour', 'wall', 'cladding', 'loft', 'terrace', 'gate', 'corner', 'canopy'];
const PART_WORD = {
  door: 'door',
  window: 'window',
  roof: 'roof',
  stair: 'stair',
  colour: 'colour',
  wall: 'wall',
  cladding: 'cladding',
  loft: 'loft',
  terrace: 'terrace',
  gate: 'gate',
  corner: 'corner boards',
  canopy: 'door canopy'
};

/** Keep only the house parts the picture is allowed to change. */
export function acceptPictureParts(input) {
  if (!Array.isArray(input)) return [];
  const seen = [];
  for (const item of input) {
    const id = String(item ?? '').trim().toLowerCase();
    if (!PICTURE_PARTS.includes(id) || seen.includes(id)) continue;
    seen.push(id);
  }
  return seen;
}

export function partChange(input) {
  const words = acceptPictureParts(input).map((id) => PART_WORD[id]);
  if (!words.length) return '';
  const list = words.length === 1 ? words[0] : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
  return `Change the rendered ${list} to make the house look like the uploaded reference images.`;
}

/** Keep roof, colour, and material wording. Drop any clause that asks for a person. */
export function houseWording(prompt) {
  const idea = String(prompt ?? '').replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!idea || !FIGURE.test(idea)) return idea;
  const kept = idea
    .split(/\s*(?:,|;|\.|\band\b|\boch\b|\bwith\b|\bmed\b|\bplus\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part && !FIGURE.test(part));
  const wording = kept.join(', ').replace(/\s+/g, ' ').trim();
  if (!wording || FIGURE.test(wording)) return '';
  return wording;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

export function renderPrompt(prompt, facts, imageCount) {
  const raw = String(prompt ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const idea = houseWording(raw);
  const note = String(facts ?? '').replace(/\s+/g, ' ').trim().slice(0, 360);
  const parts = [
    'Photoreal exterior of a small Swedish timber house, standing on a lawn, daylight.'
  ];
  if (note) parts.push(`Build facts: ${note}`);
  if (idea) parts.push(idea);
  if (imageCount > 0) parts.push('Follow the uploaded photos and sketches for the house only.');
  parts.push('If the sentence names a roof shape, a colour, or a material, follow the sentence.');
  parts.push(HOUSE_ONLY);
  return parts.join(' ');
}

const SITE_FACINGS = {
  front: 'front facade',
  back: 'rear facade',
  left: 'left-side facade',
  right: 'right-side facade'
};

export function acceptPlacement(input) {
  const record = input && typeof input === 'object' ? input : {};
  const clamp = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(5, Math.min(95, Math.round(number))) : fallback;
  };
  return { x: clamp(record.x, 50), y: clamp(record.y, 68) };
}

export function acceptHouseWidthPercent(input) {
  const width = Number(input);
  return Number.isFinite(width) ? Math.max(20, Math.min(90, Math.round(width))) : 55;
}

/** The side of the house the photograph was taken from. */
export function acceptFacing(input) {
  const value = String(input ?? '').trim().toLowerCase();
  return Object.hasOwn(SITE_FACINGS, value) ? value : 'front';
}

/**
 * Rynell-studio style edit: image 0 = garden scene to edit, image 1 = exact
 * configured house reference. Natural prompt language works better with Flux.2.
 */
export function sitePrompt(facts, imageCount, placement, facing, houseWidthPercent) {
  if (imageCount < 2) return '';
  const point = acceptPlacement(placement);
  const width = acceptHouseWidthPercent(houseWidthPercent);
  const side = acceptFacing(facing);
  const facade = SITE_FACINGS[side];
  const note = String(facts ?? '').replace(/\s+/g, ' ').trim().slice(0, 700);

  let roofBit = 'exact roof from the house reference';
  if (/\b(?:mono-pitch|single-slope|shed|pulpettak|lean-to)\b/i.test(note)) {
    roofBit = 'single-slope mono-pitch shed roof (pulpettak), not a gable';
  } else if (/\b(?:flat roof|flackt|parapet)\b/i.test(note)) {
    roofBit = 'modern flat roof, not a gable';
  } else if (/\b(?:gable|sadeltak)\b/i.test(note)) {
    roofBit = 'dual-pitch gable roof with a central ridge';
  }

  return [
    `Photoreal outdoor photograph of this garden with the exact Scandinavian timber house from the reference standing in place, viewed from the ${side} toward its ${facade}.`,
    'Image 0 is the placement draft already showing the house in the garden — keep that silhouette, scale, and layout. Image 1 is the clean house reference for materials and attached parts.',
    'Perfect ground contact, coherent realistic daylight, colour temperature, and contact shadows.',
    `Preserve the house architecture exactly: ${roofBit}, cladding, windows, doors, wooden terrace, sauna cabin, hot tub, and flue — same proportions and layout as the draft and reference. Do not invent extra buildings.`,
    `Keep ground contact around ${point.x}% from the left and ${point.y}% from the top, about ${width}% of the image width.`,
    'Completely replace any old shed. Keep garden plants, fences, paths, neighbouring buildings, and sky.',
    'No CAD look, no grey studio floor, no grid, no floating card, no hard rectangular cutout around the house.',
    note ? `House facts: ${note}` : '',
    NO_FIGURES
  ].filter(Boolean).join(' ');
}

/** Photoreal product render driven only by captures of the configured 3D house. */
export function housePrompt(facts, imageCount, facing) {
  if (imageCount < 2) return '';
  const side = acceptFacing(facing);
  const facade = SITE_FACINGS[side];
  const note = String(facts ?? '').replace(/\s+/g, ' ').trim().slice(0, 900);
  return [
    'Create a photoreal architectural product render of only the configured house.',
    `Image 0 is the authoritative ${facade} view of the exact live 3D model. Preserve its silhouette, height-to-width ratio, roofline, wall positions, openings, attached structures, and camera angle exactly.`,
    'Image 1 is the authoritative elevated overview of that same model. Use it to preserve the complete roof, terrace decks, sauna or shed, hot tub, flues, and every attachment on the correct side.',
    'Convert the simple 3D materials into believable real construction materials, but do not redesign or reinterpret any geometry.',
    'Do not add, remove, move, shrink, enlarge, rotate, simplify, or duplicate any floor, roof, room, wall, door, window, deck, railing, tub, chimney, stair, canopy, or outbuilding.',
    'Show the complete house without cropping, isolated on a seamless neutral light-grey background with a minimal ground plane and soft daylight contact shadow.',
    'No garden, neighbouring buildings, landscaping, trees, plants, furniture, vehicles, signs, text, people, or animals.',
    note ? `Configured house facts: ${note}` : '',
    NO_FIGURES
  ].filter(Boolean).join(' ');
}

export function renderSizeForAspect(input) {
  const ratio = Number(input);
  const aspect = Number.isFinite(ratio) ? Math.max(0.6, Math.min(2, ratio)) : 4 / 3;
  const multiple = (value) => Math.max(512, Math.round(value / 32) * 32);
  if (aspect >= 1) return { width: 1024, height: multiple(1024 / aspect) };
  return { width: multiple(1024 * aspect), height: 1024 };
}

/** A follow-up instruction edits the previous picture. Image 0 is that picture. */
export function revisePrompt(change, original) {
  const raw = String(change ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const fix = houseWording(raw) || (FIGURE.test(raw) ? 'Show only the house.' : '');
  if (!fix) return '';
  const idea = houseWording(original).slice(0, 400);
  return [
    'Revise image 0, which is the previous picture of the house.',
    'Keep the house and every architectural part this change does not mention.',
    'Where this change disagrees with image 0, follow the change and redraw that part.',
    `Apply this change: ${fix}.`,
    idea ? `The first request was: ${idea}.` : '',
    HOUSE_ONLY
  ].filter(Boolean).join(' ');
}

export function decodeImages(images) {
  if (!Array.isArray(images)) return [];
  const blobs = [];
  for (const item of images.slice(0, MODEL_IMAGES)) {
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
  const change = partChange(body?.parts);
  const site = body?.scene?.mode === 'site';
  const house = body?.scene?.mode === 'house';
  const prompt = site
    ? sitePrompt(body?.facts, images.length, body?.scene?.placement, body?.scene?.facing, body?.scene?.houseWidthPercent)
    : house
      ? housePrompt(body?.facts, images.length, body?.scene?.facing)
    : body?.revision
      ? revisePrompt(change, partChange(body?.originalParts))
      : renderPrompt(change, body?.facts, images.length);
  if (!prompt) return json({ error: 'render' }, 400, headers);

  // Match rynell-studio: square 1024 edits are the reliable Flux.2 path.
  const size = site
    ? { width: 1024, height: 1024 }
    : house
      ? { width: 1024, height: 1024 }
      : renderSizeForAspect(body?.scene?.aspectRatio);

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(size.width));
  form.append('height', String(size.height));
  images.forEach((blob, index) => {
    const type = blob.type || 'image/png';
    const ext = type.includes('png') ? 'png' : 'jpg';
    form.append(`input_image_${index}`, blob, `ref-${index}.${ext}`);
  });
  const formResponse = new Response(form);

  try {
    const result = await env.AI.run(MODEL, {
      multipart: {
        body: formResponse.body,
        contentType: formResponse.headers.get('content-type')
      }
    });
    // rynell-studio: Flux.2 often returns { image: "<base64>" } directly.
    if (result && typeof result === 'object' && typeof result.image === 'string' && result.image.length > 32) {
      const raw = result.image.startsWith('data:image')
        ? result.image
        : `data:image/png;base64,${result.image}`;
      return json({ image: raw }, 200, headers);
    }
    const bytes = await pictureBytes(result);
    if (!bytes || bytes.length < 32) {
      console.error(`render empty ${shape(result)}`);
      return json({ error: 'render' }, 502, headers);
    }
    return json({ image: `data:${mime(bytes)};base64,${bytesToBase64(bytes)}` }, 200, headers);
  } catch (error) {
    console.error(`render fail ${safe(error)}`);
    return json({ error: 'render' }, 502, headers);
  }
}

function shape(result) {
  if (result == null) return 'null';
  if (typeof result === 'string') return `string ${result.length}`;
  if (result instanceof Uint8Array) return `bytes ${result.length}`;
  if (result instanceof ArrayBuffer) return `buffer ${result.byteLength}`;
  if (typeof Response !== 'undefined' && result instanceof Response) return `response ${result.status}`;
  if (typeof result.getReader === 'function') return 'stream';
  if (typeof result === 'object') return `object ${Object.keys(result).slice(0, 6).join(',')}`;
  return typeof result;
}

function safe(error) {
  return String(error && error.message ? error.message : error || 'unknown')
    .replace(/[0-9a-f]{16,}/gi, '[id]')
    .slice(0, 240);
}
