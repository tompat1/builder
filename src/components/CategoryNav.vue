<template>
  <nav class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" :aria-label="t('nav.label')">
    <button
      v-for="(cat, idx) in categories"
      :key="cat.id"
      :id="`category-${cat.id}`"
      type="button"
      @click="store.selectCategory(cat.id)"
      :class="[
        'flex flex-col items-center justify-center min-w-[58px] min-h-[52px] py-2 px-1.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
        store.selectedCategory === cat.id
          ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 hover:border-[#FF5A00]'
      ]"
      :aria-current="store.selectedCategory === cat.id ? 'step' : undefined"
    >
      <!-- Authored SVG Architectural Icons (No Emojis) -->
      <span class="mb-1 flex items-center justify-center">
        <!-- Storlek (Dimensions / Blueprint) -->
        <svg v-if="cat.id === 'size'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2" />
          <path d="m11.5 9.5 2-2" />
          <path d="m8.5 6.5 2-2" />
          <path d="m17.5 15.5 2-2" />
        </svg>

        <!-- Tak (Roof) -->
        <svg v-else-if="cat.id === 'roof'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M19 8.5V20H5V8.5" />
        </svg>

        <!-- Loft (Loft ladder / level) -->
        <svg v-else-if="cat.id === 'loft'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3v18" />
          <path d="M18 3v18" />
          <path d="M6 7h12" />
          <path d="M6 12h12" />
          <path d="M6 17h12" />
        </svg>

        <!-- Dörrar (Door with swing arc) -->
        <svg v-else-if="cat.id === 'doors'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 21h16" />
          <path d="M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17" />
          <path d="M12 4c5 0 7 2 7 8v9" />
          <circle cx="10" cy="12" r="1" fill="currentColor" />
        </svg>

        <!-- Fönster (Window with multipane sash) -->
        <svg v-else-if="cat.id === 'windows'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 3v18" />
          <path d="M3 12h18" />
        </svg>

        <!-- Portar (Sectional garage door) -->
        <svg v-else-if="cat.id === 'gates'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M10 18h4" />
        </svg>
      </span>

      <span class="text-[11px] font-medium tracking-tight whitespace-nowrap">
        <Cms :k="`nav.${cat.id}`" />
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useConfigStore, type CategoryKey } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();

const categories: { id: CategoryKey }[] = [
  { id: 'size' },
  { id: 'roof' },
  { id: 'loft' },
  { id: 'doors' },
  { id: 'windows' },
  { id: 'gates' }
];
</script>
