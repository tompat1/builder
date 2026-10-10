<template>
  <div v-if="store.showDimensions && store.viewMode === 'utsida'" class="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden" aria-hidden="true">
    <div
      id="dim-front-annotation"
      class="absolute -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
      :style="labelStyle('width')"
    >
      <span id="dim-width" class="block text-xs md:text-sm font-bold text-slate-900 tracking-tight leading-none">
        {{ store.dimensions.width }} mm
      </span>
      <span id="dim-area" class="block text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5">
        {{ store.dimensions.areaSqMeters }} m²
      </span>
    </div>

    <div
      id="dim-roof-angle"
      class="absolute -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-300/80 shadow-xs flex items-center gap-1.5"
      :style="labelStyle('pitch')"
    >
      <svg class="w-4 h-3 text-slate-700" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="11" x2="22" y2="11" />
        <line x1="2" y1="11" x2="22" y2="3" />
        <path d="M 8 11 A 6 6 0 0 0 7 7" stroke-dasharray="1 1" />
      </svg>
      <span class="text-xs font-black text-slate-900 leading-none">
        {{ store.roofPitchAngle }}°
      </span>
      <span class="text-[10px] text-slate-500 font-semibold hidden md:inline"><Cms k="dims.pitch" /></span>
    </div>

    <div
      id="dim-left-height"
      class="absolute -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
      :style="labelStyle('frontHeight')"
    >
      <span class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.eaveHeight }} mm
      </span>
      <span class="block text-[9px] text-slate-500 font-medium"><Cms k="dims.frontWall" /></span>
    </div>

    <div
      id="dim-height-annotation"
      class="absolute -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
      :style="labelStyle('rearHeight')"
    >
      <span id="dim-height" class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.activeRoof === 'pulpettak' ? store.rearHeight : store.eaveHeight }} mm
      </span>
      <span class="block text-[9px] text-slate-500 font-medium">
        <Cms v-if="store.activeRoof === 'pulpettak'" k="dims.rearWall" />
        <Cms v-else k="dims.overall" />
      </span>
    </div>
  </div>

  <div v-if="store.showDimensions && store.viewMode === 'insida'" class="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden" aria-hidden="true">
    <div
      id="dim-inside-height"
      class="absolute -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs text-center"
      :style="labelStyle('ceiling')"
    >
      <span class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.innerCeilingHeight }} mm
      </span>
      <span class="block text-[10px] text-slate-500 font-medium"><Cms k="dims.ceiling" /></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();

function labelStyle(id: string) {
  const label = store.dimensionLabels[id];
  if (!label?.visible) {
    return { left: '0px', top: '0px', visibility: 'hidden' as const };
  }
  return {
    left: `clamp(3.25rem, ${label.x}px, calc(100% - 3.25rem))`,
    top: `clamp(6.5rem, ${label.y}px, calc(100% - 3.25rem))`,
    visibility: 'visible' as const
  };
}
</script>
