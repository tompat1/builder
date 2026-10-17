<template>
  <div
    id="mood-join-loading"
    class="relative h-full w-full overflow-y-auto overscroll-y-contain bg-[#F5F3EC] text-[#222925] selection:bg-[#173D35] selection:text-white [-webkit-overflow-scrolling:touch]"
    @focusin="keepFieldVisible"
  >
    <div class="relative flex min-h-full w-full items-start justify-center p-4 pb-[max(7rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-8 lg:p-8">
    <!-- Background atmospheric decorative glows -->
    <div class="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#173D35]/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#c084fc]/10 blur-3xl"></div>

    <main class="relative z-10 my-2 w-full max-w-2xl overflow-clip rounded-3xl border border-[#d7d1c4]/80 bg-white shadow-[0_24px_48px_-12px_rgba(23,61,53,0.18)] sm:my-0">
      <img src="/brand/mood.webp" alt="" class="block h-auto w-full" />
      <div class="p-6 sm:p-8 lg:p-10">
      <!-- Header -->
      <header class="text-center">
        <h1 class="text-2xl font-bold tracking-tight text-[#173D35] sm:text-3xl">
          {{ isRestoringMode ? (t('mood.restoreTitle') || 'Återanslut till moodboarden') : (t('mood.joinTitle') || 'Välkommen till moodboarden') }}
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-[#4a5851] sm:text-base">
          {{ isRestoringMode ? (t('mood.restoreSubtitle') || 'Skriv in den e-postadress du använde tidigare för att återställa din avatar och deltagarprofil.') : (t('mood.joinSubtitle') || 'Skapa din deltagarprofil och låt AI:n laga ihop din unika avatar innan du ansluter till tavlan.') }}
        </p>
      </header>

      <!-- 1. Restore participant with email form -->
      <form v-if="isRestoringMode" class="mt-8 space-y-6" @submit.prevent="handleRestore">
        <div class="space-y-1.5">
          <label for="restore-email" class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
            {{ t('mood.restoreEmailLabel') || 'Din e-postadress' }} <span class="text-rose-600">*</span>
          </label>
          <div class="relative">
            <input
              id="restore-email"
              v-model="restoreEmail"
              type="email"
              autocomplete="email"
              required
              :placeholder="t('mood.restoreEmailPlaceholder') || 'Ange den e-postadress du använde'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
              :class="restoreError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200' : ''"
              @input="restoreError = ''"
            />
          </div>
          <p v-if="restoreError" class="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
            {{ restoreError }}
          </p>
          <p v-else-if="restoreSuccess" class="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <span>✓</span> {{ restoreSuccess }}
          </p>
          <p v-else class="text-xs text-stone-500">
            {{ t('mood.restoreEmailHint') || 'Vi söker efter din deltagarprofil på denna moodboard.' }}
          </p>
        </div>

        <!-- Restore submit -->
        <div class="pt-2">
          <button
            type="submit"
            id="btn-restore-participant"
            class="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-6 text-base font-bold text-[#F5F3EC] shadow-lg shadow-[#173D35]/25 transition hover:bg-[#0f2b25] hover:shadow-xl hover:shadow-[#173D35]/35 active:scale-[0.99] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#173D35] focus:ring-offset-2"
            :disabled="isSearching || !restoreEmail.trim()"
          >
            <span v-if="isSearching" class="animate-spin text-lg">⏳</span>
            <span>{{ isSearching ? (t('mood.restoring') || 'Söker profil...') : (t('mood.restoreButton') || 'Hitta profil & anslut') }}</span>
            <svg v-if="!isSearching" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <!-- Back to create profile -->
        <div class="pt-2 text-center">
          <button
            type="button"
            id="btn-switch-to-create"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173D35] underline decoration-[#173D35]/40 underline-offset-4 hover:decoration-[#173D35] hover:text-[#0f2b25] transition"
            @click="isRestoringMode = false"
          >
            <span>←</span>
            <span>{{ t('mood.backToCreate') || 'Eller skapa en ny profil' }}</span>
          </button>
        </div>
      </form>

      <!-- 2. Create new profile onboarding form -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="submitJoin">
        <!-- 1. Name input -->
        <div class="space-y-1.5">
          <label for="participant-name" class="block text-sm font-semibold text-[#173D35]">
            1. {{ t('mood.yourName') }} <span class="text-rose-600">*</span>
          </label>
          <div class="relative">
            <input
              id="participant-name"
              v-model="name"
              type="text"
              maxlength="40"
              autocomplete="name"
              :placeholder="t('mood.namePlaceholder')"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
              :class="errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200' : ''"
              @input="onNameChange"
            />
          </div>
          <p v-if="errors.name" class="text-xs font-medium text-rose-600">{{ errors.name }}</p>
        </div>

        <!-- 2. Preset theme selection -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <label class="min-w-0 text-sm font-semibold text-[#173D35]">
              2. {{ t('mood.chooseThemes') }}
            </label>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
              :class="selectedThemes.length === 3 ? 'bg-[#173D35] text-white' : 'bg-stone-200 text-stone-700'"
            >
              {{ selectedThemes.length }}/3
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="theme in AVATAR_THEMES"
              :key="theme.id"
              type="button"
              class="relative flex min-h-16 flex-col items-start rounded-xl border p-3 text-left"
              :class="[
                selectedThemes.includes(theme.id)
                  ? 'border-[#173D35] bg-[#173D35]/8 ring-2 ring-[#173D35]'
                  : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-100'
              ]"
              :aria-pressed="selectedThemes.includes(theme.id)"
              @click="toggleTheme(theme.id)"
            >
              <span
                v-if="selectedThemes.includes(theme.id)"
                class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#173D35] text-[11px] text-white"
                aria-hidden="true"
              >
                ✓
              </span>
              <span class="text-lg" aria-hidden="true">{{ theme.emoji }}</span>
              <span class="mt-1 pr-6 text-sm font-semibold leading-tight text-[#222925]">{{ themeTitle(theme) }}</span>
              <span class="mt-0.5 line-clamp-2 pr-1 text-[11px] leading-snug text-[#4a5851]">{{ themeLine(theme) }}</span>
            </button>
          </div>
          <p v-if="errors.themes" class="text-xs font-medium text-rose-600">{{ errors.themes }}</p>
        </div>

        <!-- 3. AI Avatar Kitchen Preview -->
        <div class="rounded-2xl border border-[#d7d1c4]/80 bg-[#FDFBF7] p-5 shadow-xs">
          <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div class="flex items-center gap-4">
              <!-- Avatar Circle Preview -->
              <div class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-200 shadow-md ring-2 ring-[#173D35]/20">
                <img
                  v-if="avatarDataUrl && !isCooking"
                  :src="avatarDataUrl"
                  alt="AI Avatar Preview"
                  class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <!-- Cooking loading animation state -->
                <div
                  v-else-if="isCooking"
                  class="flex h-full w-full flex-col items-center justify-center bg-[#173D35] text-white"
                >
                  <span class="animate-spin text-2xl">🍳</span>
                  <span class="mt-1 text-[11px] font-semibold">{{ t('mood.cooking') }}</span>
                </div>
                <div v-else class="flex h-full w-full items-center justify-center text-stone-400 text-2xl">
                  👤
                </div>
              </div>

              <div>
                <p class="text-sm font-bold text-[#173D35]">
                  {{ isCooking ? cookingStepText : (avatarDataUrl ? t('mood.avatarReady') : t('mood.avatarEmpty')) }}
                </p>
                <p class="mt-0.5 text-xs text-[#4a5851]">
                  {{ selectedThemes.length > 0 ? selectedThemes.map(themeTitleById).join(' + ') : t('mood.pickThemesHint') }}
                </p>
              </div>
            </div>

            <!-- Cook action button -->
            <button
              type="button"
              id="btn-cook-avatar"
              class="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f2b25] disabled:opacity-50 sm:w-auto"
              :disabled="isCooking || selectedThemes.length === 0"
              @click="cookAvatar"
            >
              <span>{{ isCooking ? '⏳' : '✨' }}</span>
              <span>{{ avatarDataUrl ? (t('mood.recookAvatar') || 'Koka om avatar') : (t('mood.cookAvatar') || 'Koka ihop AI-avatar') }}</span>
            </button>
          </div>
        </div>

        <!-- 4. Email notifications (optional) -->
        <div class="space-y-1.5">
          <label for="participant-email" class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
            3. {{ t('mood.emailLabel') || 'E-post för aviseringar (frivilligt)' }}
          </label>
          <input
            id="participant-email"
            v-model="email"
            type="email"
            autocomplete="email"
            :placeholder="t('mood.emailPlaceholder')"
            class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
          />
          <p class="text-xs text-stone-500">
            {{ t('mood.emailHint') || 'Få notiser när någon lägger till nya idéer, bilder eller post-its på moodboarden.' }}
          </p>
        </div>

        <!-- Submit & Enter -->
        <div class="pt-2">
          <button
            type="submit"
            id="btn-join-moodboard"
            class="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-6 text-base font-bold text-[#F5F3EC] shadow-lg shadow-[#173D35]/25 transition hover:bg-[#0f2b25] hover:shadow-xl hover:shadow-[#173D35]/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#173D35] focus:ring-offset-2"
          >
            <span>{{ t('mood.joinButton') || 'Anslut till moodboard' }}</span>
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <!-- Or restore with email option -->
        <div class="mt-6 border-t border-[#d7d1c4]/70 pt-5 text-center">
          <p class="text-xs text-[#4a5851]">
            {{ t('mood.restorePrompt') || 'Har du redan skapat en profil på en annan enhet?' }}
          </p>
          <button
            type="button"
            id="btn-switch-to-restore"
            class="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#173D35] underline decoration-[#173D35]/40 underline-offset-4 hover:decoration-[#173D35] hover:text-[#0f2b25] transition"
            @click="isRestoringMode = true"
          >
            <span>{{ t('mood.restoreAction') || 'Logga in med din e-post' }}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
      </div>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLabels } from '../i18n';
