<template>
  <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 z-10 overflow-hidden">
    <!-- Top Header Bar -->
    <HeaderBar v-if="!store.isFullscreen" @open-export="isExportOpen = true" />

    <div
      v-if="skyMarkerShown"
      class="pointer-events-none absolute inset-y-0 left-0 right-0 z-30"
      aria-hidden="true"
    >
      <div
        id="day-sun"
        class="absolute -translate-x-1/2 -translate-y-1/2"
        :class="[
          store.daylightMode === 'moon' ? 'day-moon' : 'day-sun',
          store.isFullscreen ? 'top-10' : 'top-16 md:top-[5.5rem] min-[1180px]:max-xl:top-[8.75rem]'
        ]"
        :style="{ left: sunLeft }"
      ></div>
    </div>

    <!-- 3D Scene In-Canvas Overlays (Aligned with the 3D Canvas Area) -->
    <div
      class="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      <!-- 3D Dimension Overlay -->
      <DimensionOverlay />
      <MeasureRuler />

      <!-- In-Scene Wall Panel Interaction Overlay (disabled in fullscreen mode and walkthrough) -->
      <PanelSlotOverlay v-if="!store.isFullscreen && !store.framingWalkthrough" />

      <HouseNotes />
    </div>

    <!-- Master Carpenter Timber Framing Walkthrough Overlay -->
    <BuilderWalkthroughOverlay v-if="store.framingWalkthrough" />

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
      v-if="!store.isFullscreen && !store.framingWalkthrough"
      id="config-panel"
      class="pointer-events-auto z-40 mt-auto flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md max-[1179px]:max-h-[min(68dvh,calc(100dvh-11rem))] min-[1180px]:absolute min-[1180px]:bottom-[max(1.5rem,env(safe-area-inset-bottom))] min-[1180px]:right-6 min-[1180px]:top-auto min-[1180px]:max-h-[calc(100dvh-7.5rem)] min-[1180px]:justify-between"
      :data-panel-cols="panelSingleColumn ? '1' : 'multi'"
      :style="panelInlineStyle"
      :aria-label="t('panel.label')"
    >
      <!-- Left Resize Handle (Desktop only) -->
      <div
        id="config-panel-resizer"
        role="separator"
        aria-orientation="vertical"
        tabindex="0"
        :aria-valuenow="desktopPanelWidth"
        :aria-valuemin="MIN_PANEL_WIDTH"
        :aria-valuemax="maxPanelWidth"
        :aria-label="t('panel.resizeHandle')"
        :title="t('panel.resizeHandle')"
        class="hidden min-[1180px]:flex absolute left-0 top-0 bottom-0 w-3.5 cursor-col-resize items-center justify-center z-50 select-none group touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]"
        @pointerdown="onResizeStart"
        @dblclick="onResizeReset"
        @keydown="onResizeKeydown"
      >
        <div
          class="h-10 w-1 rounded-full transition-all duration-150 shadow-2xs"
          :class="isResizing
            ? 'h-16 w-1.5 bg-[#FF5A00] ring-2 ring-[#FF5A00]/30 shadow-md'
            : 'bg-slate-300/80 group-hover:h-14 group-hover:w-1.5 group-hover:bg-[#FF5A00] group-hover:shadow-sm'"
        />
      </div>

      <!-- Top Height Resize Handle (Desktop only) -->
      <div
        id="config-panel-height-resizer"
        role="separator"
        aria-orientation="horizontal"
        tabindex="0"
        :aria-valuenow="desktopPanelHeight"
        :aria-valuemin="MIN_PANEL_HEIGHT"
        :aria-valuemax="maxDesktopPanelHeight"
        :aria-label="t('panel.resizeHeightHandle')"
        :title="t('panel.resizeHeightHandle')"
        class="hidden min-[1180px]:flex absolute left-0 right-0 top-0 h-3.5 cursor-row-resize items-center justify-center z-50 select-none group touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]"
        @pointerdown="onHeightResizeStart"
        @dblclick="onHeightResizeReset"
        @keydown="onHeightResizeKeydown"
      >
        <div
          class="w-10 h-1 rounded-full transition-all duration-150 shadow-2xs"
          :class="isHeightResizing
            ? 'w-16 h-1.5 bg-[#FF5A00] ring-2 ring-[#FF5A00]/30 shadow-md'
            : 'bg-slate-300/80 group-hover:w-14 group-hover:h-1.5 group-hover:bg-[#FF5A00] group-hover:shadow-sm'"
        />
      </div>

      <!-- Main Panel Title (Desktop) -->
      <div
        v-show="!panelCompact"
        class="hidden min-[1180px]:block shrink-0 border-b border-slate-100 px-5 pb-2 pt-4"
      >
        <h2 class="text-base font-extrabold tracking-tight text-slate-900">
          <Cms k="panel.title" />
        </h2>
      </div>

      <!-- Options sit above the icon row on a phone, and under it on a wide screen. -->
      <div
        v-show="narrow || !panelCompact"
        id="config-sheet-options"
        class="sheet-reveal min-h-0 max-[1179px]:order-1 min-[1180px]:flex min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:flex-col"
        :class="sheetOpen ? 'is-open' : ''"
        :aria-hidden="(narrow && !sheetOpen) || (!narrow && panelCompact) ? true : undefined"
        :inert="(narrow && !sheetOpen) || (!narrow && panelCompact) ? true : undefined"
      >
        <div class="min-h-0 max-[1179px]:overflow-hidden min-[1180px]:flex min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:flex-col">
          <div
            ref="optionsScroll"
            class="panel-scrollbar max-h-[calc(min(68dvh,100dvh-11rem)-6.25rem)] space-y-4 overflow-y-auto overscroll-contain p-4 min-[1180px]:max-h-none min-[1180px]:min-h-0 min-[1180px]:flex-1 md:p-5"
            :class="panelSingleColumn ? 'min-[1180px]:!p-3' : ''"
          >
            <OptionsGrid @placed="closeMobilePicker" />
            <AIAssistantBar />
          </div>
        </div>
      </div>

      <!-- Category icons. On a phone this row is the whole bar until a step is chosen. -->
      <div
        class="w-full min-w-0 shrink-0 border-t border-slate-100/80 bg-white/50 px-3 py-2.5 max-[1179px]:order-2 max-[1179px]:pb-[max(0.625rem,env(safe-area-inset-bottom))] min-[1180px]:border-b min-[1180px]:border-t-0 min-[1180px]:px-3.5 min-[1180px]:py-2.5"
        :class="panelCompact ? 'min-[1180px]:border-t-0 min-[1180px]:pt-3.5' : ''"
      >
        <CategoryNav
          :expanded="narrow ? sheetOpen : !panelCompact"
          :desktop-slots="panelSingleColumn ? 1 : 4"
          @pick="onPickCategory"
        />
      </div>

      <!-- Footer Quick Status Summary -->
      <div
        v-show="!panelCompact"
        class="hidden shrink-0 items-center rounded-b-2xl border-t border-slate-100 bg-slate-50/90 p-3 min-[1180px]:flex md:p-4"
      >
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
import BuilderWalkthroughOverlay from './BuilderWalkthroughOverlay.vue';
import HouseNotes from './HouseNotes.vue';
import MoodBoard from './MoodBoard.vue';
import Cms from './Cms.vue';
import { searchAction, searchRequest } from '../search/run';
import {
  DEFAULT_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  MIN_PANEL_HEIGHT,
  clampPanelWidth,
  clampPanelHeight,
  maxPanelHeight,
  isSingleColumnPanelWidth,
  loadPanelWidth,
  loadPanelHeight,
  savePanelWidth,
  savePanelHeight
} from '../services/displayPrefs';

