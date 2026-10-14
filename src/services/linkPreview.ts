import { workerBase } from './account';

export interface LinkPreview {
  title: string;
  image: string;
  host: string;
}

/** Ask the worker for the page title and preview picture. In local dev, Vite answers the same path. */
export async function fetchLinkPreview(pageUrl: string): Promise<LinkPreview | null> {
  const base = import.meta.env.DEV ? '' : workerBase();
  try {
    const response = await fetch(`${base}/api/link-preview?url=${encodeURIComponent(pageUrl)}`);
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<LinkPreview>;
    const image = typeof body.image === 'string' && body.image.startsWith('https://') ? body.image : '';
    const title = typeof body.title === 'string' ? body.title.slice(0, 180) : '';
    const host = typeof body.host === 'string' ? body.host.slice(0, 120) : '';
    if (!image && !title) return null;
    return { title, image, host };
  } catch {
    return null;
  }
}
