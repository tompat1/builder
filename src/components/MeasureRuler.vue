<template>
  <div class="pointer-events-none absolute inset-0 z-10 overflow-hidden">
    <svg v-if="band" class="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      <line
        :x1="band.x1"
        :y1="band.y1"
        :x2="band.x2"
        :y2="band.y2"
        stroke="#ffffff"
        stroke-width="5"
        stroke-linecap="round"
      />
      <line
        :x1="band.x1"
        :y1="band.y1"
        :x2="band.x2"
        :y2="band.y2"
        stroke="#0f172a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        v-for="(tick, index) in band.ticks"
        :key="index"
        :x1="tick[0]"
        :y1="tick[1]"
        :x2="tick[2]"
        :y2="tick[3]"
        stroke="#0f172a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <circle :cx="band.x1" :cy="band.y1" r="3.5" fill="#0f172a" />
      <circle :cx="band.x2" :cy="band.y2" r="3.5" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
    </svg>
    <div
      v-if="band"
      id="measure-readout"
      class="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-slate-300/80 bg-white/95 px-2 py-1 text-xs font-bold leading-none text-slate-900 shadow-2xs"
      :style="{ left: `${band.labelX}px`, top: `${band.labelY}px` }"
      role="status"
    >
      {{ band.mm }} mm
    </div>
    <p
      v-if="hint"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md"
      role="status"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import { measureLengthMm } from '../measure/length';

const store = useConfigStore();
const { t } = useLabels();

const hint = computed(() => {
  if (!store.measuring) return '';
  if (!store.measureStart) return t('tools.measureStart');
  if (!store.measureEnd) return t('tools.measureEnd');
  return '';
});

const band = computed(() => {
  const start = store.measureStart;
  const end = store.measureEnd ?? store.measureCursor;
  const from = store.measureScreen.start;
  const to = store.measureScreen.end;
  if (!start || !end || !from.visible || !to.visible) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const span = Math.hypot(dx, dy);
  if (span < 1) return null;
  const nx = -dy / span;
  const ny = dx / span;
  const tick = 7;
  return {
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    ticks: [
      [from.x - nx * tick, from.y - ny * tick, from.x + nx * tick, from.y + ny * tick],
      [to.x - nx * tick, to.y - ny * tick, to.x + nx * tick, to.y + ny * tick]
    ],
    labelX: (from.x + to.x) / 2 + nx * 18,
    labelY: (from.y + to.y) / 2 + ny * 18,
    mm: measureLengthMm(start, end)
  };
});

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.measuring) store.toggleMeasure();
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>
