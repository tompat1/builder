<template>
  <div
    id="expense-join-loading"
    class="relative h-full w-full overflow-y-auto overscroll-y-contain bg-[#F5F3EC] text-[#222925] selection:bg-[#173D35] selection:text-white [-webkit-overflow-scrolling:touch]"
  >
    <div class="relative flex min-h-full w-full items-start justify-center p-4 pb-[max(7rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-8 lg:p-8">
      <!-- Atmospheric decorative glow -->
      <div class="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#173D35]/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#f59e0b]/15 blur-3xl"></div>

      <main class="relative z-10 my-2 w-full max-w-2xl overflow-clip rounded-3xl border border-[#d7d1c4]/80 bg-white shadow-[0_24px_48px_-12px_rgba(23,61,53,0.18)] sm:my-0">
        <!-- Header banner -->
        <div class="bg-gradient-to-r from-[#173D35] via-[#1f4a41] to-[#28574d] p-6 text-white text-center sm:p-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-400/20 text-amber-200 border border-amber-400/30 mb-3">
            <span>✨</span>
            <span>{{ isEn ? 'Inbjudan till Kostnadsuppföljning' : 'Inbjudan till Kostnadsuppföljning' }}</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-[#F5F3EC] sm:text-3xl">
            {{ isRestoringMode
              ? (isEn ? 'Restore Profile & Reconnect' : 'Återanslut profil')
              : (isEn ? 'Welcome to Expense Tracking' : 'Välkommen till kostnadsuppföljningen') }}
          </h1>
          <p class="mx-auto mt-2 max-w-md text-sm text-[#F5F3EC]/80 sm:text-base">
            {{ isRestoringMode
              ? (isEn ? 'Enter the email you previously used to restore your participant profile.' : 'Ange den e-postadress du använde tidigare för att återställa din avatar och deltagarprofil.')
              : (isEn ? 'Create your participant profile. You will get access to both the Expense Tracker and the Mood Board.' : 'Skapa din deltagarprofil. Du får behörighet till både kostnadsuppföljningen och projektets moodboard.') }}
          </p>
        </div>

        <div class="p-6 sm:p-8 lg:p-10">
          <!-- 1. Restore participant form -->
          <form v-if="isRestoringMode" class="space-y-6" @submit.prevent="handleRestore">
            <div class="space-y-1.5">
              <label for="restore-email" class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
                {{ isEn ? 'Your Email Address' : 'Din e-postadress' }} <span class="text-rose-600">*</span>
              </label>
              <input
                id="restore-email"
                v-model="restoreEmail"
                type="email"
                autocomplete="email"
                required
                :placeholder="isEn ? 'Enter your email' : 'Ange din e-postadress'"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                :class="restoreError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200' : ''"
                @input="restoreError = ''"
              />
              <p v-if="restoreError" class="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
                {{ restoreError }}
              </p>
              <p v-else-if="restoreSuccess" class="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <span>✓</span> {{ restoreSuccess }}
              </p>
              <p v-else class="text-xs text-stone-500">
                {{ isEn ? 'We search for your profile for this project.' : 'Vi söker efter din deltagarprofil för detta husbygge.' }}
              </p>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-6 text-base font-bold text-[#F5F3EC] shadow-lg shadow-[#173D35]/25 transition hover:bg-[#0f2b25] active:scale-[0.99] disabled:opacity-60"
                :disabled="isSearching || !restoreEmail.trim()"
              >
                <span>{{ isSearching ? (isEn ? 'Searching...' : 'Söker profil...') : (isEn ? 'Find Profile & Join' : 'Hitta profil & anslut') }}</span>
              </button>
            </div>

            <div class="pt-2 text-center">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173D35] underline decoration-[#173D35]/40 underline-offset-4 hover:decoration-[#173D35]"
                @click="isRestoringMode = false"
              >
                <span>←</span>
                <span>{{ isEn ? 'Or create a new profile' : 'Eller skapa en ny profil' }}</span>
              </button>
            </div>
          </form>

          <!-- 2. Create new profile onboarding form -->
          <form v-else class="space-y-6" @submit.prevent="submitJoin">
            <!-- 1. Name input -->
            <div class="space-y-1.5">
              <label for="participant-name" class="block text-sm font-semibold text-[#173D35]">
                1. {{ isEn ? 'Your Name' : 'Ditt namn' }} <span class="text-rose-600">*</span>
              </label>
              <input
                id="participant-name"
                v-model="name"
                type="text"
                maxlength="40"
                autocomplete="name"
                :placeholder="isEn ? 'E.g. Emma S.' : 'T.ex. Emma S.'"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                :class="errors.name ? 'border-rose-500' : ''"
                @input="errors.name = ''"
              />
              <p v-if="errors.name" class="text-xs font-medium text-rose-600">{{ errors.name }}</p>
            </div>

            <!-- 2. Preset theme selection for avatar -->
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <label class="min-w-0 text-sm font-semibold text-[#173D35]">
                  2. {{ isEn ? 'Choose 3 themes for your AI avatar' : 'Välj 3 teman för din AI-avatar' }}
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
                  class="relative flex min-h-16 flex-col items-start rounded-xl border p-3 text-left transition"
                  :class="[
                    selectedThemes.includes(theme.id)
                      ? 'border-[#173D35] bg-[#173D35]/8 ring-2 ring-[#173D35]'
                      : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-100'
                  ]"
                  @click="toggleTheme(theme.id)"
                >
                  <span
                    v-if="selectedThemes.includes(theme.id)"
                    class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#173D35] text-[11px] text-white"
                  >
                    ✓
                  </span>
                  <span class="text-lg">{{ theme.emoji }}</span>
                  <span class="mt-1 text-sm font-semibold text-[#222925]">{{ isEn ? theme.nameEn : theme.name }}</span>
                  <span class="mt-0.5 text-[11px] text-[#4a5851] line-clamp-2">{{ isEn ? theme.taglineEn : theme.tagline }}</span>
                </button>
              </div>
              <p v-if="errors.themes" class="text-xs font-medium text-rose-600">{{ errors.themes }}</p>
            </div>

            <!-- Avatar preview -->
            <div v-if="previewAvatar" class="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div
                class="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-md border-2 border-white"
                v-html="previewAvatar"
              ></div>
              <div>
                <p class="text-xs font-semibold text-[#173D35] uppercase tracking-wider">
                  {{ isEn ? 'AI Avatar Preview' : 'Din unika avatar' }}
                </p>
                <p class="text-xs text-stone-600 mt-0.5">
                  {{ isEn ? 'Generated based on your name and selected themes.' : 'Genererad automatiskt utifrån ditt namn och dina valda teman.' }}
                </p>
              </div>
            </div>

            <!-- 3. Email input (optional) -->
            <div class="space-y-1.5">
              <label for="participant-email" class="block text-sm font-semibold text-[#173D35]">
                3. {{ isEn ? 'Email address (optional)' : 'E-postadress (valfritt)' }}
              </label>
              <input
                id="participant-email"
                v-model="email"
                type="email"
                autocomplete="email"
                :placeholder="isEn ? 'For restoring profile or notifications' : 'För att enkelt återansluta eller få kvittonotiser'"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
              />
              <p class="text-xs text-stone-500">
                {{ isEn ? 'Allows you to restore your profile on other devices.' : 'Gör att du kan återställa din deltagarprofil på andra enheter.' }}
              </p>
            </div>

            <!-- Submit button -->
            <div class="pt-4">
              <button
                type="submit"
                id="btn-join-expenses"
                class="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-6 text-base font-bold text-[#F5F3EC] shadow-lg shadow-[#173D35]/25 transition hover:bg-[#0f2b25] active:scale-[0.99] disabled:opacity-60"
                :disabled="!name.trim()"
              >
                <span>{{ isEn ? 'Join & Open Expense Tracker' : 'Anslut & öppna kostnadsuppföljning' }}</span>
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            <!-- Switch to restore -->
            <div class="pt-1 text-center">
              <button
                type="button"
                class="text-xs font-semibold text-[#173D35] underline decoration-[#173D35]/40 underline-offset-4 hover:decoration-[#173D35]"
                @click="isRestoringMode = true"
              >
                {{ isEn ? 'Already joined before? Restore profile with email' : 'Har du redan anslutit tidigare? Återställ med e-post' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { AVATAR_THEMES, generateAiAvatar } from '../../mood/avatar';
import { saveStoredParticipant, getStoredParticipant } from '../../services/moodSave';
import { grantExpenseAccess } from '../../services/expenseSave';
import { useLabels } from '../../i18n';
import type { MoodParticipant } from '../../mood/board';

const props = defineProps<{
  houseKey: string;
}>();

const emit = defineEmits<{
  (e: 'joined', participant: MoodParticipant): void;
}>();

const { locale } = useLabels();
const isEn = computed(() => locale.value === 'en');

const isRestoringMode = ref(false);
const name = ref('');
const email = ref('');
const selectedThemes = ref<string[]>(['Foresty', 'Adventure', 'Dreamy']);
const errors = ref<Record<string, string>>({});

const restoreEmail = ref('');
const isSearching = ref(false);
const restoreError = ref('');
const restoreSuccess = ref('');

function toggleTheme(id: string) {
  const index = selectedThemes.value.indexOf(id);
  if (index >= 0) {
    if (selectedThemes.value.length > 1) {
      selectedThemes.value.splice(index, 1);
    }
  } else if (selectedThemes.value.length < 3) {
    selectedThemes.value.push(id);
  } else {
    selectedThemes.value = [...selectedThemes.value.slice(1), id];
  }
}

const previewAvatar = computed(() => {
  if (!name.value.trim()) return '';
  return generateAiAvatar({
    name: name.value.trim(),
    themes: selectedThemes.value,
    seed: name.value.trim()
  });
});

function submitJoin() {
  const cleanName = name.value.trim();
  if (!cleanName) {
    errors.value.name = isEn.value ? 'Please enter your name' : 'Vänligen ange ditt namn';
    return;
  }

  const avatar = generateAiAvatar({
    name: cleanName,
    themes: selectedThemes.value,
    seed: cleanName
  });

  const participant: MoodParticipant = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    avatar,
    email: email.value.trim() || undefined,
    themes: selectedThemes.value,
    joinedAt: new Date().toISOString(),
    hasExpenseAccess: true
  };

  saveStoredParticipant(participant);
  grantExpenseAccess(props.houseKey);
  emit('joined', participant);
}

function handleRestore() {
  isSearching.value = true;
  restoreError.value = '';
  restoreSuccess.value = '';

  setTimeout(() => {
    isSearching.value = false;
    const existing = getStoredParticipant();
    if (existing && existing.email && existing.email.toLowerCase() === restoreEmail.value.trim().toLowerCase()) {
      existing.hasExpenseAccess = true;
      saveStoredParticipant(existing);
      grantExpenseAccess(props.houseKey);
      restoreSuccess.value = isEn.value ? 'Profile restored! Connecting...' : 'Profil återställd! Ansluter...';
      setTimeout(() => emit('joined', existing), 400);
      return;
    }

    // If matching by name or creating fallback
    if (restoreEmail.value.trim()) {
      const generated = {
        id: `p_restored_${Date.now()}`,
        name: restoreEmail.value.split('@')[0],
        avatar: generateAiAvatar({
          name: restoreEmail.value.split('@')[0],
          themes: ['Foresty', 'Adventure', 'Dreamy']
        }),
        email: restoreEmail.value.trim(),
        themes: ['Foresty', 'Adventure', 'Dreamy'],
        joinedAt: new Date().toISOString(),
        hasExpenseAccess: true
      };
      saveStoredParticipant(generated);
      grantExpenseAccess(props.houseKey);
      restoreSuccess.value = isEn.value ? 'Connected with email!' : 'Ansluten med e-post!';
      setTimeout(() => emit('joined', generated), 400);
    }
  }, 450);
}
</script>
