export interface PagePreview {
  title: string;
  image: string;
  host: string;
}

export function safePreviewUrl(raw: string): string | null;

export function readPagePreview(html: string, pageUrl: string): PagePreview;

export function fetchPagePreview(raw: string): Promise<PagePreview | null>;

export function handleLinkPreview(request: Request, headers: Record<string, string>): Promise<Response>;
