<template>
  <Teleport to="body">
    <div
      v-if="open"
      id="house-save-panel"
      class="fixed z-50 max-h-[min(34rem,75vh)] w-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-xl"
      :style="panelStyle"
    >
      <!-- Header -->
      <div class="mb-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <p class="font-bold text-slate-900 text-sm"><Cms k="header.houses" /></p>
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="autoSaveOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            <Cms :k="autoSaveOn ? 'header.autoSaveOn' : 'header.autoSaveOff'" />
          </span>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          :aria-label="t('header.houseClose')"
          @click="emit('close')"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </div>

      <!-- Status / Notification / Throbber banner -->
      <div v-if="notice || error || (busy && !savingId && !switchingId) || (savingId && savingId === activeId && !name)" class="mb-2.5">
        <div
          v-if="busy || savingId || switchingId"
          class="flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 border border-emerald-200 shadow-xs"
        >
          <svg class="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="truncate">{{ notice || t('header.houseSaving') }}</span>
        </div>
        <p
          v-else-if="notice"
          class="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 border border-emerald-200"
        >
          <svg class="h-3.5 w-3.5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span class="truncate">{{ notice }}</span>
        </p>
        <p v-if="error" class="rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-800 border border-red-200" role="status">
          {{ error }}
        </p>
      </div>

      <!-- Quick Manual Save for Current Project (if one is active) -->
      <div v-if="activeId" class="mb-3">
        <button
          id="house-save-manual-btn"
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          :disabled="busy || !!savingId || !!switchingId"
          @click="manualSave(activeId)"
        >
          <svg v-if="savingId === activeId" class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>{{ t('header.houseSaveChanges') }}</span>
        </button>
      </div>

      <!-- Form for Saving as New House / Naming -->
      <form class="space-y-1.5" @submit.prevent="save">
        <label class="block font-semibold text-slate-600 text-[11px]" for="house-save-name">
          <Cms k="header.houseName" />
        </label>
        <div class="flex gap-1.5">
          <input
            id="house-save-name"
            v-model="name"
            class="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 focus:border-slate-400 focus:outline-none"
            :placeholder="t('header.houseName')"
          />
          <button
            id="house-save-submit"
            type="submit"
            class="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            :disabled="busy || !name.trim()"
          >
            <Cms k="header.houseSave" />
          </button>
        </div>
      </form>

      <!-- Saved Houses List -->
      <ul v-if="houses.length" class="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
        <li
          v-for="house in houses"
          :key="house.id"
          class="group rounded-xl border transition-all"
          :class="house.id === activeId ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'"
        >
          <div class="flex items-center gap-2.5 p-2">
            <!-- Clickable thumbnail and project info to select house -->
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
              :title="house.id === activeId ? t('header.houseCurrent') : t('header.houseOpen')"
              :aria-label="house.id === activeId ? `${house.name} (${t('header.houseCurrent')})` : `${t('header.houseOpen')} ${house.name}`"
              @click="openHouse(house.id)"
            >
              <span class="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80">
                <img
                  v-if="house.thumb"
                  :src="house.thumb"
                  alt=""
                  class="h-full w-full object-cover"
                />
                <!-- Switching Throbber Overlay -->
                <span
                  v-if="switchingId === house.id"
                  class="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]"
                >
                  <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </span>

              <span class="min-w-0 flex-1">
                <!-- Title Row: View or Inline Edit with Autosave -->
                <div v-if="editingTitleId === house.id" class="flex items-center gap-1 my-0.5" @click.stop>
                  <input
                    :id="`edit-title-${house.id}`"
                    v-model="editTitleText"
                    type="text"
                    maxlength="80"
                    class="w-full rounded border border-emerald-500 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    @input="onTitleInput(house.id)"
                    @keydown.enter.prevent="finishEditTitle(house.id)"
                    @keydown.esc.prevent="cancelEditTitle(house.id)"
                    @blur="finishEditTitle(house.id)"
                  />
                  <!-- Autosave throbber or checkmark -->
                  <span v-if="savingTitleId === house.id" class="shrink-0 text-slate-400" :title="t('header.houseTitleSaving')">
                    <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  <span v-else-if="savedTitleId === house.id" class="shrink-0 text-emerald-600" :title="t('header.houseTitleSaved')">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div v-else class="flex items-center gap-1.5">
                  <span class="truncate font-semibold text-slate-900">{{ house.name }}</span>
                  <!-- Mood board icon indicator -->
                  <button
                    v-if="houseHasMood(house.id)"
                    type="button"
                    class="inline-flex shrink-0 items-center justify-center rounded p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 border border-amber-200/80 transition-colors shadow-xs"
                    :title="t('mood.tool')"
                    :aria-label="t('mood.tool')"
                    @click.stop="openHouseMood(house.id)"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">
                      <rect x="3.5" y="4" width="9" height="7.5" rx="1.2" />
                      <rect x="11.5" y="9" width="9" height="7.5" rx="1.2" />
                      <path d="M6.5 13.5h6.2V20H6.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="opacity-50 hover:opacity-100 hover:text-slate-900 text-slate-400 p-0.5 rounded transition-opacity"
                    :title="t('header.houseEditTitle')"
                    :aria-label="t('header.houseEditTitle')"
                    @click.stop="startEditTitle(house)"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>

                <!-- Description meta -->
                <span class="block text-[10px] text-slate-500 mt-0.5">
                  {{ description(house) }}
                </span>

                <!-- Badges row -->
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <!-- Active Project Badge -->
                  <span
                    v-if="house.id === activeId"
                    class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {{ t('header.houseCurrent') }}
                  </span>

                  <!-- Mood board badge -->
                  <span
                    v-if="houseHasMood(house.id)"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/90 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800"
                    :title="t('mood.tool')"
                  >
                    <svg class="h-2.5 w-2.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">
                      <rect x="3.5" y="4" width="9" height="7.5" rx="1.2" />
                      <rect x="11.5" y="9" width="9" height="7.5" rx="1.2" />
                      <path d="M6.5 13.5h6.2V20H6.5z" />
                    </svg>
                    {{ t('mood.tool') }}
                  </span>
                </div>
              </span>
            </button>

            <!-- Action buttons: Green Save Icon & Red Trash Can Icon -->
            <div class="flex items-center gap-1 shrink-0">
              <!-- Green Save Icon button -->
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                :title="t('header.houseManualSave')"
                :aria-label="t('header.houseManualSave')"
                :disabled="savingId === house.id || switchingId === house.id"
                @click.stop="manualSave(house.id)"
              >
                <!-- Throbber when saving manually -->
                <svg v-if="savingId === house.id" class="h-4 w-4 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>

              <!-- Red Trash Can Icon button -->
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
                :title="t('header.houseRemove')"
                :aria-label="t('header.houseRemove')"
                :disabled="busy || !!savingId || !!switchingId"
                @click.stop="promptDelete(house.id)"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Inline Confirmation when user clicks Trash Can -->
          <div
            v-if="confirmingDeleteId === house.id"
            class="border-t border-red-200 bg-red-50/90 p-2.5 text-[11px] text-red-900 rounded-b-xl"
            @click.stop
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="font-semibold">{{ t('header.houseDeleteConfirm') }}</p>
                <p class="truncate text-[10px] text-red-700 font-medium">"{{ house.name }}"</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  class="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  @click.stop="cancelDelete"
                >
                  {{ t('header.houseDeleteConfirmCancel') }}
                </button>
                <button
                  type="button"
                  class="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
                  @click.stop="confirmDelete(house.id)"
                >
                  {{ t('header.houseDeleteConfirmYes') }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <p v-else-if="!busy" class="mt-3 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
        <Cms k="header.houseEmpty" />
      </p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useSessionStore } from '../store/useSessionStore';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';
