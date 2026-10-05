import { allKnowledgeEntries, type KnowledgeLang } from '../knowledge/hub';

export interface RetrievedPassage {
  title: string;
  url: string;
  text: string;
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

/** Ask the worker which page fits, and which stored passages are close. */
export async function askKnowledgeWorker(
  question: string,
  lang: KnowledgeLang
): Promise<{ entryId: string | null; passages: RetrievedPassage[] }> {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL
    || 'https://builder-knowledge.thomasrynell.workers.dev';
  const known = new Set(allKnowledgeEntries().map((entry) => entry.id));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang }),
      signal: controller.signal
    });
    if (!response.ok) return { entryId: null, passages: [] };
    const data = (await response.json()) as { entryId?: unknown; passages?: unknown };
    const entryId = typeof data.entryId === 'string' ? data.entryId : '';
    return {
      entryId: known.has(entryId) ? entryId : null,
      passages: passagesFrom(data.passages)
    };
  } catch {
    return { entryId: null, passages: [] };
  } finally {
    clearTimeout(timer);
  }
}
