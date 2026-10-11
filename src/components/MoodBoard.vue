<template>
  <section
    id="mood-board"
    class="mood-board pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#F5F3EC] text-[#222925]"
    role="region"
    :aria-label="t('mood.tool')"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <header class="flex items-start justify-between gap-4 px-4 pb-2 pt-4 md:px-8 md:pt-6">
      <div class="min-w-0">
        <h2 class="text-[1.65rem] font-semibold leading-none tracking-[-0.03em] text-[#173D35]">
          <Cms k="mood.title" />
        </h2>
        <p class="mt-2 max-w-[62ch] text-sm leading-relaxed text-[#3c4a43]">
          <Cms k="mood.lead" />
        </p>
      </div>
      <button
        type="button"
        id="btn-mood-close"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#173D35] hover:bg-[#173D35] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
        :aria-label="t('mood.close')"
        @click="store.showMood = false"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
      </button>
    </header>

    <form class="flex flex-wrap items-center gap-2 px-4 pb-3 md:px-8" @submit.prevent="submitLink">
      <label class="sr-only" for="mood-link"><Cms k="mood.link" /></label>
      <input
        id="mood-link"
        v-model="link"
        type="text"
        inputmode="url"
        autocomplete="off"
        spellcheck="false"
        class="mood-link min-w-[12rem] flex-1 rounded-xl border border-[#d7d1c4] bg-white px-3 py-2.5 text-sm text-[#222925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
        :placeholder="t('mood.placeholder')"
      />
      <button
        type="submit"
        id="btn-mood-add"
        class="h-11 rounded-xl bg-[#173D35] px-4 text-sm font-semibold text-[#F5F3EC] hover:bg-[#102e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F3EC]"
      >
        <Cms k="mood.add" />
      </button>
      <button
        type="button"
        id="btn-mood-files"
        class="h-11 rounded-xl border border-[#173D35] px-4 text-sm font-semibold text-[#173D35] hover:bg-[#173D35] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
        @click="fileInput?.click()"
      >
        <Cms k="mood.files" />
      </button>
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept="image/*,video/*"
        multiple
        :aria-label="t('mood.files')"
        @change="onFileInput"
      />
    </form>

    <p v-if="notice" class="px-4 pb-2 text-sm text-[#173D35] md:px-8" role="status">{{ t(notice) }}</p>

    <div
      ref="stage"
      class="relative min-h-0 flex-1 overflow-y-auto"
      :class="over ? 'outline outline-2 -outline-offset-[12px] outline-[#173D35]' : ''"
    >
      <div ref="sheet" class="relative min-h-[max(100%,40rem)] w-full">
      <p
        v-if="over"
        class="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-[#173D35] px-4 py-2 text-sm font-semibold text-[#F5F3EC]"
      >
        <Cms k="mood.drop" />
      </p>

      <article
        v-for="piece in pieces"
        :id="`mood-${piece.id}`"
        :key="piece.id"
        class="mood-piece absolute bg-white p-1.5 pb-2 shadow-[0_16px_32px_-12px_rgba(34,41,37,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
        :style="frame(piece)"
        tabindex="0"
        :aria-label="t('mood.move')"
        @pointerdown="onDown($event, piece, 'move')"
        @pointermove="onPointer"
        @pointerup="onUp"
        @pointercancel="onUp"
        @keydown="onPieceKey($event, piece)"
      >
        <div class="relative overflow-hidden bg-[#173D35]">
          <iframe
            v-if="playing === piece.id && embed(piece)"
            class="aspect-video w-full"
            :src="embed(piece)"
            :title="piece.caption || t('mood.play')"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
          <video
            v-else-if="piece.clip === 'file' && shown(piece)"
            class="block w-full"
            :src="shown(piece)"
            controls
            playsinline
            preload="metadata"
          ></video>
          <img
            v-else-if="piece.clip === 'youtube' && !broken[piece.id]"
            class="block w-full"
            :src="youtubePoster(piece.ref)"
            :alt="piece.caption || t('mood.picture')"
            draggable="false"
            @error="markBroken(piece.id)"
          />
          <div v-else-if="piece.clip === 'vimeo'" class="flex aspect-video w-full items-end bg-[#173D35] px-3 pb-3">
            <span class="text-[11px] font-medium tracking-wide text-[#F5F3EC]">vimeo.com</span>
          </div>
          <img
            v-else-if="piece.kind === 'image' && shown(piece) && !broken[piece.id]"
            class="block w-full"
            :src="shown(piece)"
            :alt="piece.caption || t('mood.picture')"
            draggable="false"
            @error="markBroken(piece.id)"
          />
          <p v-else class="px-3 py-8 text-center text-xs leading-relaxed text-[#F5F3EC]">
            {{ t(piece.src.startsWith('local:') ? 'mood.miss' : 'mood.gone') }}
          </p>

          <button
            v-if="(piece.clip === 'youtube' || piece.clip === 'vimeo') && playing !== piece.id"
            type="button"
            class="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5F3EC] text-[#173D35] shadow-[0_8px_16px_-6px_rgba(23,61,53,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
            :aria-label="t('mood.play')"
            @pointerdown.stop
            @click.stop="playing = piece.id"
          >
            <svg class="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
        </div>

        <label class="sr-only" :for="`mood-caption-${piece.id}`">{{ t('mood.caption') }}</label>
        <input
          :id="`mood-caption-${piece.id}`"
          class="mood-caption mt-1.5 w-full bg-transparent px-1 text-[13px] text-[#222925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :value="piece.caption"
          :placeholder="t('mood.captionPlaceholder')"
          maxlength="80"
          @pointerdown.stop
          @change="onCaption(piece, $event)"
        />

        <button
          type="button"
          class="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#173D35] text-[#F5F3EC] shadow-[0_6px_12px_-6px_rgba(23,61,53,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :aria-label="t('mood.remove')"
          @pointerdown.stop
          @click.stop="remove(piece)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>

        <button
          type="button"
          class="mood-size absolute bottom-1.5 right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm bg-[#173D35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :aria-label="t('mood.resize')"
          @pointerdown.stop="onDown($event, piece, 'size')"
          @pointermove.stop="onPointer"
          @pointerup.stop="onUp"
          @pointercancel.stop="onUp"
        ></button>
      </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';
