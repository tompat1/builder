<template>
  <div v-if="store.showDimensions" class="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden" aria-hidden="true">
    <!-- Front Width Annotation (6040 mm / 29.9 m²) -->
    <div
      id="dim-front-annotation"
      class="absolute left-1/2 -translate-x-1/2 top-[38%] md:top-auto md:bottom-28 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center transition-all"
    >
      <span id="dim-width" class="block text-xs md:text-sm font-bold text-slate-900 tracking-tight leading-none">
        {{ store.dimensions.width }} mm
      </span>
      <span id="dim-area" class="block text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5">
        {{ store.dimensions.areaSqMeters }} m²
      </span>
    </div>

    <!-- Roof Pitch Angle Indicator (e.g., 8° as shown in images) -->
    <div
      id="dim-roof-angle"
      class="absolute left-[36%] md:left-[42%] top-[18%] md:top-[16%] -translate-y-1/2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-300/80 shadow-xs flex items-center gap-1.5 transition-all"
    >
      <!-- Sloping angle schematic icon -->
      <svg class="w-4 h-3 text-slate-700" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="11" x2="22" y2="11" />
        <line x1="2" y1="11" x2="22" y2="3" />
        <path d="M 8 11 A 6 6 0 0 0 7 7" stroke-dasharray="1 1" />
      </svg>
      <span class="text-xs font-black text-slate-900 leading-none">
        {{ store.roofPitchAngle }}°
      </span>
      <span class="text-[10px] text-slate-500 font-semibold hidden md:inline">{{ t('dims.pitch') }}</span>
    </div>

    <!-- Left Front Height Annotation (matching Image 3) -->
    <div
      id="dim-left-height"
      class="hidden sm:block absolute left-[18%] md:left-[22%] top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
    >
      <span class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.dimensions.height }} mm
      </span>
      <span class="block text-[9px] text-slate-500 font-medium">{{ t('dims.frontWall') }}</span>
    </div>

    <!-- Right Height Annotation (3503 mm or rear 2744 mm for Pulpettak) -->
    <div
      id="dim-height-annotation"
      class="hidden sm:block absolute right-[28%] md:right-[32%] top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
    >
      <span id="dim-height" class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.activeRoof === 'pulpettak' ? store.rearHeight : store.dimensions.height }} mm
      </span>
      <span class="block text-[9px] text-slate-500 font-medium">
        {{ store.activeRoof === 'pulpettak' ? t('dims.rearWall') : t('dims.overall') }}
      </span>
    </div>

    <!-- Inside Room Ceiling Height Annotation -->
    <div
      v-if="store.viewMode === 'insida'"
      id="dim-inside-height"
      class="absolute left-[36%] top-[38%] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs text-center"
    >
      <span class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.innerCeilingHeight }} mm
      </span>
      <span class="block text-[10px] text-slate-500 font-medium">{{ t('dims.ceiling') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';

const store = useConfigStore();
const { t } = useLabels();
</script>