const store = useConfigStore();
const { t } = useLabels();
const skyMarkerShown = computed(() => {
  if (!store.showSun) return false;
  if (store.viewMode !== 'utsida') return false;
  // Neutral has no sun path — keep the sky clear of the day/moon marker.
  if (store.daylightMode === 'neutral') return false;
  if (store.daylightMode === 'moon') return true;
  return sunPlacement(store.sunHour, headingForFacing(store.facing)).altitude > 0.02;
});
const sunLeft = computed(() => `${(8 + sunAlongDay(store.sunHour) * 84).toFixed(1)}%`);
const isExportOpen = ref(false);
const isHouseImportOpen = ref(false);
const sheetOpen = ref(false);
const narrow = ref(false);
const optionsScroll = ref<HTMLElement | null>(null);

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800);
const desktopPanelWidth = ref(loadPanelWidth(windowWidth.value));
const desktopPanelHeight = ref(loadPanelHeight(windowHeight.value));
const isResizing = ref(false);
const isHeightResizing = ref(false);
let resizeStartX = 0;
let resizeStartWidth = 0;
let resizeStartY = 0;
let resizeStartHeight = 0;

const maxPanelWidth = computed(() => {
  return Math.min(960, Math.max(MIN_PANEL_WIDTH, windowWidth.value - 120));
});

