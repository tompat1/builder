<template>
  <section class="space-y-3" aria-labelledby="site-preview-title">
    <div class="space-y-1">
      <h4 id="site-preview-title" class="text-sm font-extrabold tracking-tight text-slate-900">{{ t('houseImport.siteTitle') }}</h4>
      <p class="text-[11px] leading-relaxed text-slate-600">{{ t('houseImport.siteBody') }}</p>
    </div>

    <div class="space-y-2">
      <label for="import-site-photos" class="block text-[11px] font-semibold text-slate-700">{{ t('houseImport.sitePhotos') }}</label>
      <input
        id="import-site-photos"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        class="block w-full text-[11px] text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-800"
        @change="onPhotos"
      />
      <p class="text-[11px] leading-relaxed text-slate-500">{{ photoNote || t('houseImport.siteLimit') }}</p>
    </div>

    <div v-if="primaryThumb" class="space-y-2">
      <button
        id="site-placement-photo"
        type="button"
        class="relative block w-full overflow-hidden rounded-xl bg-slate-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        :aria-label="t('houseImport.sitePlace')"
        @click="setPlacement"
      >
        <img :src="primaryThumb" alt="" class="block h-auto w-full" />
        <span
          class="pointer-events-none absolute h-4 -translate-x-1/2 -translate-y-full border-b-2 border-dashed border-white drop-shadow-md before:absolute before:bottom-[-5px] before:left-0 before:h-3 before:border-l-2 before:border-white after:absolute after:bottom-[-5px] after:right-0 after:h-3 after:border-r-2 after:border-white"
          :style="{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${houseWidthPercent}%` }"
          aria-hidden="true"
        ></span>
        <span
          class="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-full rounded-full border-[3px] border-white bg-[#FF5A00] shadow-md"
          :style="{ left: `${placement.x}%`, top: `${placement.y}%` }"
          aria-hidden="true"
        >
          <span class="absolute left-1/2 top-full h-2 w-0.5 -translate-x-1/2 bg-white"></span>
        </span>
      </button>
      <p class="text-[11px] leading-relaxed text-slate-600">{{ t('houseImport.sitePlace') }}</p>

      <div class="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
        <div class="flex items-center justify-between gap-3">
          <label for="site-house-width" class="text-[11px] font-semibold text-slate-700">{{ t('houseImport.siteWidth') }}</label>
          <output for="site-house-width" class="text-[11px] font-bold tabular-nums text-slate-900">{{ t('houseImport.siteWidthValue', { value: houseWidthPercent }) }}</output>
        </div>
        <input
          id="site-house-width"
          v-model.number="houseWidthPercent"
          type="range"
          min="20"
          max="90"
          step="5"
          class="block min-h-11 w-full accent-[#FF5A00]"
          :aria-describedby="'site-house-width-help'"
          @input="invalidateResult"
        />
        <p id="site-house-width-help" class="text-[11px] leading-relaxed text-slate-500">{{ t('houseImport.siteWidthHelp') }}</p>
      </div>

      <div class="space-y-1.5">
        <p id="site-facing-label" class="text-[11px] font-semibold text-slate-700">{{ t('houseImport.siteFacing') }}</p>
        <div class="grid grid-cols-2 gap-1.5" role="group" aria-labelledby="site-facing-label">
          <button
            v-for="side in FACINGS"
            :key="side"
            type="button"
            :id="`site-facing-${side}`"
            class="min-h-11 rounded-lg border px-1 py-2 text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            :class="facing === side ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'"
            :aria-pressed="facing === side"
            @click="setFacing(side)"
          >
            {{ t(`houseImport.site${facingKey(side)}`) }}
          </button>
        </div>
      </div>

      <div v-if="thumbs.length > 1" class="flex flex-wrap gap-2" role="list" :aria-label="t('houseImport.sitePhotos')">
        <button
          v-for="(thumb, index) in thumbs"
          :key="thumb"
          type="button"
          class="h-14 w-16 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          :class="index === primaryIndex ? 'border-slate-900' : 'border-transparent hover:border-slate-300'"
          :aria-label="t('houseImport.sitePrimary', { number: index + 1 })"
          :aria-pressed="index === primaryIndex"
          @click="selectPrimary(index)"
        >
          <img :src="thumb" alt="" class="h-full w-full object-cover" />
        </button>
      </div>
    </div>

    <button
      id="import-site-render"
      type="button"
      class="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      :disabled="busy || !sitePhotos.length"
      @click="renderSite"
    >
      <span aria-live="polite">{{ busy ? t('houseImport.siteWorking') : result ? t('houseImport.siteUpdate') : t('houseImport.siteShow') }}</span>
    </button>

    <div v-if="busy && !result" class="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3" role="status">
      <svg class="h-4 w-4 animate-spin text-slate-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" class="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="text-xs font-semibold text-slate-700">{{ t('houseImport.siteWorking') }}</span>
    </div>

    <p v-if="error" class="text-[11px] font-semibold text-red-700" role="alert">{{ t('houseImport.siteFailed') }}</p>

    <figure v-if="result" class="space-y-2">
      <button
        id="site-picture-result"
        type="button"
        class="block w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        :aria-label="t('houseImport.enlarge')"
        @click="preview = true"
      >
        <img :src="result" :alt="t('houseImport.siteResultAlt')" class="w-full" />
      </button>
      <figcaption class="flex items-center justify-between gap-3 text-[11px] leading-relaxed text-slate-600">
        <span>{{ t('houseImport.siteNote') }}</span>
        <button
          id="site-picture-download"
          type="button"
          class="min-h-11 shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          @click="download"
        >
          {{ t('houseImport.download') }}
        </button>
      </figcaption>
    </figure>

    <Teleport to="body">
      <div v-if="preview" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-6" role="dialog" aria-modal="true" :aria-label="t('houseImport.siteResultAlt')" @click.self="preview = false">
        <button
          type="button"
          class="absolute right-4 top-4 min-h-11 rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="preview = false"
        >
          {{ t('houseImport.closePreview') }}
        </button>
        <img :src="result" :alt="t('houseImport.siteResultAlt')" class="max-h-[85vh] max-w-[90vw] rounded-xl" />
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import {
  captureHouseCutout,
  captureHouseOverview,
  requestSitePicture,
  type SiteFacing
} from '../services/houseRender';
import { configuredHouseFacts } from '../services/configuredHouseFacts';
import {
  clearOldStructureUnderHouse,
  drawHouseContactShadow,
  siteHouseRect
} from '../services/sitePhotoPrep';

