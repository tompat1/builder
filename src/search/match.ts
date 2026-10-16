export interface SearchQueryDoc {
  id: string;
  topic: string;
  title: string;
  hint: string;
  keywords: string;
  lead?: boolean;
  boost?: number;
}

export function fold(value: string) {
  return value
    .toLocaleLowerCase('sv')
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function completionSuffix(title: string, query: string) {
  const typed = query.trim();
  const q = fold(typed);
  if (!q || !fold(title).startsWith(q)) return '';
  return title.slice(typed.length);
}

export function matchSearch<T extends SearchQueryDoc>(docs: T[], query: string, topic: string, limit = 12) {
  const q = fold(query.trim());
  const words = q.split(/\s+/).filter(Boolean);
  const pool = topic === 'all' ? docs : docs.filter((doc) => doc.topic === topic);
  if (!words.length) {
    const shown = topic === 'all' ? pool.filter((doc) => doc.lead) : pool;
    return shown.slice(0, limit);
  }
  return pool
    .map((doc) => ({ doc, score: scoreDoc(doc, q, words) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title, 'sv'))
    .slice(0, limit)
    .map((row) => row.doc);
}

function scoreDoc(doc: SearchQueryDoc, query: string, words: string[]) {
  const title = fold(doc.title);
  const hint = fold(doc.hint);
  const keys = fold(doc.keywords);
  const hay = `${title} ${hint} ${keys}`;
  if (!words.every((word) => hay.includes(word))) return 0;
  let score = (doc.boost ?? 0) + (doc.lead ? 4 : 0);
  if (title === query) score += 200;
  else if (title.startsWith(query)) score += 140;
  else if (title.split(/\s+/).some((word) => word.startsWith(query))) score += 110;
  else if (title.includes(query)) score += 80;
  if (keys.includes(query)) score += 50;
  if (hint.includes(query)) score += 24;
  for (const word of words) {
    if (title.startsWith(word)) score += 16;
    else if (title.includes(word)) score += 8;
    else if (keys.includes(word)) score += 4;
  }
  return score;
}
