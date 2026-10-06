import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { MERCH, lineKey } from '../site/merch';

const KEY = 'builder.merch.bag';

function read(): Record<string, number> {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}') as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const lines: Record<string, number> = {};
    for (const [key, qty] of Object.entries(data)) {
      const count = Number(qty);
      if (!key || !Number.isInteger(count) || count < 1 || count > 19) continue;
      const [id, size] = key.split('::');
      const item = MERCH.find((entry) => entry.id === (size ? id : key));
      if (!item) continue;
      const chosen = size && item.sizes.includes(size) ? size : item.sizes[0];
      const line = lineKey(item.id, chosen);
      lines[line] = Math.min(19, (lines[line] ?? 0) + count);
    }
    return lines;
  } catch {
    return {};
  }
}

export const useBagStore = defineStore('bag', () => {
  const lines = ref<Record<string, number>>(read());

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(lines.value));
  }

  function add(id: string) {
    lines.value = { ...lines.value, [id]: Math.min(19, (lines.value[id] ?? 0) + 1) };
    persist();
  }

  function remove(id: string) {
    setQty(id, 0);
  }

  function setQty(id: string, qty: number) {
    const count = Math.min(19, Math.max(0, Math.floor(Number(qty) || 0)));
    const next = { ...lines.value };
    if (count === 0) delete next[id];
    else next[id] = count;
    lines.value = next;
    persist();
  }

  const panel = ref(false);
  function openPanel() {
    panel.value = true;
  }
  function closePanel() {
    panel.value = false;
  }

  const count = computed(() => Object.values(lines.value).reduce((sum, qty) => sum + qty, 0));

  return { lines, add, remove, setQty, count, panel, openPanel, closePanel };
});
