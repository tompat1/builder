import type { KnowledgeEntry } from './hub';

export interface StoredResource {
  id: string;
  title: string;
  body: string;
  keywords: string[];
  linkLabel: string;
  linkHref: string;
}

let extra: KnowledgeEntry[] = [];

export function addedResources() {
  return extra;
}

export function setAddedResources(rows: StoredResource[]) {
  extra = rows.map(resourceEntry);
}

export function resourceEntry(row: StoredResource): KnowledgeEntry {
  const title = { sv: row.title, en: row.title };
  const body = { sv: row.body, en: row.body };
  const links = row.linkHref
    ? [{ label: { sv: row.linkLabel || row.title, en: row.linkLabel || row.title }, href: row.linkHref }]
    : [];
  return {
    id: row.id,
    keywords: row.keywords,
    title,
    body,
    figure: 'note',
    links
  };
}
