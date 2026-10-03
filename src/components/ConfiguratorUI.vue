<template>
  <div class="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 z-10 overflow-hidden">
    <!-- Top Header Bar -->
    <HeaderBar @next-step="isExportOpen = true" />

    <!-- Desktop Sidebar & Mobile Bottom Sheet -->
    <aside
      class="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 transition-all duration-300 flex flex-col justify-between mt-auto w-full md:w-[410px] md:absolute md:right-6 md:top-24 md:bottom-6 max-h-[60vh] md:max-h-[calc(100vh-7.5rem)]"
      :class="isMobileCollapsed ? 'h-auto max-h-[140px]' : 'h-[60vh] md:h-auto'"
      aria-label="Konfigurationspanel"
    >
      <!-- Mobile Drawer Drag & Collapse Header -->
      <div class="md:hidden flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
        <div class="flex items-center gap-2">
          <span class="w-8 h-1 bg-slate-300 rounded-full mx-auto block"></span>
        </div>
        <button
          type="button"
          @click="isMobileCollapsed = !isMobileCollapsed"
          class="text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-lg"
        >
          {{ isMobileCollapsed ? 'Visa panel ▲' : 'Minimera ▼' }}
        </button>
      </div>

      <!-- Main Scrollable Panel Content -->
      <div v-show="!isMobileCollapsed" class="p-4 md:p-5 overflow-y-auto space-y-4 flex-1">
        <!-- Step Navigation Bar -->
        <CategoryNav />

        <!-- Dynamic Category Options Grid -->
        <OptionsGrid />

        <!-- Embedded AI Assistant Command Box -->
        <AIAssistantBar />
      </div>

      <!-- Footer Quick Summary -->
      <div class="p-3 md:p-4 bg-slate-50/90 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-xs text-slate-600 font-medium">
            {{ store.currentSize.name }} • {{ store.dimensions.areaSqMeters }} m²
          </span>
        </div>

        <button
          type="button"
          @click="isExportOpen = true"
          class="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline p-1"
        >
          <span>Exportera</span>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- Export Pipeline Modal -->
    <ExportModal :is-open="isExportOpen" @close="isExportOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import HeaderBar from './HeaderBar.vue';
import CategoryNav from './CategoryNav.vue';
import OptionsGrid from './OptionsGrid.vue';
import AIAssistantBar from './AIAssistantBar.vue';
import ExportModal from './ExportModal.vue';

const store = useConfigStore();
const isExportOpen = ref(false);
const isMobileCollapsed = ref(false);
</script>
