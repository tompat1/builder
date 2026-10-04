<template>
  <section id="house-import" class="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
    <h3 class="text-xs font-bold text-slate-900 tracking-tight">{{ t('houseImport.title') }}</h3>

    <div class="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <h4 class="text-xs font-bold text-slate-800">{{ t('houseImport.picture') }}</h4>
      <p class="text-[11px] text-slate-600 leading-relaxed">{{ t('houseImport.pictureBody') }}</p>
      <label for="import-photos" class="block text-[11px] font-semibold text-slate-700">{{ t('houseImport.photos') }}</label>
      <input
        id="import-photos"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        class="block w-full text-[11px] text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-800"
        @change="onPhotos"
      />
      <p v-if="photoNote" class="text-[11px] text-slate-500">{{ photoNote }}</p>
      <div v-if="thumbs.length" class="flex gap-1.5">
        <img
          v-for="thumb in thumbs"
          :key="thumb"
          :src="thumb"
          alt=""
          class="h-12 w-12 rounded-lg object-cover border border-slate-200"
        />
      </div>
      <label for="import-prompt" class="block text-[11px] font-semibold text-slate-700">{{ t('houseImport.prompt') }}</label>
      <textarea
        id="import-prompt"
        v-model="prompt"
        rows="3"
        class="select-text w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400"
        :placeholder="t('houseImport.promptHint')"
      />
      <button
        id="import-picture"
        type="button"
        class="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        :disabled="pictureBusy || !prompt.trim()"
        @click="showPicture"
      >
        {{ pictureBusy ? t('houseImport.working') : t('houseImport.show') }}
      </button>
      <p v-if="pictureError" class="text-[11px] font-semibold text-red-700" role="status">{{ t('houseImport.failed') }}</p>
      <figure v-if="picture" class="space-y-1.5">
        <img id="import-picture-result" :src="picture" :alt="t('houseImport.pictureNote')" class="w-full rounded-lg border border-slate-200" />
        <figcaption class="text-[11px] text-slate-600 leading-relaxed">{{ t('houseImport.pictureNote') }}</figcaption>
        <p v-if="factTitle" class="text-[11px] font-semibold text-slate-700">{{ t('houseImport.steered') }} {{ factTitle }}</p>
      </figure>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <h4 class="text-xs font-bold text-slate-800">{{ t('houseImport.drawing') }}</h4>
      <p class="text-[11px] text-slate-600 leading-relaxed">{{ t('houseImport.drawingBody') }}</p>
      <label for="import-pdf" class="block text-[11px] font-semibold text-slate-700">{{ t('houseImport.pdf') }}</label>
      <input
        id="import-pdf"
        type="file"
        accept="application/pdf,.pdf"
        class="block w-full text-[11px] text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-800"
        @change="onPdf"
      />
      <button
        id="import-drawing"
        type="button"
        class="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        :disabled="drawingBusy || !pdfFile"
        @click="readPdf"
      >
        {{ drawingBusy ? t('houseImport.reading') : t('houseImport.read') }}
      </button>
      <p id="import-drawing-status" class="text-[11px] text-slate-700 leading-relaxed" role="status">{{ drawingStatus }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { DOORS_OPTIONS, ROOF_OPTIONS, useConfigStore, WINDOWS_OPTIONS } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import { askKnowledge } from '../knowledge/hub';
import { extractPdfText, hasMeasures, readDrawing, type DrawingReading } from '../import/drawing.js';
import { requestHousePicture } from '../services/houseRender';

const store = useConfigStore();
const { t, locale, catalog } = useLabels();

const prompt = ref('');
const photos = ref<File[]>([]);
const thumbs = ref<string[]>([]);
const photoNote = ref('');
const picture = ref('');
const factTitle = ref('');
const pictureBusy = ref(false);
const pictureError = ref(false);

const pdfFile = ref<File | null>(null);
const drawingBusy = ref(false);
const drawingStatus = ref('');

function clearThumbs() {
  for (const url of thumbs.value) URL.revokeObjectURL(url);
  thumbs.value = [];
}

function onPhotos(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])].filter((file) => /^image\/(png|jpeg|webp)$/.test(file.type));
  photos.value = files.slice(0, 4);
  photoNote.value = files.length > 4 ? t('houseImport.four') : '';
  clearThumbs();
  thumbs.value = photos.value.map((file) => URL.createObjectURL(file));
}

function onPdf(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  pdfFile.value = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) ? file : null;
  drawingStatus.value = '';
}

async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('blob');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const size = 0x4000;
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

async function showPicture() {
  const idea = prompt.value.trim();
  if (!idea || pictureBusy.value) return;
  pictureBusy.value = true;
  pictureError.value = false;
  try {
    const lang = locale.value === 'en' ? 'en' : 'sv';
    const hit = askKnowledge(idea);
    const facts = hit ? hit.entry.body[lang].slice(0, 360) : '';
    factTitle.value = hit ? hit.entry.title[lang] : '';
    const images: string[] = [];
    for (const file of photos.value) images.push(await shrink(file));
    picture.value = await requestHousePicture(idea, images, facts);
  } catch {
    pictureError.value = true;
  } finally {
    pictureBusy.value = false;
  }
}

function summary(reading: DrawingReading) {
  const parts: string[] = [];
  if (reading.width && reading.depth) parts.push(`${reading.width} × ${reading.depth} mm`);
  else if (reading.width) parts.push(`${reading.width} mm`);
  else if (reading.depth) parts.push(`${reading.depth} mm`);
  if (reading.height) parts.push(`${reading.height} mm`);
  if (reading.roof) parts.push(catalog(reading.roof, 'name', ROOF_OPTIONS.find((item) => item.id === reading.roof)?.name ?? reading.roof));
  if (reading.covering) parts.push(t(`category.${reading.covering}`));
  if (reading.door) parts.push(catalog(reading.door, 'name', DOORS_OPTIONS.find((item) => item.id === reading.door)?.name ?? reading.door));
  if (reading.window) parts.push(catalog(reading.window, 'name', WINDOWS_OPTIONS.find((item) => item.id === reading.window)?.name ?? reading.window));
  return parts.join(', ');
}

function applyReading(reading: DrawingReading) {
  if (reading.width) store.setBuildingMeasure('width', reading.width);
  if (reading.depth) store.setBuildingMeasure('depth', reading.depth);
  if (reading.height) store.setBuildingMeasure('height', reading.height);
  if (reading.roof) store.selectRoof(reading.roof);
  if (reading.covering) store.selectRoofCovering(reading.covering);
  if (reading.door) {
    store.selectDoor(reading.door);
    store.assignSlotItem('front-0', 'door', reading.door);
  }
  if (reading.window) {
    store.selectWindow(reading.window);
    store.assignSlotItem('front-1', 'window', reading.window);
  }
}

async function readPdf() {
  const file = pdfFile.value;
  if (!file || drawingBusy.value) return;
  drawingBusy.value = true;
  drawingStatus.value = '';
  try {
    if (file.size > 8_000_000) {
      drawingStatus.value = t('houseImport.bigPdf');
      return;
    }
    const text = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
    const reading = readDrawing(text);
    if (!hasMeasures(reading)) {
      drawingStatus.value = t('houseImport.empty');
      return;
    }
    applyReading(reading);
    drawingStatus.value = `${t('houseImport.applied')} ${summary(reading)}`;
  } catch {
    drawingStatus.value = t('houseImport.empty');
  } finally {
    drawingBusy.value = false;
  }
}

onBeforeUnmount(clearThumbs);
</script>
