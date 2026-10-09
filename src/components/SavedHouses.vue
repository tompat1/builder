<template>
  <Teleport to="body">
    <div
      v-if="open"
      id="house-save-panel"
      class="fixed z-50 max-h-[min(32rem,70vh)] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl"
      :style="panelStyle"
    >
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <p class="font-bold text-slate-900"><Cms k="header.houses" /></p>
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="autoSaveOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >
            <Cms :k="autoSaveOn ? 'header.autoSaveOn' : 'header.autoSaveOff'" />
          </span>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-700" :aria-label="t('header.houseClose')" @click="emit('close')">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </div>

      <p v-if="notice" class="mb-2 text-[11px] text-emerald-800">{{ notice }}</p>
      <p v-if="error" class="mb-2 text-[11px] text-red-800" role="status">{{ error }}</p>

      <form class="space-y-1.5" @submit.prevent="save">
        <label class="block font-semibold text-slate-600" for="house-save-name"><Cms k="header.houseName" /></label>
        <input
          id="house-save-name"
          v-model="name"
          class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900"
        />
        <button
          id="house-save-submit"
          type="submit"
          class="w-full rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          :disabled="busy"
        >
          <Cms k="header.houseSave" />
        </button>
      </form>

      <ul v-if="houses.length" class="mt-3 space-y-1 border-t border-slate-200 pt-3">
        <li v-for="house in houses" :key="house.id" class="flex items-start gap-2">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
            @click="openHouse(house.id)"
          >
            <span class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
              <img
                v-if="house.thumb"
                :src="house.thumb"
                alt=""
                class="h-full w-full object-cover"
              />
            </span>
            <span class="min-w-0">
              <span class="block truncate font-semibold text-slate-900">{{ house.name }}</span>
              <span class="block text-[10px] text-slate-500">
                {{ description(house) }}
              </span>
            </span>
          </button>
          <button
            type="button"
            class="shrink-0 px-1 py-1 font-semibold text-slate-500 hover:text-slate-900"
            @click="remove(house.id)"
          >
            <Cms k="header.houseRemove" />
          </button>
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
  listHouses,
  markHousePending,
  openNamedHouse,
  readActiveHouseId,
  readLocalHouse,
  watchActiveHouseId,
  readPendingHouse,
  removeNamedHouse,
  saveNamedHouse,
  updateNamedHouse,
  writeActiveHouseId,
  writeLocalHouse,
  type SavedHouse
} from '../services/houseSave';
import { captureHouseThumb, forgetHouseThumb, houseThumb, rememberHouseThumb } from '../services/houseThumb';

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

function place() {
  const button = document.getElementById('btn-save-project');
  const rect = button?.getBoundingClientRect();
  if (!rect) return;
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.max(12, Math.min(rect.left, window.innerWidth - 332))}px`
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
  let active = readActiveHouseId();
  if (!active) {
    try {
      const listed = await listHouses();
      if (listed.length === 1) {
        active = listed[0].id;
        writeActiveHouseId(active);
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
  if (!active || !session.user) return;
  void updateNamedHouse(active, config).catch(() => {
    // The browser copy is already written. The account catches up on the next change.
  });
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
    activeId.value = saved.id;
    if (thumb) rememberHouseThumb(saved.id, thumb);
    name.value = '';
    notice.value = t('header.houseSaved');
    houses.value = [{ ...saved, thumb }, ...houses.value.filter((house) => house.id !== saved.id)].slice(0, 24);
  } catch {
    error.value = t('header.saveFailed');
  } finally {
    busy.value = false;
  }
}

async function openHouse(id: string) {
  error.value = '';
  notice.value = '';
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
    notice.value = t('header.houseOpened');
  } catch {
    error.value = t('header.saveFailed');
  } finally {
    busy.value = false;
  }
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
  } catch {
    error.value = t('header.saveFailed');
  }
}

async function uploadPending() {
  const pending = readPendingHouse();
  if (!pending?.name || !session.user) return;
  try {
    const saved = await saveNamedHouse(pending.name, pending.config);
    writeActiveHouseId(saved.id);
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
    if (props.open) await refresh();
  } catch {
    // The named copy stays in this browser until the next save.
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close');
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
});
</script>