const maxDesktopPanelHeight = computed(() => maxPanelHeight(windowHeight.value));

/** Collapsed to chrome for one scrollable category row (four items visible). */
const panelCompact = computed(
  () => !narrow.value && desktopPanelHeight.value <= MIN_PANEL_HEIGHT + 8
);

/** Narrow enough for one option-card column (and one scrollable nav slot). */
const panelSingleColumn = computed(
  () => !narrow.value && isSingleColumnPanelWidth(desktopPanelWidth.value)
);

const panelInlineStyle = computed(() => {
  if (narrow.value) return undefined;
  return {
    width: `${desktopPanelWidth.value}px`,
    maxWidth: 'calc(100vw - 3rem)',
    height: `${desktopPanelHeight.value}px`
  };
});

function onResizeStart(event: PointerEvent) {
  if (event.button !== 0) return;
  isResizing.value = true;
  resizeStartX = event.clientX;
  resizeStartWidth = desktopPanelWidth.value;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', onResizeEnd);
  window.addEventListener('pointercancel', onResizeEnd);
}

function onResizeMove(event: PointerEvent) {
  if (!isResizing.value) return;
  const deltaX = resizeStartX - event.clientX;
  desktopPanelWidth.value = clampPanelWidth(resizeStartWidth + deltaX, windowWidth.value);
}

function onResizeEnd() {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
  window.removeEventListener('pointercancel', onResizeEnd);
  savePanelWidth(desktopPanelWidth.value);
}

function onResizeReset() {
  desktopPanelWidth.value = DEFAULT_PANEL_WIDTH;
  savePanelWidth(DEFAULT_PANEL_WIDTH);
}

function onResizeKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 50 : 20;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    desktopPanelWidth.value = clampPanelWidth(desktopPanelWidth.value + step, windowWidth.value);
    savePanelWidth(desktopPanelWidth.value);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    desktopPanelWidth.value = clampPanelWidth(desktopPanelWidth.value - step, windowWidth.value);
    savePanelWidth(desktopPanelWidth.value);
  } else if (event.key === 'Home') {
    event.preventDefault();
    desktopPanelWidth.value = MIN_PANEL_WIDTH;
    savePanelWidth(desktopPanelWidth.value);
  } else if (event.key === 'End') {
    event.preventDefault();
    desktopPanelWidth.value = maxPanelWidth.value;
    savePanelWidth(desktopPanelWidth.value);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onResizeReset();
  }
}

function onHeightResizeStart(event: PointerEvent) {
  if (event.button !== 0) return;
  isHeightResizing.value = true;
  resizeStartY = event.clientY;
  resizeStartHeight = desktopPanelHeight.value;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'row-resize';
  window.addEventListener('pointermove', onHeightResizeMove);
  window.addEventListener('pointerup', onHeightResizeEnd);
  window.addEventListener('pointercancel', onHeightResizeEnd);
}

function onHeightResizeMove(event: PointerEvent) {
  if (!isHeightResizing.value) return;
  // Dragging the top edge down shrinks the panel.
  const deltaY = event.clientY - resizeStartY;
  desktopPanelHeight.value = clampPanelHeight(
    resizeStartHeight - deltaY,
    windowHeight.value
  );
}

function onHeightResizeEnd() {
  if (!isHeightResizing.value) return;
  isHeightResizing.value = false;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  window.removeEventListener('pointermove', onHeightResizeMove);
  window.removeEventListener('pointerup', onHeightResizeEnd);
  window.removeEventListener('pointercancel', onHeightResizeEnd);
  savePanelHeight(desktopPanelHeight.value);
}

function onHeightResizeReset() {
  desktopPanelHeight.value = maxDesktopPanelHeight.value;
  savePanelHeight(desktopPanelHeight.value);
}

function onHeightResizeKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 50 : 20;
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    desktopPanelHeight.value = clampPanelHeight(
      desktopPanelHeight.value + step,
      windowHeight.value
    );
    savePanelHeight(desktopPanelHeight.value);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    desktopPanelHeight.value = clampPanelHeight(
      desktopPanelHeight.value - step,
      windowHeight.value
    );
    savePanelHeight(desktopPanelHeight.value);
  } else if (event.key === 'Home') {
    event.preventDefault();
    desktopPanelHeight.value = MIN_PANEL_HEIGHT;
    savePanelHeight(desktopPanelHeight.value);
  } else if (event.key === 'End') {
    event.preventDefault();
    desktopPanelHeight.value = maxDesktopPanelHeight.value;
    savePanelHeight(desktopPanelHeight.value);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onHeightResizeReset();
  }
}

function expandPanelForOptions() {
  if (narrow.value || !panelCompact.value) return;
  const target = Math.max(
    Math.round(maxDesktopPanelHeight.value * 0.55),
    Math.min(420, maxDesktopPanelHeight.value)
  );
  desktopPanelHeight.value = clampPanelHeight(target, windowHeight.value);
  savePanelHeight(desktopPanelHeight.value);
}

function readNarrow() {
  narrow.value = window.matchMedia('(max-width: 1179px)').matches;
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
  if (desktopPanelWidth.value > maxPanelWidth.value) {
    desktopPanelWidth.value = maxPanelWidth.value;
  }
  if (desktopPanelHeight.value > maxDesktopPanelHeight.value) {
    desktopPanelHeight.value = maxDesktopPanelHeight.value;
  }
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
  expandPanelForOptions();
  store.selectCategory(id);
}

function onTourSheet(event: Event) {
  if (!narrow.value) return;
  sheetOpen.value = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;
}

function onTourTools(event: Event) {
  const tray = (event as CustomEvent<{ tray?: string }>).detail?.tray;
  isHouseImportOpen.value = tray === 'ai';
}

function applySearchNavigation() {
  const action = searchAction.value;
  if (!action || action.path !== '/build') return;
  if (action.sizeId) store.selectSize(action.sizeId);
  if (action.category) store.selectCategory(action.category);
  isHouseImportOpen.value = action.tool === 'ai';
  store.showMood = action.tool === 'mood';
}

watch(searchRequest, applySearchNavigation);

onMounted(() => {
  readNarrow();
  window.addEventListener('resize', readNarrow);
  window.addEventListener('builder:onboarding-sheet', onTourSheet);
  window.addEventListener('builder:onboarding-tools', onTourTools);
  applySearchNavigation();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', readNarrow);
  window.removeEventListener('builder:onboarding-sheet', onTourSheet);
  window.removeEventListener('builder:onboarding-tools', onTourTools);
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
  window.removeEventListener('pointercancel', onResizeEnd);
  window.removeEventListener('pointermove', onHeightResizeMove);
  window.removeEventListener('pointerup', onHeightResizeEnd);
  window.removeEventListener('pointercancel', onHeightResizeEnd);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
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
    overflow: hidden;
    /* min() inside calc() cannot move from 0px, so a transition stays stuck closed and clips the options. */
    transition: none;
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

.day-moon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgb(226 232 240 / 0.75) 0%,
    rgb(148 163 184 / 0.35) 32%,
    rgb(71 85 105 / 0.12) 55%,
    transparent 70%
  );
  box-shadow:
    0 0 14px 3px rgb(148 163 184 / 0.35),
    0 0 36px 12px rgb(51 65 85 / 0.22);
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

/*
 * Viewport `sm:` breakpoints still see a wide desktop, so force option card
 * grids to one column when the panel itself is resized narrow.
 * Dense chip/swatch grids stay at two columns so they remain usable.
 */
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.grid-cols-2),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.sm\:grid-cols-2),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.sm\:grid-cols-3) {
  grid-template-columns: minmax(0, 1fr) !important;
}

#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.grid-cols-3),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.grid-cols-4),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.grid-cols-5),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.grid-cols-6),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.sm\:grid-cols-4),
#config-panel[data-panel-cols='1'] :deep(#config-sheet-options .grid.sm\:grid-cols-5) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}
</style>
