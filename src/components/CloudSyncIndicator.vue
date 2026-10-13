<template>
  <div class="relative inline-block" ref="containerRef">
    <!-- Cloud Synced Status Button Pill -->
    <button
      id="btn-cloud-sync-status"
      type="button"
      class="group inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 select-none cursor-pointer"
      :class="[
        isOnline
          ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200/80 text-emerald-950 shadow-2xs'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-700',
        popoverOpen ? 'ring-2 ring-emerald-500/30 border-emerald-300' : ''
      ]"
      :aria-expanded="popoverOpen"
      :aria-label="t('header.cloudSync.allReady')"
      :title="t('header.cloudSync.allReady')"
      @click="togglePopover"
    >
      <!-- Green Online Marker with subtle pulse animation -->
      <span class="relative flex h-2.5 w-2.5 items-center justify-center shrink-0" aria-hidden="true">
        <span
          v-if="isOnline && status !== 'syncing'"
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"
        ></span>
        <span
          class="relative inline-flex h-2 w-2 rounded-full transition-colors duration-200"
          :class="[
            status === 'syncing' ? 'bg-amber-500 animate-pulse' : '',
            status === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : '',
            status === 'offline' ? 'bg-slate-400' : '',
            status === 'error' ? 'bg-rose-500' : ''
          ]"
        ></span>
      </span>

      <!-- Cloud Icon with checkmark or spinning sync arrows -->
      <span class="relative flex items-center justify-center shrink-0">
        <!-- Syncing Spinner Icon -->
        <svg
          v-if="status === 'syncing' || isVerifying"
          class="h-3.5 w-3.5 animate-spin text-emerald-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>

        <!-- Cloud Icon with Synced Checkmark -->
        <svg
          v-else
          class="h-3.5 w-3.5 text-emerald-700 transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <polyline points="9 13 11 15 15 10" />
        </svg>
      </span>

      <!-- Text Label -->
      <span class="hidden sm:inline font-medium text-[11px] min-[1180px]:text-xs tracking-tight text-emerald-900">
        {{ labelText }}
      </span>

      <!-- Mobile / ultra-compact label -->
      <span class="sm:hidden font-medium text-[10px] text-emerald-900">
        {{ status === 'syncing' ? t('header.cloudSync.syncing') : t('header.cloudSync.synced') }}
      </span>

      <!-- Dropdown chevron -->
      <svg
        class="h-3 w-3 text-emerald-700/60 transition-transform duration-200 shrink-0 ml-0.5"
        :class="popoverOpen ? 'rotate-180 text-emerald-800' : ''"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Cloudflare Status Detail Popover -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="scale-95 opacity-0 -translate-y-1"
      enter-to-class="scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="scale-100 opacity-100 translate-y-0"
      leave-to-class="scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="popoverOpen"
        id="cloud-sync-popover"
        class="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200/90 bg-white/98 p-4 shadow-xl backdrop-blur-md text-xs text-slate-700 animate-fadeIn"
        role="dialog"
        :aria-label="t('header.cloudSync.statusDetails')"
      >
        <!-- Card Header -->
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 shrink-0 shadow-2xs">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <polyline points="9 13 11 15 15 10" />
              </svg>
            </div>
            <div>
              <p class="font-extrabold text-slate-900 leading-tight text-[13px]">
                {{ t('header.cloudSync.allReady') }}
              </p>
              <p class="text-[10px] text-slate-500 font-medium mt-0.5">
                {{ t('header.cloudSync.cloudflareEdge') }} • Workers & D1
              </p>
            </div>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            @click="popoverOpen = false"
            aria-label="Close"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Status Metrics Breakdown -->
        <div class="mt-3 space-y-2">
          <!-- Cloudflare Edge & Latency -->
          <div class="flex items-center justify-between rounded-xl bg-slate-50/90 px-3 py-2 border border-slate-100">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]"></span>
              <span class="font-semibold text-slate-800 text-[11px]">{{ t('header.cloudSync.cloudflareEdge') }}</span>
            </div>
            <div class="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span v-if="latencyMs">{{ latencyMs }} ms</span>
              <span v-else>{{ t('header.cloudSync.active') }}</span>
            </div>
          </div>

          <!-- Cloudflare Worker & D1 Database -->
          <div class="flex items-center justify-between rounded-xl bg-slate-50/90 px-3 py-2 border border-slate-100">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]"></span>
              <span class="font-semibold text-slate-800 text-[11px]">{{ t('header.cloudSync.workerReady') }}</span>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {{ t('header.cloudSync.ready') }}
            </span>
          </div>

          <!-- 3D Design & Local State Sync -->
          <div class="flex items-center justify-between rounded-xl bg-slate-50/90 px-3 py-2 border border-slate-100">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_#10B981]"></span>
              <span class="font-semibold text-slate-800 text-[11px]">{{ t('header.cloudSync.designSynced') }}</span>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {{ status === 'syncing' ? t('header.cloudSync.syncing') : t('header.cloudSync.synced') }}
            </span>
          </div>
        </div>

        <!-- Footer / Last Synced Timestamp & Action -->
        <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span class="text-slate-400">
            {{ t('header.cloudSync.lastSync') }}: <span class="font-semibold text-slate-600">{{ formattedLastSync }}</span>
          </span>
          <button
            type="button"
            id="btn-verify-cloudflare"
            class="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 transition-colors disabled:opacity-50"
            :disabled="isVerifying"
            @click="handleManualVerify"
          >
            <svg
              class="h-3 w-3"
              :class="isVerifying ? 'animate-spin' : ''"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span>{{ isVerifying ? t('header.cloudSync.verifying') : t('header.cloudSync.verifyNow') }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { initCloudSync, useCloudSync } from '../services/cloudSync';
import { useLabels } from '../i18n';
import { pulseFeedback } from '../services/feedback';

const { t } = useLabels();
const {
  status,
  isOnline,
  latencyMs,
  lastSyncedAt,
  isVerifying,
  checkHealth
} = useCloudSync();

const popoverOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const labelText = computed(() => {
  if (status.value === 'syncing') return t('header.cloudSync.syncing');
  if (status.value === 'offline') return t('header.cloudSync.offline');
  return t('header.cloudSync.synced');
});

const formattedLastSync = computed(() => {
  if (!lastSyncedAt.value) return t('header.cloudSync.justNow');
  const diffSec = Math.floor((Date.now() - lastSyncedAt.value.getTime()) / 1000);
  if (diffSec < 30) return t('header.cloudSync.justNow');
  if (diffSec < 120) return '1 min';
  return `${Math.floor(diffSec / 60)} min`;
});

function togglePopover() {
  popoverOpen.value = !popoverOpen.value;
}

async function handleManualVerify() {
  pulseFeedback(t('header.cloudSync.verifying'), 'info');
  await checkHealth();
}

function handleDocumentClick(event: MouseEvent) {
  if (popoverOpen.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
    popoverOpen.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && popoverOpen.value) {
    popoverOpen.value = false;
  }
}

let cleanup: (() => void) | null = null;

onMounted(() => {
  cleanup = initCloudSync(45000);
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  if (cleanup) cleanup();
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
  }
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>