const SITE_PHOTO_LIMIT = 3;
const DATA_URL_LIMIT = 270_000;
const FACINGS = ['front', 'back'] as const;
const store = useConfigStore();
const { t } = useLabels();

const sitePhotos = ref<File[]>([]);
const thumbs = ref<string[]>([]);
const facings = ref<SiteFacing[]>([]);
const primaryIndex = ref(0);
const placement = ref({ x: 50, y: 68 });
const houseWidthPercent = ref(55);
const photoNote = ref('');
const result = ref('');
const busy = ref(false);
const error = ref(false);
const preview = ref(false);

const primaryThumb = computed(() => thumbs.value[primaryIndex.value] ?? '');
const facing = computed(() => facings.value[primaryIndex.value] ?? 'front');

function facingKey(side: SiteFacing) {
  return `${side.charAt(0).toUpperCase()}${side.slice(1)}` as 'Front' | 'Back' | 'Left' | 'Right';
}

function clearThumbs() {
  for (const thumb of thumbs.value) URL.revokeObjectURL(thumb);
  thumbs.value = [];
}

function onPhotos(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])].filter((file) => /^image\/(png|jpeg|webp)$/.test(file.type));
  sitePhotos.value = files.slice(0, SITE_PHOTO_LIMIT);
  facings.value = sitePhotos.value.map(() => 'front');
  photoNote.value = files.length > SITE_PHOTO_LIMIT ? t('houseImport.siteThree') : '';
  primaryIndex.value = 0;
  placement.value = { x: 50, y: 68 };
  houseWidthPercent.value = 55;
  result.value = '';
  error.value = false;
  clearThumbs();
  thumbs.value = sitePhotos.value.map((file) => URL.createObjectURL(file));
}

function selectPrimary(index: number) {
  primaryIndex.value = index;
  result.value = '';
  error.value = false;
}

function setFacing(side: SiteFacing) {
  facings.value[primaryIndex.value] = side;
  result.value = '';
  error.value = false;
}

function setPlacement(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const bounds = target.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  placement.value = {
    x: Math.max(5, Math.min(95, Math.round(((event.clientX - bounds.left) / bounds.width) * 100))),
    y: Math.max(10, Math.min(95, Math.round(((event.clientY - bounds.top) / bounds.height) * 100)))
  };
  invalidateResult();
}

function invalidateResult() {
  result.value = '';
  error.value = false;
}

function blobDataUrl(blob: Blob) {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const size = 0x4000;
    for (let index = 0; index < bytes.length; index += size) {
      binary += String.fromCharCode(...bytes.subarray(index, index + size));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  });
}

