<template>
  <div
    class="pointer-events-auto absolute transition-all duration-300 flex flex-col items-start gap-2 z-20"
    :class="store.isFullscreen ? 'top-6 left-6 md:top-auto md:bottom-6 md:left-6' : 'top-20 left-3 md:top-auto md:bottom-6 md:left-6'"
    :aria-label="t('tools.label')"
  >
    <!-- Camera toolbar: daylight, zoom, fullscreen, view -->
    <div class="w-fit self-start bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex flex-col gap-1">
      <div ref="sunBox" class="relative">
        <div
          id="sun-timebox"
          class="absolute top-0 z-30 w-[240px] origin-left transition-all duration-200 ease-out"
          :class="sunOpen ? 'left-14 opacity-100' : 'pointer-events-none left-0 opacity-0'"
          :inert="!sunOpen"
          :aria-hidden="!sunOpen"
        >
          <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 px-2.5 py-2">
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                id="btn-tool-sun-show"
                @click="store.toggleSunShown()"
                :class="[...toolButton(store.showSun), 'shrink-0']"
                :aria-label="t('tools.sun')"
                :aria-pressed="store.showSun"
              >
                <svg v-if="store.showSun" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                  <circle cx="12" cy="12" r="2.2" />
                  <path d="M4 6.5 20 17.5" />
                </svg>
                <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                  <circle cx="12" cy="12" r="2.2" />
                </svg>
                <span class="tool-tip"><Cms k="tools.sun" /></span>
              </button>
              <span class="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <Cms k="tools.facing" />
              </span>
              <span id="sun-time-label" class="text-[11px] font-bold tabular-nums text-slate-900">{{ sunClock }}</span>
            </div>
            <div class="mt-1.5 grid grid-cols-4 gap-1" role="group" :aria-label="t('tools.facing')">
              <button
                v-for="bearing in bearings"
                :key="bearing.id"
                type="button"
                :id="`facing-${bearing.id}`"
                @click="store.setFacing(bearing.id)"
                :aria-label="t(bearing.name)"
                :aria-pressed="store.facing === bearing.id"
                :class="[
                  'flex h-7 items-center justify-center rounded-lg border text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                  store.facing === bearing.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                ]"
              >
                <Cms :k="bearing.letter" />
              </button>
            </div>
            <label class="mt-2 block">
              <span class="sr-only"><Cms k="tools.sunTime" /></span>
              <input
                id="sun-hour"
                type="range"
                min="5"
                max="21"
                step="0.25"
                :value="store.sunHour"
                class="sun-hour h-1.5 w-full cursor-pointer accent-slate-900"
                @input="onSunInput"
                @change="onSunCommit"
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          id="btn-tool-sun"
          @click="toggleSun"
          :class="toolButton(sunOpen)"
          :aria-label="t('tools.sunTime')"
          :aria-expanded="sunOpen"
          aria-controls="sun-timebox"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
          </svg>
          <span
            v-if="!sunOpen"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#8a6a2f]"
            aria-hidden="true"
          ></span>
          <span class="tool-tip"><Cms k="tools.sunTime" /></span>
        </button>
      </div>

      <div class="h-px bg-slate-100 mx-1"></div>

      <button
        type="button"
        id="btn-tool-zoom-in"
        @click="$emit('zoom-in')"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :aria-label="t('tools.zoomIn')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <span class="tool-tip"><Cms k="tools.zoomIn" /></span>
      </button>

      <div class="h-px bg-slate-100 mx-1"></div>

      <button
        type="button"
        id="btn-tool-zoom-out"
        @click="$emit('zoom-out')"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :aria-label="t('tools.zoomOut')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <span class="tool-tip"><Cms k="tools.zoomOut" /></span>
      </button>

      <div class="h-px bg-slate-100 mx-1"></div>

      <button
        type="button"
        id="btn-tool-fullscreen"
        @click="toggleFullscreen"
        :class="[
          'group relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
          store.isFullscreen
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        ]"
        :aria-label="store.isFullscreen ? t('tools.exitFullscreen') : t('tools.fullscreen')"
        :aria-pressed="store.isFullscreen"
      >
        <svg v-if="store.isFullscreen" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <span class="tool-tip"><Cms :k="store.isFullscreen ? 'tools.exitFullscreen' : 'tools.fullscreen'" /></span>
      </button>

      <div class="h-px bg-slate-100 mx-1"></div>

      <div ref="viewBox" class="relative">
        <div
          id="view-tools"
          class="absolute top-1/2 z-30 -translate-y-1/2 origin-left transition-all duration-200 ease-out"
          :class="viewOpen ? 'left-14 opacity-100' : 'pointer-events-none left-0 opacity-0'"
          :inert="!viewOpen"
          :aria-hidden="!viewOpen"
        >
          <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
            <button
              type="button"
              id="btn-tool-reset-apply"
              @click="resetAndClose"
              class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              :aria-label="t('tools.resetView')"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span class="tool-tip"><Cms k="tools.resetView" /></span>
            </button>
            <div class="w-px h-7 bg-slate-200/60"></div>
            <button
              type="button"
              id="btn-tool-mark-view"
              @click="markAndClose"
              :aria-pressed="Boolean(store.defaultView)"
              :aria-label="t('tools.markView')"
              :class="toolButton(Boolean(store.defaultView))"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="12" y1="9" x2="12" y2="15" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </svg>
              <span class="tool-tip"><Cms k="tools.markView" /></span>
            </button>
          </div>
        </div>
        <button
          type="button"
          id="btn-tool-reset-view"
          @click="toggleView"
          :class="toolButton(viewOpen)"
          :aria-label="t('tools.resetView')"
          :aria-expanded="viewOpen"
          aria-controls="view-tools"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span
            v-if="store.defaultView && !viewOpen"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#8a6a2f]"
            aria-hidden="true"
          ></span>
          <span class="tool-tip"><Cms k="tools.resetView" /></span>
        </button>
      </div>
    </div>

    <!-- Bottom Button Row: Ruler toolbox / Undo / Redo / Notes -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
      <div ref="rulerBox" class="relative">
        <div
          id="ruler-tools"
          class="absolute bottom-[calc(100%+8px)] z-30 origin-bottom-left transition-all duration-200 ease-out"
          :class="rulerOpen ? 'left-16 opacity-100' : 'pointer-events-none left-0 opacity-0'"
          :inert="!rulerOpen"
          :aria-hidden="!rulerOpen"
        >
          <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
            <button
              type="button"
              id="btn-tool-dimensions"
              @click="store.toggleDimensions()"
              :class="toolButton(store.showDimensions)"
              :aria-label="t('tools.dimensions')"
              :aria-pressed="store.showDimensions"
            >
              <svg v-if="store.showDimensions" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                <circle cx="12" cy="12" r="2.2" />
                <path d="M4 6.5 20 17.5" />
              </svg>
              <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                <circle cx="12" cy="12" r="2.2" />
              </svg>
              <span class="tool-tip"><Cms k="tools.dimensions" /></span>
            </button>
            <div class="w-px h-7 bg-slate-200/60"></div>
            <button
              type="button"
              id="btn-tool-tape"
              @click="store.toggleMeasure()"
              :class="toolButton(store.measuring)"
              :aria-label="t('tools.tape')"
              :aria-pressed="store.measuring"
            >
              <svg class="h-8 w-12" viewBox="0 0 48 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23.3 17.8V6.6l1.5-1.7.1-2.3h-3.4l-.2 2.3C20.4 3.4 17.2 1.5 12.6 1.5 6.4 1.5 2.2 5.8 2.2 11.2V19.5c0 1.6 1.6 2.9 3.8 2.9H46.2V17.8H23.3z" />
                <circle cx="12.7" cy="12.2" r="4.5" />
                <path stroke-linecap="butt" d="M26.4 22.4v-1.55M29.8 22.4v-1.55M33.2 22.4v-1.55M36.6 22.4v-1.55M40 22.4v-1.55M43.4 22.4v-1.55" />
              </svg>
              <span class="tool-tip"><Cms k="tools.tape" /></span>
            </button>
          </div>
        </div>
        <button
          type="button"
          id="btn-tool-measure"
          @click="toggleRuler"
          :class="toolButton(rulerOpen || store.measuring)"
          :aria-label="t('tools.ruler')"
          :aria-expanded="rulerOpen"
          aria-controls="ruler-tools"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
            <path d="m14.5 12.5 2-2" />
            <path d="m11.5 9.5 2-2" />
            <path d="m8.5 6.5 2-2" />
          </svg>
          <span
            v-if="!rulerOpen"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#8a6a2f]"
            aria-hidden="true"
          ></span>
          <span class="tool-tip"><Cms k="tools.ruler" /></span>
        </button>
      </div>

      <div class="w-px h-7 bg-slate-200/60 my-auto"></div>

      <!-- Undo -->
      <button
        type="button"
        id="btn-tool-undo"
        @click="store.undo()"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40"
        :class="store.canUndo ? '' : 'opacity-40'"
        :aria-label="t('tools.undo')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span class="tool-tip"><Cms k="tools.undo" /></span>
      </button>

      <!-- Redo -->
      <button
        type="button"
        id="btn-tool-redo"
        @click="store.redo()"
        class="group relative w-12 h-12 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        :class="store.canRedo ? '' : 'opacity-40'"
        :aria-label="t('tools.redo')"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span class="tool-tip"><Cms k="tools.redo" /></span>
      </button>

      <div class="w-px h-7 bg-slate-200/60 my-auto"></div>

      <div ref="notesBox" class="relative">
        <div
          id="note-tools"
          class="absolute bottom-[calc(100%+8px)] z-30 origin-bottom-left transition-all duration-200 ease-out"
          :class="notesOpen ? 'left-16 opacity-100' : 'pointer-events-none left-0 opacity-0'"
          :inert="!notesOpen"
          :aria-hidden="!notesOpen"
        >
          <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
            <button
              type="button"
              id="btn-tool-notes-show"
              @click="store.showNotes = !store.showNotes"
              :class="toolButton(store.showNotes)"
              :aria-label="t('notes.tool')"
              :aria-pressed="store.showNotes"
            >
              <svg v-if="store.showNotes" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                <circle cx="12" cy="12" r="2.2" />
                <path d="M4 6.5 20 17.5" />
              </svg>
              <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.8 12S6.2 7 12 7s9.2 5 9.2 5-3.4 5-9.2 5S2.8 12 2.8 12Z" />
                <circle cx="12" cy="12" r="2.2" />
              </svg>
              <span class="tool-tip"><Cms k="notes.tool" /></span>
            </button>
            <div class="w-px h-7 bg-slate-200/60"></div>
            <button
              type="button"
              id="btn-add-note"
              @click="store.addNote()"
              :class="[...toolButton(false), 'disabled:opacity-40']"
              :disabled="store.notes.length >= NOTE_LIMIT"
              :aria-label="store.notes.length >= NOTE_LIMIT ? t('notes.limit') : t('notes.add')"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span class="tool-tip"><Cms :k="store.notes.length >= NOTE_LIMIT ? 'notes.limit' : 'notes.add'" /></span>
            </button>
          </div>
        </div>
        <button
          type="button"
          id="btn-tool-notes"
          @click="toggleNotesTray"
          :class="toolButton(notesOpen || store.showNotes)"
          :aria-label="t('notes.tool')"
          :aria-expanded="notesOpen"
          aria-controls="note-tools"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4.5h9.5L19 8v11.5H6z" />
            <path d="M15 4.5V8h4" />
            <path d="M8.5 12h7" />
            <path d="M8.5 15.5h5" />
          </svg>
          <span
            v-if="!notesOpen"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#8a6a2f]"
            aria-hidden="true"
          ></span>
          <span class="tool-tip"><Cms k="notes.tool" /></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { NOTE_LIMIT } from '../notes/board';
