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

    <div
      v-if="store.viewMode === 'utsida' && store.selectedSlotId && activeSlot"
      class="pointer-events-auto absolute z-20 w-[17.5rem] rounded-2xl bg-white text-slate-900 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.45)]"
      :style="overlayStyle"
    >
      <div class="flex items-center gap-0.5 px-1.5 pt-1.5">
        <button
          type="button"
          id="btn-slot-prev"
          @click="store.cycleSlot('prev')"
          class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          :title="t('slot.prev')"
          :aria-label="t('slot.prev')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p class="min-w-0 flex-1 text-center text-sm font-semibold leading-tight">{{ placeLabel }}</p>
        <button
          type="button"
          id="btn-slot-next"
          @click="store.cycleSlot('next')"
          class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          :title="t('slot.next')"
          :aria-label="t('slot.next')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div class="px-3 pb-3 pt-1">
        <template v-if="activeSlot.type !== 'empty'">
          <p class="truncate text-sm leading-5 text-slate-600">{{ placedLabel }}</p>
          <div class="mt-3 flex flex-col gap-1.5">
            <button
              type="button"
              id="btn-replace-slot"
              @click="replacePlaced()"
              class="h-11 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <Cms k="slot.replace" />
            </button>
            <button
              v-if="alternateCategory"
              type="button"
              id="btn-switch-slot-type"
              @click="openCategory(alternateCategory)"
              class="h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <Cms v-if="alternateCategory === 'doors'" k="slot.chooseDoor" />
              <Cms v-else k="slot.chooseWindow" />
            </button>
          </div>
        </template>

        <div v-else class="mt-2 flex flex-col gap-1.5">
          <button
            v-if="store.selectedSlotCanAcceptDoor"
            type="button"
            id="btn-choose-door"
            @click="openCategory('doors')"
            class="h-11 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <Cms k="slot.chooseDoor" />
          </button>
          <button
            type="button"
            id="btn-choose-window"
            @click="openCategory('windows')"
            :class="store.selectedSlotCanAcceptDoor
              ? 'h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2'
              : 'h-11 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2'"
          >
            <Cms k="slot.chooseWindow" />
          </button>
        </div>

        <div class="mt-1 flex items-center" :class="activeSlot.type === 'empty' ? 'justify-center' : 'justify-between'">
          <button
            v-if="activeSlot.type !== 'empty'"
            type="button"
            id="btn-remove-slot-item"
            @click="store.removeSlotItem(activeSlot.id)"
            class="h-11 px-1 text-sm font-medium text-rose-700 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :title="t('slot.clear')"
          >
            <Cms k="slot.remove" />
          </button>
          <button
            type="button"
            id="btn-deselect-slot"
            @click="store.deselectSlot()"
            class="h-11 px-1 text-sm font-semibold text-slate-900 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :title="t('slot.done')"
          >
            <Cms k="slot.done" />
          </button>
        </div>
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

const WALL_LABEL = {
  front: 'notes.wallFront',
  back: 'notes.wallBack',
  left: 'notes.wallLeft',
  right: 'notes.wallRight'
} as const;

const placeLabel = computed(() => {
  const slot = activeSlot.value;
  if (!slot) return '';
  const wall = t(WALL_LABEL[slot.wall]);
  const band = t(slot.isUpper ? 'notes.upper' : 'notes.lower');
  return `${wall} · ${band}`;
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
      left: `clamp(min(240px, 50%), ${store.slotScreenPosition.x}px, calc(100% - min(160px, 50%)))`,
      top: `clamp(100px, ${store.slotScreenPosition.y + 18}px, calc(100% - 340px))`,
      transform: 'translate(-50%, 0)'
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
