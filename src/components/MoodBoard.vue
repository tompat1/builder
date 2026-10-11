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
      <div class="min-w-0 flex-1">
        <div class="group flex items-center gap-2">
          <input
            id="mood-title-input"
            v-model="title"
            type="text"
            maxlength="100"
            class="max-w-[34rem] truncate rounded-xl border border-transparent bg-transparent px-2 py-1 text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-[#173D35] transition hover:border-[#d7d1c4] focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/30"
            :placeholder="t('mood.title')"
            :aria-label="t('mood.editTitle')"
            @input="persist"
            @blur="persist"
          />
          <span class="pointer-events-none text-xs text-[#173D35]/40 opacity-0 transition group-hover:opacity-100">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
        </div>

        <div v-if="formattedCreated" class="mt-1 flex items-center gap-1.5 px-2 text-xs font-medium text-[#5c6b64]">
          <svg class="h-3.5 w-3.5 text-[#173D35]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ t('mood.created') }}: {{ formattedCreated }}</span>
        </div>

        <p class="mt-1.5 max-w-[62ch] px-2 text-sm leading-relaxed text-[#3c4a43]">
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
      <button
        type="button"
        id="btn-mood-postit"
        class="flex h-11 items-center gap-1.5 rounded-xl border border-[#e4d8a5] bg-[#FEF9C3] px-3.5 text-sm font-semibold text-[#854D0E] shadow-sm hover:bg-[#FEF08A] hover:border-[#d6c78e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D0E]"
        @click="addPostIt()"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span>{{ t('mood.postit') }}</span>
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
          class="mood-piece absolute select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :class="[
            piece.kind === 'note'
              ? ['mood-note border p-3 pb-3.5 shadow-[0_12px_24px_-8px_rgba(34,41,37,0.35)]', noteClasses(piece.color)]
              : 'cursor-grab active:cursor-grabbing bg-white p-1.5 pb-2.5 shadow-[0_16px_32px_-12px_rgba(34,41,37,0.45)]'
          ]"
          :style="frame(piece)"
          tabindex="0"
          :aria-label="t('mood.move')"
          @pointerdown="onDown($event, piece, 'move')"
          @pointermove="onPointer"
          @pointerup="onUp"
          @pointercancel="onUp"
          @keydown="onPieceKey($event, piece)"
        >
          <!-- POST-IT NOTE RENDERING -->
          <template v-if="piece.kind === 'note'">
            <div class="pointer-events-none absolute -top-2.5 left-1/2 h-4 w-12 -translate-x-1/2 rounded-xs bg-white/55 shadow-xs backdrop-blur-xs" aria-hidden="true"></div>

            <div class="mb-1.5 flex items-center justify-between gap-1.5">
              <div class="flex items-center gap-1 cursor-grab" :aria-label="t('mood.move')">
                <svg class="h-3 w-5 opacity-40 hover:opacity-80" viewBox="0 0 20 8" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="2" r="1.2" />
                  <circle cx="10" cy="2" r="1.2" />
                  <circle cx="17" cy="2" r="1.2" />
                  <circle cx="3" cy="6" r="1.2" />
                  <circle cx="10" cy="6" r="1.2" />
                  <circle cx="17" cy="6" r="1.2" />
                </svg>
              </div>

              <!-- Color dots -->
              <div class="flex items-center gap-1">
                <button
                  v-for="col in NOTE_COLORS"
                  :key="col"
                  type="button"
                  class="h-3 w-3 rounded-full border border-black/10 transition-transform hover:scale-125 focus:outline-none"
                  :class="[noteDotClass(col), piece.color === col ? 'ring-1.5 ring-[#173D35]' : '']"
                  :aria-label="col"
                  @pointerdown.stop
                  @click.stop="piece.color = col; persist()"
                ></button>
              </div>

              <button
                type="button"
                class="flex h-5 w-5 items-center justify-center rounded-full text-black/40 hover:bg-black/10 hover:text-black/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#173D35]"
                :aria-label="t('mood.remove')"
                @pointerdown.stop
                @click.stop="remove(piece)"
              >
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </div>

            <textarea
              class="mood-note-text block w-full resize-none bg-transparent text-[13px] leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#173D35]/30 rounded"
              :value="piece.caption"
              :placeholder="t('mood.notePlaceholder')"
              rows="4"
              maxlength="500"
              spellcheck="true"
              @pointerdown.stop
              @input="onCaption(piece, $event)"
              @change="persist"
            ></textarea>
          </template>

          <!-- IMAGE / CLIP RENDERING -->
          <template v-else>
            <div
              class="group relative overflow-hidden bg-[#173D35]"
              :class="piece.kind === 'image' && shown(piece) && !broken[piece.id] ? 'cursor-zoom-in' : ''"
              @click="onImageAreaClick(piece)"
            >
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
                class="block w-full transition duration-150 group-hover:scale-[1.02]"
                :src="shown(piece)"
                :alt="piece.caption || t('mood.picture')"
                draggable="false"
                @error="markBroken(piece.id)"
              />
              <p v-else class="px-3 py-8 text-center text-xs leading-relaxed text-[#F5F3EC]">
                {{ t(piece.src.startsWith('local:') ? 'mood.miss' : 'mood.gone') }}
              </p>

              <!-- Zoom badge indicator for images -->
              <div
                v-if="piece.kind === 'image' && shown(piece) && !broken[piece.id]"
                class="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>{{ t('mood.openLightbox') }}</span>
              </div>

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
            <textarea
              :id="`mood-caption-${piece.id}`"
              class="mood-caption mt-1.5 block w-full resize-none rounded-md bg-transparent px-1.5 py-1 text-[13px] leading-snug text-[#222925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
              :value="piece.caption"
              :placeholder="t('mood.captionPlaceholder')"
              rows="2"
              maxlength="500"
              spellcheck="true"
              @pointerdown.stop
              @input="onCaption(piece, $event)"
              @change="persist"
            ></textarea>

            <button
              type="button"
              class="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#173D35] text-[#F5F3EC] shadow-[0_6px_12px_-6px_rgba(23,61,53,0.7)] hover:bg-[#102e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
              :aria-label="t('mood.remove')"
              @pointerdown.stop
              @click.stop="remove(piece)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>
          </template>

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

    <!-- LIGHTBOX MODAL -->
    <Teleport to="body">
      <div
        v-if="lightboxIndex !== null && currentLightboxPiece"
        id="mood-lightbox"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 p-4 md:p-8 backdrop-blur-md select-none animate-fadeIn"
        tabindex="-1"
        role="dialog"
        :aria-label="t('mood.openLightbox')"
        @click="closeLightbox"
      >
        <!-- Top bar -->
        <div class="flex w-full items-center justify-between px-2 text-white/80" @click.stop>
          <div class="text-sm font-semibold tracking-wider">
            <span v-if="imagePieces.length > 1">{{ lightboxIndex + 1 }} / {{ imagePieces.length }}</span>
          </div>

          <button
            type="button"
            id="btn-lightbox-close"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            :aria-label="t('mood.closeLightbox')"
            @click="closeLightbox"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </button>
        </div>

        <!-- Center Image Stage with Arrows -->
        <div class="relative flex min-h-0 flex-1 w-full items-center justify-center p-2">
          <!-- Previous Button -->
          <button
            v-if="imagePieces.length > 1"
            type="button"
            id="btn-lightbox-prev"
            class="absolute left-2 md:left-6 z-10 flex h-13 w-13 items-center justify-center rounded-full bg-white/15 text-white shadow-xl backdrop-blur-md transition hover:bg-white/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
            :aria-label="t('mood.prevImage')"
            @click.stop="prevImage"
          >
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Current Image -->
          <img
            :src="shown(currentLightboxPiece)"
            :alt="currentLightboxPiece.caption || t('mood.picture')"
            class="max-h-[78vh] max-w-[86vw] object-contain rounded-xl shadow-2xl transition duration-200"
            @click.stop
          />

          <!-- Next Button -->
          <button
            v-if="imagePieces.length > 1"
            type="button"
            id="btn-lightbox-next"
            class="absolute right-2 md:right-6 z-10 flex h-13 w-13 items-center justify-center rounded-full bg-white/15 text-white shadow-xl backdrop-blur-md transition hover:bg-white/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
            :aria-label="t('mood.nextImage')"
            @click.stop="nextImage"
          >
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Caption Bottom Bar -->
        <div class="mt-2 flex w-full justify-center px-4" @click.stop>
          <div
            v-if="currentLightboxPiece.caption"
            class="max-w-2xl rounded-2xl bg-white/12 px-6 py-3.5 text-center text-sm md:text-base leading-relaxed text-white/95 backdrop-blur-md shadow-lg whitespace-pre-wrap"
          >
            {{ currentLightboxPiece.caption }}
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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
  type MoodColor,
  type MoodPiece
} from '../mood/board';
import { pictureDataUrl } from '../mood/image';
import { deleteClip, getClip, loadMood, moodHouseKey, putClip, saveMood } from '../services/moodSave';
import { watchActiveHouseId } from '../services/houseSave';

