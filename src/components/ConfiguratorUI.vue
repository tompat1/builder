<template>
  <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 z-10 overflow-hidden">
    <!-- Top Header Bar -->
    <HeaderBar v-if="!store.isFullscreen" @open-export="isExportOpen = true" />

    <div
      v-if="sunShown"
      class="pointer-events-none absolute inset-y-0 left-0 z-30 min-[1180px]:right-[434px]"
      :style="store.isFullscreen ? { right: '0px' } : undefined"
      aria-hidden="true"
    >
      <div
        id="day-sun"
        class="day-sun absolute -translate-x-1/2 -translate-y-1/2"
        :class="store.isFullscreen ? 'top-10' : 'top-16 md:top-[5.5rem] min-[1180px]:max-xl:top-[8.75rem]'"
        :style="{ left: sunLeft }"
      ></div>
    </div>

    <!-- 3D Scene In-Canvas Overlays (Aligned with the 3D Canvas Area) -->
    <div
      class="pointer-events-none absolute inset-0 z-10 overflow-hidden transition-all duration-300 min-[1180px]:right-[434px]"
      :style="{ right: store.isFullscreen ? '0px' : undefined }"
    >
      <!-- 3D Dimension Overlay -->
      <DimensionOverlay />
      <MeasureRuler />

      <!-- In-Scene Wall Panel Interaction Overlay (disabled in fullscreen mode) -->
      <PanelSlotOverlay v-if="!store.isFullscreen" />

      <HouseNotes />
    </div>

    <MoodBoard v-if="store.showMood" />

    <div class="pointer-events-none mt-auto flex w-full min-w-0 flex-col gap-2 min-[1180px]:contents">
    <!-- Lower-Left Toolset (Zoom, Fullscreen, Center, Measure, Undo, Redo, Notes) -->
    <ToolSet
      :ai-open="isHouseImportOpen"
      @zoom-in="$emit('zoom-in')"
      @zoom-out="$emit('zoom-out')"
      @reset-view="$emit('reset-view')"
      @mark-view="$emit('mark-view')"
      @toggle-ai="isHouseImportOpen = !isHouseImportOpen"
      @close-ai="isHouseImportOpen = false"
    />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <section
        v-if="isHouseImportOpen"
        id="ai-concierge-panel"
        class="pointer-events-auto absolute inset-x-3 bottom-3 top-24 z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md min-[1180px]:inset-x-auto min-[1180px]:bottom-[6.5rem] min-[1180px]:left-6 min-[1180px]:top-auto min-[1180px]:max-h-[calc(100dvh-9rem)] min-[1180px]:w-[410px]"
        :aria-label="t('tools.aiConcierge')"
      >
        <header class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-4 py-3.5">
          <div class="flex min-w-0 items-center gap-3">
            <img src="/brand/icon_aiconcierge.svg" alt="" class="h-8 w-9 shrink-0 object-contain" />
            <div class="min-w-0">
              <h2 class="text-sm font-extrabold tracking-tight text-slate-900">{{ t('tools.aiConcierge') }}</h2>
              <p class="text-[11px] font-semibold text-slate-500">{{ t('houseImport.title') }}</p>
            </div>
          </div>
          <button
            id="btn-close-ai-concierge"
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :aria-label="t('tools.closeAiConcierge')"
            @click="isHouseImportOpen = false"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <HouseImport />
        </div>
      </section>
    </Transition>

    <!-- Right Sidebar / Mobile Bottom Sheet -->
    <aside
      v-if="!store.isFullscreen"
      id="config-panel"
      class="pointer-events-auto z-40 mt-auto flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md max-[1179px]:max-h-[min(68dvh,calc(100dvh-11rem))] min-[1180px]:absolute min-[1180px]:bottom-[max(1.5rem,env(safe-area-inset-bottom))] min-[1180px]:right-6 min-[1180px]:top-24 min-[1180px]:h-auto min-[1180px]:max-h-[calc(100dvh-7.5rem)] min-[1180px]:w-[410px] min-[1180px]:justify-between"
      :aria-label="t('panel.label')"
    >
      <!-- Main Panel Title (Desktop) -->
      <div class="hidden min-[1180px]:block shrink-0 border-b border-slate-100 px-5 pb-2 pt-4">
        <h2 class="text-base font-extrabold tracking-tight text-slate-900">
          <Cms k="panel.title" />
        </h2>
      </div>

      <!-- Options sit above the icon row on a phone, and under it on a wide screen. -->
      <div
        id="config-sheet-options"
        class="sheet-reveal min-h-0 max-[1179px]:order-1 min-[1180px]:flex min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:flex-col"
        :class="sheetOpen ? 'is-open' : ''"
        :aria-hidden="narrow && !sheetOpen ? true : undefined"
        :inert="narrow && !sheetOpen ? true : undefined"
      >
        <div class="min-h-0 max-[1179px]:overflow-hidden min-[1180px]:flex min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:flex-col">
          <div
            ref="optionsScroll"
            class="panel-scrollbar max-h-[calc(min(68dvh,100dvh-11rem)-6.25rem)] space-y-4 overflow-y-auto overscroll-contain p-4 min-[1180px]:max-h-none min-[1180px]:min-h-0 min-[1180px]:flex-1 md:p-5"
          >
            <OptionsGrid @placed="closeMobilePicker" />
            <AIAssistantBar />
          </div>
        </div>
      </div>

      <!-- Category icons. On a phone this row is the whole bar until a step is chosen. -->
      <div class="w-full min-w-0 shrink-0 border-t border-slate-100/80 bg-white/50 px-3 py-2.5 max-[1179px]:order-2 max-[1179px]:pb-[max(0.625rem,env(safe-area-inset-bottom))] min-[1180px]:border-b min-[1180px]:border-t-0 min-[1180px]:px-5 min-[1180px]:py-3">
        <CategoryNav :expanded="narrow ? sheetOpen : true" @pick="onPickCategory" />
      </div>

      <!-- Footer Quick Status Summary -->
      <div class="hidden shrink-0 items-center rounded-b-2xl border-t border-slate-100 bg-slate-50/90 p-3 min-[1180px]:flex md:p-4">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs shrink-0"></span>
          <span class="text-xs text-slate-700 font-semibold truncate">
            <Cms :k="`catalog.${store.currentSize.id}.name`" :fallback="store.currentSize.name" /> • <Cms :k="`catalog.${store.currentMaterial.id}.name`" :fallback="store.currentMaterial.name" />
          </span>
        </div>
      </div>
    </aside>
    </div>

    <!-- Export Modal -->
    <ExportModal :is-open="isExportOpen" @close="isExportOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useConfigStore, type CategoryKey } from '../store/useConfigStore';
