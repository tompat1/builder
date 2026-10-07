<template>
  <header class="sticky top-0 z-30 border-b border-pine/10 bg-ivory/95 backdrop-blur-md">
    <div class="flex h-[4.25rem] w-full items-center gap-6 px-4 md:px-8">
      <BrandLockup class="text-pine" mark-class="text-[#FF5A00]" />
      <nav class="ml-auto hidden items-center gap-7 md:flex" :aria-label="t('site.menu')">
        <a v-for="link in links" :key="link.to" :href="link.to" class="group inline-flex items-center gap-2" :class="linkClass(link.to)">
          <Cms :k="link.label" />
          <ArrowMark />
        </a>
      </nav>
      <div class="ml-auto flex items-center gap-2 md:ml-0">
        <button
          type="button"
          class="inline-flex h-[34px] items-center gap-[3px] rounded-md border border-pine/15 bg-white px-3 text-[11px] tracking-[0.05em] shadow-[0_1px_2px_rgba(23,61,53,0.06)] hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          :aria-label="locale === 'sv' ? 'English' : 'Svenska'"
          :title="locale === 'sv' ? 'English' : 'Svenska'"
          @click="toggleLocale"
        >
          <span :class="locale === 'sv' ? 'font-extrabold text-pine' : 'font-semibold text-pine/40'">SV</span>
          <span class="font-semibold text-pine/30" aria-hidden="true">/</span>
          <span :class="locale === 'en' ? 'font-extrabold text-pine' : 'font-semibold text-pine/40'">EN</span>
        </button>
        <div class="flex items-center rounded-full border border-pine/15 bg-white/80">
          <button
            type="button"
            class="relative grid h-10 w-10 place-items-center rounded-full text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            :aria-label="`${t('site.bag')} (${bag.count})`"
            :aria-expanded="bag.panel"
            @click="bag.panel ? bag.closePanel() : bag.openPanel()"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V7a3 3 0 0 1 6 0v1" />
            </svg>
            <span class="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold tabular-nums text-ivory">{{ bag.count }}</span>
          </button>
          <router-link
            :to="session.user ? '/build' : '/login'"
            class="grid h-10 w-10 place-items-center rounded-full text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            :aria-label="session.user ? session.user.name : t('site.login')"
          >
            <img v-if="session.user?.avatarUrl" :src="session.user.avatarUrl" alt="" class="h-7 w-7 rounded-full object-cover" />
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" />
            </svg>
          </router-link>
        </div>
        <ActionControl to="/build" prominent tone="graphite" class="max-md:hidden"><Cms k="site.start" /></ActionControl>
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-full text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine md:hidden"
          :aria-expanded="open"
          :aria-label="open ? t('site.close') : t('site.menu')"
          @click="open = !open"
        >
          <svg v-if="!open" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="open" class="border-t border-pine/10 bg-ivory px-4 py-4 md:hidden">
      <nav class="flex flex-col gap-1" :aria-label="t('site.menu')">
        <a v-for="link in links" :key="link.to" :href="link.to" class="group inline-flex items-center gap-2 rounded-xl px-3 py-3 text-base font-semibold text-pine" @click="open = false">
          <Cms :k="link.label" />
          <ArrowMark />
        </a>
        <router-link :to="session.user ? '/build' : '/login'" class="group inline-flex items-center gap-2 rounded-xl px-3 py-3 text-base font-semibold text-pine" @click="open = false">
          <template v-if="session.user">{{ session.user.name }}</template>
          <Cms v-else k="site.login" />
          <ArrowMark />
        </router-link>
        <ActionControl to="/build" prominent tone="graphite" class="mt-2 w-full" @click="open = false"><Cms k="site.start" /></ActionControl>
      </nav>
    </div>
  </header>
  <BagDrawer />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BrandLockup from '../brand/BrandLockup.vue';
import ActionControl from './ActionControl.vue';
import ArrowMark from './ArrowMark.vue';
import BagDrawer from './BagDrawer.vue';
import Cms from '../Cms.vue';
import { applyLocale, useLabels } from '../../i18n';
import { useBagStore } from '../../store/useBagStore';
import { useSessionStore } from '../../store/useSessionStore';

const { t, locale } = useLabels();
const bag = useBagStore();
const session = useSessionStore();
const route = useRoute();
const open = ref(false);

function toggleLocale() {
  applyLocale(locale.value === 'en' ? 'sv' : 'en');
}

const links = [
  { to: '/homes', label: 'site.explore' },
  { to: '/homes#how', label: 'site.how' },
  { to: '/merch', label: 'site.merch' }
];

function linkClass(to: string) {
  const active = to === '/merch'
    ? route.path === '/merch'
    : to === '/homes'
      ? route.path === '/homes' && route.hash !== '#how'
      : to === '/homes#how'
        ? route.hash === '#how'
        : false;
  return [
    'text-sm font-semibold text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine',
    active ? 'border-b-2 border-clay pb-0.5' : 'border-b-2 border-transparent pb-0.5 hover:border-sage'
  ];
}

watch(() => route.fullPath, () => {
  open.value = false;
  if (route.hash === '#bag') bag.openPanel();
  else bag.closePanel();
}, { immediate: true });
</script>