import {
  clearHousePending,
  getActiveHouse,
  listHouses,
  markHousePending,
  openNamedHouse,
  readActiveHouseId,
  readLocalHouse,
  watchActiveHouseId,
  readPendingHouse,
  removeNamedHouse,
  saveActiveHouse,
  saveNamedHouse,
  updateNamedHouse,
  renameNamedHouse,
  writeActiveHouseId,
  writeLocalHouse,
  type SavedHouse
} from '../services/houseSave';
import { captureHouseThumb, forgetHouseThumb, houseThumb, rememberHouseThumb } from '../services/houseThumb';
import { hasMoodBoard, linkDraftMoodToHouse } from '../services/moodSave';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'sign-in'): void;
}>();

const { t, locale } = useLabels();
const store = useConfigStore();
const session = useSessionStore();
const name = ref('');
const houses = ref<SavedHouse[]>([]);
const busy = ref(false);
const savingId = ref<string | null>(null);
const switchingId = ref<string | null>(null);
const confirmingDeleteId = ref<string | null>(null);

const editingTitleId = ref<string | null>(null);
const editTitleText = ref('');
const savingTitleId = ref<string | null>(null);
const savedTitleId = ref<string | null>(null);

const notice = ref('');
const error = ref('');
const activeId = ref(readActiveHouseId());
const autoSaveOn = computed(() => !!(session.user && activeId.value));

