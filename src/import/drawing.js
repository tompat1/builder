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
  const gable = text.includes('sadel') || text.includes('gable');
  const extra = text.includes('extra takhöjd') || text.includes('extra takhojd') || text.includes('14°') || text.includes('14 grader');
  if (gable && extra) return 'sadeltak14';
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

  const footprint = footprintFromArea(folded);
  if (footprint) {
    if (width == null) width = fit('width', footprint.width);
    if (depth == null) depth = fit('depth', footprint.depth);
    if (height == null && footprint.height != null) height = fit('height', footprint.height);
  }

  const notes = folded
    .split('\n')
    .filter((line) => !(line.includes('=') && /fonster|dorr|ventil|balk/.test(line)))
    .join('\n');

  return {
    width,
    depth,
    height,
    roof: roofOf(notes),
    covering: coveringOf(notes),
    door: doorOf(notes),
    window: windowOf(notes)
  };
}

function footprintFromArea(text) {
  const areaMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*m(?:2|²)/);
  if (!areaMatch) return null;
  const area = Number(areaMatch[1].replace(',', '.'));
  if (!(area > 0)) return null;
  const counts = new Map();
  for (const match of text.matchAll(/(?:^|[^\d])(\d{4,5})(?=[^\d]|$)/gm)) {
    const value = Number(match[1]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const values = [...counts.keys()];
  let best = null;
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      const gap = Math.abs((values[i] * values[j]) / 1e6 - area);
      if (gap <= 0.15 && (best == null || gap < best.gap)) {
        best = { a: values[i], b: values[j], gap };
      }
    }
  }
  if (!best) return null;
  const width = Math.max(best.a, best.b);
  const depth = Math.min(best.a, best.b);
  const heights = [];
  for (const [value, count] of counts) {
    if (fit('height', value) !== value) continue;
    const planSide = value === width || value === depth;
    if (planSide && count < 2) continue;
    heights.push(value);
  }
  return { width, depth, height: heights.length ? Math.max(...heights) : null };
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

function isImageDict(dict) {
  return /DCTDecode|JPXDecode|\/Subtype\s*\/Image/.test(dict);
}

function isFont(bytes) {
  if (bytes.length < 4) return false;
  const head = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  return head === 'OTTO' || head === 'true' || (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0);
}

async function walkStreams(data, visit) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const streamMark = new TextEncoder().encode('stream');
  const endMark = new TextEncoder().encode('endstream');
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
    const payload = trimStream(bytes.subarray(dataStart, end));
    await visit(dict, payload);
    cursor = end + endMark.length;
  }
}

function findObject(latin, id) {
  const needle = `${id} 0 obj`;
  let at = 0;
  while ((at = latin.indexOf(needle, at)) >= 0) {
    if (at === 0 || !/\d/.test(latin[at - 1])) return at;
    at += needle.length;
  }
  return -1;
}

async function objectText(latin, bytes, id) {
  const at = findObject(latin, id);
  if (at < 0) return '';
  const end = latin.indexOf('endobj', at);
  if (end < 0) return '';
  const slice = latin.slice(at, end);
  const mark = /stream\r?\n/.exec(slice);
  if (!mark) return slice;
  const start = at + mark.index + mark[0].length;
  const stop = latin.indexOf('endstream', start);
  if (stop < 0) return '';
  let raw = bytes.subarray(start, stop);
  if (slice.includes('FlateDecode')) {
    try {
      raw = await inflate(raw);
    } catch {
      return '';
    }
  }
  return new TextDecoder('latin1').decode(raw);
}

function parseCMap(text) {
  const map = new Map();
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const line of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(line[1], 16), String.fromCodePoint(parseInt(line[2], 16)));
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const line of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      let code = parseInt(line[3], 16);
      for (let cid = parseInt(line[1], 16); cid <= parseInt(line[2], 16); cid += 1) {
        map.set(cid, String.fromCodePoint(code));
        code += 1;
      }
    }
  }
  return map;
}

async function fontEncodings(latin, bytes) {
  const fonts = new Map();
  for (const block of latin.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
    for (const ref of block[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
      const font = await objectText(latin, bytes, ref[2]);
      const unicode = font.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (!unicode) continue;
      fonts.set(ref[1], parseCMap(await objectText(latin, bytes, unicode[1])));
    }
  }
  return fonts;
}

function decodeHex(hex, map) {
  const width = hex.length % 4 === 0 ? 4 : 2;
  let text = '';
  for (let index = 0; index < hex.length; index += width) {
    text += map.get(parseInt(hex.slice(index, index + width), 16)) ?? '';
  }
  return text;
}

function shownText(decoded, fonts) {
  if (!fonts.size) return '';
  const content = new TextDecoder('latin1').decode(decoded);
  if (!content.includes('TJ') && !content.includes('Tj')) return '';
  let font = fonts.keys().next().value;
  const parts = [];
  const pattern = /\/(F\d+)\s+[\d.]+\s+Tf|\[([\s\S]*?)\]\s*TJ|<([0-9A-Fa-f]+)>\s*Tj/g;
  for (const match of content.matchAll(pattern)) {
    if (match[1]) {
      font = match[1];
      continue;
    }
    const map = fonts.get(font);
    if (!map) continue;
    const hex = match[2] == null
      ? match[3]
      : [...match[2].matchAll(/<([0-9A-Fa-f]+)>/g)].map((item) => item[1]).join('');
    const text = decodeHex(hex, map).trim();
    if (text) parts.push(text);
  }
  return parts.join('\n');
}

/** Pull literal strings out of a PDF, including FlateDecode streams. Pictures are left out. */
export async function extractPdfText(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const latin = new TextDecoder('latin1').decode(bytes);
  const fonts = await fontEncodings(latin, bytes);
  const chunks = [];
  await walkStreams(bytes, async (dict, payload) => {
    if (isImageDict(dict)) return;
    let decoded = payload;
    if (dict.includes('FlateDecode')) {
      try {
        decoded = await inflate(decoded);
      } catch {
        return;
      }
    }
    if (isFont(decoded)) return;
    chunks.push(stringsFrom(decoded));
    chunks.push(shownText(decoded, fonts));
  });
  return chunks.join('\n').trim().slice(0, 20000);
}

/** JPEG pictures embedded in a drawing. The sheet may have no typed text. */
export function extractPdfImages(data, limit = 8) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const streamMark = new TextEncoder().encode('stream');
  const endMark = new TextEncoder().encode('endstream');
  const images = [];
  let cursor = 0;
  while (cursor < bytes.length && images.length < limit) {
    const start = findBytes(bytes, streamMark, cursor);
    if (start < 0) break;
    let dataStart = start + streamMark.length;
    if (bytes[dataStart] === 13) dataStart += 1;
    if (bytes[dataStart] === 10) dataStart += 1;
    const end = findBytes(bytes, endMark, dataStart);
    if (end < 0) break;
    const dict = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, start - 800), start));
    const payload = trimStream(bytes.subarray(dataStart, end));
    if (dict.includes('DCTDecode') && payload.length > 1000 && payload.length < 800000 && payload[0] === 0xff) {
      images.push(payload.slice());
    }
    cursor = end + endMark.length;
  }
  return images;
}
