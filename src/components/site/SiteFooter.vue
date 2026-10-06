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
          <li><router-link class="hover:text-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory" to="/homes" :aria-current="homesCurrent">{{ t('site.explore') }}</router-link></li>
          <li><router-link class="hover:text-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory" to="/homes#how" :aria-current="howCurrent">{{ t('site.how') }}</router-link></li>
          <li><router-link class="hover:text-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory" to="/merch">{{ t('site.merch') }}</router-link></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{{ t('site.footerSupport') }}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><router-link class="hover:text-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory" to="/build">{{ t('site.start') }}</router-link></li>
          <li><router-link class="hover:text-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory" to="/login">{{ t('site.login') }}</router-link></li>
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
