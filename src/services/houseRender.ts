/** Ask the worker for a picture. The 3D house is left alone. */

export async function requestHousePicture(
  prompt: string,
  images: string[],
  facts: string,
  revision?: { original: string }
): Promise<string> {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL
    || 'https://builder-knowledge.thomasrynell.workers.dev';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        images,
        facts,
        revision: Boolean(revision),
        original: revision?.original ?? ''
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('render');
    const data = (await response.json()) as { image?: unknown };
    if (typeof data.image !== 'string' || !data.image.startsWith('data:image')) throw new Error('render');
    return data.image;
  } finally {
    clearTimeout(timer);
  }
}
