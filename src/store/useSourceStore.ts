import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sessionToken, workerBase } from '../services/account';

export const useSourceStore = defineStore('sources', () => {
  const items = ref<string[]>([]);

  async function load() {
    try {
      const response = await fetch(`${workerBase()}/api/sources`);
      if (!response.ok) return;
      const data = (await response.json()) as { sources?: string[] };
      items.value = data.sources ?? [];
    } catch {
      /* The list stays empty until the worker answers. */
    }
  }

  async function add(url: string) {
    const response = await fetch(`${workerBase()}/api/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken()}`
      },
      body: JSON.stringify({ url })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
    if (!response.ok || !data.url) throw new Error(data.error || 'bad_link');
    if (!items.value.includes(data.url)) items.value = [...items.value, data.url];
    return data.url;
  }

  async function remove(url: string) {
    const response = await fetch(`${workerBase()}/api/sources?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionToken()}` }
    });
    if (!response.ok) throw new Error('bad_link');
    items.value = items.value.filter((item) => item !== url);
  }

  return { items, load, add, remove };
});
