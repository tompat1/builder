<template>
  <div class="mt-4 pt-3.5 border-t border-slate-200/80">
    <div class="flex items-center gap-1.5 mb-1.5">
      <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
      <label for="ai-prompt-input" class="text-xs font-bold text-slate-800 tracking-tight">{{ t('ai.title') }}</label>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-2">
      <button
        v-for="prompt in prompts"
        :key="prompt"
        type="button"
        @click="ask(prompt)"
        class="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 whitespace-nowrap transition-colors border border-slate-200/50"
      >
        {{ prompt }}
      </button>
    </div>

    <form @submit.prevent="ask(customPrompt)" class="flex gap-1.5">
      <input
        id="ai-prompt-input"
        v-model="customPrompt"
        type="text"
        :placeholder="t('ai.placeholder')"
        class="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
      />
      <button
        type="submit"
        id="btn-ai-generate"
        class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1"
      >
        <span>{{ asking ? t('ai.asking') : t('ai.ask') }}</span>
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </form>

    <div v-if="hit" ref="answerEl" class="mt-3 rounded-xl border border-slate-200 bg-white p-3" aria-live="polite">
      <p class="text-xs font-bold text-slate-900">{{ copy(hit.entry.title) }}</p>
      <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span class="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {{ t('ai.base') }}
        </span>
        <span
          v-if="viaWorker"
          class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
          :title="t('ai.workers')"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
          {{ t('ai.model') }}
        </span>
      </div>
      <div class="mt-2 rounded-lg bg-slate-100/80 px-2">
        <KnowledgeFigure :figure="hit.entry.figure" />
      </div>
      <p class="text-[11px] text-slate-600 leading-relaxed mt-2">{{ copy(hit.entry.body) }}</p>

      <div v-if="hit.entry.links.length" class="mt-2">
        <p class="text-[11px] font-semibold text-slate-600">{{ t('ai.sources') }}</p>
        <ul class="mt-1 space-y-1">
          <li v-for="link in hit.entry.links" :key="link.href">
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-semibold text-slate-800 underline underline-offset-2 hover:text-slate-950"
            >
              {{ copy(link.label) }}
            </a>
          </li>
        </ul>
      </div>

      <button
        v-if="hit.entry.apply"
        type="button"
        class="mt-2 text-[11px] font-semibold text-slate-800 hover:text-slate-950 underline underline-offset-2"
        @click="showOnHouse(hit.entry)"
      >
        {{ appliedId === hit.entry.id ? t('ai.shown') : t('ai.show') }}
      </button>

      <div v-if="hit.related.length" class="flex flex-wrap gap-1.5 mt-2">
        <button
          v-for="related in hit.related"
          :key="related.id"
          type="button"
          class="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          @click="openEntry(related)"
        >
          {{ copy(related.title) }}
        </button>
      </div>
    </div>

    <p v-else-if="miss" ref="answerEl" class="mt-2 text-[11px] text-slate-500 leading-relaxed" aria-live="polite">
      {{ t('ai.miss') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import { askKnowledge, knowledgeEntries, type KnowledgeApply, type KnowledgeEntry, type KnowledgeHit, type KnowledgeLang } from '../knowledge/hub';
import { askKnowledgeWorker } from '../services/knowledgeWorker';
import KnowledgeFigure from './KnowledgeFigure.vue';

const store = useConfigStore();
const { t, locale } = useLabels();
const customPrompt = ref('');
const hit = ref<KnowledgeHit | null>(null);
const miss = ref(false);
const appliedId = ref<string | null>(null);
const answerEl = ref<HTMLElement | null>(null);
const viaWorker = ref(false);
const asking = ref(false);
let requestId = 0;

const lang = computed<KnowledgeLang>(() => (locale.value === 'en' ? 'en' : 'sv'));

const prompts = computed(() => [t('ai.belt'), t('ai.cladding'), t('ai.air'), t('ai.wall'), t('ai.permit')]);

function copy(value: Record<KnowledgeLang, string>) {
  return value[lang.value];
}

function ask(query: string) {
  const next = query.trim();
  if (!next) return;
  const id = ++requestId;
  customPrompt.value = next;
  appliedId.value = null;
  viaWorker.value = false;
  const found = askKnowledge(next);
  hit.value = found;
  miss.value = !found;
  asking.value = true;
  reveal();
  askKnowledgeWorker(next, lang.value).then((entryId) => {
    if (id !== requestId) return;
    asking.value = false;
    const entry = entryId ? knowledgeEntries().find((item) => item.id === entryId) : undefined;
    if (!entry) return;
    hit.value = { entry, related: found?.related.filter((item) => item.id !== entry.id) ?? [] };
    viaWorker.value = true;
    miss.value = false;
    reveal();
  }).catch(() => {
    if (id === requestId) asking.value = false;
  });
}

function reveal() {
  nextTick(() => answerEl.value?.scrollIntoView({ block: 'center' }));
}

function openEntry(entry: KnowledgeEntry) {
  hit.value = { entry, related: [] };
  miss.value = false;
  appliedId.value = null;
  customPrompt.value = copy(entry.title);
  viaWorker.value = false;
  asking.value = false;
  reveal();
}

function showOnHouse(entry: KnowledgeEntry) {
  const action = entry.apply;
  if (!action) return;
  const wantsShingles = entry.id === 'covering' && /shingel|shingle/.test(customPrompt.value.toLowerCase());
  runApply(wantsShingles ? 'shingles' : action);
  appliedId.value = entry.id;
}

function runApply(action: KnowledgeApply) {
  if (action === 'size') {
    store.selectCategory('size');
  } else if (action === 'pulpet') {
    store.selectRoof('pulpettak');
    store.selectCategory('roof');
  } else if (action === 'cladding') {
    store.selectPanelOrientation('staende');
    store.selectCladdingSize('22x145');
    store.selectCategory('size');
  } else if (action === 'roof' || action === 'shingles') {
    if (action === 'shingles') store.selectRoofCovering('shingles');
    store.selectCategory('roof');
  } else if (action === 'loft') {
    store.selectRoof('sadeltak');
    store.selectLoft('sleeping');
    store.selectCategory('loft');
  } else if (action === 'door') {
    store.selectDoor('SVANSHALL');
    store.selectCategory('doors');
  }
}
</script>
