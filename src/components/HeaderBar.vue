<template>
  <header
    class="pointer-events-auto flex items-center justify-between bg-white/95 backdrop-blur-md shadow-sm rounded-2xl px-3 py-2 md:px-6 md:py-3 border border-slate-200/80 transition-all z-20"
    role="banner"
  >
    <!-- Brand & Top Links (Matching Skånska Byggvaror) -->
    <div class="flex items-center gap-3 md:gap-5">
      <!-- Logo Badge -->
      <router-link to="/" class="flex items-center gap-2.5 text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
        <BrandMark class="h-8 w-auto" />
        <div class="block">
          <div class="flex items-center gap-1.5 leading-none">
            <span class="font-extrabold text-slate-900 tracking-tight text-sm md:text-base">Builder</span>
          </div>
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5"><Cms k="brand.tagline" /></span>
        </div>
      </router-link>

      <div class="h-6 w-px bg-slate-200 hidden md:block"></div>

      <!-- Action Quick-links -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          id="btn-save-project"
          :aria-expanded="housesOpen"
          @click="toggleHouses"
          class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1"
        >
          <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span><Cms k="header.save" /></span>
        </button>

        <button
          type="button"
          id="btn-open-blueprint"
          @click="$emit('open-export')"
          class="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1"
        >
          <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span><Cms k="header.drawings" /></span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
    <div
      class="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner shrink-0"
      role="group"
      :aria-label="t('lang.label')"
    >
      <button
        type="button"
        id="lang-sv"
        lang="sv"
        :aria-pressed="locale === 'sv'"
        @click="applyLocale('sv')"
        :class="langButtonClass(locale === 'sv')"
      >
        Sv
      </button>
      <button
        type="button"
        id="lang-en"
        lang="en"
        :aria-pressed="locale === 'en'"
        @click="applyLocale('en')"
        :class="langButtonClass(locale === 'en')"
      >
        En
      </button>
    </div>

    <!-- Center Segmented Master Toggle (Outside / Inside) -->
    <nav class="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner shrink-0" role="tablist" :aria-label="t('header.view')">
      <button
        type="button"
        role="tab"
        id="toggle-utsida"
        :aria-selected="store.viewMode === 'utsida'"
        @click="store.setViewMode('utsida')"
        :class="[
          'flex items-center gap-1 px-2.5 md:px-4 py-1 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[30px] md:min-h-[34px]',
          store.viewMode === 'utsida'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
          'flex items-center gap-1 px-2.5 md:px-4 py-1 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[30px] md:min-h-[34px]',
          store.viewMode === 'insida'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        ]"
      >
        <span><Cms k="header.inside" /></span>
      </button>
    </nav>
    </div>

    <!-- Price and Action Cluster -->
    <div class="flex items-center gap-2 md:gap-5 shrink-0">
      <AccountMenu ref="accountMenu" />
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
          <span class="hidden md:block text-[10px] uppercase font-bold text-slate-400 leading-none"><Cms k="header.total" /></span>
          <span class="font-extrabold text-xs sm:text-sm md:text-lg text-slate-900 tabular-nums whitespace-nowrap">
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

      <button
        type="button"
        id="btn-next-step"
        class="bg-[#1b5e40] hover:bg-[#154a32] active:bg-[#0f3624] text-white font-extrabold px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm transition-all duration-150 shadow-sm hover:shadow min-h-[32px] md:min-h-[38px] flex items-center gap-1.5 shrink-0"
        @click="$emit('open-export')"
      >
        <span><Cms k="panel.export" /></span>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  </header>

  <SavedHouses :open="housesOpen" @close="housesOpen = false" @sign-in="accountMenu?.openLogin()" />

  <!-- Price Breakdown Flyout Modal -->
  <div
    v-if="showPriceBreakdown"
    class="pointer-events-auto absolute top-20 right-6 z-30 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 text-xs text-slate-700 animate-fade-in"
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
import { useConfigStore } from '../store/useConfigStore';
import { useContentStore } from '../store/useContentStore';
import { useSessionStore } from '../store/useSessionStore';
import { applyLocale, useLabels } from '../i18n';
import { readLocalHouse } from '../services/houseSave';
import AccountMenu from './AccountMenu.vue';
import SavedHouses from './SavedHouses.vue';
import Cms from './Cms.vue';

const store = useConfigStore();
const content = useContentStore();
const session = useSessionStore();
const accountMenu = ref<{ openLogin: () => void } | null>(null);
const housesOpen = ref(false);
const { t, locale, catalog, money, delta } = useLabels();
const showPriceBreakdown = ref(false);

defineEmits<{
  (e: 'open-export'): void;
}>();

function langButtonClass(active: boolean) {
  return [
    'px-2 md:px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-200 min-h-[30px] md:min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
    active
      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
  ];
}

function toggleHouses() {
  housesOpen.value = !housesOpen.value;
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
