<template>
  <div class="global-feedback-layer pointer-events-none select-none" aria-live="polite">
    <!-- 1. SLIM SHIMMER PROGRESS BAR (Shows momentarily on every action) -->
    <div
      v-if="isBarVisible"
      id="global-status-bar"
      class="fixed top-0 left-0 right-0 z-[9999] h-[3.5px] overflow-hidden bg-black/5"
      role="progressbar"
      :aria-valuenow="barProgress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full bg-gradient-to-r from-[#173D35] via-[#10B981] to-[#34D399] transition-all duration-200 ease-out relative"
        :style="{ width: `${barProgress}%` }"
      >
        <!-- Shimmer sweep effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
        <!-- Leading edge glow -->
        <div class="absolute right-0 top-0 bottom-0 w-3 shadow-[0_0_12px_#34D399,0_0_6px_#10B981]"></div>
      </div>
    </div>

    <!-- 2. GLOBAL SPINNER / THROBBER (Appears only on longer waiting times > 380ms) -->
    <Transition name="fade-modal">
      <div
        v-if="isSpinnerVisible"
        id="global-throbber-overlay"
        class="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center p-4"
      >
        <!-- Soft background blur veil -->
        <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-[2.5px] transition-opacity"></div>

        <!-- Floating Glassmorphic Status Pill -->
        <div
          class="relative flex flex-col items-center gap-3.5 rounded-2xl border border-white/60 bg-[#F5F3EC]/95 px-7 py-5 shadow-2xl backdrop-blur-md text-[#173D35] max-w-sm w-full mx-4 animate-scaleUp"
        >
          <!-- Modern Dual-Ring Brand Spinner -->
          <div class="relative flex h-11 w-11 items-center justify-center">
            <!-- Outer smooth spinning track -->
            <svg class="h-11 w-11 animate-spin text-[#173D35]" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
              <path class="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <!-- Center pulsing emerald dot -->
            <div class="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-70"></div>
            <div class="absolute h-2 w-2 rounded-full bg-[#173D35]"></div>
          </div>

          <!-- Dynamic Status Description -->
          <div class="flex flex-col items-center text-center">
            <span class="text-xs sm:text-sm font-bold tracking-tight text-[#173D35]">
              {{ statusMessage || 'Laddar...' }}
            </span>
            <span class="text-[11px] font-medium text-[#173D35]/65 mt-0.5">
              Ett ögonblick, vänligen vänta...
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 3. TOP TOAST FEEDBACK PILL (Quick confirmation / notice) -->
    <Transition name="slide-toast">
      <div
        v-if="activeToast"
        id="global-toast-pill"
        class="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-300"
        :class="[
          activeToast.tone === 'success' ? 'border-emerald-500/30 bg-[#173D35] text-[#F5F3EC]' : '',
          activeToast.tone === 'error' ? 'border-rose-300 bg-rose-600 text-white' : '',
          activeToast.tone === 'info' ? 'border-slate-300 bg-white/95 text-slate-800' : ''
        ]"
        @click="dismissToast"
      >
        <!-- Success Icon -->
        <svg v-if="activeToast.tone === 'success'" class="h-4 w-4 text-emerald-300 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>

        <!-- Error Icon -->
        <svg v-else-if="activeToast.tone === 'error'" class="h-4 w-4 text-white shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>

        <!-- Info Icon -->
        <svg v-else class="h-4 w-4 text-[#173D35] shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>

        <span>{{ activeToast.message }}</span>
      </div>
    </Transition>

    <!-- 4. UNOBTRUSIVE AUTOSAVE BADGE (Once per session in 3D & Moodboard) -->
    <Transition name="badge-slide-fade">
      <div
        v-if="isAutosaveBadgeVisible"
        id="autosave-session-badge"
        class="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 sm:left-6 z-[9990] flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 shadow-md backdrop-blur-md transition-all duration-300"
        role="status"
        aria-live="polite"
      >
        <!-- Mini smooth spinner -->
        <svg
          v-if="autosaveBadgeStatus === 'saving'"
          class="h-3.5 w-3.5 animate-spin text-[#173D35]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3.5"></circle>
          <path class="opacity-85" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>

        <!-- Mini green checkmark when saved -->
        <svg
          v-else
          class="h-3.5 w-3.5 text-emerald-600 transition-transform duration-200 scale-100"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>

        <!-- Dynamic Text -->
        <span class="tracking-tight select-none">
          {{ autosaveBadgeStatus === 'saving' ? (t('autosave.saving') || 'Autosparar...') : (t('autosave.saved') || 'Sparat') }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useFeedback, useAutosaveBadge } from '../services/feedback';
import { useLabels } from '../i18n';

let t: (k: string) => string;
try {
  const labels = useLabels();
  t = labels.t;
} catch {
  t = (k: string) => (k === 'autosave.saving' ? 'Autosparar...' : 'Sparat');
}

const {
  isBarVisible,
  barProgress,
  isSpinnerVisible,
  statusMessage,
  activeToast,
  dismissToast
} = useFeedback();

const {
  isAutosaveBadgeVisible,
  autosaveBadgeStatus
} = useAutosaveBadge();
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

@keyframes scaleUp {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-scaleUp {
  animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Modal fade transition */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.25s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

/* Toast slide transition */
.slide-toast-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-toast-leave-active {
  transition: all 0.2s ease-in;
}
.slide-toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -12px);
}
.slide-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

/* Autosave badge subtle slide-in / fade */
.badge-slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.badge-slide-fade-leave-active {
  transition: all 0.25s ease-in;
}
.badge-slide-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
.badge-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
