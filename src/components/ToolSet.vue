<template>
  <div class="pointer-events-auto absolute top-20 left-3 md:top-auto md:bottom-6 md:left-6 flex flex-col gap-2 z-20" aria-label="3D Vyverktyg">
    <!-- Top Button Pair: Zoom In / Zoom Out -->
    <div class="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 p-1 flex flex-col gap-1 w-10">
      <button
        type="button"
        id="btn-tool-zoom-in"
        @click="$emit('zoom-in')"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="Zooma in"
        aria-label="Zooma in"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <div class="h-px bg-slate-100 mx-1"></div>

      <button
        type="button"
        id="btn-tool-zoom-out"
        @click="$emit('zoom-out')"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="Zooma ut"
        aria-label="Zooma ut"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
    </div>

    <!-- Bottom Button Row: Measure / Undo / Redo -->
    <div class="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 p-1 flex items-center gap-1">
      <button
        type="button"
        id="btn-tool-measure"
        @click="store.toggleDimensions()"
        :class="[
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          store.showDimensions
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        ]"
        title="Visa måttsättning"
        aria-label="Visa måttsättning"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2" />
          <path d="m11.5 9.5 2-2" />
          <path d="m8.5 6.5 2-2" />
        </svg>
      </button>

      <div class="w-px h-5 bg-slate-200/60 my-auto"></div>

      <!-- Undo -->
      <button
        type="button"
        id="btn-tool-undo"
        @click="store.undo()"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="Ångra"
        aria-label="Ångra"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      <!-- Redo -->
      <button
        type="button"
        id="btn-tool-redo"
        @click="store.redo()"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="Gör om"
        aria-label="Gör om"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';

const store = useConfigStore();

defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
}>();
</script>