import { AVATAR_THEMES, generateAiAvatar, getTheme, type AvatarTheme } from '../mood/avatar';
import {
  getStoredParticipant,
  saveStoredParticipant,
  registerBoardParticipant,
  findParticipantByEmail,
  moodHouseKey
} from '../services/moodSave';
import type { MoodParticipant } from '../mood/board';

const props = withDefaults(
  defineProps<{
    houseKey?: string;
  }>(),
  {
    houseKey: ''
  }
);

const emit = defineEmits<{
  (e: 'joined', participant: MoodParticipant): void;
}>();

const { t, locale } = useLabels();
const route = useRoute();

const activeHouseKey = computed(() => {
  if (props.houseKey) return props.houseKey;
  if (typeof route?.query?.board === 'string' && route.query.board) return route.query.board;
  return moodHouseKey();
});

const isRestoringMode = ref(false);
const restoreEmail = ref('');
const isSearching = ref(false);
const restoreError = ref('');
const restoreSuccess = ref('');

const name = ref('');
const email = ref('');
const selectedThemes = ref<string[]>(['Foresty', 'Chill']);
const avatarDataUrl = ref('');
const isCooking = ref(false);
const cookingStepText = ref('');
const errors = ref<{ name?: string; themes?: string }>({});

onMounted(() => {
  const existing = getStoredParticipant();
  if (existing) {
    name.value = existing.name;
    email.value = existing.email || '';
    if (existing.themes?.length) {
      selectedThemes.value = existing.themes.slice(0, 3);
    }
    avatarDataUrl.value = existing.avatar;
  } else {
    // Generate an initial playful avatar with default themes
    avatarDataUrl.value = generateAiAvatar({
      name: 'Vän',
      themes: selectedThemes.value
    });
  }
});

