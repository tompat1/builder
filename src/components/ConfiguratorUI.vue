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
      class="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 transition-all duration-300 flex flex-col justify-between mt-auto w-full min-[1180px]:w-[410px] min-[1180px]:absolute min-[1180px]:right-6 min-[1180px]:top-24 min-[1180px]:bottom-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[62dvh] min-[1180px]:max-h-[calc(100dvh-7.5rem)] z-40 overflow-hidden"
      :class="isMobileCollapsed ? 'h-auto max-h-[140px]' : 'h-[min(62dvh,calc(100dvh-31.5rem))] min-[1180px]:h-auto'"
      :aria-label="t('panel.label')"
    >
      <!-- Mobile Drawer Drag Handle & Collapse Header -->
      <div class="flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-[#173D35]/10 bg-[#F5F3EC] px-4 min-[1180px]:hidden">
        <span class="text-xs font-bold text-[#173D35]"><Cms k="panel.title" /></span>
        <button
          type="button"
          id="btn-toggle-mobile-sheet"
          @click="isMobileCollapsed = !isMobileCollapsed"
          class="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#173D35] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
        >
          <Cms v-if="isMobileCollapsed" k="panel.show" />
          <Cms v-else k="panel.hide" />
        </button>
      </div>

      <!-- Main Panel Title (Desktop) -->
      <div class="hidden min-[1180px]:block px-5 pt-4 pb-2 border-b border-slate-100 shrink-0">
        <h2 class="text-base font-extrabold text-slate-900 tracking-tight">
          <Cms k="panel.title" />
        </h2>
      </div>

      <!-- Fixed Menu / Category Navigation (Pinned at top of panel) -->
      <div v-show="!isMobileCollapsed" class="px-4 py-3 md:px-5 border-b border-slate-100/80 bg-white/50 shrink-0">
        <CategoryNav />
      </div>

      <!-- Main Scrollable Panel Content -->
      <div v-show="!isMobileCollapsed" class="p-4 md:p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0 panel-scrollbar">
        <!-- Dynamic Category & Material Options Grid -->
        <OptionsGrid />

        <!-- Embedded AI Architect Assistant -->
        <AIAssistantBar />
      </div>

      <!-- Footer Quick Status Summary -->
      <div class="p-3 md:p-4 bg-slate-50/90 border-t border-slate-100 rounded-b-2xl flex items-center shrink-0">
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
import { computed, ref, watch } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
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
const isMobileCollapsed = ref(false);
const isHouseImportOpen = ref(false);

// Auto-expand drawer when user selects a category (e.g. from 3D wall slot action pills)
watch(
  () => store.selectedCategory,
  () => {
    isMobileCollapsed.value = false;
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