import { headingForFacing, sunAlongDay, sunPlacement } from '../three-engine/sunPosition';
import { useLabels } from '../i18n';
import HeaderBar from './HeaderBar.vue';
import CategoryNav from './CategoryNav.vue';
import OptionsGrid from './OptionsGrid.vue';
import AIAssistantBar from './AIAssistantBar.vue';
import HouseImport from './HouseImport.vue';
import ExportModal from './ExportModal.vue';
import ToolSet from './ToolSet.vue';
import DimensionOverlay from './DimensionOverlay.vue';
import MeasureRuler from './MeasureRuler.vue';
import PanelSlotOverlay from './PanelSlotOverlay.vue';
import HouseNotes from './HouseNotes.vue';
import MoodBoard from './MoodBoard.vue';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();
const sunShown = computed(() => {
  if (!store.showSun) return false;
  if (store.viewMode !== 'utsida') return false;
  return sunPlacement(store.sunHour, headingForFacing(store.facing)).altitude > 0.02;
});
const sunLeft = computed(() => `${(8 + sunAlongDay(store.sunHour) * 84).toFixed(1)}%`);
const isExportOpen = ref(false);
const isHouseImportOpen = ref(false);
const sheetOpen = ref(false);
const narrow = ref(false);
const optionsScroll = ref<HTMLElement | null>(null);

function readNarrow() {
  narrow.value = window.matchMedia('(max-width: 1179px)').matches;
}

function closeMobilePicker() {
  if (!narrow.value) return;
  sheetOpen.value = false;
  store.deselectSlot();
}

function onPickCategory(id: CategoryKey) {
  if (narrow.value && sheetOpen.value && store.selectedCategory === id) {
    sheetOpen.value = false;
    return;
  }
  store.selectCategory(id);
}

function onTourSheet(event: Event) {
  if (!narrow.value) return;
  sheetOpen.value = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;
}

onMounted(() => {
  readNarrow();
  window.addEventListener('resize', readNarrow);
  window.addEventListener('builder:onboarding-sheet', onTourSheet);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', readNarrow);
  window.removeEventListener('builder:onboarding-sheet', onTourSheet);
});

watch(
  () => store.categoryRequest,
  () => {
    sheetOpen.value = true;
    void nextTick(() => {
      if (optionsScroll.value) optionsScroll.value.scrollTop = 0;
    });
  }
);

defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'reset-view'): void;
  (e: 'mark-view'): void;
}>();
</script>

<style scoped>
.sheet-reveal {
  transition: grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (max-width: 1179px) {
  .sheet-reveal {
    display: grid;
    grid-template-rows: 0px;
    transition: grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .sheet-reveal.is-open {
    grid-template-rows: calc(min(68dvh, 100dvh - 11rem) - 6.25rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet-reveal {
    transition: none;
  }
}

.day-sun {
  width: 92px;
  height: 92px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgb(255 248 230 / 0.62) 0%,
    rgb(255 186 80 / 0.34) 24%,
    rgb(255 122 20 / 0.14) 46%,
    transparent 68%
  );
  box-shadow:
    0 0 16px 4px rgb(255 176 64 / 0.42),
    0 0 46px 18px rgb(255 140 32 / 0.28);
  transition: left 220ms ease-out;
}

/* 11" landscape: the noon sun would land on the header controls. */
@media (min-width: 1180px) and (max-width: 1279px) {
  .day-sun {
    box-shadow:
      0 0 12px 2px rgb(255 176 64 / 0.35),
      0 0 22px 6px rgb(255 140 32 / 0.18);
  }
}

.panel-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.panel-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.panel-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.panel-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 9999px;
}

.panel-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>
