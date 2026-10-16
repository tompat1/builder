import { ref } from 'vue';
import type { SearchEntry } from './catalog';

export const searchRequest = ref(0);
export const searchAction = ref<SearchEntry | null>(null);

export function requestSearch(entry: SearchEntry) {
  searchAction.value = entry;
  searchRequest.value += 1;
}

export function clearSearch() {
  searchAction.value = null;
}

export function openSearch() {
  window.dispatchEvent(new Event('builder:open-search'));
}