import { formatSunHour } from '../three-engine/sunPosition';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const store = useConfigStore();
const sunClock = computed(() => formatSunHour(store.sunHour));
const bearings = [
  { id: 'north', letter: 'tools.letterNorth', name: 'tools.north' },
  { id: 'east', letter: 'tools.letterEast', name: 'tools.east' },
  { id: 'south', letter: 'tools.letterSouth', name: 'tools.south' },
  { id: 'west', letter: 'tools.letterWest', name: 'tools.west' }
] as const;

function onSunInput(event: Event) {
  store.previewSunHour(Number((event.target as HTMLInputElement).value));
}

function onSunCommit(event: Event) {
  store.commitSunHour(Number((event.target as HTMLInputElement).value));
}
const { t } = useLabels();
const rulerOpen = ref(false);
const sunOpen = ref(false);
const viewOpen = ref(false);
const notesOpen = ref(false);
const rulerBox = ref<HTMLElement | null>(null);
const sunBox = ref<HTMLElement | null>(null);
const viewBox = ref<HTMLElement | null>(null);
const notesBox = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'reset-view'): void;
  (e: 'mark-view'): void;
}>();

function toolButton(active: boolean) {
  return [
    'group relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
    active
      ? 'bg-slate-900 text-white shadow-2xs'
      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
  ];
}