const CLIP_LIMIT = 12 * 1024 * 1024;
const NOTE_COLORS: MoodColor[] = ['yellow', 'sand', 'moss', 'sky', 'rose'];

const store = useConfigStore();
const { t, locale } = useLabels();
const pieces = ref<MoodPiece[]>([]);
const title = ref('');
const createdAt = ref('');
const link = ref('');
const notice = ref('');
const over = ref(false);
const playing = ref('');
const broken = ref<Record<string, boolean>>({});
const urls = ref<Record<string, string>>({});
const stage = ref<HTMLElement | null>(null);
const sheet = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const lightboxIndex = ref<number | null>(null);
const activeId = ref('');

let houseKey = moodHouseKey();
let dragDepth = 0;
let stopWatch = () => {};
let drag: {
  mode: 'move' | 'size';
  id: string;
  px: number;
  py: number;
  x: number;
  y: number;
  w: number;
  hasMoved: boolean;
} | null = null;

const formattedCreated = computed(() => {
  if (!createdAt.value) return '';
  const d = new Date(createdAt.value);
  if (isNaN(d.getTime())) return '';
  const loc = locale.value === 'en' ? 'en-US' : 'sv-SE';
  return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' });
});

const imagePieces = computed(() => {
  return pieces.value.filter((p) => p.kind === 'image' && shown(p) && !broken.value[p.id]);
});

