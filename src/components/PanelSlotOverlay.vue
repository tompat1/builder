<template>
  <div>
    <!-- Desktop Hover Indicator Pill -->
    <div
      v-if="store.viewMode === 'utsida' && store.hoveredSlotId && store.hoveredSlotId !== store.selectedSlotId"
      class="pointer-events-none absolute z-20 transition-all duration-150 ease-out animate-fade-in"
      :style="hoverPromptStyle"
    >
      <div class="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-2 text-xs font-semibold">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{{ hoverText }}</span>
      </div>
    </div>

    <!-- Active Selected Slot Cluster -->
    <div
      v-if="store.viewMode === 'utsida' && store.selectedSlotId && activeSlot"
      class="pointer-events-auto absolute z-20 flex flex-col items-center gap-2 animate-fade-in transition-all duration-100"
      :style="overlayStyle"
    >
      <!-- Horizontal Navigation Cluster with Left/Right Arrows (Matching Skånska Byggvaror) -->
      <div class="flex items-center gap-2 relative">
        <!-- Prev Panel Arrow Button -->
        <button
          type="button"
          id="btn-slot-prev"
          @click="store.cycleSlot('prev')"
          class="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-105"
          :title="t('slot.prev')"
          :aria-label="t('slot.prev')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <!-- Slot Action Cluster (Pill) -->
        <div class="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-300">
          <!-- Plus Icon Circle (matching Image 1 & 2) -->
          <div class="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            +
          </div>

          <template v-if="activeSlot.type !== 'empty'">
            <span class="text-xs font-semibold text-slate-900 px-1 max-w-[9rem] truncate">{{ placedLabel }}</span>
            <button
              type="button"
              id="btn-replace-slot"
              @click="replacePlaced()"
              class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              <Cms k="slot.replace" />
            </button>
            <button
              v-if="alternateCategory"
              type="button"
              id="btn-switch-slot-type"
              @click="openCategory(alternateCategory)"
              class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              <Cms v-if="alternateCategory === 'doors'" k="slot.chooseDoor" />
              <Cms v-else k="slot.chooseWindow" />
            </button>
            <button
              type="button"
              id="btn-remove-slot-item"
              @click="store.removeSlotItem(activeSlot.id)"
              class="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg font-medium transition-colors"
              :title="t('slot.clear')"
            >
              <Cms k="slot.remove" />
            </button>
          </template>

          <template v-else>
            <button
              v-if="store.selectedSlotCanAcceptDoor"
              type="button"
              id="btn-choose-door"
              @click="openCategory('doors')"
              class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 21h16M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17" />
              </svg>
              <span><Cms k="slot.chooseDoor" /></span>
            </button>

            <button
              type="button"
              id="btn-choose-window"
              @click="openCategory('windows')"
              class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 3v18M3 12h18" />
              </svg>
              <span><Cms k="slot.chooseWindow" /></span>
            </button>
          </template>
        </div>

        <!-- Next Panel Arrow Button -->
        <button
          type="button"
          id="btn-slot-next"
          @click="store.cycleSlot('next')"
          class="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-105"
          :title="t('slot.next')"
          :aria-label="t('slot.next')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <!-- Action Confirmation & Badge Row (Matching Skånska Byggvaror check/cross) -->
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          {{ t('slot.marked', { wall: markedWall }) }}
        </span>

        <!-- Confirm Selection Button -->
        <button
          type="button"
          id="btn-confirm-slot"
          @click="store.deselectSlot()"
          class="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-colors"
          :title="t('slot.done')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <!-- Deselect Button -->
        <button
          type="button"
          id="btn-deselect-slot"
          @click="store.deselectSlot()"
          class="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
          :title="t('slot.cancel')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DOORS_OPTIONS, GATES_OPTIONS, useConfigStore, WINDOWS_OPTIONS, type CategoryKey, type WallSlot } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t } = useLabels();

const activeSlot = computed(() => {
  return store.selectedSlotId ? store.wallSlots[store.selectedSlotId] : null;
});

const markedWall = computed(() => {
  const slot = activeSlot.value;
  if (!slot) return '';
  const name = `${slot.wall.toUpperCase()}-${slot.index + 1}`;
  return slot.isUpper ? `${name} ${t('slot.upper')}` : name;
});

const placedLabel = computed(() => productName(activeSlot.value));

const alternateCategory = computed((): CategoryKey | null => {
  const slot = activeSlot.value;
  if (!slot || slot.type === 'empty') return null;
  if (slot.type === 'window' && store.selectedSlotCanAcceptDoor) return 'doors';
  if (slot.type === 'door') return 'windows';
  return null;
});

const hoverText = computed(() => {
  const id = store.hoveredSlotId;
  if (!id) return '';
  const slot = store.wallSlots[id];
  if (!slot || slot.type === 'empty') return t('slot.hover', { id });
  return t('slot.hoverPlaced', { name: productName(slot) });
});

const overlayStyle = computed(() => {
  if (store.slotScreenPosition && store.slotScreenPosition.visible) {
    return {
      left: `clamp(168px, ${store.slotScreenPosition.x}px, calc(100% - 168px))`,
      top: `clamp(88px, ${store.slotScreenPosition.y}px, calc(100% - 72px))`,
      transform: 'translate(-50%, -50%)'
    };
  }
  return {
    left: '50%',
    top: '46%',
    transform: 'translate(-50%, -50%)'
  };
});

const hoverPromptStyle = computed(() => {
  if (store.hoveredSlotPos) {
    return {
      left: `${store.hoveredSlotPos.x}px`,
      top: `${Math.max(store.hoveredSlotPos.y - 45, 60)}px`,
      transform: 'translate(-50%, -100%)'
    };
  }
  return {
    left: '50%',
    top: '32%',
    transform: 'translate(-50%, -50%)'
  };
});

function productName(slot: WallSlot | null) {
  if (!slot || slot.type === 'empty') return '';
  const list = slot.type === 'door' ? DOORS_OPTIONS : slot.type === 'window' ? WINDOWS_OPTIONS : GATES_OPTIONS;
  return list.find((item) => item.id === slot.itemId)?.name ?? slot.itemId ?? '';
}

function openCategory(category: CategoryKey) {
  store.selectCategory(category);
}

function replacePlaced() {
  const slot = activeSlot.value;
  if (!slot || slot.type === 'empty') return;
  const category: CategoryKey = slot.type === 'door' ? 'doors' : slot.type === 'window' ? 'windows' : 'gates';
  openCategory(category);
}
</script>