function onNameChange() {
  if (errors.value.name) errors.value.name = '';
  if (!avatarDataUrl.value || avatarDataUrl.value.includes('V%C3%A4n') || avatarDataUrl.value.includes('MB')) {
    avatarDataUrl.value = generateAiAvatar({
      name: name.value.trim() || 'Vän',
      themes: selectedThemes.value
    });
  }
}

function themeTitle(theme: AvatarTheme) {
  return locale.value === 'en' ? theme.nameEn : theme.name;
}

function themeLine(theme: AvatarTheme) {
  return locale.value === 'en' ? theme.taglineEn : theme.tagline;
}

function themeTitleById(id: string) {
  return themeTitle(getTheme(id));
}

function toggleTheme(id: string) {
  if (errors.value.themes) errors.value.themes = '';
  const idx = selectedThemes.value.indexOf(id);
  if (idx >= 0) {
    selectedThemes.value.splice(idx, 1);
  } else {
    if (selectedThemes.value.length >= 3) {
      // Rotate out oldest
      selectedThemes.value.shift();
    }
    selectedThemes.value.push(id);
  }
}

async function cookAvatar() {
  if (selectedThemes.value.length === 0) {
    errors.value.themes = t('mood.themeRequired');
    return;
  }
  isCooking.value = true;
  cookingStepText.value = t('mood.cookingMix');

  await sleep(250);
  cookingStepText.value = t('mood.cookingPalette');
  await sleep(250);
  cookingStepText.value = t('mood.cookingStyles');
  await sleep(200);

  const seed = String(Date.now());
  avatarDataUrl.value = generateAiAvatar({
    name: name.value.trim() || 'Vän',
    themes: selectedThemes.value,
    seed
  });

  isCooking.value = false;
}

