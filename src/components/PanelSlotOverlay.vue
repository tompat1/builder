<template>
  <div>
    <!-- Desktop Hover Indicator Pill -->
    <div
      v-if="store.viewMode === 'utsida' && !store.framingWalkthrough && store.hoveredSlotId && store.hoveredSlotId !== store.selectedSlotId && !store.isDragging"
      class="pointer-events-none absolute z-20 transition-all duration-150 ease-out animate-fade-in"
      :style="hoverPromptStyle"
    >
      <div class="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-2 text-xs font-semibold">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{{ hoverText }}</span>
      </div>
    </div>

    <div
      v-if="store.viewMode === 'utsida' && !store.framingWalkthrough && store.selectedSlotId && activeSlot"
      class="absolute z-20 w-[17.5rem] rounded-2xl bg-white text-slate-900 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.45)] transition-opacity duration-150"
      :class="store.isDragging ? 'pointer-events-none opacity-20' : 'pointer-events-auto opacity-100'"
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
          <div v-if="rhythmCounts.length > 0" class="mt-3">
            <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <Cms k="slot.windowCount" />
            </p>
            <div
              class="grid gap-1 rounded-xl bg-slate-100 p-1"
              :style="{ gridTemplateColumns: `repeat(${rhythmCounts.length}, minmax(0, 1fr))` }"
              role="group"
              :aria-label="t('slot.windowCount')"
            >
              <button
                v-for="n in rhythmCounts"
                :key="n"
                type="button"
                :id="`btn-window-rhythm-${n}`"
                @click="applyWindowRhythm(n)"
                class="h-10 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                :class="activeRhythmCount === n
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'"
                :aria-pressed="activeRhythmCount === n"
                :aria-label="t('slot.windowCountN', { n })"
              >
                {{ n }}
              </button>
            </div>
          </div>
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
              v-if="canFitWindow"
              type="button"
              id="btn-fit-window"
              @click="store.fitWindowToWall(activeSlot.id)"
              class="h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              :title="t('slot.fitTitle')"
            >
              <Cms k="slot.fit" />
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
import {
  DOORS_OPTIONS,
  GATES_OPTIONS,
  freeLowerRunForRhythm,
  panelCountForWall,
  useConfigStore,
  WINDOWS_OPTIONS,
  type CategoryKey,
  type WallSlot,
  type WindowRhythmCount
} from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const { t, catalog } = useLabels();

const activeSlot = computed(() => {
  return store.selectedSlotId ? store.wallSlots[store.selectedSlotId] : null;
});

const rhythmHost = computed(() => {
  const slot = activeSlot.value;
  if (!slot || slot.isUpper) return null;
  if (slot.windowRhythm) return slot;
  if (slot.coveredBy) {
    const host = store.wallSlots[slot.coveredBy];
    if (host?.windowRhythm) return host;
  }
  return null;
});

const rhythmRunLength = computed(() => {
  const slot = activeSlot.value;
  if (!slot || slot.isUpper || slot.type !== 'window') return 0;
  const count = panelCountForWall(slot.wall, store.dimensions.width, store.dimensions.depth);
  return freeLowerRunForRhythm(store.wallSlots, slot.wall, count, slot.index).length;
});

const rhythmCounts = computed((): WindowRhythmCount[] => {
  const slot = activeSlot.value;
  if (!slot || slot.isUpper || slot.type !== 'window') return [];
  const max = Math.min(4, rhythmRunLength.value);
  if (max < 2) return [];
  return ([2, 3, 4] as WindowRhythmCount[]).filter((n) => n <= max);
});

const activeRhythmCount = computed((): WindowRhythmCount | null => {
  const host = rhythmHost.value;
  if (host?.windowRhythm) return host.windowRhythm;
  const slot = activeSlot.value;
  if (!slot || slot.type !== 'window' || slot.isUpper) return null;
  const count = panelCountForWall(slot.wall, store.dimensions.width, store.dimensions.depth);
  let windows = 0;
  for (let i = 0; i < count; i += 1) {
    const s = store.wallSlots[`${slot.wall}-${i}`];
    if (s?.type === 'window') windows += 1;
  }
  if (windows === 2 || windows === 3 || windows === 4) return windows;
  return null;
});

function applyWindowRhythm(n: WindowRhythmCount) {
  const slot = activeSlot.value;
  if (!slot || slot.type !== 'window' || !slot.itemId) return;
  store.setWallWindowRhythm(slot.wall, n, slot.itemId, slot.index);
}

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

const canFitWindow = computed(() => {
  const slot = activeSlot.value;
  return Boolean(slot && slot.type === 'window' && store.windowFitOffers.includes(slot.id));
});

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
      top: `clamp(100px, ${store.slotScreenPosition.y + 18}px, calc(100% - 400px))`,
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
  const item = list.find((entry) => entry.id === slot.itemId);
  if (!item) return slot.itemId ?? '';
  return catalog(item.id, 'name', item.name);
}

function openCategory(category: CategoryKey) {
  store.selectCategory(category);
}

function replacePlaced() {
  const slot = activeSlot.value;
  if (!slot || slot.type === 'empty') return;
  const category: CategoryKey = slot.type === 'window' ? 'windows' : 'doors';
  openCategory(category);
}
</script>
