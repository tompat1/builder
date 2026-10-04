<template>
  <div class="pointer-events-auto absolute top-20 left-3 md:top-auto md:bottom-6 md:left-6 flex flex-col gap-2 z-20" :aria-label="t('tools.label')">
    <!-- Top Button Pair: Zoom In / Zoom Out -->
    <div class="w-fit self-start bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex flex-col gap-1">
      <button
        type="button"
        id="btn-tool-zoom-in"
        @click="$emit('zoom-in')"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :aria-label="t('tools.zoomIn')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <span class="tool-tip"><Cms k="tools.zoomIn" /></span>
      </button>

      <div class="h-px bg-slate-100 mx-1"></div>

      <button
        type="button"
        id="btn-tool-zoom-out"
        @click="$emit('zoom-out')"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :aria-label="t('tools.zoomOut')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <span class="tool-tip"><Cms k="tools.zoomOut" /></span>
      </button>
    </div>

    <!-- Bottom Button Row: Measure / Undo / Redo -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
      <button
        type="button"
        id="btn-tool-measure"
        @click="store.toggleDimensions()"
        :class="[
          'group relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
          store.showDimensions
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        ]"
        :aria-label="t('tools.measure')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2" />
          <path d="m11.5 9.5 2-2" />
          <path d="m8.5 6.5 2-2" />
        </svg>
        <span class="tool-tip"><Cms k="tools.measure" /></span>
      </button>

      <div class="w-px h-7 bg-slate-200/60 my-auto"></div>

      <!-- Undo -->
      <button
        type="button"
        id="btn-tool-undo"
        @click="store.undo()"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40"
        :class="store.canUndo ? '' : 'opacity-40'"
        :aria-label="t('tools.undo')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span class="tool-tip"><Cms k="tools.undo" /></span>
      </button>

      <!-- Redo -->
      <button
        type="button"
        id="btn-tool-redo"
        @click="store.redo()"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :class="store.canRedo ? '' : 'opacity-40'"
        :aria-label="t('tools.redo')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span class="tool-tip"><Cms k="tools.redo" /></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();

defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
}>();
</script>

<style scoped>
.tool-tip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  z-index: 30;
  transform: translateY(-50%);
  white-space: nowrap;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 8px;
  opacity: 0;
  box-shadow: 0 8px 18px rgb(15 23 42 / 0.18);
}
.group:hover > .tool-tip,
.group:focus-visible > .tool-tip {
  opacity: 1;
}
</style>
