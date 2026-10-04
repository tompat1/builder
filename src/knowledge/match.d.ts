export const PAGE_KEYWORDS: Record<string, string[]>;

export function fold(value: string): string;

export function rankEntries<T extends { id: string; keywords: string[] }>(
  entries: T[],
  query: string
): { entry: T; score: number }[];
