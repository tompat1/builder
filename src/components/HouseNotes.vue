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

    <article
      v-for="item in placed"
      :id="`note-${item.note.id}`"
      :key="item.note.id"
      class="note pointer-events-auto absolute w-44"
      :class="[`note-${item.note.color}`, { 'note-active': store.activeNoteId === item.note.id }]"
      :style="{ left: `${item.left}px`, top: `${item.top}px`, '--tilt': `${tilt(item.note.id)}deg`, zIndex: store.activeNoteId === item.note.id ? 3 : 1 }"
      @pointerdown="onDown($event, item.note)"
      @pointermove="onMove($event, item.note)"
      @pointerup="onUp(item.note)"
      @pointercancel="onUp(item.note)"
    >
      <span class="tape" aria-hidden="true"></span>
      <div class="note-bar">
        <button
          type="button"
          class="move"
          :aria-label="t('notes.move')"
          @pointerdown.stop="onDown($event, item.note)"
        >
          <svg viewBox="0 0 24 8" fill="currentColor" aria-hidden="true">
            <circle cx="4" cy="2" r="1.1" />
            <circle cx="10" cy="2" r="1.1" />
            <circle cx="16" cy="2" r="1.1" />
            <circle cx="4" cy="6" r="1.1" />
            <circle cx="10" cy="6" r="1.1" />
            <circle cx="16" cy="6" r="1.1" />
          </svg>
        </button>
        <button type="button" class="remove" :aria-label="t('notes.remove')" @click="store.removeNote(item.note.id)">
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
      <label class="link-label" :for="`note-link-${item.note.id}`">{{ t('notes.link') }}</label>
      <select
        :id="`note-link-${item.note.id}`"
        class="link"
        :value="linkToValue(item.note.link)"
        @change="onLink(item.note, $event)"
      >
        <optgroup :label="t('notes.house')">
          <option value="board">{{ t('notes.board') }}</option>
          <option value="roof">{{ t('notes.roof') }}</option>
          <option value="floor">{{ t('notes.floor') }}</option>
          <option value="loft">{{ t('notes.loft') }}</option>
          <option value="wall:front">{{ t('notes.wallFront') }}</option>
          <option value="wall:back">{{ t('notes.wallBack') }}</option>
          <option value="wall:left">{{ t('notes.wallLeft') }}</option>
          <option value="wall:right">{{ t('notes.wallRight') }}</option>
        </optgroup>
        <optgroup v-for="wall in walls" :key="wall" :label="t(wallLabel[wall])">
          <option v-for="slot in slotsFor(wall)" :key="slot.id" :value="`slot:${slot.id}`">
            {{ t('notes.panel', { band: slot.isUpper ? t('notes.upper') : t('notes.lower'), n: slot.index + 1 }) }}
          </option>
        </optgroup>
      </select>
      <p v-if="item.linked && !item.tracking" class="hint">{{ t('notes.hidden') }}</p>
      <span class="fold" aria-hidden="true"></span>
    </article>

    <div class="pointer-events-auto absolute left-3 top-32 z-10 flex flex-col items-start gap-2">
      <button
        v-if="store.notes.length < NOTE_LIMIT"
        id="btn-add-note"
        type="button"
        class="add-note"
        @click="store.addNote()"
      >
        {{ t('notes.add') }}
      </button>
      <p v-else id="note-limit" class="limit" role="status">{{ t('notes.limit') }}</p>
      <p v-if="!store.notes.length" class="empty">{{ t('notes.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import {
  linkToValue,
  noteTargetId,
  NOTE_LIMIT,
  type HouseNote,
  type NoteWall
} from '../notes/board';

const store = useConfigStore();
const { t } = useLabels();
const board = ref<HTMLElement | null>(null);
const boardSize = ref({ w: 1, h: 1 });
const walls: NoteWall[] = ['front', 'back', 'left', 'right'];
const wallLabel: Record<NoteWall, string> = {
  front: 'notes.wallFront',
  back: 'notes.wallBack',
  left: 'notes.wallLeft',
  right: 'notes.wallRight'
};

let observer: ResizeObserver | null = null;
let dragging: string | null = null;
let grabX = 0;
let grabY = 0;

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

function slotsFor(wall: NoteWall) {
  return Object.values(store.wallSlots)
    .filter((slot) => slot.wall === wall)
    .sort((a, b) => a.index - b.index || Number(Boolean(a.isUpper)) - Number(Boolean(b.isUpper)));
}

function layout(note: HouseNote) {
  const target = noteTargetId(note.link);
  const anchor = target ? store.noteAnchors[target] : undefined;
  const tracking = Boolean(target && anchor?.visible);
  const width = Math.max(board.value?.clientWidth || boardSize.value.w, 1);
  const height = Math.max(board.value?.clientHeight || boardSize.value.h, 1);
  const leftRaw = tracking && anchor
    ? anchor.x + note.offsetX
    : (note.x / 100) * width;
  const topRaw = tracking && anchor
    ? anchor.y + note.offsetY
    : (note.y / 100) * height;
  const maxX = Math.max(8, width - 188);
  const maxY = Math.max(8, height - 220);
  return {
    left: Math.min(maxX, Math.max(8, leftRaw)),
    top: Math.min(maxY, Math.max(8, topRaw)),
    tracking,
    linked: Boolean(target),
    anchor: tracking ? anchor : null
  };
}

const placed = computed(() => store.notes.map((note) => ({ note, ...layout(note) })));

const lines = computed(() => placed.value.flatMap((item) => {
  if (!item.tracking || !item.anchor) return [];
  return [{
    id: item.note.id,
    x1: item.anchor.x,
    y1: item.anchor.y,
    x2: item.left + 88,
    y2: item.top + 8
  }];
}));

function onText(note: HouseNote, event: Event) {
  store.setNoteText(note.id, (event.target as HTMLTextAreaElement).value);
}

function onLink(note: HouseNote, event: Event) {
  store.setNoteLink(note.id, (event.target as HTMLSelectElement).value);
}

function onDown(event: PointerEvent, note: HouseNote) {
  const target = event.target as HTMLElement;
  if (target.closest('textarea, select, .remove')) return;
  dragging = note.id;
  store.activeNoteId = note.id;
  const noteEl = (event.currentTarget as HTMLElement).closest('article') ?? (event.currentTarget as HTMLElement);
  const rect = noteEl.getBoundingClientRect();
  grabX = event.clientX - rect.left;
  grabY = event.clientY - rect.top;
  noteEl.setPointerCapture(event.pointerId);
}

function onMove(event: PointerEvent, note: HouseNote) {
  if (dragging !== note.id || !board.value) return;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
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
  cursor: grab;
  width: 2.5rem;
}

.move:active {
  cursor: grabbing;
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
.link:focus-visible,
.writing:focus-visible,
.add-note:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.writing {
  display: block;
  width: 100%;
  min-height: 4.5rem;
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

.link-label {
  display: block;
  margin-top: 0.45rem;
  color: var(--muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.link {
  display: block;
  width: 100%;
  margin-top: 0.2rem;
  min-height: 1.75rem;
  border: 0;
  border-radius: 0.25rem;
  background: var(--field);
  color: var(--ink);
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.35rem;
}

.hint,
.empty,
.limit {
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.35;
}

.hint {
  margin-top: 0.4rem;
}

.fold {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-bottom: 14px solid rgb(58 42 16 / 0.14);
  border-left: 14px solid transparent;
}

.add-note,
.limit,
.empty {
  background: #f6e7a8;
  color: #3c2f1c;
  box-shadow: 0 10px 18px rgb(58 42 16 / 0.14);
}

.add-note {
  border-radius: 2px;
  padding: 0.45rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.add-note:hover {
  background: #f3e09a;
}

.empty,
.limit {
  max-width: 11rem;
  border-radius: 2px;
  padding: 0.45rem 0.6rem;
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