const currentLightboxPiece = computed(() => {
  if (lightboxIndex.value === null) return null;
  return imagePieces.value[lightboxIndex.value] ?? null;
});

onMounted(() => {
  const data = loadMood(houseKey);
  pieces.value = data.pieces;
  title.value = data.title;
  createdAt.value = data.createdAt || (data.pieces.length > 0 ? new Date().toISOString() : '');
  void hydrate();
  window.addEventListener('paste', onPaste);
  window.addEventListener('keydown', onKeyDown);
  stopWatch = watchActiveHouseId(() => {
    const next = moodHouseKey();
    if (next === houseKey) return;
    persist();
    houseKey = next;
    playing.value = '';
    broken.value = {};
    revokeUrls();
    const nextData = loadMood(houseKey);
    pieces.value = nextData.pieces;
    title.value = nextData.title;
    createdAt.value = nextData.createdAt || (nextData.pieces.length > 0 ? new Date().toISOString() : '');
    void hydrate();
  });
});

onBeforeUnmount(() => {
  persist();
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('keydown', onKeyDown);
  stopWatch();
  revokeUrls();
});

function noteClasses(color?: MoodColor) {
  switch (color) {
    case 'sand':
      return 'bg-[#FDF6E2] border-[#E8D9B5] text-[#4A3B22]';
    case 'moss':
      return 'bg-[#EDF5ED] border-[#C8DEC8] text-[#244224]';
    case 'sky':
      return 'bg-[#EAF2F8] border-[#BCD5E8] text-[#1E3A52]';
    case 'rose':
      return 'bg-[#FDF0F0] border-[#F2C4C4] text-[#541C1C]';
    case 'yellow':
    default:
      return 'bg-[#FEF9C3] border-[#FDE047] text-[#713F12]';
  }
}

function noteDotClass(color: MoodColor) {
  switch (color) {
    case 'sand':
      return 'bg-[#FDF6E2]';
    case 'moss':
      return 'bg-[#EDF5ED]';
    case 'sky':
      return 'bg-[#EAF2F8]';
    case 'rose':
      return 'bg-[#FDF0F0]';
    case 'yellow':
    default:
      return 'bg-[#FEF9C3]';
  }
}

