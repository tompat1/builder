<template>
  <div
    v-if="store.showNotes"
    id="note-board"
    ref="board"
    class="pointer-events-none absolute inset-0 z-30"
    role="region"
    :aria-label="t('notes.tool')"
  >
    <svg
      class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      :viewBox="`0 0 ${boardSize.w} ${boardSize.h}`"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g v-for="line in lines" :key="line.id" class="note-line">
        <line :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" />
        <circle :cx="line.x1" :cy="line.y1" r="3.5" />
      </g>
    </svg>

    <div id="note-loose" class="pointer-events-none absolute inset-0">
      <article
        v-for="item in loose"
        :id="`note-${item.note.id}`"
        :key="item.note.id"
        class="note pointer-events-auto absolute"
        :class="[`note-${item.note.color}`, { 'note-active': store.activeNoteId === item.note.id }]"
        :style="paperStyle(item.note, { left: `${item.left}px`, top: `${item.top}px`, '--tilt': `${tilt(item.note.id)}deg` })"
      >
        <span class="tape" aria-hidden="true"></span>
        <div
          class="note-bar"
          @pointerdown.stop="onDown($event, item.note)"
          @pointermove.stop="onMove($event, item.note)"
          @pointerup.stop="onUp(item.note)"
          @pointercancel.stop="onUp(item.note)"
        >
          <button type="button" class="move" :aria-label="t('notes.move')" tabindex="-1">
            <svg viewBox="0 0 24 8" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="2" r="1.1" />
              <circle cx="10" cy="2" r="1.1" />
              <circle cx="16" cy="2" r="1.1" />
              <circle cx="4" cy="6" r="1.1" />
              <circle cx="10" cy="6" r="1.1" />
              <circle cx="16" cy="6" r="1.1" />
            </svg>
          </button>
          <button
            type="button"
            class="remove"
            :aria-label="t('notes.remove')"
            @pointerdown.stop
            @pointerup.stop="onRemove($event, item.note)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </button>
        </div>
        <label class="sr-only" :for="`note-text-${item.note.id}`">{{ t('notes.write') }}</label>
        <textarea
          :id="`note-text-${item.note.id}`"
          class="writing"
          :value="item.note.text"
          :placeholder="t('notes.placeholder')"
          maxlength="240"
          rows="4"
          spellcheck="true"
          @input="onText(item.note, $event)"
          @blur="store.commitNotes()"
        ></textarea>
        <button
          type="button"
          class="fold"
          :aria-label="t('notes.resize')"
          @pointerdown.stop="onResizeDown($event, item.note)"
          @pointermove.stop="onResizeMove($event, item.note)"
          @pointerup.stop="onResizeUp(item.note)"
          @pointercancel.stop="onResizeUp(item.note)"
        ></button>
      </article>
    </div>
    <div class="note-view">
      <div id="note-camera" class="note-camera" :style="{ transform: store.noteCamera }">
        <article
          v-for="item in stuck"
          :id="`note-${item.note.id}`"
          :key="item.note.id"
          class="note note-stuck pointer-events-auto absolute"
          :class="[`note-${item.note.color}`, { 'note-active': store.activeNoteId === item.note.id, 'note-away': !item.shown }]"
          :style="paperStyle(item.note, { left: '0px', top: '0px', transform: item.transform })"
        >
          <span class="tape" aria-hidden="true"></span>
          <div
            class="note-bar"
            @pointerdown.stop="onDown($event, item.note)"
            @pointermove.stop="onMove($event, item.note)"
            @pointerup.stop="onUp(item.note)"
            @pointercancel.stop="onUp(item.note)"
          >
            <button type="button" class="move" :aria-label="t('notes.move')" tabindex="-1">
              <svg viewBox="0 0 24 8" fill="currentColor" aria-hidden="true">
                <circle cx="4" cy="2" r="1.1" />
                <circle cx="10" cy="2" r="1.1" />
                <circle cx="16" cy="2" r="1.1" />
                <circle cx="4" cy="6" r="1.1" />
                <circle cx="10" cy="6" r="1.1" />
                <circle cx="16" cy="6" r="1.1" />
              </svg>
            </button>
            <button
              type="button"
              class="remove"
              :aria-label="t('notes.remove')"
              @pointerdown.stop
              @pointerup.stop="onRemove($event, item.note)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>
          </div>
          <label class="sr-only" :for="`note-text-${item.note.id}`">{{ t('notes.write') }}</label>
          <textarea
            :id="`note-text-${item.note.id}`"
            class="writing"
            :value="item.note.text"
            :placeholder="t('notes.placeholder')"
            maxlength="240"
            rows="4"
            spellcheck="true"
            @input="onText(item.note, $event)"
          @blur="store.commitNotes()"
        ></textarea>
          <button
            type="button"
            class="fold"
            :aria-label="t('notes.resize')"
            @pointerdown.stop="onResizeDown($event, item.note)"
            @pointermove.stop="onResizeMove($event, item.note)"
            @pointerup.stop="onResizeUp(item.note)"
            @pointercancel.stop="onResizeUp(item.note)"
          ></button>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import { noteTargetId, noteVisibleInView, type HouseNote, type NotePin, type NoteScope } from '../notes/board';