async function shrinkScene(file: File) {
  const bitmap = await createImageBitmap(file);
  const aspectRatio = bitmap.width / bitmap.height;
  const attempts = [
    { maxSide: 768, quality: 0.72 },
    { maxSide: 640, quality: 0.64 },
    { maxSide: 512, quality: 0.58 },
    { maxSide: 384, quality: 0.52 }
  ];
  try {
    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(64, Math.round(bitmap.width * scale));
      canvas.height = Math.max(64, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', attempt.quality));
      if (!blob) throw new Error('blob');
      const dataUrl = await blobDataUrl(blob);
      if (dataUrl.length <= DATA_URL_LIMIT) return { dataUrl, aspectRatio };
    }
  } finally {
    bitmap.close();
  }
  throw new Error('image');
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image'));
    image.src = src;
  });
}

async function shrinkDataUrl(dataUrl: string) {
  if (dataUrl.length <= DATA_URL_LIMIT) return dataUrl;
  const image = await loadImage(dataUrl);
  const attempts = [
    { maxSide: 768, quality: 0.72 },
    { maxSide: 640, quality: 0.64 },
    { maxSide: 512, quality: 0.58 },
    { maxSide: 384, quality: 0.5 }
  ];
  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(64, Math.round(image.width * scale));
    canvas.height = Math.max(64, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', attempt.quality));
    if (!blob) continue;
    const next = await blobDataUrl(blob);
    if (next.length <= DATA_URL_LIMIT) return next;
  }
  throw new Error('image');
}

/**
 * Live test winner: image 0 = geometry-locked draft (cleared garden + exact
 * 3D cutout), image 1 = clean house plate. Flux then photorealizes without the
 * floating CAD-card failure mode.
 */
async function composeDraft(siteUrl: string, cutoutUrl: string) {
  const [site, cutout] = await Promise.all([loadImage(siteUrl), loadImage(cutoutUrl)]);
  const canvas = document.createElement('canvas');
  canvas.width = site.naturalWidth || site.width;
  canvas.height = site.naturalHeight || site.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.drawImage(site, 0, 0, canvas.width, canvas.height);
  const rect = siteHouseRect(
    placement.value,
    canvas.width,
    canvas.height,
    houseWidthPercent.value,
    cutout.width / Math.max(1, cutout.height)
  );
  clearOldStructureUnderHouse(context, canvas.width, canvas.height, rect);
  drawHouseContactShadow(context, rect);
  context.drawImage(cutout, rect.x, rect.y, rect.width, rect.height);

  for (const quality of [0.82, 0.74, 0.66, 0.58]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) continue;
    const dataUrl = await blobDataUrl(blob);
    if (dataUrl.length <= DATA_URL_LIMIT) return dataUrl;
  }
  throw new Error('image');
}

async function houseReferencePlate(cutoutUrl: string, overviewUrl: string) {
  const cutout = await loadImage(cutoutUrl);
  const pad = Math.max(16, Math.round(Math.max(cutout.width, cutout.height) * 0.04));
  const canvas = document.createElement('canvas');
  canvas.width = cutout.width + pad * 2;
  canvas.height = cutout.height + pad * 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.fillStyle = '#eef2f6';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(cutout, pad, pad);
  for (const quality of [0.85, 0.72, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) continue;
    const dataUrl = await blobDataUrl(blob);
    if (dataUrl.length <= DATA_URL_LIMIT) return dataUrl;
  }
  return shrinkDataUrl(overviewUrl);
}

async function captureHouseRefs() {
  const dimensionsWereShown = store.showDimensions;
  if (dimensionsWereShown) {
    store.showDimensions = false;
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  try {
    const cutout = captureHouseCutout(facing.value);
    const overview = captureHouseOverview();
    if (!cutout) throw new Error('house');
    if (!overview || overview.length > DATA_URL_LIMIT) throw new Error('house');
    return { cutout, overview };
  } finally {
    if (dimensionsWereShown) {
      store.showDimensions = true;
      await nextTick();
    }
  }
}

async function renderSite() {
  if (!sitePhotos.value.length || busy.value) return;
  busy.value = true;
  error.value = false;
  try {
    const primary = await shrinkScene(sitePhotos.value[primaryIndex.value]);
    const refs = await captureHouseRefs();
    const draft = await composeDraft(primary.dataUrl, refs.cutout);
    const plate = await houseReferencePlate(refs.cutout, refs.overview);
    result.value = await requestSitePicture(
      [draft, plate],
      `Image 0 is a placement draft of the exact configured 3D house in the garden — photorealize it without changing the house silhouette, roof, terrace, sauna, or hot tub. ${configuredHouseFacts(store)}`,
      placement.value,
      houseWidthPercent.value,
      primary.aspectRatio,
      facing.value
    );
  } catch (err) {
    console.error('Site render failed:', err);
    error.value = true;
  } finally {
    busy.value = false;
  }
}

function download() {
  if (!result.value) return;
  const link = document.createElement('a');
  link.href = result.value;
  link.download = 'builder-site-preview.jpg';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') preview.value = false;
}

onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  clearThumbs();
});
</script>
