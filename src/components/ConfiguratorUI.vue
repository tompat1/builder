<template>
  <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 z-10 overflow-hidden">
    <!-- Top Header Bar -->
    <HeaderBar v-if="!store.isFullscreen" @open-export="isExportOpen = true" />

    <!-- 3D Scene In-Canvas Overlays (Aligned with the 3D Canvas Area) -->
    <div
      class="pointer-events-none absolute inset-0 z-10 overflow-hidden transition-all duration-300 md:right-[434px]"
      :style="{ right: store.isFullscreen ? '0px' : undefined }"
    >
      <!-- 3D Dimension Overlay -->
      <DimensionOverlay />
      <MeasureRuler />

      <!-- In-Scene Wall Panel Interaction Overlay (disabled in fullscreen mode) -->
      <PanelSlotOverlay v-if="!store.isFullscreen" />

      <HouseNotes />
    </div>

    <!-- Lower-Left Toolset (Zoom, Fullscreen, Center, Measure, Undo, Redo, Notes) -->
    <ToolSet
      @zoom-in="$emit('zoom-in')"
      @zoom-out="$emit('zoom-out')"
      @reset-view="$emit('reset-view')"
    />

    <!-- Right Sidebar / Mobile Bottom Sheet -->
    <aside
      v-if="!store.isFullscreen"
      class="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 transition-all duration-300 flex flex-col justify-between mt-auto w-full md:w-[410px] md:absolute md:right-6 md:top-24 md:bottom-6 max-h-[62vh] md:max-h-[calc(100vh-7.5rem)] z-40"
      :class="isMobileCollapsed ? 'h-auto max-h-[140px]' : 'h-[62vh] md:h-auto'"
      :aria-label="t('panel.label')"
    >
      <!-- Mobile Drawer Drag Handle & Collapse Header -->
      <div class="md:hidden flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
        <div class="flex items-center gap-2">
          <span class="w-8 h-1 bg-slate-300 rounded-full mx-auto block"></span>
          <span class="text-xs font-bold text-slate-700"><Cms k="panel.title" /></span>
        </div>
        <button
          type="button"
          id="btn-toggle-mobile-sheet"
          @click="isMobileCollapsed = !isMobileCollapsed"
          class="text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-lg"
        >
          <Cms v-if="isMobileCollapsed" k="panel.show" />
          <Cms v-else k="panel.hide" />
        </button>
      </div>

      <!-- Main Panel Title (Desktop) -->
      <div class="hidden md:block px-5 pt-4 pb-2 border-b border-slate-100">
        <h2 class="text-base font-extrabold text-slate-900 tracking-tight">
          <Cms k="panel.title" />
        </h2>
      </div>

      <!-- Main Scrollable Panel Content -->
      <div v-show="!isMobileCollapsed" class="p-4 md:p-5 overflow-y-auto space-y-4 flex-1">
        <!-- Step Navigation Bar -->
        <CategoryNav />

        <!-- Dynamic Category & Material Options Grid -->
        <OptionsGrid />

        <!-- Embedded AI Architect Assistant -->
        <AIAssistantBar />

        <HouseImport />
      </div>

      <!-- Footer Quick Status Summary -->
      <div class="p-3 md:p-4 bg-slate-50/90 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
          <span class="text-xs text-slate-700 font-semibold">
            <Cms :k="`catalog.${store.currentSize.id}.name`" :fallback="store.currentSize.name" /> • <Cms :k="`catalog.${store.currentMaterial.id}.name`" :fallback="store.currentMaterial.name" />
          </span>
        </div>

        <button
          type="button"
          @click="isExportOpen = true"
          class="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline p-1"
        >
          <span><Cms k="panel.export" /></span>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- Export Modal -->
    <ExportModal :is-open="isExportOpen" @close="isExportOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
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
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();
const isExportOpen = ref(false);
const isMobileCollapsed = ref(false);

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
}>();
</script>
