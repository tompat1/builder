<template>
  <SiteFrame>
    <section class="relative flex flex-1 flex-col overflow-hidden">
      <img
        src="/brand/landing.webp"
        :alt="t('site.heroAlt')"
        class="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-[46%_48%] md:block"
        style="mask-image: linear-gradient(102deg, transparent 0%, transparent 22%, #000 58%, #000 100%); -webkit-mask-image: linear-gradient(102deg, transparent 0%, transparent 22%, #000 58%, #000 100%)"
      />
      <div class="relative z-10 flex w-full flex-1 flex-col px-4 py-10 md:px-8 md:py-12">
        <div class="max-w-xl">
          <h1 class="max-w-[12ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-pine md:text-7xl">
            {{ t('site.heroTitle') }}
          </h1>
          <p class="mt-5 max-w-[36ch] text-lg leading-relaxed text-pine/80">{{ t('site.heroLead') }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <router-link to="/build" class="inline-flex items-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-semibold text-ivory hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
              {{ t('site.start') }}
              <span aria-hidden="true">→</span>
            </router-link>
            <router-link to="/homes" class="inline-flex items-center rounded-full border border-pine/25 bg-ivory px-5 py-3 text-sm font-semibold text-pine hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
              {{ t('site.explore') }}
            </router-link>
          </div>
        </div>
        <img src="/brand/landing.webp" alt="" class="mt-8 h-64 w-full object-cover object-[75%_center] md:hidden" />
        <ul class="relative mt-12 grid gap-8 sm:grid-cols-3 md:mb-10 md:mt-auto md:max-w-2xl md:before:pointer-events-none md:before:absolute md:before:-bottom-4 md:before:-left-8 md:before:top-0 md:before:w-[48rem] md:before:bg-gradient-to-r md:before:from-ivory md:before:via-ivory/80 md:before:to-transparent md:before:content-['']">
          <li v-for="point in points" :key="point.title" class="relative z-10">
            <svg class="h-9 w-9 text-pine" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <template v-if="point.icon === 'sliders'">
                <path d="M8 3.5v17M16 3.5v17" />
                <rect x="6" y="8" width="4" height="3.2" rx="0.6" fill="currentColor" stroke="none" />
                <rect x="14" y="13" width="4" height="3.2" rx="0.6" fill="currentColor" stroke="none" />
              </template>
              <template v-else-if="point.icon === 'cube'">
                <path d="M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6L12 3.2z" />
                <path d="M12 12.2 20 7.6M12 12.2 4 7.6M12 12.2v8.6" />
              </template>
              <template v-else>
                <path d="M3.5 11.2 12 4l8.5 7.2V20h-17v-8.8z" />
                <path d="M9.5 20v-6h5v6" />
              </template>
            </svg>
            <p class="mt-4 text-lg font-semibold leading-snug text-pine">{{ t(point.title) }}</p>
            <p class="mt-1.5 max-w-[22ch] text-sm leading-relaxed text-pine/75">{{ t(point.body) }}</p>
          </li>
        </ul>
      </div>

      <router-link
        to="/merch"
        class="relative z-10 mx-4 mb-6 mt-2 flex items-center gap-3 self-end rounded-2xl bg-white p-2.5 pr-4 shadow-[0_12px_28px_-16px_rgba(23,61,53,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine md:absolute md:bottom-6 md:right-6 md:mx-0 md:mb-0 md:mt-0 md:w-[18.5rem]"
      >
          <img src="/merch/07.jpg" alt="" class="h-16 w-16 shrink-0 rounded-xl object-cover" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-pine">{{ t('site.merchTitle') }}</span>
            <span class="mt-0.5 block text-xs leading-snug text-pine/70">{{ t('site.merchBody') }}</span>
          </span>
          <span aria-hidden="true" class="text-lg text-pine">→</span>
      </router-link>
    </section>
  </SiteFrame>
</template>

<script setup lang="ts">
import SiteFrame from '../components/site/SiteFrame.vue';
import { useLabels } from '../i18n';

const { t } = useLabels();

const points = [
  { icon: 'sliders', title: 'site.deepTitle', body: 'site.deepBody' },
  { icon: 'cube', title: 'site.viewTitle', body: 'site.viewBody' },
  { icon: 'house', title: 'site.sidesTitle', body: 'site.sidesBody' }
];

</script>
