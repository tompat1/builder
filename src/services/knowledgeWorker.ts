import { allKnowledgeEntries, type KnowledgeLang } from '../knowledge/hub';

export interface RetrievedPassage {
  title: string;
  url: string;
  text: string;
}

export interface WebSource {
  title: string;
  url: string;
}

export interface WebAnswer {
  answer: string;
  sources: WebSource[];
}

function passagesFrom(value: unknown): RetrievedPassage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as { title?: unknown; url?: unknown; text?: unknown };
    const title = typeof row.title === 'string' ? row.title.trim().slice(0, 160) : '';
    const text = typeof row.text === 'string' ? row.text.trim().slice(0, 700) : '';
    const url = typeof row.url === 'string' && /^https:\/\//i.test(row.url) ? row.url.slice(0, 2000) : '';
    if (!title || !text) return [];
    return [{ title, url, text }];
  }).slice(0, 4);
}

function webFrom(value: unknown): WebAnswer | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as { answer?: unknown; sources?: unknown };
  const answer = typeof row.answer === 'string' ? row.answer.replace(/\s+/g, ' ').trim() : '';
  if (answer.length < 20 || answer.length > 600) return null;
  const sources = Array.isArray(row.sources)
    ? row.sources.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const source = item as { title?: unknown; url?: unknown };
      const title = typeof source.title === 'string' ? source.title.trim().slice(0, 160) : '';
      const url = typeof source.url === 'string' && /^https:\/\//i.test(source.url) ? source.url.slice(0, 2000) : '';
      if (!title || !url) return [];
      return [{ title, url }];
    }).slice(0, 4)
    : [];
  return { answer, sources };
}

/** Ask the worker which page fits, which stored passages are close, and, when nothing fits, what the web says. */
export async function askKnowledgeWorker(
  question: string,
  lang: KnowledgeLang
): Promise<{ entryId: string | null; passages: RetrievedPassage[]; web: WebAnswer | null }> {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL
    || 'https://builder-knowledge.thomasrynell.workers.dev';
  const known = new Set(allKnowledgeEntries().map((entry) => entry.id));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang }),
      signal: controller.signal
    });
    if (!response.ok) return { entryId: null, passages: [], web: null };
    const data = (await response.json()) as { entryId?: unknown; passages?: unknown; web?: unknown };
    const entryId = typeof data.entryId === 'string' ? data.entryId : '';
    return {
      entryId: known.has(entryId) ? entryId : null,
      passages: passagesFrom(data.passages),
      web: webFrom(data.web)
    };
  } catch {
    return { entryId: null, passages: [], web: null };
  } finally {
    clearTimeout(timer);
  }
}
