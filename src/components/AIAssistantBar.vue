<template>
  <div class="mt-4 pt-3.5 border-t border-slate-200/80">
    <div class="flex items-center gap-1.5 mb-1.5">
      <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
      <label for="ai-prompt-input" class="text-xs font-bold text-slate-800 tracking-tight"><Cms k="ai.title" /></label>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-2">
      <button
        v-for="key in promptKeys"
        :key="key"
        type="button"
        @click="ask(t(key))"
        class="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 whitespace-nowrap transition-colors border border-slate-200/50"
      >
        <Cms :k="key" />
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
        <Cms v-if="asking" k="ai.asking" />
        <Cms v-else k="ai.ask" />
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </form>

    <div v-if="hit" ref="answerEl" class="mt-3 rounded-xl border border-slate-200 bg-white p-3" aria-live="polite">
      <p class="text-xs font-bold text-slate-900"><Cms :k="`knowledge.${hit.entry.id}.title`" :fallback="copy(hit.entry.title)" /></p>
      <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span class="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <Cms k="ai.base" />
        </span>
        <span
          v-if="viaWorker"
          class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
          :title="t('ai.workers')"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
          <Cms k="ai.model" />
        </span>
      </div>
      <CmsImage :k="`picture.knowledge.${hit.entry.id}`" class="mt-2">
        <div class="rounded-lg bg-slate-100/80 px-2">
          <KnowledgeFigure :figure="hit.entry.figure" />
        </div>
      </CmsImage>
      <p class="text-[11px] text-slate-600 leading-relaxed mt-2"><Cms :k="`knowledge.${hit.entry.id}.body`" :fallback="copy(hit.entry.body)" block /></p>

      <div v-if="hit.entry.links.length" class="mt-2">
        <p class="text-[11px] font-semibold text-slate-600"><Cms k="ai.sources" /></p>
        <ul class="mt-1 space-y-1">
          <li v-for="(link, index) in hit.entry.links" :key="link.href">
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-semibold text-slate-800 underline underline-offset-2 hover:text-slate-950"
            >
              <Cms :k="`knowledge.${hit.entry.id}.link.${index}`" :fallback="copy(link.label)" />
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
        <Cms v-if="appliedId === hit.entry.id" k="ai.shown" />
        <Cms v-else k="ai.show" />
      </button>

      <div v-if="passages.length" class="mt-2 space-y-1.5">
        <p class="text-[11px] font-semibold text-slate-600">{{ t('ai.passages') }}</p>
        <article v-for="(passage, index) in passages" :key="`${passage.url}-${index}`" class="rounded-lg bg-slate-50 px-2 py-1.5">
          <a
            v-if="passage.url"
            :href="passage.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] font-semibold text-slate-800 underline underline-offset-2"
          >{{ passage.title }}</a>
          <p v-else class="text-[11px] font-semibold text-slate-800">{{ passage.title }}</p>
          <p class="text-[11px] text-slate-600 leading-relaxed">{{ excerpt(passage.text) }}</p>
        </article>
      </div>

      <div v-if="hit.related.length" class="flex flex-wrap gap-1.5 mt-2">
        <button
          v-for="related in hit.related"
          :key="related.id"
          type="button"
          class="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          @click="openEntry(related)"
        >
          <Cms :k="`knowledge.${related.id}.title`" :fallback="copy(related.title)" />
        </button>
      </div>
    </div>

    <div v-else-if="miss" ref="answerEl" class="mt-2" aria-live="polite">
      <p v-if="!web" class="text-[11px] text-slate-500 leading-relaxed"><Cms k="ai.miss" /></p>
      <div v-if="passages.length" class="mt-2 space-y-1.5">
        <p class="text-[11px] font-semibold text-slate-600">{{ t('ai.passages') }}</p>
        <article v-for="(passage, index) in passages" :key="`${passage.url}-${index}`" class="rounded-lg bg-slate-50 px-2 py-1.5">
          <a
            v-if="passage.url"
            :href="passage.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] font-semibold text-slate-800 underline underline-offset-2"
          >{{ passage.title }}</a>
          <p v-else class="text-[11px] font-semibold text-slate-800">{{ passage.title }}</p>
          <p class="text-[11px] text-slate-600 leading-relaxed">{{ excerpt(passage.text) }}</p>
        </article>
      </div>
    </div>

    <div v-if="web" ref="webEl" class="mt-2 rounded-xl border border-slate-200 bg-white p-3">
      <p class="text-[11px] font-semibold text-slate-600">{{ t('ai.web') }}</p>
      <p class="mt-1 text-[11px] text-slate-600 leading-relaxed">{{ web.answer }}</p>
      <ul v-if="web.sources.length" class="mt-1.5 space-y-1">
        <li v-for="source in web.sources" :key="source.url">
          <a
            :href="source.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] font-semibold text-slate-800 underline underline-offset-2"
          >{{ source.title }}</a>
        </li>
      </ul>
    </div>

    <!-- Admin Tools for Knowledge Base -->
    <div v-if="session.user?.role === 'admin'" class="mt-4 pt-3 border-t border-slate-200/80">
      <div class="flex items-center justify-between mb-2">
        <p class="text-[11px] font-bold text-slate-900 uppercase tracking-wider"><Cms k="account.knowledge" fallback="Admin: Knowledge Tools" /></p>
        <button
          type="button"
          @click="showAdminTools = !showAdminTools"
          class="text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <Cms v-if="showAdminTools" k="panel.hide" />
          <Cms v-else k="panel.show" />
        </button>
      </div>

      <div v-if="showAdminTools" class="space-y-4">
        <p v-if="adminNotice" class="text-[10px] text-emerald-800">{{ adminNotice }}</p>
        <p v-if="adminError" class="text-[10px] text-red-800">{{ adminError }}</p>

        <!-- Resource Form -->
        <form class="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200" @submit.prevent="addResource">
          <p class="font-bold text-slate-900 text-xs"><Cms k="account.resources" /></p>
          <label class="block font-semibold text-slate-600 text-[10px]" for="resource-title"><Cms k="account.resourceTitle" /></label>
          <input id="resource-title" v-model="resourceTitle" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 text-xs" />
          <label class="block font-semibold text-slate-600 text-[10px]" for="resource-body"><Cms k="account.resourceBody" /></label>
          <textarea id="resource-body" v-model="resourceBody" rows="3" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 text-xs"></textarea>
          <label class="block font-semibold text-slate-600 text-[10px]" for="resource-keywords"><Cms k="account.resourceKeywords" /></label>
          <input id="resource-keywords" v-model="resourceKeywords" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 text-xs" />
          <label class="block font-semibold text-slate-600 text-[10px]" for="resource-link"><Cms k="account.resourceLink" /></label>
          <input id="resource-link" v-model="resourceLink" type="url" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 text-xs" />
          <button type="submit" class="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50" :disabled="resourceBusy">
            <Cms k="account.resourceAdd" />
          </button>
          <ul v-if="resources.items.length" class="space-y-1 pt-1 mt-2 border-t border-slate-200">
            <li v-for="item in resources.items" :key="item.id" class="flex items-center justify-between gap-2 text-[11px]">
              <span class="truncate text-slate-800">{{ item.title }}</span>
              <button type="button" class="shrink-0 font-semibold text-slate-500 hover:text-slate-900" @click="removeResource(item.id)">
                <Cms k="account.resourceRemove" />
              </button>
            </li>
          </ul>
        </form>

        <!-- Source Form -->
        <form class="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200" @submit.prevent="addSource">
          <p class="font-bold text-slate-900 text-xs"><Cms k="account.references" /></p>
          <label class="sr-only" for="reference-url"><Cms k="account.references" /></label>
          <input id="reference-url" v-model="referenceUrl" type="url" placeholder="https://" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 text-xs" />
          <button type="submit" class="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50" :disabled="referenceBusy">
            <Cms k="account.referenceAdd" />
          </button>
          <ul v-if="sources.items.length" class="space-y-1 pt-1 mt-2 border-t border-slate-200">
            <li v-for="site in sources.items" :key="site" class="flex items-center justify-between gap-2 text-[11px]">
              <a :href="site" target="_blank" rel="noopener noreferrer" class="truncate font-semibold text-slate-800 underline underline-offset-2">{{ site }}</a>
              <button type="button" class="shrink-0 font-semibold text-slate-500 hover:text-slate-900" @click="removeSource(site)">
                <Cms k="account.resourceRemove" />
              </button>
            </li>
          </ul>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useSessionStore } from '../store/useSessionStore';