import {
  MOOD_LIMIT,
  moodId,
  pieceFrom,
  placeFor,
  readLink,
  vimeoEmbed,
  youtubeEmbed,
  youtubePoster,
  type MoodPiece
} from '../mood/board';
import { pictureDataUrl } from '../mood/image';
import { deleteClip, getClip, loadMood, moodHouseKey, putClip, saveMood } from '../services/moodSave';
import { watchActiveHouseId } from '../services/houseSave';

const CLIP_LIMIT = 12 * 1024 * 1024;

const store = useConfigStore();
const { t } = useLabels();
const pieces = ref<MoodPiece[]>([]);
const link = ref('');
const notice = ref('');
const over = ref(false);
const playing = ref('');
const broken = ref<Record<string, boolean>>({});
const urls = ref<Record<string, string>>({});
const stage = ref<HTMLElement | null>(null);
const sheet = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
let houseKey = moodHouseKey();
let dragDepth = 0;
let stopWatch = () => {};
let drag: { mode: 'move' | 'size'; id: string; px: number; py: number; x: number; y: number; w: number } | null = null;

onMounted(() => {
  pieces.value = loadMood(houseKey);
  void hydrate();
  window.addEventListener('paste', onPaste);
  window.addEventListener('keydown', onEscape);
  stopWatch = watchActiveHouseId(() => {
    const next = moodHouseKey();
    if (next === houseKey) return;
    saveMood(pieces.value, houseKey);
    houseKey = next;
    playing.value = '';
    broken.value = {};
    revokeUrls();
    pieces.value = loadMood(houseKey);
    void hydrate();
  });
});

onBeforeUnmount(() => {
  saveMood(pieces.value, houseKey);
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('keydown', onEscape);
  stopWatch();
  revokeUrls();
});

function frame(piece: MoodPiece) {
  return {
    left: `${piece.x}%`,
    top: `${piece.y}%`,
    width: `${piece.w}%`,
    transform: `rotate(${piece.tilt}deg)`,
    zIndex: drag?.id === piece.id ? 5 : 1
  };
}

function shown(piece: MoodPiece) {
  return piece.src.startsWith('local:') ? urls.value[piece.id] ?? '' : piece.src;
}

function embed(piece: MoodPiece) {
  if (piece.clip === 'youtube') return youtubeEmbed(piece.ref);
  if (piece.clip === 'vimeo') return vimeoEmbed(piece.ref);
  return '';
}

function markBroken(id: string) {
  broken.value = { ...broken.value, [id]: true };
}

async function hydrate() {
  const next: Record<string, string> = {};
  for (const piece of pieces.value) {
    if (!piece.src.startsWith('local:')) continue;
    const blob = await getClip(piece.id);
    if (!blob) continue;
    next[piece.id] = URL.createObjectURL(blob);
  }
  revokeUrls();
  urls.value = next;
}

function revokeUrls() {
  for (const url of Object.values(urls.value)) URL.revokeObjectURL(url);
  urls.value = {};
}

function persist() {
  saveMood(pieces.value, houseKey);
}

function submitLink() {
  const raw = link.value;
  link.value = '';
  addLink(raw);
}

function addLink(raw: string) {
  notice.value = '';
  if (pieces.value.length >= MOOD_LIMIT) {
    notice.value = 'mood.full';
    return;
  }
  const parsed = readLink(raw);
  if (!parsed) {
    notice.value = 'mood.bad';
    return;
  }
  pieces.value.push(pieceFrom(parsed, pieces.value.length));
  persist();
}

