<template>
  <SiteFrame>
    <div class="px-4 py-12 md:px-8 md:py-16">
      <h1 class="max-w-[16ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-pine md:text-6xl">{{ t('site.shopTitle') }}</h1>
      <p class="mt-4 max-w-xl text-lg text-pine/80">{{ t('site.shopLead') }}</p>
      <div class="mt-6 flex flex-wrap gap-2" role="tablist">
        <button
          v-for="filter in filters"
          :key="filter.id"
          type="button"
          role="tab"
          :aria-selected="kind === filter.id"
          class="rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          :class="kind === filter.id ? 'bg-pine text-ivory' : 'bg-white text-pine hover:bg-sage/40'"
          @click="kind = filter.id"
        >
          {{ t(filter.label) }}
        </button>
      </div>

      <ul class="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="item in shown" :key="item.id" class="group">
          <div class="relative overflow-hidden rounded-2xl bg-white" :class="selected === item.id ? 'ring-2 ring-pine' : ''">
            <button
              type="button"
              class="block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              :aria-pressed="selected === item.id"
              :aria-label="`${t(item.nameKey)}. ${t('site.zoomPhoto')}`"
              @click="openZoom(item)"
            >
              <img
                :src="item.image"
                alt=""
                class="aspect-square w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-105 group-focus-within:scale-105 motion-reduce:group-hover:scale-100"
              />
            </button>
            <span v-if="totalQty(item)" class="pointer-events-none absolute right-3 top-3 z-20 grid h-7 min-w-7 place-items-center rounded-full bg-pine px-2 text-xs font-bold tabular-nums text-ivory">{{ totalQty(item) }}</span>
            <div
              class="z-10 bg-ivory/95 px-3 py-3 md:absolute md:inset-x-0 md:bottom-0 md:border-t md:border-pine/15 md:bg-ivory/90 md:backdrop-blur-md md:transition-transform md:duration-500 md:ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:md:transition-none"
              :class="selected === item.id ? 'md:translate-y-0' : 'md:translate-y-full md:group-hover:translate-y-0 md:group-focus-within:translate-y-0'"
            >
              <p class="text-xs leading-relaxed text-pine/75">{{ t(item.detailKey) }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5" role="group" :aria-label="t('site.size')">
                <button
                  v-for="size in item.sizes"
                  :key="size"
                  type="button"
                  class="rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                  :class="chosen(item) === size ? 'bg-pine text-ivory' : 'border border-pine/20 text-pine hover:border-pine'"
                  :aria-pressed="chosen(item) === size"
                  @click="pickSize(item.id, size)"
                >
                  {{ sizeLabel(size) }}
                </button>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button
                  v-if="!lineQty(item)"
                  type="button"
                  class="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-ivory hover:bg-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                  @click="add(item)"
                >
                  {{ t('site.add') }}
                </button>
                <template v-else>
                  <button type="button" class="grid h-9 w-9 place-items-center rounded-full border border-pine/20 text-pine hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" :aria-label="t('site.decrease')" @click="bag.setQty(keyFor(item), lineQty(item) - 1)">−</button>
                  <span class="w-6 text-center text-sm font-semibold tabular-nums">{{ lineQty(item) }}</span>
                  <button type="button" class="grid h-9 w-9 place-items-center rounded-full border border-pine/20 text-pine hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" :aria-label="t('site.increase')" :disabled="lineQty(item) >= 19" @click="bag.setQty(keyFor(item), lineQty(item) + 1)">+</button>
                  <button type="button" class="ml-1 text-sm font-semibold text-pine hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" @click="bag.remove(keyFor(item))">
                    {{ t('site.remove') }}
                  </button>
                </template>
              </div>
            </div>
          </div>
          <h2 class="mt-3 font-display text-lg font-extrabold tracking-[-0.03em] text-pine">{{ t(item.nameKey) }}</h2>
          <p class="mt-1 text-sm font-semibold tabular-nums text-graphite">{{ money(item.priceSek) }}</p>
        </li>
      </ul>
    </div>
    <Teleport to="body">
      <div v-if="zoomed" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
        <button type="button" class="absolute inset-0 bg-graphite/75" :aria-label="t('site.close')" @click="closeZoom" />
        <div
          class="relative z-10 flex max-h-full w-full max-w-5xl flex-col"
          role="dialog"
          aria-modal="true"
          :aria-label="t(zoomed.nameKey)"
        >
          <button
            ref="zoomClose"
            type="button"
            class="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-ivory text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
            :aria-label="t('site.close')"
            @click="closeZoom"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div
            ref="stage"
            role="button"
            tabindex="0"
            class="overflow-hidden rounded-2xl bg-ivory select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
            :class="tight ? (drag ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'"
            :style="tight ? { touchAction: 'none' } : undefined"
            :aria-pressed="tight"
            :aria-label="tight ? `${t('site.zoomFit')}. ${t('site.zoomMove')}` : t('site.zoomCloser')"
            @pointerdown="onStageDown"
            @click="onStageClick"
            @keydown.enter.prevent="onStageClick"
            @keydown.space.prevent="onStageClick"
            @dragstart.prevent
          >
            <img
              :src="zoomed.image"
              alt=""
              draggable="false"
              class="pointer-events-none max-h-[82vh] w-full select-none object-contain ease-out [-webkit-user-drag:none] motion-reduce:transition-none"
              :class="drag ? '' : 'transition-transform duration-300'"
              :style="{ transform: tight ? `translate(${pan.x}px, ${pan.y}px) scale(2.4)` : 'scale(1)' }"
            />
          </div>
          <p class="mt-3 text-center font-display text-lg font-extrabold text-ivory">{{ t(zoomed.nameKey) }}</p>
          <p v-if="tight" class="mt-1 text-center text-sm text-ivory/80">{{ t('site.zoomMove') }}</p>
        </div>
      </div>
    </Teleport>
  </SiteFrame>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import SiteFrame from '../components/site/SiteFrame.vue';
import { useLabels } from '../i18n';
import { MERCH, lineKey, type MerchItem, type MerchKind } from '../site/merch';
import { useBagStore } from '../store/useBagStore';

const { t, money } = useLabels();
const bag = useBagStore();
const kind = ref<'all' | MerchKind>('all');
const selected = ref('');
const picked = ref<Record<string, string>>({});
const zoomed = ref<MerchItem | null>(null);
const tight = ref(false);
const zoomClose = ref<HTMLButtonElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const pan = ref({ x: 0, y: 0 });
const drag = ref<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
let suppressClick = false;

function openZoom(item: MerchItem) {
  selected.value = item.id;
  tight.value = false;
  pan.value = { x: 0, y: 0 };
  zoomed.value = item;
}

function closeZoom() {
  zoomed.value = null;
  tight.value = false;
  pan.value = { x: 0, y: 0 };
  onStageUp();
}

function panLimit() {
  const el = stage.value;
  if (!el) return { x: 0, y: 0 };
  return {
    x: (el.clientWidth * (2.4 - 1)) / 2,
    y: (el.clientHeight * (2.4 - 1)) / 2
  };
}

function clampPan(x: number, y: number) {
  const limit = panLimit();
  return {
    x: Math.max(-limit.x, Math.min(limit.x, x)),
    y: Math.max(-limit.y, Math.min(limit.y, y))
  };
}

function onStageDown(event: PointerEvent) {
  if (!tight.value || event.button !== 0) return;
  // A press on the photo otherwise becomes a native image drag, which never emits pointermove.
  event.preventDefault();
  const target = event.currentTarget;
  if (target instanceof Element) {
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Capture needs a live pointer. Window listeners still follow the drag.
    }
  }
  drag.value = { x: event.clientX, y: event.clientY, px: pan.value.x, py: pan.value.y, moved: false };
  window.addEventListener('pointermove', onStageMove);
  window.addEventListener('pointerup', onStageUp);
  window.addEventListener('pointercancel', onStageUp);
}