import { useResourceStore } from '../store/useResourceStore';
import { useSourceStore } from '../store/useSourceStore';
import { useLabels } from '../i18n';
import { allKnowledgeEntries, askKnowledge, type KnowledgeApply, type KnowledgeEntry, type KnowledgeHit, type KnowledgeLang } from '../knowledge/hub';
import { askKnowledgeWorker, type RetrievedPassage, type WebAnswer } from '../services/knowledgeWorker';
import KnowledgeFigure from './KnowledgeFigure.vue';
import CmsImage from './CmsImage.vue';
import Cms from './Cms.vue';

const store = useConfigStore();
const session = useSessionStore();
const resources = useResourceStore();
const sources = useSourceStore();
const { t, locale } = useLabels();

const showAdminTools = ref(false);
const resourceTitle = ref('');
const resourceBody = ref('');
const resourceKeywords = ref('');
const resourceLink = ref('');
const resourceBusy = ref(false);

const referenceUrl = ref('');
const referenceBusy = ref(false);
const adminNotice = ref('');
const adminError = ref('');

const messages: Record<string, string> = {
  bad_resource: 'account.badResource',
  bad_link: 'account.badLink'
};

function showAdminError(code: string) {
  adminNotice.value = '';
  const key = messages[code];
  adminError.value = key ? t(key) : code;
}

