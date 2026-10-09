import { defineStore } from 'pinia';
import { ref } from 'vue';
import { setAddedResources, type StoredResource } from '../knowledge/added';
import { sessionToken, workerBase } from '../services/account';

export const RESOURCE_TITLE_LIMIT = 120;
export const RESOURCE_BODY_LIMIT = 20_000;

export const useResourceStore = defineStore('resources', () => {
  const items = ref<StoredResource[]>([]);

  function apply(rows: StoredResource[]) {
    items.value = rows;
    setAddedResources(rows);
  }

  async function load() {
    try {
      const response = await fetch(`${workerBase()}/api/resources`);
      if (!response.ok) return;
      const data = (await response.json()) as { resources?: StoredResource[] };
      apply(data.resources ?? []);
    } catch {
      /* Built-in pages stay available. */
    }
  }

  async function add(input: { title: string; body: string; keywords: string; linkHref: string }) {
    if (input.title.trim().length > RESOURCE_TITLE_LIMIT) throw new Error('title_too_long');
    if (input.body.trim().length > RESOURCE_BODY_LIMIT) throw new Error('answer_too_long');
    const response = await fetch(`${workerBase()}/api/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken()}`
      },
      body: JSON.stringify(input)
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; resource?: StoredResource };
    if (!response.ok || !data.resource) throw new Error(data.error || 'bad_resource');
    apply([...items.value, data.resource]);
    return data.resource;
  }

  async function remove(id: string) {
    const response = await fetch(`${workerBase()}/api/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionToken()}` }
    });
    if (!response.ok) throw new Error('bad_resource');
    apply(items.value.filter((item) => item.id !== id));
  }

  return { items, load, add, remove };
});
