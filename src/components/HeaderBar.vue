<template>
  <header
    class="pointer-events-auto flex items-center justify-between bg-white/95 backdrop-blur-md shadow-sm rounded-2xl px-4 py-2.5 md:px-6 md:py-3 border border-slate-200/80 transition-all"
    role="banner"
  >
    <!-- Brand / Studio Title -->
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-900 tracking-tight text-sm md:text-base leading-none">MODULAR STUDIO</span>
          <span class="inline-block text-[10px] md:text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">3D MVP</span>
        </div>
        <p class="text-xs text-slate-500 hidden md:block mt-0.5">Skapa din modulära byggsats</p>
      </div>
    </div>

    <!-- Central Segmented Master Toggle (Outside / Inside) -->
    <nav class="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner" role="tablist" aria-label="Visningsläge">
      <button
        type="button"
        role="tab"
        id="toggle-utsida"
        :aria-selected="store.viewMode === 'utsida'"
        @click="store.setViewMode('utsida')"
        :class="[
          'flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[36px]',
          store.viewMode === 'utsida'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        ]"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        <span>Utsida</span>
      </button>

      <button
        type="button"
        role="tab"
        id="toggle-insida"
        :aria-selected="store.viewMode === 'insida'"
        @click="store.setViewMode('insida')"
        :class="[
          'flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 min-h-[36px]',
          store.viewMode === 'insida'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        ]"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <span>Insida</span>
      </button>
    </nav>

    <!-- Price and Action Cluster -->
    <div class="flex items-center gap-3 md:gap-5">
      <div class="text-right">
        <span class="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Uppskattat pris</span>
        <span class="font-extrabold text-sm md:text-lg text-slate-900 tabular-nums">
          {{ store.totalPriceSek.toLocaleString('sv-SE') }} kr
        </span>
      </div>

      <button
        type="button"
        id="btn-next-step"
        class="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm transition-all duration-150 shadow-sm hover:shadow flex items-center gap-1.5 min-h-[40px]"
        @click="$emit('next-step')"
      >
        <span>Nästa steg</span>
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';

const store = useConfigStore();

defineEmits<{
  (e: 'next-step'): void;
}>();
</script>
