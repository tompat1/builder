/** Short passages for retrieval. Embeddings come later; words find a passage until then. */

const CHUNK = 700;
const OVERLAP = 80;
const CHUNK_LIMIT = 24;
const TEXT_LIMIT = 20_000;
const TRACKING = /^(utm_|gad_|gclid$|gbraid$|wbraid$|fbclid$|mc_|cam$)/i;

export function canonicalSourceUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname) return '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING.test(key)) parsed.searchParams.delete(key);
  }
  parsed.hash = '';
  return parsed.href;
}

export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|footer|header|aside|form)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const point = Number(code);
      return point > 31 && point < 65536 ? String.fromCharCode(point) : ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageTitle(html, fallback) {
  const match = String(html ?? '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = htmlToText(match?.[1] || fallback || '').slice(0, 160);
  return title || String(fallback || '').slice(0, 160);
}

/** Break a page into overlapping passages, on a sentence when one is near. */
export function chunkText(value) {
  const clean = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, TEXT_LIMIT);
  if (clean.length < 24) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length && chunks.length < CHUNK_LIMIT) {
    let end = Math.min(clean.length, start + CHUNK);
    if (end < clean.length) {
      const sentence = clean.lastIndexOf('. ', end);
      if (sentence > start + CHUNK * 0.5) end = sentence + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece.length >= 24) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - OVERLAP, start + 1);
  }
  return chunks;
}

function fold(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9° ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function rankPassages(passages, query) {
  const terms = fold(query).split(' ').filter((term) => term.length > 2);
  if (!terms.length) return [];
  const ranked = passages
    .map((passage) => {
      const hay = fold(`${passage.title} ${passage.text}`);
      const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? term.length : 0), 0);
      return { ...passage, score };
    })
    .filter((passage) => passage.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const picked = [];
  const seen = new Set();
  for (const passage of ranked) {
    const key = passage.url || passage.title;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(passage);
    if (picked.length === 4) break;
  }
  return picked.map(({ title, url, text }) => ({ title, url, text }));
}

function passageId(kind, sourceId, position) {
  let hash = 5381;
  const raw = `${kind}|${sourceId}|${position}`;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) + hash + raw.charCodeAt(index)) >>> 0;
  }
  return `pas_${hash.toString(16)}_${position}`;
}

export async function replacePassages(env, document) {
  if (!env.DB) return;
  const chunks = chunkText(document.text);
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare('DELETE FROM passages WHERE source_kind = ? AND source_id = ?').bind(document.kind, document.sourceId)
  ];
  chunks.forEach((text, position) => {
    statements.push(env.DB.prepare(
      `INSERT INTO passages (id, source_kind, source_id, url, title, position, text, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      passageId(document.kind, document.sourceId, position),
      document.kind,
      document.sourceId,
      String(document.url || '').slice(0, 2000),
      String(document.title || document.url || '').slice(0, 160),
      position,
      text,
      now
    ));
  });
  await env.DB.batch(statements);
}

export async function deletePassages(env, kind, sourceId) {
  if (!env.DB) return;
  await env.DB.prepare('DELETE FROM passages WHERE source_kind = ? AND source_id = ?').bind(kind, sourceId).run();
}

export async function searchPassages(env, query) {
  if (!env.DB) return [];
  const result = await env.DB.prepare(
    'SELECT title, url, text FROM passages ORDER BY fetched_at DESC LIMIT 400'
  ).all();
  return rankPassages(result.results ?? [], query);
}

let catalogReady = false;

export async function indexCatalog(env, pages) {
  if (!env.DB || catalogReady) return;
  for (const page of pages) {
    await replacePassages(env, {
      kind: 'page',
      sourceId: page.id,
      url: '',
      title: page.title,
      text: `${page.title}. ${page.summary}`
    });
  }
  catalogReady = true;
}

export function resetCatalogIndex() {
  catalogReady = false;
}

export async function indexResource(env, resource) {
  const text = [resource.title, ...(resource.keywords || []), resource.body].filter(Boolean).join('. ');
  await replacePassages(env, {
    kind: 'resource',
    sourceId: resource.id,
    url: resource.linkHref || '',
    title: resource.title,
    text
  });
}

function stubText(url) {
  const parsed = new URL(url);
  const path = decodeURIComponent(parsed.pathname).replace(/[-_/]+/g, ' ').trim();
  const line = `${parsed.hostname} ${path}`.replace(/\s+/g, ' ').trim();
  return `${line}. Referenssida sparad för husfrågor.`;
}

export async function readHtmlPage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,text/plain;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return null;
  const type = response.headers.get('content-type') || '';
  if (!/text\/html|text\/plain/.test(type)) return null;
  const html = (await response.text()).slice(0, 400_000);
  const text = htmlToText(html).slice(0, TEXT_LIMIT);
  if (text.length < 24) return null;
  return { title: pageTitle(html, url), text };
}

export async function indexExternalPage(env, storedUrl) {
  const clean = canonicalSourceUrl(storedUrl) || storedUrl;
  const fallback = stubText(clean);
  await replacePassages(env, {
    kind: 'source',
    sourceId: storedUrl,
    url: clean,
    title: fallback,
    text: fallback
  });
  let page = null;
  try {
    page = await readHtmlPage(clean);
  } catch {
    page = null;
  }
  if (!page || /just a moment/i.test(page.title)) return false;
  await replacePassages(env, {
    kind: 'source',
    sourceId: storedUrl,
    url: clean,
    title: page.title,
    text: page.text
  });
  return true;
}

/** Admin pages already saved become passages without another visit to the form. */
export async function indexPendingResources(env) {
  if (!env.DB) return 0;
  const rows = await env.DB.prepare(
    'SELECT id, title, body, keywords, link_href FROM resources'
  ).all();
  let indexed = 0;
  for (const row of rows.results ?? []) {
    const have = await env.DB.prepare(
      'SELECT id FROM passages WHERE source_kind = ? AND source_id = ? LIMIT 1'
    ).bind('resource', row.id).first();
    if (have) continue;
    let keywords = [];
    try {
      const parsed = JSON.parse(row.keywords);
      if (Array.isArray(parsed)) keywords = parsed.map((item) => String(item));
    } catch {
      keywords = [];
    }
    await indexResource(env, {
      id: row.id,
      title: row.title,
      body: row.body,
      keywords,
      linkHref: row.link_href || ''
    });
    indexed += 1;
  }
  return indexed;
}

/** Read reference sites that have no passages yet. A few per call, so a request stays short. */
export async function indexPendingSources(env, limit = 2) {
  if (!env.DB) return 0;
  const rows = await env.DB.prepare('SELECT url FROM sources ORDER BY created_at').all();
  let fetched = 0;
  for (const row of rows.results ?? []) {
    const have = await env.DB.prepare(
      'SELECT id FROM passages WHERE source_kind = ? AND source_id = ? LIMIT 1'
    ).bind('source', row.url).first();
    if (have) continue;
    await indexExternalPage(env, row.url);
    fetched += 1;
    if (fetched >= limit) break;
  }
  return fetched;
}
