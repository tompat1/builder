<template>
  <div class="relative min-[1180px]:hidden" :class="menuOpen ? 'z-50' : 'z-20'">
    <header
      class="pointer-events-auto flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-md"
      role="banner"
    >
      <router-link
        to="/"
        class="grid h-11 w-11 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        aria-label="Builder"
      >
        <BrandMark class="h-8 w-auto text-[#FF5A00]" />
      </router-link>
      <button
        type="button"
        class="grid h-11 w-11 place-items-center rounded-xl text-[#173D35] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? t('site.close') : t('site.menu')"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </header>
    <div
      v-if="menuOpen"
      class="pointer-events-auto absolute left-0 right-0 top-[calc(100%+0.5rem)] flex max-h-[min(70dvh,32rem)] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl"
    >
      <ActionControl
        appearance="text"
        direction="forward"
        id="btn-save-project-mobile"
        class="min-h-11"
        :aria-expanded="housesOpen"
        @click="toggleHouses"
      >
        <span class="flex items-center gap-2">
          <svg class="h-[18px] w-[18px] text-[#FF5A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <Cms k="header.projects" fallback="Projects" />
        </span>
      </ActionControl>
      <CloudSyncIndicator />
      <nav class="flex w-fit rounded-xl bg-graphite p-1 shadow-inner" role="group" :aria-label="locale === 'sv' ? 'Språk' : 'Language'">
        <button type="button" :aria-pressed="locale === 'sv'" class="min-h-11 min-w-11 rounded-lg px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" :class="locale === 'sv' ? 'bg-[#FF5A00] text-graphite' : 'text-ivory hover:text-white'" @click="applyLocale('sv', true)">SV</button>
        <button type="button" :aria-pressed="locale === 'en'" class="min-h-11 min-w-11 rounded-lg px-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" :class="locale === 'en' ? 'bg-[#FF5A00] text-graphite' : 'text-ivory hover:text-white'" @click="applyLocale('en', true)">EN</button>
      </nav>
      <nav class="flex w-fit rounded-xl bg-graphite p-1 shadow-inner" role="tablist" :aria-label="t('header.view')">
        <button type="button" role="tab" class="min-h-11 rounded-lg px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" :aria-selected="store.viewMode === 'utsida'" :class="store.viewMode === 'utsida' ? 'bg-[#FF5A00] text-graphite' : 'text-ivory hover:text-white'" @click="store.setViewMode('utsida')"><Cms k="header.outside" /></button>
        <button type="button" role="tab" class="min-h-11 rounded-lg px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" :aria-selected="store.viewMode === 'insida'" :class="store.viewMode === 'insida' ? 'bg-[#FF5A00] text-graphite' : 'text-ivory hover:text-white'" @click="store.setViewMode('insida')"><Cms k="header.inside" /></button>
      </nav>
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="min-h-11 rounded-xl px-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" :aria-expanded="showPriceBreakdown" @click="showPriceBreakdown = !showPriceBreakdown">
          <span class="block text-[10px] font-bold uppercase tracking-wide text-[#173D35]/70"><Cms k="header.total" /></span>
          <span class="text-lg font-extrabold tabular-nums text-[#173D35]">{{ money(store.totalPriceSek) }}</span>
        </button>
        <ActionControl prominent tone="graphite" direction="down" id="btn-next-step-mobile" class="shrink-0" @click="emitExport">
          <Cms k="panel.export" />
        </ActionControl>
      </div>
      <div v-if="showPriceBreakdown" class="rounded-xl border border-[#173D35]/10 bg-[#F5F3EC] px-3 py-2.5 text-xs text-[#173D35]">
        <div class="flex justify-between gap-3">
          <span><Cms :k="`catalog.${store.currentSize.id}.name`" :fallback="store.currentSize.name" /></span>
          <span class="font-semibold tabular-nums">{{ money(store.currentSize.basePrice) }}</span>
        </div>
        <div class="mt-1.5 flex justify-between gap-3">
          <span>{{ t('header.facade', { name: catalog(store.currentMaterial.id, 'name', store.currentMaterial.name) }) }}</span>
          <span v-if="store.currentMaterial.id !== 'custom'" class="font-semibold tabular-nums">{{ delta(store.currentMaterial.priceDelta) }}</span>
        </div>
        <div v-if="store.hasLoft" class="mt-1.5 flex justify-between gap-3 text-emerald-800">
          <span><Cms k="header.loftExtra" /></span>
          <span class="font-semibold tabular-nums">{{ delta(21500) }}</span>
        </div>
      </div>
      <button
        v-if="session.user?.role === 'admin'"
        type="button"
        class="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
        :disabled="content.saving"
        @click="toggleEdit"
      >
        {{ content.editing ? t('cms.done') : t('cms.edit') }}
      </button>
    </div>
  </div>

  <header
    class="pointer-events-auto hidden min-[1180px]:flex items-center justify-between bg-white/95 backdrop-blur-md shadow-sm rounded-2xl px-3 py-2 min-[1180px]:px-6 min-[1180px]:py-3 border border-slate-200/80 transition-all z-20"
    role="banner"
  >
    <!-- Brand & Top Links (Matching Skånska Byggvaror) -->
    <div class="flex items-center gap-3 min-[1180px]:gap-5">
      <!-- Logo Badge -->
      <router-link to="/" class="flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]">
        <BrandMark class="h-9 md:h-10 w-auto text-[#FF5A00]" />
        <div class="block">
          <div class="flex items-center gap-1.5 leading-none">
            <span class="font-extrabold text-[#0E3524] tracking-tight text-sm min-[1180px]:text-[22px]"><Cms k="brand.name" fallback="Builder" /></span>
          </div>
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5"><Cms k="brand.tagline" /></span>
        </div>
      </router-link>

      <div class="h-6 w-px bg-slate-200 hidden min-[1180px]:block"></div>

      <!-- Action Quick-links -->
      <div class="flex items-center gap-2.5 min-[1180px]:gap-4">
        <ActionControl
          appearance="text"
          direction="forward"
          id="btn-save-project"
          :aria-expanded="housesOpen"
          @click="toggleHouses"
        >
          <span class="flex items-center gap-2">
            <svg class="w-[18px] h-[18px] text-[#FF5A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <Cms k="header.projects" fallback="Projects" />
          </span>
        </ActionControl>

        <!-- Cloud Synced with green online marker -->
        <CloudSyncIndicator />
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <!-- Language Toggle -->
      <nav class="flex bg-graphite p-1 rounded-xl shadow-inner shrink-0" role="group" :aria-label="locale === 'sv' ? 'Språk' : 'Language'">
        <button
          type="button"
          :aria-pressed="locale === 'sv'"
          @click="applyLocale('sv', true)"
          :class="[
            'flex items-center justify-center px-2.5 min-[1180px]:px-3 py-1 text-xs min-[1180px]:text-sm font-bold rounded-lg transition-all duration-200 min-h-[30px] min-[1180px]:min-h-[34px]',
            locale === 'sv'
              ? 'bg-[#FF5A00] text-graphite shadow-sm'
              : 'text-ivory hover:text-white'
          ]"
        >
          SV
        </button>

        <button
          type="button"
          :aria-pressed="locale === 'en'"
          @click="applyLocale('en', true)"
          :class="[
            'flex items-center justify-center px-2.5 min-[1180px]:px-3 py-1 text-xs min-[1180px]:text-sm font-bold rounded-lg transition-all duration-200 min-h-[30px] min-[1180px]:min-h-[34px]',
            locale === 'en'
              ? 'bg-[#FF5A00] text-graphite shadow-sm'
              : 'text-ivory hover:text-white'
          ]"
        >
          EN
        </button>
      </nav>

    <!-- Center Segmented Master Toggle (Outside / Inside) -->
    <nav class="flex bg-graphite p-1 rounded-xl shadow-inner shrink-0" role="tablist" :aria-label="t('header.view')">
      <button
        type="button"
        role="tab"
        id="toggle-utsida"
        :aria-selected="store.viewMode === 'utsida'"
        @click="store.setViewMode('utsida')"
        :class="[
          'flex items-center gap-1 px-2.5 min-[1180px]:px-4 py-1 text-xs min-[1180px]:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[30px] min-[1180px]:min-h-[34px]',
          store.viewMode === 'utsida'
            ? 'bg-[#FF5A00] text-graphite shadow-sm'
            : 'text-ivory hover:text-white'
        ]"
      >
        <span><Cms k="header.outside" /></span>
      </button>

      <button
        type="button"
        role="tab"
        id="toggle-insida"
        :aria-selected="store.viewMode === 'insida'"
        @click="store.setViewMode('insida')"
        :class="[
          'flex items-center gap-1 px-2.5 min-[1180px]:px-4 py-1 text-xs min-[1180px]:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[30px] min-[1180px]:min-h-[34px]',
          store.viewMode === 'insida'
            ? 'bg-[#FF5A00] text-graphite shadow-sm'
            : 'text-ivory hover:text-white'
        ]"
      >
        <span><Cms k="header.inside" /></span>
      </button>
    </nav>
    </div>

    <!-- Price and Action Cluster -->
    <div class="flex items-center gap-2 min-[1180px]:gap-5 shrink-0">
      <AdminAiPanel />
      <button
        v-if="session.user?.role === 'admin'"
        type="button"
        id="btn-edit-copy"
        class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 min-h-[32px] disabled:opacity-50"
        :disabled="content.saving"
        @click="toggleEdit"
      >
        {{ content.editing ? t('cms.done') : t('cms.edit') }}
      </button>
      <div class="flex items-center gap-1 text-right">
        <div>
          <span class="hidden min-[1180px]:block text-[10px] uppercase font-bold text-slate-400 leading-none"><Cms k="header.total" /></span>
          <span class="font-extrabold text-xs sm:text-sm min-[1180px]:text-lg text-slate-900 tabular-nums whitespace-nowrap">
            {{ money(store.totalPriceSek) }}
          </span>
        </div>
        <!-- Price breakdown dropdown indicator -->
        <button
          type="button"
          @click="showPriceBreakdown = !showPriceBreakdown"
          class="text-slate-500 hover:text-slate-900 p-0.5"
          :title="t('header.priceDetails')"
          :aria-label="t('header.priceDetails')"
        >
          <svg class="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <ActionControl
        prominent
        tone="graphite"
        direction="down"
        id="btn-next-step"
        class="shrink-0 min-h-[32px] md:min-h-[38px]"
        @click="$emit('open-export')"
      >
        <Cms k="panel.export" />
      </ActionControl>
    </div>
  </header>

  <SavedHouses :open="housesOpen" @close="housesOpen = false" />

  <!-- Price Breakdown Flyout Modal -->
  <div
    v-if="showPriceBreakdown"
    class="pointer-events-auto absolute top-20 right-6 z-30 hidden w-72 animate-fade-in rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xl min-[1180px]:block"
  >
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-bold text-slate-900">
      <span><Cms k="header.breakdown" /></span>
      <button @click="showPriceBreakdown = false" class="text-slate-400 hover:text-slate-600">✕</button>
    </div>
    <div class="space-y-1.5">
      <div class="flex justify-between">
        <span><Cms :k="`catalog.${store.currentSize.id}.name`" :fallback="store.currentSize.name" /></span>
        <span class="font-semibold">{{ money(store.currentSize.basePrice) }}</span>
      </div>
      <div class="flex justify-between">
        <span>{{ t('header.facade', { name: catalog(store.currentMaterial.id, 'name', store.currentMaterial.name) }) }}</span>
        <span v-if="store.currentMaterial.id !== 'custom'" class="font-semibold">{{ delta(store.currentMaterial.priceDelta) }}</span>
      </div>
      <div v-if="store.hasLoft" class="flex justify-between text-emerald-700">
        <span><Cms k="header.loftExtra" /></span>
        <span class="font-semibold">{{ delta(21500) }}</span>
      </div>
    </div>
    <div class="pt-2 mt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
      <span><Cms k="header.totalVat" /></span>
      <span>{{ money(store.totalPriceSek) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BrandMark from './brand/BrandMark.vue';
import ActionControl from './site/ActionControl.vue';
import { useConfigStore } from '../store/useConfigStore';
import { useContentStore } from '../store/useContentStore';
import { useSessionStore } from '../store/useSessionStore';
import { applyLocale, useLabels } from '../i18n';
import { readLocalHouse } from '../services/houseSave';
import SavedHouses from './SavedHouses.vue';
import AdminAiPanel from './AdminAiPanel.vue';
import CloudSyncIndicator from './CloudSyncIndicator.vue';
import Cms from './Cms.vue';

const store = useConfigStore();
const content = useContentStore();
const session = useSessionStore();
const housesOpen = ref(false);
const menuOpen = ref(false);
const { t, locale, catalog, money, delta } = useLabels();
const showPriceBreakdown = ref(false);

const emit = defineEmits<{
  (e: 'open-export'): void;
}>();

function emitExport() {
  menuOpen.value = false;
  emit('open-export');
}


function toggleHouses() {
  housesOpen.value = !housesOpen.value;
  if (housesOpen.value) menuOpen.value = false;
}

onMounted(() => {
  const local = readLocalHouse();
  if (local) store.importHouse(local);
});

async function toggleEdit() {
  if (!content.editing) {
    content.editing = true;
    return;
  }
  try {
    await content.save();
    content.editing = false;
  } catch {
    content.editing = true;
  }
}
</script>
