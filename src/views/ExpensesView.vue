<template>
  <div class="relative h-dvh w-full overflow-hidden bg-[#F5F3EC]">
    <!-- 1. Gated: Invitation Required Screen (for unauthorized or mood-only guests) -->
    <div
      v-if="gateReady && !hasAccess"
      class="relative flex h-full w-full items-center justify-center p-4 bg-[#F5F3EC] overflow-y-auto"
    >
      <div class="relative z-10 w-full max-w-md rounded-3xl border border-[#d7d1c4] bg-white p-6 sm:p-8 shadow-2xl text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl mb-3 text-amber-700">
          🔒
        </div>

        <h1 class="text-xl sm:text-2xl font-bold text-[#173D35] tracking-tight">
          {{ isEn ? 'Invitation Required' : 'Inbjudan krävs' }}
        </h1>

        <p class="mt-2 text-xs sm:text-sm text-stone-600">
          {{ isEn
            ? 'The Expense Tracker is private and requires an invitation from the project owner. If you have an invitation code or link, enter it below.'
            : 'Kostnadsuppföljningen är privat och kräver en inbjudan från projektägaren. Om du har fått en inbjudningskod eller länk kan du ange den nedan.' }}
        </p>

        <!-- Token entry form -->
        <form class="mt-6 space-y-3" @submit.prevent="submitInviteCode">
          <input
            v-model="inviteCodeInput"
            type="text"
            required
            :placeholder="isEn ? 'Paste invitation code or link' : 'Klistra in inbjudningskod eller länk'"
            class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2.5 text-base sm:text-sm text-stone-800 focus:border-[#173D35] focus:outline-none"
          />

          <p v-if="inviteCodeError" class="text-xs font-semibold text-rose-600">
            {{ inviteCodeError }}
          </p>

          <button
            type="submit"
            class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-4 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#0f2b25]"
          >
            <span>{{ isEn ? 'Unlock Expense Tracker' : 'Lås upp kostnadsuppföljning' }}</span>
          </button>
        </form>

        <!-- Go to Mood Board button (Users with mood access can always go to mood board) -->
        <div class="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2">
          <button
            type="button"
            class="text-xs font-semibold text-[#173D35] hover:underline"
            @click="goToMoodBoard"
          >
            ← {{ isEn ? 'Go to Mood Board' : 'Gå till projektets Moodboard' }}
          </button>

          <button
            type="button"
            class="text-xs font-medium text-stone-500 hover:underline"
            @click="goToHome"
          >
            {{ isEn ? 'Return to Home' : 'Till startsidan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Onboarding: First-time participant sign-up (same as mood board) -->
    <ExpenseJoinLoading
      v-else-if="gateReady && showJoinScreen"
      :house-key="houseKey"
      @joined="onJoined"
    />

    <!-- 3. Authorized Expense Tracker -->
    <ExpenseTracker
      v-else-if="gateReady"
      :house-key="houseKey"
      :standalone="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpenseJoinLoading from '../components/expenses/ExpenseJoinLoading.vue';
import ExpenseTracker from '../components/expenses/ExpenseTracker.vue';
import {
  hasExpenseAccess,
  grantExpenseAccess,
  setExpenseAccess,
  expenseHouseKey
} from '../services/expenseSave';
import { getStoredParticipant, saveStoredParticipant, syncMoodWithCloudflare } from '../services/moodSave';
import { useSessionStore } from '../store/useSessionStore';
import { useLabels } from '../i18n';
import type { MoodParticipant } from '../mood/board';

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const { locale } = useLabels();
const isEn = computed(() => locale.value === 'en');

const gateReady = ref(false);
const hasAccess = ref(false);
const showJoinScreen = ref(false);

const inviteCodeInput = ref('');
const inviteCodeError = ref('');

const houseKey = computed(() => {
  return (typeof route?.query?.board === 'string' && route.query.board)
    ? route.query.board
    : expenseHouseKey();
});

onMounted(async () => {
  await sessionStore.ensureAccountState();

  const storedParticipant = getStoredParticipant();
  if (storedParticipant && !sessionStore.user) {
    const remote = await syncMoodWithCloudflare(houseKey.value);
    const boardParticipant = remote?.participants?.find((participant) => (
      participant.id === storedParticipant.id
      || Boolean(
        storedParticipant.email
        && participant.email
        && storedParticipant.email.toLowerCase().trim() === participant.email.toLowerCase().trim()
      )
    ));
    if (boardParticipant) {
      if (boardParticipant.hasExpenseAccess === true) storedParticipant.hasExpenseAccess = true;
      else delete storedParticipant.hasExpenseAccess;
      if (boardParticipant.canInviteParticipants === true) storedParticipant.canInviteParticipants = true;
      else delete storedParticipant.canInviteParticipants;
      saveStoredParticipant(storedParticipant);
      setExpenseAccess(boardParticipant.hasExpenseAccess === true, houseKey.value);
    }
  }

  // If URL contains an invite token, grant access immediately!
  const inviteParam = typeof route?.query?.invite === 'string' ? route.query.invite.trim() : '';
  if (inviteParam) {
    grantExpenseAccess(houseKey.value);
  }

  const access = hasExpenseAccess(houseKey.value);
  hasAccess.value = access;

  if (access) {
    // Check if participant profile needed (first-time sign-up)
    const stored = getStoredParticipant();
    const hasUser = Boolean(sessionStore.user);

    if (!stored && !hasUser) {
      showJoinScreen.value = true;
    } else {
      showJoinScreen.value = false;
    }
  }

  gateReady.value = true;
});

function submitInviteCode() {
  const code = inviteCodeInput.value.trim();
  if (!code) return;

  // Accept URL or token string
  if (code.includes('invite=') || code.startsWith('exp_') || code.length > 5) {
    grantExpenseAccess(houseKey.value);
    hasAccess.value = true;
    inviteCodeError.value = '';

    const stored = getStoredParticipant();
    const hasUser = Boolean(sessionStore.user);
    if (!stored && !hasUser) {
      showJoinScreen.value = true;
    } else {
      showJoinScreen.value = false;
    }
  } else {
    inviteCodeError.value = isEn.value ? 'Invalid invitation code' : 'Ogiltig inbjudningskod';
  }
}

function onJoined(_p: MoodParticipant) {
  showJoinScreen.value = false;
}

function goToMoodBoard() {
  void router.push({
    path: '/mood',
    query: { board: houseKey.value }
  });
}

function goToHome() {
  void router.push('/');
}
</script>
