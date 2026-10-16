<template>
  <div v-if="open" class="fixed inset-0 z-[92]" @keydown="onKey">
    <button
      type="button"
      class="absolute inset-0 bg-[#173D35]/45"
      :aria-label="t('search.close')"
      @click="close"
    ></button>
    <div
      class="search-panel relative mx-auto mt-[8vh] flex max-h-[min(36rem,80vh)] w-[min(40rem,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl bg-[#F5F3EC] text-[#222925] shadow-[0_18px_40px_rgba(23,61,53,0.22)]"
      role="dialog"
      aria-modal="true"
      :aria-label="t('search.label')"
    >
      <div class="relative border-b border-[#173D35]/10">
        <div class="pointer-events-none absolute inset-y-0 left-4 right-16 flex items-center text-base" aria-hidden="true">
          <span class="whitespace-pre text-transparent">{{ query }}</span><span class="text-[#173D35]/35">{{ completion }}</span>
        </div>
        <input
          id="site-search"
          ref="inputEl"
          v-model="query"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          aria-autocomplete="both"
          aria-controls="site-search-list"
          :aria-expanded="true"
          :aria-activedescendant="activeId"
          class="relative w-full bg-transparent px-4 py-3.5 pr-16 text-base text-[#173D35] caret-[#FF5A00] placeholder:text-[#173D35]/45 focus:outline-none"
          :placeholder="t('search.placeholder')"
          @keydown="onInputKey"
        />
        <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide text-[#173D35]/45">{{ shortcut }}</span>
      </div>

      <div class="flex flex-wrap gap-1.5 px-3 py-2.5" role="group" :aria-label="t('search.topics')">
        <button
          v-for="pill in pills"
          :key="pill"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
          :class="topic === pill ? 'bg-[#173D35] text-[#F5F3EC]' : 'bg-white text-[#173D35] hover:bg-[#B7C7AF]/40'"
          :aria-pressed="topic === pill"
          @click="pickTopic(pill)"
        >
          {{ t(pill === 'all' ? 'search.all' : `search.topic.${pill}`) }}
        </button>
      </div>

      <ul
        id="site-search-list"
        ref="listEl"
        class="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
        role="listbox"
        :aria-label="t('search.label')"
      >
        <li v-if="!hits.length" class="px-3 py-6 text-sm text-[#173D35]">{{ t('search.empty') }}</li>
        <li v-for="(hit, index) in hits" :key="hit.entry.id" role="presentation">
          <button
            :id="optionId(hit.entry.id)"
            type="button"
            role="option"
            class="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
            :class="index === active ? 'bg-[#173D35]/10' : 'hover:bg-[#173D35]/10'"
            :aria-selected="index === active"
            @mouseenter="active = index"
            @click="choose(hit.entry)"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-[#173D35]">{{ hit.title }}</span>
              <span v-if="hit.hint" class="mt-0.5 block truncate text-xs leading-relaxed text-[#173D35]/75">{{ hit.hint }}</span>
            </span>
            <span class="shrink-0 pt-0.5 text-[11px] font-semibold text-[#173D35]/55">{{ t(`search.topic.${hit.entry.topic}`) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { i18n, useLabels } from '../i18n';
import { SEARCH_ENTRIES, SEARCH_TOPICS, type SearchEntry, type SearchTopic } from '../search/catalog';
import { completionSuffix, matchSearch, type SearchQueryDoc } from '../search/match';
import { clearSearch, requestSearch } from '../search/run';

interface Hit extends SearchQueryDoc {
  entry: SearchEntry;
}

const { t, te } = useLabels();
const route = useRoute();
const router = useRouter();
const open = ref(false);
const query = ref('');
const topic = ref<'all' | SearchTopic>('all');
const active = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);
const listEl = ref<HTMLElement | null>(null);
const shortcut = 'Ctrl K';
const pills: Array<'all' | SearchTopic> = ['all', ...SEARCH_TOPICS];

function read(key: string | undefined, fallback: string) {
  if (!key || !te(key)) return fallback;
  const value = t(key);
  return value === key ? fallback : value;
}

function both(key: string | undefined) {
  if (!key) return [];
  return (['sv', 'en'] as const).map((locale) => String(i18n.global.t(key, {}, { locale }))).filter((value) => value && value !== key);
}

const docs = computed<Hit[]>(() => SEARCH_ENTRIES.map((entry) => {
  const title = read(entry.titleKey, entry.title);
  const hint = read(entry.hintKey, entry.hint);
  return {
    entry,
    id: entry.id,
    topic: entry.topic,
    title,
    hint,
    keywords: [...entry.keywords, entry.title, entry.hint, ...both(entry.titleKey), ...both(entry.hintKey)].join(' '),
    lead: entry.lead,
    boost: entry.boost
  };
}));

const hits = computed(() => matchSearch(docs.value, query.value, topic.value));
const completion = computed(() => {
  const hit = hits.value[active.value];
  return hit ? completionSuffix(hit.title, query.value) : '';
});
const activeId = computed(() => {
  const hit = hits.value[active.value];
  return hit ? optionId(hit.entry.id) : undefined;
});

function optionId(id: string) {
  return `search-hit-${id}`;
}

function pickTopic(next: 'all' | SearchTopic) {
  topic.value = next;
  active.value = 0;
  inputEl.value?.focus();
}

function close() {
  open.value = false;
}

async function choose(entry: SearchEntry) {
  close();
  requestSearch(entry);
  if (route.path !== entry.path) await router.push(entry.path);
  await nextTick();
  window.setTimeout(() => {
    const focus = entry.focus ? document.getElementById(entry.focus) : null;
    focus?.scrollIntoView({ block: 'center' });
    focus?.classList.add('search-hit');
    window.setTimeout(() => focus?.classList.remove('search-hit'), 1600);
    clearSearch();
  }, 420);
}

function acceptCompletion() {
  const hit = hits.value[active.value];
  if (!hit || !completion.value) return false;
  query.value = hit.title;
  return true;
}

function move(step: number) {
  if (!hits.value.length) return;
  active.value = (active.value + step + hits.value.length) % hits.value.length;
  document.getElementById(optionId(hits.value[active.value].entry.id))?.scrollIntoView({ block: 'nearest' });
}

function onInputKey(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    move(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const hit = hits.value[active.value];
    if (hit) void choose(hit.entry);
  } else if ((event.key === 'Tab' || event.key === 'ArrowRight') && completion.value) {
    const atEnd = event.key === 'Tab' || (inputEl.value?.selectionStart === query.value.length);
    if (!atEnd) return;
    event.preventDefault();
    acceptCompletion();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}

function onGlobalKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    open.value = !open.value;
  }
}

function onOpen() {
  open.value = true;
}

watch(open, async (showing) => {
  if (!showing) return;
  query.value = '';
  topic.value = 'all';
  active.value = 0;
  await nextTick();
  inputEl.value?.focus();
});

watch([query, topic], () => {
  active.value = 0;
});

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey);
  window.addEventListener('builder:open-search', onOpen);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey);
  window.removeEventListener('builder:open-search', onOpen);
});
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .search-panel {
    animation: search-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

@keyframes search-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>

<style>
.search-hit {
  outline: 2px solid #FF5A00;
  outline-offset: 3px;
}
</style>