function toggleSun() {
  sunOpen.value = !sunOpen.value;
  if (sunOpen.value) {
    viewOpen.value = false;
    rulerOpen.value = false;
    notesOpen.value = false;
  }
}

function toggleView() {
  viewOpen.value = !viewOpen.value;
  if (viewOpen.value) {
    sunOpen.value = false;
    rulerOpen.value = false;
    notesOpen.value = false;
  }
}

function toggleRuler() {
  rulerOpen.value = !rulerOpen.value;
  if (rulerOpen.value) {
    sunOpen.value = false;
    viewOpen.value = false;
    notesOpen.value = false;
  }
}

function toggleNotesTray() {
  notesOpen.value = !notesOpen.value;
  if (notesOpen.value) {
    sunOpen.value = false;
    viewOpen.value = false;
    rulerOpen.value = false;
  }
}

function resetAndClose() {
  viewOpen.value = false;
  emit('reset-view');
}

function markAndClose() {
  viewOpen.value = false;
  emit('mark-view');
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (rulerOpen.value && !rulerBox.value?.contains(target)) rulerOpen.value = false;
  if (sunOpen.value && !sunBox.value?.contains(target)) sunOpen.value = false;
  if (viewOpen.value && !viewBox.value?.contains(target)) viewOpen.value = false;
  if (notesOpen.value && !notesBox.value?.contains(target)) notesOpen.value = false;
}

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  rulerOpen.value = false;
  sunOpen.value = false;
  viewOpen.value = false;
  notesOpen.value = false;
}

function syncFullscreen() {
  const isFull = document.fullscreenElement != null;
  store.setIsFullscreen(isFull);
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  } catch {
    syncFullscreen();
  }
}

onMounted(() => {
  syncFullscreen();
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreen);
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onKey);
});

</script>

<style scoped>
.tool-tip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  z-index: 30;
  transform: translateY(-50%);
  white-space: nowrap;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 8px;
  opacity: 0;
  box-shadow: 0 8px 18px rgb(15 23 42 / 0.18);
}
.group:hover > .tool-tip,
.group:focus-visible > .tool-tip {
  opacity: 1;
}
</style>
