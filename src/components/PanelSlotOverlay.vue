<template>
  <div
    v-if="store.selectedSlotId && activeSlot"
    class="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-[24%] md:top-[46%] -translate-y-1/2 z-30 flex flex-col items-center gap-2 animate-fade-in"
  >
    <!-- Slot action cluster -->
    <div class="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-300">
      <!-- Slot icon indicator -->
      <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
        +
      </div>

      <!-- Quick Option Buttons -->
      <button
        type="button"
        id="btn-choose-door"
        @click="openCategory('doors')"
        :class="[
          'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
          activeSlot.type === 'door'
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 21h16M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17" />
        </svg>
        <span>{{ activeSlot.type === 'door' ? `Dörr (${activeSlot.itemId})` : 'Välj dörr' }}</span>
      </button>

      <button
        type="button"
        id="btn-choose-window"
        @click="openCategory('windows')"
        :class="[
          'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all',
          activeSlot.type === 'window'
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 3v18M3 12h18" />
        </svg>
        <span>{{ activeSlot.type === 'window' ? `Fönster (${activeSlot.itemId})` : 'Välj fönster' }}</span>
      </button>

      <!-- Clear / Remove from slot -->
      <button
        v-if="activeSlot.type !== 'empty'"
        type="button"
        id="btn-remove-slot-item"
        @click="store.removeSlotItem(activeSlot.id)"
        class="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg font-medium transition-colors"
        title="Töm denna panel"
      >
        Ta bort
      </button>
    </div>

    <!-- Active panel coordinate badge -->
    <span class="text-[11px] font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
      Markerad väggyta: {{ activeSlot.wall.toUpperCase() }}-{{ activeSlot.index + 1 }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConfigStore, type CategoryKey } from '../store/useConfigStore';

const store = useConfigStore();

const activeSlot = computed(() => {
  return store.selectedSlotId ? store.wallSlots[store.selectedSlotId] : null;
});

function openCategory(category: CategoryKey) {
  store.selectCategory(category);
}
</script>
