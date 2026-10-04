import { knowledgeEntries, type KnowledgeLang } from '../knowledge/hub';

/** Ask the Cloudflare Worker which page fits. Returns null when it cannot choose. */
export async function askKnowledgeWorker(question: string, lang: KnowledgeLang): Promise<string | null> {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL
    || 'https://builder-knowledge.thomasrynell.workers.dev';
  const known = new Set(knowledgeEntries().map((entry) => entry.id));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { entryId?: unknown };
    const entryId = typeof data.entryId === 'string' ? data.entryId : '';
    return known.has(entryId) ? entryId : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