import { noteAxes } from '../notes/surface';

const store = useConfigStore();
const { t } = useLabels();
const board = ref<HTMLElement | null>(null);
const boardSize = ref({ w: 1, h: 1 });

let observer: ResizeObserver | null = null;
let dragging: string | null = null;
let resizing: string | null = null;
let grabX = 0;
let grabY = 0;
let dragPlane: { u: number; v: number } | null = null;
let resizeX = 0;
let resizeY = 0;
let resizeW = 0;
let resizeH = 0;

type StickPoint = { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number; scope?: NoteScope };

function paperStyle(note: HouseNote, extra: Record<string, string>) {
  return {
    ...extra,
    '--note-w': `${note.width}px`,
    '--note-h': `${note.height}px`,
    zIndex: store.activeNoteId === note.id ? 3 : 1
  };
}

function measure() {
  if (!board.value) return;
  boardSize.value = {
    w: Math.max(board.value.clientWidth, 1),
    h: Math.max(board.value.clientHeight, 1)
  };
}

function tilt(id: string) {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return ((sum % 5) - 2) * 0.7;
}

function layout(note: HouseNote) {
  const width = Math.max(board.value?.clientWidth || boardSize.value.w, 1);
  const height = Math.max(board.value?.clientHeight || boardSize.value.h, 1);
  if (note.pin) {
    const plane = store.notePlanes[note.id];
    return {
      left: 0,
      top: 0,
      tracking: false,
      stuck: true,
      transform: plane?.transform ?? 'none',
      shown: Boolean(plane?.visible),
      anchor: null
    };
  }
  const target = noteTargetId(note.link);
  const anchor = target ? store.noteAnchors[target] : undefined;
  const tracking = Boolean(target && anchor?.visible);
  const leftRaw = tracking && anchor
    ? anchor.x + note.offsetX
    : (note.x / 100) * width;
  const topRaw = tracking && anchor
    ? anchor.y + note.offsetY
    : (note.y / 100) * height;
  const maxX = Math.max(8, width - note.width - 12);
  const maxY = Math.max(8, height - note.height - 12);
  return {
    left: Math.min(maxX, Math.max(8, leftRaw)),
    top: Math.min(maxY, Math.max(8, topRaw)),
    tracking,
    stuck: false,
    transform: '',
    shown: true,
    anchor: tracking ? anchor : null
  };
}

const visibleNotes = computed(() => store.notes.filter((note) => noteVisibleInView(note, store.viewMode)));
const placed = computed(() => visibleNotes.value.map((note) => ({ note, ...layout(note) })));
const stuck = computed(() => placed.value.filter((item) => item.stuck));
const loose = computed(() => placed.value.filter((item) => !item.stuck));

const lines = computed(() => placed.value.flatMap((item) => {
  if (!item.tracking || !item.anchor) return [];
  return [{
    id: item.note.id,
    x1: item.anchor.x,
    y1: item.anchor.y,
    x2: item.left + item.note.width / 2,
    y2: item.top + 8
  }];
}));

function onText(note: HouseNote, event: Event) {
  store.setNoteText(note.id, (event.target as HTMLTextAreaElement).value);
}

function houseUnder(clientX: number, clientY: number): StickPoint | null {
  const scene = (window as unknown as {
    __houseScene?: {
      notePointAt?: (x: number, y: number) => StickPoint | null;
    };
  }).__houseScene;
  return scene?.notePointAt?.(clientX, clientY) ?? null;
}

function clampGrab(value: number, limit: number) {
  return Math.min(limit, Math.max(-limit, value));
}