async function addFiles(files: File[]) {
  notice.value = '';
  for (const file of files) {
    if (pieces.value.length >= MOOD_LIMIT) {
      notice.value = 'mood.full';
      break;
    }
    if (file.type.startsWith('video/')) {
      if (file.size > CLIP_LIMIT) {
        notice.value = 'mood.big';
        continue;
      }
      const id = moodId();
      try {
        await putClip(id, file);
      } catch {
        notice.value = 'mood.bad';
        continue;
      }
      const parsed = readLink(`local:${id}`);
      if (!parsed) continue;
      urls.value = { ...urls.value, [id]: URL.createObjectURL(file) };
      pieces.value.push({ id, ...parsed, ...placeFor(pieces.value.length), caption: '' });
      continue;
    }
    if (!file.type.startsWith('image/')) {
      notice.value = 'mood.bad';
      continue;
    }
    try {
      const data = await pictureDataUrl(file);
      const parsed = readLink(data);
      if (!parsed) {
        notice.value = 'mood.bad';
        continue;
      }
      pieces.value.push(pieceFrom(parsed, pieces.value.length));
    } catch {
      notice.value = 'mood.big';
    }
  }
  persist();
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = '';
  void addFiles(files);
}

function remove(piece: MoodPiece) {
  if (piece.src.startsWith('local:')) {
    const url = urls.value[piece.id];
    if (url) URL.revokeObjectURL(url);
    const next = { ...urls.value };
    delete next[piece.id];
    urls.value = next;
    void deleteClip(piece.id);
  }
  if (playing.value === piece.id) playing.value = '';
  pieces.value = pieces.value.filter((item) => item.id !== piece.id);
  persist();
}

function onCaption(piece: MoodPiece, event: Event) {
  piece.caption = (event.target as HTMLInputElement).value.trim().slice(0, 80);
  persist();
}

function onPaste(event: ClipboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea')) return;
  const files = [...(event.clipboardData?.files ?? [])];
  if (files.length) {
    event.preventDefault();
    void addFiles(files);
    return;
  }
  const text = event.clipboardData?.getData('text') ?? '';
  if (!readLink(text)) return;
  event.preventDefault();
  addLink(text);
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') store.showMood = false;
}

function onDragEnter(event: DragEvent) {
  if (!hasFiles(event)) return;
  dragDepth += 1;
  over.value = true;
}

function onDragOver(event: DragEvent) {
  if (!hasFiles(event)) return;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  over.value = true;
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) over.value = false;
}

function onDrop(event: DragEvent) {
  dragDepth = 0;
  over.value = false;
  void addFiles([...(event.dataTransfer?.files ?? [])]);
}

function hasFiles(event: DragEvent) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}

function onDown(event: PointerEvent, piece: MoodPiece, mode: 'move' | 'size') {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (mode === 'move' && target?.closest('input, button, textarea, iframe, video, a')) return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag = { mode, id: piece.id, px: event.clientX, py: event.clientY, x: piece.x, y: piece.y, w: piece.w };
}

function onPointer(event: PointerEvent) {
  if (!drag || !sheet.value) return;
  const piece = pieces.value.find((item) => item.id === drag?.id);
  if (!piece) return;
  const rect = sheet.value.getBoundingClientRect();
  if (drag.mode === 'move') {
    piece.x = clamp(drag.x + ((event.clientX - drag.px) / rect.width) * 100, 0, 100 - piece.w);
    piece.y = clamp(drag.y + ((event.clientY - drag.py) / rect.height) * 100, 0, 78);
    return;
  }
  piece.w = clamp(drag.w + ((event.clientX - drag.px) / rect.width) * 100, 16, 72);
  piece.x = Math.min(piece.x, 100 - piece.w);
}

function onUp() {
  if (!drag) return;
  drag = null;
  persist();
}

function onPieceKey(event: KeyboardEvent, piece: MoodPiece) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, iframe, video')) return;
  const step = event.shiftKey ? 4 : 1.5;
  if (event.key === 'ArrowLeft') piece.x = clamp(piece.x - step, 0, 100 - piece.w);
  else if (event.key === 'ArrowRight') piece.x = clamp(piece.x + step, 0, 100 - piece.w);
  else if (event.key === 'ArrowUp') piece.y = clamp(piece.y - step, 0, 78);
  else if (event.key === 'ArrowDown') piece.y = clamp(piece.y + step, 0, 78);
  else if (event.key === 'Delete' || event.key === 'Backspace') remove(piece);
  else return;
  event.preventDefault();
  persist();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
</script>

<style scoped>
.mood-board ::selection {
  background: #173d35;
  color: #f5f3ec;
}
.mood-link::placeholder {
  color: #5c6b64;
}
.mood-caption::placeholder {
  color: transparent;
}
.mood-caption:focus::placeholder {
  color: #5c6b64;
}
.mood-size {
  opacity: 0;
}
.mood-piece:hover .mood-size,
.mood-piece:focus-within .mood-size {
  opacity: 1;
}
@media (hover: none) {
  .mood-size {
    opacity: 1;
  }
}
.mood-piece {
  animation: mood-in 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes mood-in {
  from {
    opacity: 0;
    filter: blur(6px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mood-piece {
    animation: none;
  }
}
</style>
