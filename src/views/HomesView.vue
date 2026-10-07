<template>
  <SiteFrame>
    <section class="px-4 py-12 md:px-8 md:py-16">
      <h1 class="max-w-[12ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-pine md:text-7xl">{{ t('site.explore') }}</h1>
      <p class="mt-5 max-w-xl text-lg leading-relaxed text-pine/80">{{ t('site.homesLead') }}</p>
      <ul class="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
        <li v-for="size in homes" :key="size.id">
          <router-link
            to="/build"
            class="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
            @click="store.selectSize(size.id)"
          >
            <span class="relative block overflow-hidden rounded-2xl bg-white">
              <img
                :src="size.image"
                :alt="catalog(size.id, 'name', size.name)"
                class="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100"
              />
              <span class="absolute left-3 top-3 rounded-full bg-ivory/95 px-2.5 py-1 text-xs font-semibold text-pine">{{ catalog(size.id, 'badge', size.badge) }}</span>
            </span>
            <span class="mt-4 block font-display text-3xl font-extrabold tracking-[-0.03em] text-pine">{{ size.areaSqMeters }} m²</span>
            <span class="mt-1 block text-sm font-semibold text-graphite">{{ catalog(size.id, 'name', size.name) }}</span>
            <span class="mt-1.5 block max-w-[34ch] text-sm leading-relaxed text-pine/75">{{ catalog(size.id, 'desc', size.desc) }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <section id="how" class="scroll-mt-24 border-t border-pine/10 px-4 py-12 md:px-8 md:py-16">
      <h2 class="max-w-[14ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-pine md:text-6xl">{{ t('site.how') }}</h2>
      <p class="mt-5 max-w-xl text-lg leading-relaxed text-pine/80">{{ t('site.howLead') }}</p>
      <ol class="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
        <li v-for="(step, index) in steps" :key="step.title">
          <div class="relative">
            <span
              v-if="index < steps.length - 1"
              aria-hidden="true"
              class="pointer-events-none absolute left-[90%] top-1/2 z-0 h-px w-[calc(20%+1.5rem)] -translate-y-1/2 bg-pine/45"
              :class="index % 2 === 0 ? 'hidden sm:block' : 'hidden xl:block'"
            />
            <img :src="step.image" alt="" class="relative z-10 aspect-[3/2] w-full object-contain" />
          </div>
          <span class="grid h-8 w-8 place-items-center rounded-full bg-pine text-sm font-bold text-ivory">{{ index + 1 }}</span>
          <p class="mt-3 font-display text-xl font-extrabold tracking-[-0.03em] text-pine">{{ t(step.title) }}</p>
          <p class="mt-1.5 max-w-[28ch] text-sm leading-relaxed text-pine/75">{{ t(step.body) }}</p>
        </li>
      </ol>
      <ActionControl to="/build" prominent class="mt-10">{{ t('site.start') }}</ActionControl>
    </section>
  </SiteFrame>
</template>

<script setup lang="ts">
import ActionControl from '../components/site/ActionControl.vue';
import SiteFrame from '../components/site/SiteFrame.vue';
import { useLabels } from '../i18n';
import { SIZE_OPTIONS, useConfigStore } from '../store/useConfigStore';

const { t, catalog } = useLabels();
const store = useConfigStore();

const images: Record<string, string> = {
  'size-15': '/homes/home-15m2.webp',
  'size-25': '/homes/home-25m2.webp',
  'size-30': '/homes/home-29-9m2.webp',
  'size-40': '/homes/home-40m2.webp'
};

const homes = SIZE_OPTIONS.map((size) => ({ ...size, image: images[size.id] }));

const steps = [
  { title: 'site.stepShape', body: 'site.stepShapeBody', image: '/steps/step-01-shape.webp' },
  { title: 'site.stepExterior', body: 'site.stepExteriorBody', image: '/steps/step-02-exterior.webp' },
  { title: 'site.stepInterior', body: 'site.stepInteriorBody', image: '/steps/step-03-interior.webp' },
  { title: 'site.stepReview', body: 'site.stepReviewBody', image: '/steps/step-04-review.webp' }
];
</script>
