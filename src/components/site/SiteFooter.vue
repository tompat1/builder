<template>
  <footer class="bg-pine text-ivory">
    <div class="flex flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:gap-12 md:px-8">
      <div class="md:mr-auto">
        <BrandLockup to="/" class="text-ivory" />
        <p class="mt-2 text-sm text-ivory/80">{{ t('brand.tagline') }}</p>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{{ t('site.footerExplore') }}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><ActionControl to="/homes" appearance="text" class="hover:text-sage" :aria-current="homesCurrent">{{ t('site.explore') }}</ActionControl></li>
          <li><ActionControl to="/homes#how" appearance="text" class="hover:text-sage" :aria-current="howCurrent">{{ t('site.how') }}</ActionControl></li>
          <li><ActionControl to="/merch" appearance="text" class="hover:text-sage">{{ t('site.merch') }}</ActionControl></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{{ t('site.footerSupport') }}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><ActionControl to="/build" appearance="text" class="hover:text-sage">{{ t('site.start') }}</ActionControl></li>
          <li><ActionControl to="/login" appearance="text" class="hover:text-sage">{{ t('site.login') }}</ActionControl></li>
        </ul>
      </div>
      <div class="flex flex-col items-start gap-3 md:items-end">
        <p class="text-xs text-ivory/70">{{ t('site.rights') }}</p>
        <label class="text-sm">
          <span class="sr-only">{{ t('lang.label') }}</span>
          <select
            class="rounded-full border border-ivory/30 bg-pine px-3 py-2 text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
            :value="locale"
            @change="onLocale"
          >
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BrandLockup from '../brand/BrandLockup.vue';
import ActionControl from './ActionControl.vue';
import { applyLocale, useLabels, type AppLocale } from '../../i18n';

const { t, locale } = useLabels();
const route = useRoute();
const homesCurrent = computed(() => (route.path === '/homes' && route.hash !== '#how' ? 'page' : undefined));
const howCurrent = computed(() => (route.path === '/homes' && route.hash === '#how' ? 'page' : undefined));

function onLocale(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'sv' || value === 'en') applyLocale(value as AppLocale);
}
</script>
