<template>
  <nav
    ref="navEl"
    class="flex w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain min-[1180px]:grid min-[1180px]:grid-cols-10 min-[1180px]:gap-1 min-[1180px]:overflow-visible min-[1180px]:max-w-[420px] min-[1180px]:mx-auto"
    :aria-label="t('nav.label')"
  >
    <button
      v-for="(cat, idx) in categories"
      :key="cat.id"
      :id="`category-${cat.id}`"
      type="button"
      @click="pick(cat.id)"
      :aria-expanded="store.selectedCategory === cat.id ? expanded : undefined"
      :class="[
        'flex w-[4.75rem] shrink-0 flex-col items-center justify-center min-h-11 py-2 px-1 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 min-[1180px]:w-auto min-[1180px]:shrink min-[1180px]:col-span-2 min-[1180px]:min-h-[3rem] min-[1180px]:py-1.5',
        idx === 5 ? 'min-[1180px]:col-start-2' : '',
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

        <!-- Kulör (Color palette / paint) -->
        <svg v-else-if="cat.id === 'color'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.992 6.012 17.49 2 12 2z" />
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
        <!-- Ute (Door roof and terrace) -->
        <svg v-else-if="cat.id === 'extras'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5 12 5l9 5.5" />
          <path d="M6 10.5V16" />
          <path d="M18 10.5V16" />
          <path d="M4 16h16" />
          <path d="M3 19.5h18" />
        </svg>
        <!-- Interiör (Interior walls/layout) -->
        <svg v-else-if="cat.id === 'interior'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h8v12" />
          <path d="M15 3v8h6" />
        </svg>
      </span>

      <span class="text-[11px] font-medium tracking-tight whitespace-nowrap">
        <Cms :k="`nav.${cat.id}`" />
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useConfigStore, type CategoryKey } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();
const navEl = ref<HTMLElement | null>(null);

defineProps<{
  expanded: boolean;
}>();

const emit = defineEmits<{
  (e: 'pick', id: CategoryKey): void;
}>();

function pick(id: CategoryKey) {
  emit('pick', id);
}

watch(() => store.selectedCategory, async () => {
  await nextTick();
  const nav = navEl.value;
  const btn = nav?.querySelector<HTMLElement>(`#category-${store.selectedCategory}`);
  if (!nav || !btn || nav.scrollWidth <= nav.clientWidth) return;
  const left = btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2;
  nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
});

const categories: { id: CategoryKey }[] = [
  { id: 'size' },
  { id: 'color' },
  { id: 'roof' },
  { id: 'doors' },
  { id: 'windows' },
  { id: 'extras' },
  { id: 'loft' },
  { id: 'interior' },
  { id: 'gates' }
];
</script>