async function handleRestore() {
  restoreError.value = '';
  restoreSuccess.value = '';
  const trimmed = restoreEmail.value.trim();
  if (!trimmed) {
    restoreError.value = t('mood.emailRequired');
    return;
  }
  isSearching.value = true;
  try {
    const found = await findParticipantByEmail(trimmed, activeHouseKey.value);
    if (!found) {
      restoreError.value = t('mood.restoreNotFound') || 'Ingen profil hittades med den e-postadressen för denna moodboard. Kontrollera stavningen eller skapa en ny profil.';
      isSearching.value = false;
      return;
    }
    saveStoredParticipant(found);
    restoreSuccess.value = (t('mood.restoreFound') || 'Välkommen tillbaka, {name}!').replace('{name}', found.name);
    await sleep(400);
    emit('joined', found);
  } catch {
    restoreError.value = t('mood.restoreFailed');
  } finally {
    isSearching.value = false;
  }
}

function submitJoin() {
  errors.value = {};
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    errors.value.name = t('mood.nameRequired');
    return;
  }
  if (selectedThemes.value.length === 0) {
    errors.value.themes = t('mood.themeRequired');
    return;
  }

  if (!avatarDataUrl.value) {
    avatarDataUrl.value = generateAiAvatar({
      name: trimmedName,
      themes: selectedThemes.value
    });
  }

  const participant: MoodParticipant = {
    id: `part_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    avatar: avatarDataUrl.value,
    email: email.value.trim() || undefined,
    themes: [...selectedThemes.value],
    joinedAt: new Date().toISOString()
  };

  saveStoredParticipant(participant);
  registerBoardParticipant(participant, activeHouseKey.value);
  emit('joined', participant);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function keepFieldVisible(event: FocusEvent) {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
  window.setTimeout(() => {
    const view = window.visualViewport;
    const rect = field.getBoundingClientRect();
    const scroller = document.getElementById('mood-join-loading');
    if (!view || !scroller) {
      field.scrollIntoView({ block: 'center', inline: 'nearest' });
      return;
    }
    const visibleBottom = view.offsetTop + view.height - 24;
    if (rect.bottom > visibleBottom) scroller.scrollTop += rect.bottom - visibleBottom;
    const next = field.getBoundingClientRect();
    if (next.top < view.offsetTop + 16) scroller.scrollTop -= view.offsetTop + 16 - next.top;
  }, 320);
}
</script>
