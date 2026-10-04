import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sessionToken, workerBase } from '../services/account';

export interface ContentEntry {
  kind: 'text' | 'image';
  value: string;
}

export const useContentStore = defineStore('content', () => {
  const editing = ref(false);
  const saving = ref(false);
  const saved = ref<Record<string, ContentEntry>>({});
  const drafts = ref<Record<string, ContentEntry>>({});

  function text(storageKey: string, fallback: string) {
    const draft = drafts.value[storageKey];
    if (draft?.kind === 'text') return draft.value;
    const row = saved.value[storageKey];
    if (row?.kind === 'text') return row.value;
    return fallback;
  }

  function image(storageKey: string) {
    const draft = drafts.value[storageKey];
    if (draft?.kind === 'image') return draft.value;
    const row = saved.value[storageKey];
    if (row?.kind === 'image') return row.value;
    return '';
  }

  function stage(storageKey: string, entry: ContentEntry) {
    drafts.value = { ...drafts.value, [storageKey]: entry };
  }

  async function load() {
    try {
      const response = await fetch(`${workerBase()}/api/content`);
      if (!response.ok) return;
      const data = (await response.json()) as { entries?: Record<string, ContentEntry> };
      saved.value = data.entries ?? {};
    } catch {
      /* The built-in copy stays until the worker answers. */
    }
  }

  async function save() {
    const entries = Object.entries(drafts.value)
      .filter(([key, entry]) => saved.value[key]?.value !== entry.value)
      .map(([storageKey, entry]) => {
        const split = storageKey.indexOf(':');
        return {
          locale: storageKey.slice(0, split),
          key: storageKey.slice(split + 1),
          kind: entry.kind,
          value: entry.value
        };
      });
    if (!entries.length) return;
    saving.value = true;
    try {
      for (let index = 0; index < entries.length; index += 80) {
        const response = await fetch(`${workerBase()}/api/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken()}`
          },
          body: JSON.stringify({ entries: entries.slice(index, index + 80) })
        });
        if (!response.ok) throw new Error('save');
      }
      saved.value = { ...saved.value, ...drafts.value };
      drafts.value = {};
    } finally {
      saving.value = false;
    }
  }

  return { editing, saving, text, image, stage, load, save };
});