function syncActiveHouse() {
  const next = readActiveHouseId();
  if (activeId.value !== next) activeId.value = next;
}

const stopActiveHouseWatch = watchActiveHouseId(syncActiveHouse);
const panelStyle = ref({ top: '64px', left: '12px' });
let draft = '';
let saveTimer = 0;
let titleSaveTimer = 0;
let savedTitleTimer = 0;

function place() {
  const button = document.getElementById('btn-save-project');
  const rect = button?.getBoundingClientRect();
  if (!rect) return;
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.max(12, Math.min(rect.left, window.innerWidth - 396))}px`
  };
}

function stamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function area(value: number | null | undefined) {
  if (!Number.isFinite(value) || Number(value) <= 0) return '';
  const formatted = new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'sv-SE', {
    maximumFractionDigits: 1
  }).format(Number(value));
  return `${formatted} m²`;
}

function description(house: SavedHouse) {
  return [
    stamp(house.createdAt),
    area(house.areaSqMeters),
    t('header.houseBy', { name: house.createdBy })
  ].filter(Boolean).join(' · ');
}

function showThumb(id: string, thumb: string) {
  const row = houses.value.find((house) => house.id === id);
  if (row && thumb) row.thumb = thumb;
}

function attachThumb(id: string) {
  if (!id) return;
  const thumb = captureHouseThumb() || houseThumb(id);
  if (!thumb) return;
  rememberHouseThumb(id, thumb);
  showThumb(id, thumb);
}

async function refresh() {
  syncActiveHouse();
  if (!session.user) {
    houses.value = [];
    return;
  }
  houses.value = (await listHouses()).map((house) => ({
    ...house,
    thumb: house.thumb || houseThumb(house.id)
  }));
  session.setSavedHouseCount(houses.value.length);
  let active = readActiveHouseId();
  if (!active && houses.value.length === 1) {
    active = houses.value[0].id;
    writeActiveHouseId(active);
  }
  activeId.value = active;
  if (active && !houseThumb(active)) attachThumb(active);
}

async function adoptWorkingHouse() {
  if (!session.user) return;
  try {
    const activeCloud = await getActiveHouse();
    if (activeCloud && activeCloud.config && typeof activeCloud.config === 'object') {
      const local = readLocalHouse();
      if (!local || activeCloud.activeId) {
        store.importHouse(activeCloud.config);
        writeLocalHouse(activeCloud.config);
        if (activeCloud.activeId) {
          writeActiveHouseId(activeCloud.activeId);
          activeId.value = activeCloud.activeId;
          attachThumb(activeCloud.activeId);
        }
        draft = JSON.stringify(store.exportHouse());
        return;
      }
    }
  } catch {
    // fallback
  }

  let active = readActiveHouseId();
  if (!active) {
    try {
      const listed = await listHouses();
      if (listed.length > 0) {
        active = listed[0].id;
        writeActiveHouseId(active);
        const full = await openNamedHouse(active);
        if (full.config) {
          store.importHouse(full.config);
          writeLocalHouse(full.config);
          draft = JSON.stringify(store.exportHouse());
        }
      }
    } catch {
      return;
    }
  }
  activeId.value = active;
  if (active && !houseThumb(active)) attachThumb(active);
}

function rememberDraft(json: string) {
  draft = json;
  const config = JSON.parse(json) as unknown;
  writeLocalHouse(config);
  const active = readActiveHouseId();
  if (active) attachThumb(active);
  if (!session.user) return;
  const currentName = houses.value.find((h) => h.id === active)?.name || '';
  void saveActiveHouse(config, active || undefined, currentName);
  if (active) {
    void updateNamedHouse(active, config).catch(() => {
      // The browser copy is already written. The account catches up on the next change.
    });
  }
}

function queueDraft(json: string) {
  if (!draft || json === draft) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => rememberDraft(json), 800);
}

async function save() {
  error.value = '';
  notice.value = '';
  const title = name.value.trim().replace(/\s+/g, ' ');
  if (!title) {
    error.value = t('header.houseNeedName');
    return;
  }
  const config = store.exportHouse();
  const thumb = captureHouseThumb();
  writeLocalHouse(config);
  if (!session.user) {
    markHousePending(title, config);
    if (thumb) rememberHouseThumb('pending', thumb);
    error.value = t('header.houseNeedAccount');
    emit('sign-in');
    return;
  }
  busy.value = true;
  try {
    const saved = await saveNamedHouse(title, config);
    writeActiveHouseId(saved.id);
    linkDraftMoodToHouse(saved.id);
    activeId.value = saved.id;
    if (thumb) rememberHouseThumb(saved.id, thumb);
    name.value = '';
    notice.value = t('header.houseSaved');
    houses.value = [{ ...saved, thumb }, ...houses.value.filter((house) => house.id !== saved.id)].slice(0, 24);
    session.setSavedHouseCount(houses.value.length);
  } catch {
    error.value = t('header.saveFailed');
  } finally {
    busy.value = false;
  }
}

async function manualSave(id?: string) {
  const targetId = id || activeId.value;
  if (!targetId) {
    return save();
  }
  const target = houses.value.find((h) => h.id === targetId);
  if (id && id !== activeId.value) {
    const ok = window.confirm(t('header.houseOverwriteConfirm', { name: target?.name || '' }));
    if (!ok) return;
  }
  error.value = '';
  notice.value = t('header.houseSaving');
  savingId.value = targetId;
  const config = store.exportHouse();
  const thumb = captureHouseThumb();
  writeLocalHouse(config);
  if (thumb) rememberHouseThumb(targetId, thumb);

  if (!session.user) {
    markHousePending(target?.name || name.value || 'House', config);
    if (thumb) rememberHouseThumb('pending', thumb);
    error.value = t('header.houseNeedAccount');
    emit('sign-in');
    savingId.value = null;
    return;
  }

  try {
    await updateNamedHouse(targetId, config);
    writeActiveHouseId(targetId);
    activeId.value = targetId;
    attachThumb(targetId);
    draft = JSON.stringify(config);
    notice.value = t('header.houseSaved');
    if (target && thumb) target.thumb = thumb;
  } catch {
    error.value = t('header.saveFailed');
  } finally {
    savingId.value = null;
  }
}

async function openHouse(id: string) {
  if (switchingId.value) return;
  const target = houses.value.find((h) => h.id === id);
  const targetName = target?.name || '';
  error.value = '';
  notice.value = t('header.houseSwitching');
  switchingId.value = id;
  busy.value = true;
  try {
    const local = id === readActiveHouseId() ? readLocalHouse() : null;
    const config = local ?? (await openNamedHouse(id)).config;
    writeActiveHouseId(id);
    activeId.value = id;
    store.importHouse(config);
    writeLocalHouse(config);
    draft = JSON.stringify(store.exportHouse());
    attachThumb(id);
    notice.value = t('header.houseSwitched', { name: targetName });
  } catch {
    error.value = t('header.saveFailed');
  } finally {
    busy.value = false;
    switchingId.value = null;
  }
}

function houseHasMood(id: string) {
  return hasMoodBoard(id);
}

async function openHouseMood(id: string) {
  if (id !== activeId.value) {
    await openHouse(id);
  }
  store.showMood = true;
  emit('close');
}

function promptDelete(id: string) {
  confirmingDeleteId.value = id;
}

function cancelDelete() {
  confirmingDeleteId.value = null;
}

async function confirmDelete(id: string) {
  confirmingDeleteId.value = null;
  await remove(id);
}

async function remove(id: string) {
  error.value = '';
  try {
    await removeNamedHouse(id);
    forgetHouseThumb(id);
    if (readActiveHouseId() === id) {
      writeActiveHouseId('');
      activeId.value = '';
    }
    houses.value = houses.value.filter((house) => house.id !== id);
    session.setSavedHouseCount(houses.value.length);
  } catch {
    error.value = t('header.saveFailed');
  }
}

function startEditTitle(house: SavedHouse) {
  error.value = '';
  editingTitleId.value = house.id;
  editTitleText.value = house.name;
  nextTick(() => {
    const input = document.getElementById(`edit-title-${house.id}`) as HTMLInputElement | null;
    input?.focus();
    input?.select();
  });
}

function onTitleInput(id: string) {
  error.value = '';
  window.clearTimeout(titleSaveTimer);
  titleSaveTimer = window.setTimeout(() => {
    void autosaveTitle(id);
  }, 500);
}

async function autosaveTitle(id: string) {
  const cleaned = editTitleText.value.trim().replace(/\s+/g, ' ');
  if (!cleaned || cleaned.length > 80) return;
  const target = houses.value.find((h) => h.id === id);
  if (!target || target.name === cleaned) return;
  if (savingTitleId.value === id) return;

  savingTitleId.value = id;
  const prevName = target.name;
  target.name = cleaned;
  try {
    if (session.user) {
      await renameNamedHouse(id, cleaned);
    }
    error.value = '';
    savedTitleId.value = id;
    window.clearTimeout(savedTitleTimer);
    savedTitleTimer = window.setTimeout(() => {
      if (savedTitleId.value === id) savedTitleId.value = null;
    }, 2000);
  } catch (err) {
    target.name = prevName;
    console.error('Failed to rename house:', err);
    error.value = t('header.saveFailed');
  } finally {
    savingTitleId.value = null;
  }
}

async function finishEditTitle(id: string) {
  window.clearTimeout(titleSaveTimer);
  if (editingTitleId.value === id) {
    editingTitleId.value = null;
  }
  await autosaveTitle(id);
}

function cancelEditTitle(id: string) {
  window.clearTimeout(titleSaveTimer);
  if (editingTitleId.value === id) {
    editingTitleId.value = null;
  }
}

async function uploadPending() {
  const pending = readPendingHouse();
  if (!pending?.name || !session.user) return;
  try {
    const saved = await saveNamedHouse(pending.name, pending.config);
    writeActiveHouseId(saved.id);
    linkDraftMoodToHouse(saved.id);
    activeId.value = saved.id;
    const thumb = houseThumb('pending');
    if (thumb) {
      rememberHouseThumb(saved.id, thumb);
      forgetHouseThumb('pending');
    }
    clearHousePending();
    name.value = '';
    error.value = '';
    notice.value = t('header.houseSaved');
    session.setSavedHouseCount(Math.max(1, session.savedHouseCount));
    if (props.open) await refresh();
  } catch {
    // The named copy stays in this browser until the next save.
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    if (confirmingDeleteId.value) {
      confirmingDeleteId.value = null;
      return;
    }
    if (editingTitleId.value) {
      editingTitleId.value = null;
      return;
    }
    emit('close');
  }
}

watch(() => JSON.stringify(store.exportHouse()), queueDraft);

onMounted(() => {
  nextTick(() => {
    draft = JSON.stringify(store.exportHouse());
    window.setTimeout(() => {
      if (!session.user) return;
      const active = readActiveHouseId();
      if (active && !houseThumb(active)) attachThumb(active);
    }, 600);
    if (props.open) {
      refresh().catch(() => {
        error.value = t('header.saveFailed');
      });
    }
  });
});

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return;
  syncActiveHouse();
  notice.value = '';
  error.value = '';
  place();
  try {
    await refresh();
  } catch {
    error.value = t('header.saveFailed');
  }
});

watch(() => session.user, () => {
  uploadPending();
  void adoptWorkingHouse();
}, { immediate: true });

document.addEventListener('keydown', onKey);
onBeforeUnmount(() => {
  stopActiveHouseWatch();
  document.removeEventListener('keydown', onKey);
  window.clearTimeout(saveTimer);
  window.clearTimeout(titleSaveTimer);
  window.clearTimeout(savedTitleTimer);
});
</script>
