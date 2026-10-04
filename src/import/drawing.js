/** Read measurements out of a drawing. The house stays a rectangle. */

const LIMITS = {
  width: [3600, 12000],
  depth: [2500, 10000],
  height: [2400, 5000]
};

function fold(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o');
}

function fit(axis, value) {
  if (value == null || !Number.isFinite(value)) return null;
  const [min, max] = LIMITS[axis];
  if (value < min * 0.75 || value > max * 1.35) return null;
  return Math.round(Math.min(max, Math.max(min, value)));
}

function labeled(text, labels) {
  const name = labels.join('|');
  const mm = text.match(new RegExp(`(?:${name})[^\\d]{0,24}(\\d{3,5})\\s*mm`, 'i'));
  if (mm) return Number(mm[1]);
  const meters = text.match(new RegExp(`(?:${name})[^\\d]{0,24}(\\d{1,2})[.,](\\d{1,3})\\s*m(?!m)`, 'i'));
  if (meters) return Math.round(Number(`${meters[1]}.${meters[2]}`) * 1000);
  const whole = text.match(new RegExp(`(?:${name})[^\\d]{0,24}(\\d{1,2})\\s*m(?!m|2)`, 'i'));
  if (whole) return Number(whole[1]) * 1000;
  const after = text.match(new RegExp(`(\\d{3,5})\\s*mm[^\\d\\n]{0,16}(?:${name})`, 'i'));
  return after ? Number(after[1]) : null;
}

function numberOf(raw) {
  const text = String(raw).trim();
  const value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  if (/[.,]/.test(text) && value < 100) return Math.round(value * 1000);
  if (value >= 1000) return Math.round(value);
  return null;
}

function firstWord(text, pairs) {
  const hits = pairs
    .map(([word, id]) => ({ id, at: text.indexOf(word) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at);
  return hits[0]?.id ?? null;
}

function roofOf(text) {
  return firstWord(text, [
    ['pulpet', 'pulpettak'],
    ['sadel', 'sadeltak'],
    ['flackt', 'flackt'],
    ['flat roof', 'flackt'],
    ['plant tak', 'flackt']
  ]);
}

function coveringOf(text) {
  return firstWord(text, [
    ['shingel', 'shingles'],
    ['shingle', 'shingles'],
    ['takpapp', 'felt'],
    ['ytpapp', 'felt'],
    ['roofing felt', 'felt'],
    ['betongpanna', 'tiles'],
    ['takpanna', 'tiles'],
    ['tegel', 'tiles'],
    ['falsad', 'metal'],
    ['takplat', 'metal'],
    ['metal', 'metal']
  ]);
}

function doorOf(text) {
  if (text.includes('svanshall') || text.includes('pardorr')) return 'SVANSHALL';
  if (/(?:^|[^a-z])(?:dorr|door)(?:[^a-z]|$)/.test(text)) return 'STEHAG';
  return null;
}

function windowOf(text) {
  if (text.includes('panorama')) return 'panorama';
  if (text.includes('sprojs')) return 'sprojat';
  if (text.includes('frost')) return 'frost';
  if (text.includes('fonster') || /(?:^|[^a-z])window(?:[^a-z]|$)/.test(text)) return 'standard-single';
  return null;
}

export function readDrawing(text) {
  const folded = fold(text);
  let width = fit('width', labeled(folded, ['bredd', 'width']));
  let depth = fit('depth', labeled(folded, ['langd', 'djup', 'depth', 'length']));
  let height = fit('height', labeled(folded, ['hojd', 'height', 'nockhojd', 'vaghojd']));

  const pair = folded.match(/(\d{1,5}(?:[.,]\d+)?)\s*[x×]\s*(\d{1,5}(?:[.,]\d+)?)/);
  if (pair) {
    if (width == null) width = fit('width', numberOf(pair[1]));
    if (depth == null) depth = fit('depth', numberOf(pair[2]));
  }

  if (height == null) {
    const used = new Set([width, depth].filter((value) => value != null));
    const leftovers = [...folded.matchAll(/(\d{3,5})\s*mm/gi)]
      .map((match) => Number(match[1]))
      .filter((value) => !used.has(value) && fit('height', value) === value);
    if (leftovers.length === 1) height = leftovers[0];
  }

  return {
    width,
    depth,
    height,
    roof: roofOf(folded),
    covering: coveringOf(folded),
    door: doorOf(folded),
    window: windowOf(folded)
  };
}

export function hasMeasures(reading) {
  return reading.width != null || reading.depth != null || reading.height != null;
}

function findBytes(hay, needle, from) {
  outer: for (let index = from; index <= hay.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (hay[index + offset] !== needle[offset]) continue outer;
    }
    return index;
  }
  return -1;
}

function unescapePdf(value) {
  return value
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([()\\])/g, '$1');
}

function stringsFrom(bytes) {
  const text = new TextDecoder('latin1').decode(bytes);
  const found = [];
  const pattern = /\((?:\\[0-7]{1,3}|\\.|[^\\)])*\)/g;
  for (const match of text.matchAll(pattern)) {
    found.push(unescapePdf(match[0].slice(1, -1)));
  }
  return found.join('\n');
}

async function inflate(bytes) {
  if (typeof DecompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const { inflateSync } = await import('node:zlib');
  return inflateSync(bytes);
}

function trimStream(bytes) {
  let end = bytes.length;
  while (end > 0 && (bytes[end - 1] === 10 || bytes[end - 1] === 13 || bytes[end - 1] === 32)) end -= 1;
  return bytes.subarray(0, end);
}

/** Pull literal strings out of a PDF, including FlateDecode streams. */
export async function extractPdfText(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const streamMark = new TextEncoder().encode('stream');
  const endMark = new TextEncoder().encode('endstream');
  const chunks = [];
  let cursor = 0;

  while (cursor < bytes.length) {
    const start = findBytes(bytes, streamMark, cursor);
    if (start < 0) break;
    let dataStart = start + streamMark.length;
    if (bytes[dataStart] === 13) dataStart += 1;
    if (bytes[dataStart] === 10) dataStart += 1;
    const end = findBytes(bytes, endMark, dataStart);
    if (end < 0) break;
    const dict = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, start - 800), start));
    let decoded = trimStream(bytes.subarray(dataStart, end));
    if (dict.includes('FlateDecode')) {
      try {
        decoded = await inflate(decoded);
      } catch {
        decoded = new Uint8Array();
      }
    }
    chunks.push(stringsFrom(decoded));
    cursor = end + endMark.length;
  }

  const text = chunks.join('\n').trim();
  return (text || stringsFrom(bytes)).slice(0, 20000);
}
