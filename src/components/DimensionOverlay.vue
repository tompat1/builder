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

    <!-- Right Height Annotation (3503 mm) -->
    <div
      id="dim-height-annotation"
      class="hidden sm:block absolute right-[28%] md:right-[32%] top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
    >
      <span id="dim-height" class="block text-xs font-bold text-slate-900 leading-none">
        {{ store.dimensions.height }} mm
      </span>
    </div>

    <!-- Inside Room Height Annotation (2144 mm) -->
    <div
      v-if="store.viewMode === 'insida'"
      class="absolute left-[36%] top-[38%] bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-300/80 shadow-2xs text-center"
    >
      <span class="block text-xs font-bold text-slate-900 leading-none">
        2144 mm
      </span>
      <span class="block text-[10px] text-slate-500 font-medium">Invändig takhöjd</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';

const store = useConfigStore();
</script>
