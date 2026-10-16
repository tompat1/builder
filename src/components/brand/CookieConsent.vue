<template>
  <Transition name="fade-consent">
    <div
      v-if="isOpen"
      id="builder-cookie-consent"
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      class="fixed bottom-4 left-4 right-4 z-[99990] mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md text-[#222925] transition-all"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173D35]/10 text-lg">
            🍪
          </div>
          <div>
            <h2 id="consent-title" class="text-sm font-bold text-[#173D35] md:text-base">
              {{ t('consent.title') }}
            </h2>
            <p id="consent-desc" class="mt-0.5 text-xs text-stone-600 leading-relaxed md:text-sm">
              {{ t('consent.description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Optional Customize Accordion -->
      <div v-if="showCustom" class="mt-4 space-y-2 rounded-xl border border-stone-200/80 bg-stone-50/80 p-3.5 text-xs">
        <div class="flex items-center justify-between py-1">
          <div>
            <span class="font-bold text-[#173D35]">{{ t('consent.necessaryCookies') }}</span>
            <p class="text-[11px] text-stone-500">{{ t('consent.necessaryDesc') }}</p>
          </div>
          <span class="rounded bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">{{ t('consent.alwaysActive') }}</span>
        </div>

        <div class="border-t border-stone-200/60 pt-2 flex items-center justify-between">
          <div>
            <span class="font-bold text-[#173D35]">{{ t('consent.soundEffects') }}</span>
            <p class="text-[11px] text-stone-500">{{ t('consent.soundDesc') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 active:scale-95 transition"
              @click="togglePreview"
            >
              {{ isPreviewing ? '⏹ ' + t('consent.stop') : '🔊 ' + t('consent.preview') }}
            </button>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                v-model="customSoundEnabled"
                class="sr-only peer"
              />
              <div class="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#173D35]"></div>
            </label>
          </div>
        </div>

        <div class="border-t border-stone-200/60 pt-2 flex items-center justify-between text-[11px]">
          <span class="text-stone-500">{{ t('consent.replayDoor') }}</span>
          <button
            type="button"
            class="rounded-lg border border-stone-300 bg-white px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-100 active:scale-95 transition"
            @click="replaySplash"
          >
            🚪 {{ t('consent.replayDoor') }}
          </button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="mt-4 flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-stone-100">
        <button
          type="button"
          class="text-xs font-semibold text-[#173D35] underline decoration-[#173D35]/30 underline-offset-4 hover:decoration-[#173D35] px-2 py-1.5 transition"
          @click="showCustom = !showCustom"
        >
          {{ showCustom ? t('consent.hideCustom') : t('consent.customize') }}
        </button>

        <button
          type="button"
          id="btn-consent-necessary"
          class="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98]"
          @click="acceptNecessary"
        >
          {{ t('consent.onlyNecessary') }}
        </button>

        <button
          type="button"
          id="btn-consent-accept-all"
          class="rounded-xl bg-[#173D35] px-4 py-2 text-xs font-bold text-[#F5F3EC] shadow-sm transition hover:bg-[#0f2b25] active:scale-[0.98]"
          @click="showCustom ? saveCustom() : acceptAll()"
        >
          {{ showCustom ? t('consent.saveCustom') : t('consent.acceptAll') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useLabels } from '../../i18n';
import {
  getSoundConsent,
  getCookieConsent,
  saveConsent,
  isCookieApprovalMissing,
  isSoundApprovalMissing,
  type SoundConsent,
  type CookieConsent
} from '../../services/consent';
import { playDoorSound, stopDoorSound } from '../../services/sound';
import { useSessionStore } from '../../store/useSessionStore';

const { t } = useLabels();
const sessionStore = useSessionStore();

const isOpen = ref(false);
const showCustom = ref(false);
const customSoundEnabled = ref(getSoundConsent() === 'granted');
const isPreviewing = ref(false);

function checkConsentPrompt() {
  // If either cookie or sound approval is missing, prompt user once
  if (isCookieApprovalMissing() || isSoundApprovalMissing()) {
    isOpen.value = true;
  }
}

function handleAccept(sound: SoundConsent, cookies: CookieConsent) {
  const userId = sessionStore.user?.id;
  saveConsent({ sound, cookies, userId });
  if (sessionStore.user) {
    sessionStore.updateUserConsent(sound, cookies);
  }
  if (sound === 'granted') {
    playDoorSound(0);
  } else {
    stopDoorSound();
  }
  isOpen.value = false;
  isPreviewing.value = false;
}

function acceptAll() {
  handleAccept('granted', 'all');
}

function acceptNecessary() {
  handleAccept('denied', 'essential');
}

function saveCustom() {
  handleAccept(customSoundEnabled.value ? 'granted' : 'denied', 'all');
}

async function togglePreview() {
  if (isPreviewing.value) {
    stopDoorSound();
    isPreviewing.value = false;
  } else {
    isPreviewing.value = true;
    const res = await playDoorSound(0);
    if (!res.started) {
      isPreviewing.value = false;
    }
  }
}

function replaySplash() {
  isOpen.value = false;
  stopDoorSound();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('builder:replay-splash'));
  }
}

function onOpenConsent() {
  customSoundEnabled.value = getSoundConsent() === 'granted';
  isOpen.value = true;
}

onMounted(() => {
  checkConsentPrompt();
  if (typeof window !== 'undefined') {
    window.addEventListener('builder:open-consent', onOpenConsent);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('builder:open-consent', onOpenConsent);
  }
});
</script>

<style scoped>
.fade-consent-enter-active,
.fade-consent-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-consent-enter-from,
.fade-consent-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
