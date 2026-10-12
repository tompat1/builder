<template>
  <div
    id="mood-join-loading"
    class="relative flex min-h-screen w-full items-center justify-center bg-[#F5F3EC] p-4 text-[#222925] selection:bg-[#173D35] selection:text-white sm:p-6 lg:p-8"
  >
    <!-- Background atmospheric decorative glows -->
    <div class="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#173D35]/10 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#c084fc]/10 blur-3xl"></div>

    <main class="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d7d1c4]/80 bg-white/95 p-6 shadow-[0_24px_48px_-12px_rgba(23,61,53,0.18)] backdrop-blur-md sm:p-8 lg:p-10">
      <!-- Header -->
      <header class="text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173D35] text-2xl text-[#F5F3EC] shadow-md shadow-[#173D35]/25">
          🎨
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-[#173D35] sm:text-3xl">
          {{ t('mood.joinTitle') || 'Välkommen till moodboarden' }}
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-[#4a5851] sm:text-base">
          {{ t('mood.joinSubtitle') || 'Skapa din deltagarprofil och låt AI:n laga ihop din unika avatar innan du ansluter till tavlan.' }}
        </p>
      </header>

      <form class="mt-8 space-y-6" @submit.prevent="submitJoin">
        <!-- 1. Name input -->
        <div class="space-y-1.5">
          <label for="participant-name" class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
            1. {{ t('mood.yourName') || 'Ditt namn' }} <span class="text-rose-600">*</span>
          </label>
          <div class="relative">
            <input
              id="participant-name"
              v-model="name"
              type="text"
              maxlength="40"
              autocomplete="name"
              placeholder="t.ex. Alex, Maria..."
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-3 text-base text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
              :class="errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200' : ''"
              @input="onNameChange"
            />
          </div>
          <p v-if="errors.name" class="text-xs font-medium text-rose-600">{{ errors.name }}</p>
        </div>

        <!-- 2. Preset theme selection -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
              2. {{ t('mood.chooseThemes') || 'Välj upp till 3 teman för AI-avataren' }}
            </label>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="selectedThemes.length === 3 ? 'bg-[#173D35] text-white' : 'bg-stone-200 text-stone-700'"
            >
              {{ selectedThemes.length }} / 3
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="theme in AVATAR_THEMES"
              :key="theme.id"
              type="button"
              class="group relative flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition"
              :class="[
                selectedThemes.includes(theme.id)
                  ? 'border-[#173D35] bg-[#173D35]/8 ring-2 ring-[#173D35]'
                  : 'border-stone-200 bg-stone-50/70 hover:border-stone-300 hover:bg-stone-100'
              ]"
              @click="toggleTheme(theme.id)"
            >
              <span class="text-lg transition-transform group-hover:scale-110">{{ theme.emoji }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-bold text-stone-900">{{ theme.name }}</p>
                <p class="truncate text-[10px] text-stone-500">{{ theme.taglineEn }}</p>
              </div>
              <span
                v-if="selectedThemes.includes(theme.id)"
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#173D35] text-[10px] text-white"
              >
                ✓
              </span>
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
                  <span class="mt-1 text-[9px] font-bold uppercase tracking-wider">Lagar...</span>
                </div>
                <div v-else class="flex h-full w-full items-center justify-center text-stone-400 text-2xl">
                  👤
                </div>
              </div>

              <div>
                <p class="text-sm font-bold text-[#173D35]">
                  {{ isCooking ? cookingStepText : (avatarDataUrl ? 'Din avatar är serverad!' : 'Ingen avatar än') }}
                </p>
                <p class="mt-0.5 text-xs text-stone-500">
                  {{ selectedThemes.length > 0 ? selectedThemes.join(' + ') : 'Välj minst 1 tema ovan' }}
                </p>
              </div>
            </div>

            <!-- Cook action button -->
            <button
              type="button"
              id="btn-cook-avatar"
              class="flex items-center gap-2 rounded-xl bg-[#173D35] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f2b25] hover:shadow active:scale-95 disabled:opacity-50"
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
            placeholder="din.epost@exempel.se"
            class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-4 py-2.5 text-sm text-[#222925] transition placeholder:text-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
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
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLabels } from '../i18n';
import { AVATAR_THEMES, generateAiAvatar } from '../mood/avatar';
import { getStoredParticipant, saveStoredParticipant } from '../services/moodSave';
import type { MoodParticipant } from '../mood/board';

const emit = defineEmits<{
  (e: 'joined', participant: MoodParticipant): void;
}>();

const { t } = useLabels();

const name = ref('');
const email = ref('');
const selectedThemes = ref<string[]>(['Foresty', 'Chill']);
const avatarDataUrl = ref('');
const isCooking = ref(false);
const cookingStepText = ref('Blandar smaker...');
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
    errors.value.themes = 'Välj minst 1 tema att koka ihop';
    return;
  }
  isCooking.value = true;
  cookingStepText.value = 'Blandar teman...';

  // Creative multi-step cooking animation
  await sleep(250);
  cookingStepText.value = 'Analyserar färgpalett...';
  await sleep(250);
  cookingStepText.value = 'Genererar stilar...';
  await sleep(200);

  const seed = String(Date.now());
  avatarDataUrl.value = generateAiAvatar({
    name: name.value.trim() || 'Vän',
    themes: selectedThemes.value,
    seed
  });

  isCooking.value = false;
}

function submitJoin() {
  errors.value = {};
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    errors.value.name = 'Vänligen ange ditt namn';
    return;
  }
  if (selectedThemes.value.length === 0) {
    errors.value.themes = 'Välj minst ett tema';
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
  emit('joined', participant);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
</script>