function frame(piece: MoodPiece) {
  return {
    left: `${piece.x}%`,
    top: `${piece.y}%`,
    width: `${piece.w}%`,
    transform: `rotate(${piece.tilt}deg)`,
    zIndex: drag?.id === piece.id ? 25 : (activeId.value === piece.id ? 10 : 1)
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
  if (!createdAt.value && (pieces.value.length > 0 || title.value.trim())) {
    createdAt.value = new Date().toISOString();
  }
  saveMood({
    title: title.value,
    createdAt: createdAt.value,
    pieces: pieces.value
  }, houseKey);
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

function addPostIt(color: MoodColor = 'yellow') {
  notice.value = '';
  if (pieces.value.length >= MOOD_LIMIT) {
    notice.value = 'mood.full';
    return;
  }
  const spot = placeFor(pieces.value.length);
  const note: MoodPiece = {
    id: moodId(),
    kind: 'note',
    src: '',
    clip: '',
    ref: '',
    color,
    x: spot.x,
    y: spot.y,
    w: 22,
    tilt: Math.random() * 4 - 2,
    caption: ''
  };
  pieces.value.push(note);
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
  piece.caption = (event.target as HTMLTextAreaElement).value.slice(0, 500);
}

function onImageAreaClick(piece: MoodPiece) {
  if (!drag?.hasMoved && piece.kind === 'image' && shown(piece) && !broken.value[piece.id]) {
    openLightbox(piece);
  }
}

function openLightbox(piece: MoodPiece) {
  const idx = imagePieces.value.findIndex((p) => p.id === piece.id);
  if (idx >= 0) {
    lightboxIndex.value = idx;
  }
}

function closeLightbox() {
  lightboxIndex.value = null;
}

function nextImage() {
  if (lightboxIndex.value === null || imagePieces.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % imagePieces.value.length;
}

function prevImage() {
  if (lightboxIndex.value === null || imagePieces.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + imagePieces.value.length) % imagePieces.value.length;
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

function onKeyDown(event: KeyboardEvent) {
  if (lightboxIndex.value !== null) {
    if (event.key === 'Escape') {
      closeLightbox();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      prevImage();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      nextImage();
      event.preventDefault();
    }
    return;
  }
  if (event.key === 'Escape') {
    store.showMood = false;
  }
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
  if (mode === 'move' && target?.closest('input, button, textarea, iframe, video, select, a')) return;

  activeId.value = piece.id;
  try {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture fallback
  }

  drag = {
    mode,
    id: piece.id,
    px: event.clientX,
    py: event.clientY,
    x: piece.x,
    y: piece.y,
    w: piece.w,
    hasMoved: false
  };
}

function onPointer(event: PointerEvent) {
  if (!drag || !sheet.value) return;
  const piece = pieces.value.find((item) => item.id === drag?.id);
  if (!piece) return;

  const dx = event.clientX - drag.px;
  const dy = event.clientY - drag.py;
  if (Math.hypot(dx, dy) > 6) {
    drag.hasMoved = true;
  }
  if (!drag.hasMoved) return;

  const rect = sheet.value.getBoundingClientRect();
  if (drag.mode === 'move') {
    piece.x = clamp(drag.x + (dx / rect.width) * 100, 0, 100 - piece.w);
    piece.y = clamp(drag.y + (dy / rect.height) * 100, 0, 85);
    return;
  }
  piece.w = clamp(drag.w + (dx / rect.width) * 100, 14, 72);
  piece.x = Math.min(piece.x, 100 - piece.w);
}

function onUp() {
  if (!drag) return;
  const wasMove = drag.mode === 'move';
  const didDrag = drag.hasMoved;
  const pieceId = drag.id;
  drag = null;
  persist();

  if (wasMove && !didDrag) {
    const piece = pieces.value.find((item) => item.id === pieceId);
    if (piece && piece.kind === 'image' && shown(piece) && !broken.value[piece.id]) {
      openLightbox(piece);
    }
  }
}

function onPieceKey(event: KeyboardEvent, piece: MoodPiece) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, iframe, video')) return;
  const step = event.shiftKey ? 4 : 1.5;
  if (event.key === 'ArrowLeft') piece.x = clamp(piece.x - step, 0, 100 - piece.w);
  else if (event.key === 'ArrowRight') piece.x = clamp(piece.x + step, 0, 100 - piece.w);
  else if (event.key === 'ArrowUp') piece.y = clamp(piece.y - step, 0, 85);
  else if (event.key === 'ArrowDown') piece.y = clamp(piece.y + step, 0, 85);
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
  color: #8c9b94;
}
.mood-caption:focus::placeholder {
  color: #5c6b64;
}
.mood-note-text::placeholder {
  color: rgba(0, 0, 0, 0.35);
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
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 180ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .mood-piece,
  .animate-fadeIn {
    animation: none;
  }
}
</style>
