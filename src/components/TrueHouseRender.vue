<template>
  <section class="space-y-3" aria-labelledby="true-house-render-title">
    <div class="space-y-1">
      <h4 id="true-house-render-title" class="text-sm font-extrabold tracking-tight text-slate-900">{{ t('houseImport.trueTitle') }}</h4>
      <p class="text-[11px] leading-relaxed text-slate-600">{{ t('houseImport.trueBody') }}</p>
    </div>

    <div class="space-y-1.5">
      <p id="true-house-facing-label" class="text-[11px] font-semibold text-slate-700">{{ t('houseImport.trueFacing') }}</p>
      <div class="grid grid-cols-4 gap-1.5" role="group" aria-labelledby="true-house-facing-label">
        <button
          v-for="side in FACINGS"
          :id="`true-house-facing-${side}`"
          :key="side"
          type="button"
          class="min-h-11 rounded-lg border px-1 py-2 text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          :class="facing === side ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100 disabled:cursor-wait disabled:hover:bg-white'"
          :aria-pressed="facing === side"
          :disabled="busy"
          @click="chooseFacing(side)"
        >
          <span class="inline-flex items-center justify-center gap-1.5">
            {{ t(`houseImport.site${facingKey(side)}`) }}
            <span
              v-if="renderStore.latest[side]"
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="facing === side ? 'bg-white' : 'bg-orange-500'"
              aria-hidden="true"
            />
          </span>
          <span v-if="renderStore.latest[side]" class="sr-only"> — {{ t('houseImport.trueReadyView') }}</span>
        </button>
      </div>
      <p v-if="readyCount" class="text-[11px] font-semibold text-slate-600" aria-live="polite">
        {{ t('houseImport.trueReady', { count: readyCount }) }}
      </p>
    </div>

    <p class="text-[11px] leading-relaxed text-slate-500">{{ t('houseImport.trueHelp') }}</p>

    <button
      id="true-house-render"
      type="button"
      class="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      :disabled="busy"
      @click="renderHouse"
    >
      <span aria-live="polite">{{ busy ? t('houseImport.trueWorking') : result ? t('houseImport.trueAgain') : t('houseImport.trueShow') }}</span>
    </button>

    <div v-if="busy && !result" class="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3" role="status">
      <svg class="h-4 w-4 animate-spin text-slate-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="text-xs font-semibold text-slate-700">{{ t('houseImport.trueWorking') }}</span>
    </div>

    <p v-if="error" class="text-[11px] font-semibold text-red-700" role="alert">{{ t('houseImport.trueFailed') }}</p>

    <figure v-if="result" class="space-y-2">
      <button
        id="true-house-result"
        type="button"
        class="block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        :aria-label="t('houseImport.enlarge')"
        @click="preview = true"
      >
        <img :src="result" :alt="t('houseImport.trueResultAlt')" class="w-full" />
      </button>
      <figcaption class="flex items-center justify-between gap-3 text-[11px] leading-relaxed text-slate-600">
        <span>{{ t('houseImport.trueNote') }}</span>
        <button
          id="true-house-download"
          type="button"
          class="min-h-11 shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          @click="download"
        >
          {{ t('houseImport.downloadView', { view: t(`houseImport.site${facingKey(facing)}`) }) }}
        </button>
      </figcaption>
    </figure>

    <Teleport to="body">
      <div v-if="preview" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-6" role="dialog" aria-modal="true" :aria-label="t('houseImport.trueResultAlt')" @click.self="preview = false">
        <button
          type="button"
          class="absolute right-4 top-4 min-h-11 rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="preview = false"
        >
          {{ t('houseImport.closePreview') }}
        </button>
        <img :src="result" :alt="t('houseImport.trueResultAlt')" class="max-h-[85vh] max-w-[90vw] rounded-xl" />
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useLabels } from '../i18n';
import { useConfigStore } from '../store/useConfigStore';
import { useHouseRenderStore } from '../store/useHouseRenderStore';
import { configuredHouseFacts } from '../services/configuredHouseFacts';
import {
  captureHouseOverview,
  captureHouseReference,
  requestTrueHousePicture,
  type SiteFacing
} from '../services/houseRender';

const FACINGS = ['front', 'back', 'left', 'right'] as const;
const DATA_URL_LIMIT = 270_000;
const store = useConfigStore();
const renderStore = useHouseRenderStore();
const { t } = useLabels();

const facing = ref<SiteFacing>('front');
const busy = ref(false);
const error = ref(false);
const preview = ref(false);
const result = computed(() => renderStore.latest[facing.value]);
const readyCount = computed(() => renderStore.readyFacings.length);

function facingKey(side: SiteFacing) {
  return `${side.charAt(0).toUpperCase()}${side.slice(1)}` as 'Front' | 'Back' | 'Left' | 'Right';
}

function chooseFacing(side: SiteFacing) {
  facing.value = side;
  error.value = false;
}

async function captureReferences(side: SiteFacing) {
  const dimensionsWereShown = store.showDimensions;
  if (dimensionsWereShown) {
    store.showDimensions = false;
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  try {
    const facade = captureHouseReference(side);
    const overview = captureHouseOverview();
    if (!facade || !overview || facade.length > DATA_URL_LIMIT || overview.length > DATA_URL_LIMIT) {
      throw new Error('house');
    }
    return [facade, overview];
  } finally {
    if (dimensionsWereShown) {
      store.showDimensions = true;
      await nextTick();
    }
  }
}

async function renderHouse() {
  if (busy.value) return;
  const renderFacing = facing.value;
  busy.value = true;
  error.value = false;
  try {
    const images = await captureReferences(renderFacing);
    const image = await requestTrueHousePicture(images, configuredHouseFacts(store), renderFacing);
    renderStore.remember(renderFacing, image);
  } catch (caught) {
    console.error('True house render failed:', caught);
    error.value = true;
  } finally {
    busy.value = false;
  }
}

function download() {
  if (!result.value) return;
  const link = document.createElement('a');
  link.href = result.value;
  link.download = `builder-house-${facing.value}-render.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') preview.value = false;
}

onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>
