<template>
  <header
    class="pointer-events-auto relative z-20 flex min-[1180px]:hidden items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-md"
    role="banner"
  >
    <router-link
      to="/"
      class="grid h-11 w-11 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
      aria-label="Builder"
    >
      <BrandMark class="h-8 w-auto text-[#FF5A00]" />
    </router-link>
    <div class="flex items-center gap-1">
      <button
        type="button"
        id="btn-search-mobile"
        class="grid h-11 w-11 place-items-center rounded-xl text-[#173D35] hover:bg-[#F5F3EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        :aria-label="t('search.open')"
        @click="openSearch"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16.5 4 4" />
        </svg>
      </button>
      <button
        type="button"
        id="btn-lang-mobile"
        class="inline-flex h-11 items-center gap-[3px] rounded-xl border border-[#173D35]/15 bg-white px-3 text-[11px] tracking-[0.05em] shadow-[0_1px_2px_rgba(23,61,53,0.06)] hover:border-[#173D35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        :aria-label="locale === 'sv' ? 'English' : 'Svenska'"
        :title="locale === 'sv' ? 'English' : 'Svenska'"
        @click="applyLocale(locale === 'en' ? 'sv' : 'en', true)"
      >
        <span :class="locale === 'sv' ? 'font-extrabold text-[#173D35]' : 'font-semibold text-[#173D35]/40'">SV</span>
        <span class="font-semibold text-[#173D35]/30" aria-hidden="true">/</span>
        <span :class="locale === 'en' ? 'font-extrabold text-[#173D35]' : 'font-semibold text-[#173D35]/40'">EN</span>
      </button>
      <div class="flex h-11 items-center rounded-full border border-[#173D35]/15 bg-white">
        <button
          v-if="session.user"
          id="btn-account-mobile"
          type="button"
          class="grid h-11 w-11 place-items-center rounded-full bg-[#FF5A00] text-[#222925] hover:bg-[#e95000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00] disabled:cursor-wait disabled:opacity-60"
          :aria-label="t('account.logout')"
          :title="t('account.logout')"
          :disabled="logoutBusy"
          @click="signOut"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" />
            <path d="M13 8l4 4-4 4M17 12H9" />
          </svg>
        </button>
        <router-link
          v-else
          id="btn-account-mobile"
          to="/login"
          class="grid h-11 w-11 place-items-center rounded-full text-[#173D35] hover:bg-[#173D35]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
          :aria-label="t('site.login')"
          :title="t('site.login')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" />
          </svg>
        </router-link>
      </div>
      <button
        type="button"
        id="btn-save-project-mobile"
        class="grid h-11 w-11 place-items-center rounded-xl text-[#FF5A00] hover:bg-[#F5F3EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        :aria-expanded="housesOpen"
        :aria-label="content.text(`${locale}:header.projects`, 'Projects')"
        @click="toggleHouses"
      >
        <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </button>
      <CloudSyncIndicator compact />
    </div>
  </header>

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
      <button
        type="button"
        id="btn-search"
        class="grid h-11 w-11 place-items-center rounded-xl text-[#173D35] hover:bg-[#F5F3EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        :aria-label="t('search.open')"
        @click="openSearch"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16.5 4 4" />
        </svg>
      </button>
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
      <GithubSignIn
        v-if="!session.user"
        id="btn-github-header"
        :wide="false"
        :disabled="githubBusy"
        :aria-label="t('site.github')"
        :title="t('site.github')"
        @click="github"
      >
        GitHub
      </GithubSignIn>
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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BrandMark from './brand/BrandMark.vue';
import ActionControl from './site/ActionControl.vue';
import { useConfigStore } from '../store/useConfigStore';
import { useContentStore } from '../store/useContentStore';
import { useSessionStore } from '../store/useSessionStore';
import { applyLocale, useLabels } from '../i18n';
import GithubSignIn from './account/GithubSignIn.vue';
import { beginGithubLogin, logoutAccount } from '../services/account';
import { readLocalHouse } from '../services/houseSave';
import SavedHouses from './SavedHouses.vue';
import AdminAiPanel from './AdminAiPanel.vue';
import CloudSyncIndicator from './CloudSyncIndicator.vue';
import Cms from './Cms.vue';
import { openSearch, searchAction, searchRequest } from '../search/run';

const store = useConfigStore();
const content = useContentStore();
const session = useSessionStore();
const router = useRouter();
const housesOpen = ref(false);
const logoutBusy = ref(false);
const githubBusy = ref(false);
const { t, locale, catalog, money, delta } = useLabels();
const showPriceBreakdown = ref(false);

defineEmits<{
  (e: 'open-export'): void;
}>();

function toggleHouses() {
  housesOpen.value = !housesOpen.value;
}

async function github() {
  if (githubBusy.value) return;
  githubBusy.value = true;
  try {
    await beginGithubLogin();
  } catch (caught) {
    const code = caught instanceof Error ? caught.message : 'github';
    await router.push({ path: '/login', query: { auth_error: code } });
  } finally {
    githubBusy.value = false;
  }
}

async function signOut() {
  if (logoutBusy.value) return;
  logoutBusy.value = true;
  try {
    await logoutAccount();
  } catch {
    // A failed server sign-out must not leave the browser session active.
  } finally {
    session.clearAccount();
    content.editing = false;
    logoutBusy.value = false;
  }
}

function onTourProjects(event: Event) {
  housesOpen.value = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;
}

function applySearchNavigation() {
  const action = searchAction.value;
  if (!action || action.path !== '/build') return;
  housesOpen.value = action.tool === 'projects';
}

watch(searchRequest, applySearchNavigation);

onMounted(() => {
  const local = readLocalHouse();
  if (local) store.importHouse(local);
  window.addEventListener('builder:onboarding-projects', onTourProjects);
  applySearchNavigation();
});

onBeforeUnmount(() => {
  window.removeEventListener('builder:onboarding-projects', onTourProjects);
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