/** Keep the grabbed spot on the header under the pointer, in the wall plane. */
function planarGrab(pin: NotePin, hit: StickPoint) {
  const normal = { x: hit.nx ?? 0, y: hit.ny ?? 0, z: hit.nz ?? 1 };
  const pinNormal = { x: pin.nx ?? normal.x, y: pin.ny ?? normal.y, z: pin.nz ?? normal.z };
  const facing = pinNormal.x * normal.x + pinNormal.y * normal.y + pinNormal.z * normal.z;
  if (facing < 0.85) return { u: 0, v: 0 };
  const axes = noteAxes(normal);
  const dx = pin.x - hit.x;
  const dy = pin.y - hit.y;
  const dz = pin.z - hit.z;
  return {
    u: clampGrab(dx * axes.right.x + dy * axes.right.y + dz * axes.right.z, 0.85),
    v: clampGrab(dx * axes.up.x + dy * axes.up.y + dz * axes.up.z, 0.7)
  };
}

function pinsClose(pin: NotePin, next: StickPoint) {
  return Math.abs(pin.x - next.x) < 0.004
    && Math.abs(pin.y - next.y) < 0.004
    && Math.abs(pin.z - next.z) < 0.004
    && Math.abs((pin.nx ?? 0) - (next.nx ?? 0)) < 0.02
    && Math.abs((pin.ny ?? 0) - (next.ny ?? 0)) < 0.02
    && Math.abs((pin.nz ?? 0) - (next.nz ?? 0)) < 0.02
    && pin.scope === next.scope;
}

function onDown(event: PointerEvent, note: HouseNote) {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement;
  if (target.closest('textarea, .remove, .fold')) return;
  dragging = note.id;
  resizing = null;
  store.activeNoteId = note.id;
  const bar = event.currentTarget as HTMLElement;
  if (note.pin) {
    const hit = houseUnder(event.clientX, event.clientY);
    dragPlane = hit ? planarGrab(note.pin, hit) : { u: 0, v: 0 };
  } else if (board.value) {
    const spot = layout(note);
    const rect = board.value.getBoundingClientRect();
    grabX = event.clientX - rect.left - spot.left;
    grabY = event.clientY - rect.top - spot.top;
  }
  bar.setPointerCapture(event.pointerId);
}

function onMove(event: PointerEvent, note: HouseNote) {
  if (dragging !== note.id || !board.value) return;
  if (note.pin) {
    const hit = houseUnder(event.clientX, event.clientY);
    if (!hit) return;
    const normal = { x: hit.nx ?? 0, y: hit.ny ?? 0, z: hit.nz ?? 1 };
    const pinNormal = {
      x: note.pin.nx ?? normal.x,
      y: note.pin.ny ?? normal.y,
      z: note.pin.nz ?? normal.z
    };
    const facing = pinNormal.x * normal.x + pinNormal.y * normal.y + pinNormal.z * normal.z;
    if (facing < 0.85) dragPlane = { u: 0, v: 0 };
    const grab = dragPlane ?? { u: 0, v: 0 };
    const axes = noteAxes(normal);
    const next = {
      x: hit.x + axes.right.x * grab.u + axes.up.x * grab.v,
      y: hit.y + axes.right.y * grab.u + axes.up.y * grab.v,
      z: hit.z + axes.right.z * grab.u + axes.up.z * grab.v,
      nx: hit.nx,
      ny: hit.ny,
      nz: hit.nz,
      scope: hit.scope
    };
    if (pinsClose(note.pin, next)) return;
    store.setNotePin(note.id, next);
    return;
  }
  const rect = board.value.getBoundingClientRect();
  const x = event.clientX - rect.left - grabX;
  const y = event.clientY - rect.top - grabY;
  const spot = layout(note);
  if (spot.tracking && spot.anchor) {
    store.moveNote(note.id, { offsetX: x - spot.anchor.x, offsetY: y - spot.anchor.y });
    return;
  }
  store.moveNote(note.id, {
    x: (x / rect.width) * 100,
    y: (y / rect.height) * 100
  });
}

