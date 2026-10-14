/** Read a public page's title and preview picture. The page body is never returned. */

const PRIVATE_HOST = /^(localhost|.*\.localhost|.*\.local|metadata\.google\.internal)$/i;

export function safePreviewUrl(raw) {
  const text = String(raw ?? '').trim();
  if (!text || text.length > 2000) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (blockedHost(url.hostname)) return null;
  return url.href;
}

export function readPagePreview(html, pageUrl) {
  const page = safePreviewUrl(pageUrl);
  if (!page) return { title: '', image: '', host: '' };
  const source = String(html ?? '').slice(0, 500_000);
  const title = decode(metaContent(source, 'og:title') || metaContent(source, 'twitter:title') || tagText(source, 'title')).slice(0, 180);
  const imageRaw = metaContent(source, 'og:image') || metaContent(source, 'twitter:image') || metaContent(source, 'twitter:image:src');
  const image = absoluteHttps(imageRaw, page);
  return { title, image, host: hostOf(page) };
}

export async function fetchPagePreview(raw) {
  let current = safePreviewUrl(raw);
  if (!current) return null;
  for (let hop = 0; hop < 4; hop += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'BuilderMood/1.0'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (response.status >= 300 && response.status < 400) {
      const next = safePreviewUrl(new URL(response.headers.get('location') || '', current).href);
      if (!next) return null;
      current = next;
      continue;
    }
    if (!response.ok) return null;
    const type = response.headers.get('content-type') || '';
    if (!/html|xml/i.test(type)) return null;
    const html = await readBounded(response, 400_000);
    return readPagePreview(html, response.url || current);
  }
  return null;
}

export function handleLinkPreview(request, headers) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/link-preview' || request.method !== 'GET') {
    return json({ error: 'Not found' }, 404, headers);
  }
  const target = url.searchParams.get('url') || '';
  return fetchPagePreview(target)
    .then((preview) => json(preview || { title: '', image: '', host: '' }, preview ? 200 : 400, headers))
    .catch(() => json({ title: '', image: '', host: '' }, 502, headers));
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function blockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.+$/, '');
  if (PRIVATE_HOST.test(host)) return true;
  const bare = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  if (bare === '::1' || bare.startsWith('fe80:') || bare.startsWith('fc') || bare.startsWith('fd')) return true;
  const parts = bare.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const wanted = key.toLowerCase();
  for (const tag of tags) {
    const named = attr(tag, 'property') || attr(tag, 'name');
    if (named.toLowerCase() !== wanted) continue;
    const content = attr(tag, 'content');
    if (content) return content;
  }
  return '';
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return '';
  return decode(match[2] ?? match[3] ?? match[4] ?? '');
}

function tagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([^<]{1,300})</${tag}>`, 'i'));
  return match ? decode(match[1]) : '';
}

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteHttps(raw, base) {
  if (!raw) return '';
  try {
    const url = new URL(raw, base);
    if (url.protocol !== 'https:' || blockedHost(url.hostname)) return '';
    return url.href.slice(0, 2000);
  } catch {
    return '';
  }
}

function hostOf(page) {
  try {
    return new URL(page).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function readBounded(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (size < limit) {
    const step = await reader.read();
    if (step.done) break;
    size += step.value.byteLength;
    chunks.push(step.value);
  }
  await reader.cancel().catch(() => {});
  const bytes = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, bytes.length - offset);
    bytes.set(slice, offset);
    offset += slice.length;
    if (offset >= bytes.length) break;
  }
  return new TextDecoder().decode(bytes);
}