function onStageMove(event: PointerEvent) {
  if (!drag.value) return;
  const dx = event.clientX - drag.value.x;
  const dy = event.clientY - drag.value.y;
  if (Math.hypot(dx, dy) > 4) drag.value.moved = true;
  pan.value = clampPan(drag.value.px + dx, drag.value.py + dy);
}

function onStageUp() {
  const active = drag.value;
  drag.value = null;
  window.removeEventListener('pointermove', onStageMove);
  window.removeEventListener('pointerup', onStageUp);
  window.removeEventListener('pointercancel', onStageUp);
  if (!active) return;
  // preventDefault on pointerdown can swallow the click, so a press that did not move zooms back out here.
  suppressClick = true;
  if (!active.moved) {
    tight.value = false;
    pan.value = { x: 0, y: 0 };
  }
}

function onStageClick() {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  tight.value = !tight.value;
  if (!tight.value) pan.value = { x: 0, y: 0 };
}

function onZoomKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeZoom();
    return;
  }
  if (!tight.value) return;
  const step = event.key === 'ArrowLeft' ? [-48, 0] : event.key === 'ArrowRight' ? [48, 0] : event.key === 'ArrowUp' ? [0, -48] : event.key === 'ArrowDown' ? [0, 48] : null;
  if (!step) return;
  event.preventDefault();
  pan.value = clampPan(pan.value.x + step[0], pan.value.y + step[1]);
}

watch(zoomed, async (item) => {
  document.body.classList.toggle('overflow-hidden', Boolean(item) || bag.panel);
  if (!item) {
    window.removeEventListener('keydown', onZoomKey);
    return;
  }
  window.addEventListener('keydown', onZoomKey);
  await nextTick();
  zoomClose.value?.focus();
});

onUnmounted(() => {
  if (!bag.panel) document.body.classList.remove('overflow-hidden');
  window.removeEventListener('keydown', onZoomKey);
  window.removeEventListener('pointermove', onStageMove);
  window.removeEventListener('pointerup', onStageUp);
  window.removeEventListener('pointercancel', onStageUp);
});

function chosen(item: MerchItem) {
  return picked.value[item.id] ?? item.sizes[0];
}

function pickSize(id: string, size: string) {
  picked.value = { ...picked.value, [id]: size };
}

function sizeLabel(size: string) {
  return size === 'one' ? t('site.oneSize') : size;
}

function keyFor(item: MerchItem) {
  return lineKey(item.id, chosen(item));
}

function lineQty(item: MerchItem) {
  return bag.lines[keyFor(item)] ?? 0;
}

function totalQty(item: MerchItem) {
  return item.sizes.reduce((sum, size) => sum + (bag.lines[lineKey(item.id, size)] ?? 0), 0);
}

function add(item: MerchItem) {
  bag.add(keyFor(item));
  bag.openPanel();
}

const filters = [
  { id: 'all' as const, label: 'site.all' },
  { id: 'clothing' as const, label: 'site.clothing' },
  { id: 'accessories' as const, label: 'site.accessories' },
  { id: 'prints' as const, label: 'site.prints' }
];

const shown = computed(() => MERCH.filter((item) => kind.value === 'all' || item.kind === kind.value));
</script>