function onUp(note: HouseNote) {
  if (dragging !== note.id) return;
  dragging = null;
  dragPlane = null;
  if (!note.pin && note.link.kind === 'board') {
    const article = document.getElementById(`note-${note.id}`);
    const rect = article?.getBoundingClientRect();
    const point = rect ? houseUnder(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
    store.setNotePin(note.id, point);
  }
  store.commitNotes();
}

function onRemove(event: PointerEvent, note: HouseNote) {
  if (event.button !== 0) return;
  dragging = null;
  resizing = null;
  dragPlane = null;
  store.removeNote(note.id);
}

function onResizeDown(event: PointerEvent, note: HouseNote) {
  if (event.button !== 0) return;
  dragging = null;
  resizing = note.id;
  store.activeNoteId = note.id;
  resizeX = event.clientX;
  resizeY = event.clientY;
  resizeW = note.width;
  resizeH = note.height;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onResizeMove(event: PointerEvent, note: HouseNote) {
  if (resizing !== note.id) return;
  store.resizeNote(
    note.id,
    resizeW + (event.clientX - resizeX),
    resizeH + (event.clientY - resizeY)
  );
}

function onResizeUp(note: HouseNote) {
  if (resizing !== note.id) return;
  resizing = null;
  store.commitNotes();
}

async function focusFresh() {
  const id = store.activeNoteId;
  const note = id ? store.notes.find((item) => item.id === id) : null;
  if (!note || note.text) return;
  await nextTick();
  document.getElementById(`note-text-${note.id}`)?.focus();
}

watch(() => store.notes.length, (count, previous) => {
  if (count > (previous ?? 0)) focusFresh();
});

onMounted(() => {
  measure();
  requestAnimationFrame(measure);
  observer = new ResizeObserver(measure);
  if (board.value) observer.observe(board.value);
  focusFresh();
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.note {
  --ink: #3c2f1c;
  --paper: #f6e7a8;
  --field: #efe0a0;
  --muted: #5c4a28;
  display: flex;
  flex-direction: column;
  width: var(--note-w, 176px);
  height: var(--note-h, 156px);
  transform: rotate(var(--tilt));
  border-radius: 2px 3px 4px 2px;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 14px 24px rgb(58 42 16 / 0.16), inset 0 1px 0 rgb(255 252 245 / 0.7);
  padding: 0.85rem 0.7rem 0.7rem;
  animation: note-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.note-active {
  box-shadow: 0 18px 30px rgb(58 42 16 / 0.22), inset 0 1px 0 rgb(255 252 245 / 0.75);
}

.note-away {
  visibility: hidden;
  pointer-events: none;
}

.note-view {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  transform-origin: 0 0;
}

.note-camera {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  pointer-events: none;
}

.note-stuck {
  margin: 0;
  animation: none;
}

.note-moss {
  --ink: #24331c;
  --paper: #d7e8c6;
  --field: #c9ddb6;
  --muted: #3d5232;
}

.note-sky {
  --ink: #1c3348;
  --paper: #d5e6f4;
  --field: #c5d9ec;
  --muted: #2c4a66;
}

.tape {
  position: absolute;
  top: -7px;
  left: 50%;
  width: 2.75rem;
  height: 0.85rem;
  margin-left: -1.375rem;
  background: rgb(255 252 245 / 0.72);
  box-shadow: 0 1px 2px rgb(58 42 16 / 0.12);
  transform: rotate(-2deg);
}

.note-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  touch-action: none;
  cursor: grab;
}

.note-bar:active {
  cursor: grabbing;
}

.move,
.remove {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  min-height: 1.75rem;
  color: var(--ink);
  border-radius: 0.25rem;
}

.move {
  width: 2.5rem;
  pointer-events: none;
}

.move svg,
.remove svg {
  width: 1rem;
  height: 1rem;
}

.move:hover,
.remove:hover,
.move:focus-visible,
.remove:focus-visible,
.writing:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.writing {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 0;
  resize: none;
  border: 0;
  background: transparent;
  color: var(--ink);
  caret-color: var(--ink);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.35;
  user-select: text;
}

.writing::placeholder {
  color: var(--muted);
  font-weight: 500;
}

.writing::selection {
  background: color-mix(in srgb, var(--ink) 22%, var(--paper));
  color: var(--ink);
}

.fold {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: linear-gradient(135deg, transparent 46%, rgb(58 42 16 / 0.2) 46%);
  cursor: nwse-resize;
  touch-action: none;
}

.note-line {
  fill: #5c4a32;
  stroke: #5c4a32;
  stroke-width: 1.25;
  stroke-linecap: round;
  opacity: 0.72;
}

@keyframes note-in {
  from { opacity: 0; transform: translateY(6px) rotate(var(--tilt)); }
  to { opacity: 1; transform: translateY(0) rotate(var(--tilt)); }
}

@media (prefers-reduced-motion: reduce) {
  .note { animation: none; }
}
</style>