async function addResource() {
  adminError.value = '';
  adminNotice.value = '';
  resourceBusy.value = true;
  try {
    await resources.add({
      title: resourceTitle.value,
      body: resourceBody.value,
      keywords: resourceKeywords.value,
      linkHref: resourceLink.value
    });
    resourceTitle.value = '';
    resourceBody.value = '';
    resourceKeywords.value = '';
    resourceLink.value = '';
    adminNotice.value = t('account.resourceSaved');
  } catch (caught) {
    showAdminError(caught instanceof Error ? caught.message : 'bad_resource');
  } finally {
    resourceBusy.value = false;
  }
}

async function removeResource(id: string) {
  adminError.value = '';
  try {
    await resources.remove(id);
  } catch (caught) {
    showAdminError(caught instanceof Error ? caught.message : 'bad_resource');
  }
}

async function addSource() {
  adminError.value = '';
  adminNotice.value = '';
  referenceBusy.value = true;
  try {
    await sources.add(referenceUrl.value);
    referenceUrl.value = '';
    adminNotice.value = t('account.referenceSaved');
  } catch (caught) {
    showAdminError(caught instanceof Error ? caught.message : 'bad_link');
  } finally {
    referenceBusy.value = false;
  }
}

async function removeSource(url: string) {
  adminError.value = '';
  try {
    await sources.remove(url);
  } catch (caught) {
    showAdminError(caught instanceof Error ? caught.message : 'bad_link');
  }
}
const customPrompt = ref('');
const hit = ref<KnowledgeHit | null>(null);
const miss = ref(false);
const appliedId = ref<string | null>(null);
const answerEl = ref<HTMLElement | null>(null);
const viaWorker = ref(false);
const asking = ref(false);
const passages = ref<RetrievedPassage[]>([]);
const web = ref<WebAnswer | null>(null);
const webEl = ref<HTMLElement | null>(null);
let requestId = 0;

const lang = computed<KnowledgeLang>(() => (locale.value === 'en' ? 'en' : 'sv'));

const promptKeys = ['ai.belt', 'ai.cladding', 'ai.air', 'ai.wall', 'ai.permit'];

function copy(value: Record<KnowledgeLang, string>) {
  return value[lang.value];
}

function excerpt(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const term = customPrompt.value
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .find((word) => clean.toLowerCase().includes(word));
  const at = term ? clean.toLowerCase().indexOf(term) : 0;
  const start = at > 40 ? at - 40 : 0;
  const slice = clean.slice(start, start + 280).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = start + 280 < clean.length ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}

function ask(query: string) {
  const next = query.trim();
  if (!next) return;
  const id = ++requestId;
  customPrompt.value = next;
  appliedId.value = null;
  viaWorker.value = false;
  passages.value = [];
  web.value = null;
  const found = askKnowledge(next);
  hit.value = found;
  miss.value = !found;
  asking.value = true;
  reveal();
  askKnowledgeWorker(next, lang.value).then((result) => {
    if (id !== requestId) return;
    asking.value = false;
    passages.value = result.passages;
    web.value = result.web;
    const entry = result.entryId ? allKnowledgeEntries().find((item) => item.id === result.entryId) : undefined;
    if (!entry) {
      reveal();
      return;
    }
    hit.value = { entry, related: found?.related.filter((item) => item.id !== entry.id) ?? [] };
    viaWorker.value = true;
    miss.value = false;
    reveal();
  }).catch(() => {
    if (id === requestId) asking.value = false;
  });
}

function reveal() {
  nextTick(() => (webEl.value ?? answerEl.value)?.scrollIntoView({ block: 'center' }));
}

function openEntry(entry: KnowledgeEntry) {
  hit.value = { entry, related: [] };
  miss.value = false;
  appliedId.value = null;
  customPrompt.value = copy(entry.title);
  viaWorker.value = false;
  web.value = null;
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
