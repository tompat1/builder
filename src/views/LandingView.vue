<template>
  <SiteFrame>
    <section class="relative flex flex-1 flex-col overflow-hidden">
      <CmsImage k="landing.heroDesktop" class="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-[46%_48%] md:block" style="mask-image: linear-gradient(102deg, transparent 0%, transparent 22%, #000 58%, #000 100%); -webkit-mask-image: linear-gradient(102deg, transparent 0%, transparent 22%, #000 58%, #000 100%)">
        <img
          src="/brand/landing.webp"
          :alt="t('site.heroAlt')"
          class="h-full w-full object-cover object-[46%_48%]"
        />
      </CmsImage>
      <div class="relative z-10 flex w-full flex-1 flex-col px-4 py-10 md:px-8 md:py-12">
        <div class="max-w-xl">
          <h1 class="max-w-[12ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-pine md:text-7xl">
            <Cms k="site.heroTitle" />
          </h1>
          <p class="mt-5 max-w-[36ch] text-lg leading-relaxed text-pine/80"><Cms k="site.heroLead" /></p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <ActionControl to="/build" prominent><Cms k="site.start" /></ActionControl>
            <ActionControl to="/homes" appearance="outline"><Cms k="site.explore" /></ActionControl>
          </div>
        </div>
        <CmsImage k="landing.heroMobile" class="mt-8 h-64 w-full object-cover object-[75%_center] md:hidden">
          <img src="/brand/landing.webp" alt="" class="h-full w-full object-cover object-[75%_center]" />
        </CmsImage>
        <ul class="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 md:mb-10 md:mt-auto md:max-w-4xl md:before:pointer-events-none md:before:absolute md:before:-bottom-4 md:before:-left-8 md:before:top-0 md:before:w-[64rem] md:before:bg-gradient-to-r md:before:from-ivory md:before:via-ivory/80 md:before:to-transparent md:before:content-['']">
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
              <template v-else-if="point.icon === 'house'">
                <path d="M3.5 11.2 12 4l8.5 7.2V20h-17v-8.8z" />
                <path d="M9.5 20v-6h5v6" />
              </template>
              <template v-else>
                <path d="M3.2 4.5h8.1a3.2 3.2 0 0 1 3.2 3.2v3.1H8.4l-3.5 3v-3H4a2.5 2.5 0 0 1-2.5-2.5V6.2a1.7 1.7 0 0 1 1.7-1.7Z" />
                <circle cx="5.8" cy="7.6" r="0.65" fill="currentColor" stroke="none" />
                <circle cx="9" cy="7.6" r="0.65" fill="currentColor" stroke="none" />
                <path d="M12 11.4c2.1-.35 3.8.15 5 1.25 1.15-.8 2.55-1.25 4.2-1.25v7.25c-1.65 0-3.05.45-4.2 1.35-1.25-.95-2.9-1.4-5-1.35v-7.25Z" />
                <path d="M17 12.65V20" />
                <path d="m18.8 3 .55 1.45 1.45.55-1.45.55L18.8 7l-.55-1.45L16.8 5l1.45-.55L18.8 3Z" fill="#FF5A00" stroke="none" />
              </template>
            </svg>
            <p class="mt-4 text-lg font-semibold leading-snug text-pine"><Cms :k="point.title" /></p>
            <p class="mt-1.5 max-w-[22ch] text-sm leading-relaxed text-pine/75"><Cms :k="point.body" /></p>
          </li>
        </ul>
      </div>

      <router-link
        to="/merch"
        class="group relative z-10 mx-4 mb-6 mt-2 flex items-stretch self-end overflow-hidden rounded-2xl bg-white text-pine shadow-[0_12px_28px_-16px_rgba(23,61,53,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine xl:absolute xl:bottom-6 xl:right-6 xl:mx-0 xl:mb-0 xl:mt-0 xl:w-[18.5rem]"
      >
          <span class="flex min-w-0 flex-1 items-center gap-3 p-2.5">
            <CmsImage k="landing.merchImage" class="h-16 w-16 shrink-0 rounded-xl object-cover">
              <img src="/merch/07.jpg" alt="" class="h-full w-full object-cover" />
            </CmsImage>
            <span class="min-w-0">
              <span class="block text-sm font-semibold"><Cms k="site.merchTitle" /></span>
              <span class="mt-0.5 block text-xs leading-snug text-pine/70"><Cms k="site.merchBody" /></span>
            </span>
          </span>
          <span class="grid w-12 shrink-0 place-items-center bg-[#FF5A00] text-graphite">
            <ArrowMark />
          </span>
      </router-link>
    </section>
  </SiteFrame>
</template>

<script setup lang="ts">
import ActionControl from '../components/site/ActionControl.vue';
import ArrowMark from '../components/site/ArrowMark.vue';
import SiteFrame from '../components/site/SiteFrame.vue';
import Cms from '../components/Cms.vue';
import CmsImage from '../components/CmsImage.vue';
import { useLabels } from '../i18n';

const { t } = useLabels();

const points = [
  { icon: 'sliders', title: 'site.deepTitle', body: 'site.deepBody' },
  { icon: 'cube', title: 'site.viewTitle', body: 'site.viewBody' },
  { icon: 'house', title: 'site.sidesTitle', body: 'site.sidesBody' },
  { icon: 'concierge', title: 'site.conciergeTitle', body: 'site.conciergeBody' }
];

</script>
