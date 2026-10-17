<template>
  <div class="relative h-screen w-screen overflow-hidden bg-[#F5F3EC]">
    <!-- If participant has not joined yet, show loading & onboarding page -->
    <MoodJoinLoading
      v-if="gateReady && showJoinScreen"
      :house-key="houseKey"
      @joined="onJoined"
    />

    <!-- Once joined or if already a participant/user, show the dedicated Moodboard -->
    <MoodBoard
      v-else-if="gateReady"
      :standalone="true"
      @reopen-profile="showJoinScreen = true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import MoodJoinLoading from '../components/MoodJoinLoading.vue';
import MoodBoard from '../components/MoodBoard.vue';
import { applyLocale } from '../i18n';
import { clearStoredParticipant, getStoredParticipant, moodHouseKey } from '../services/moodSave';
import { useSessionStore } from '../store/useSessionStore';
import type { MoodParticipant } from '../mood/board';

const route = useRoute();
const sessionStore = useSessionStore();

const gateReady = ref(false);
const showJoinScreen = ref(false);

const houseKey = computed(() => {
  return (typeof route?.query?.board === 'string' && route.query.board) ? route.query.board : moodHouseKey();
});

onMounted(async () => {
  await sessionStore.ensureAccountState();

  if (sessionStore.user) {
    clearStoredParticipant();
  }

  // If forced via ?join=1 (for non-authenticated guests), or if user is neither signed in nor a stored participant
  const forceJoin = route.query.join === '1' && !sessionStore.user;
  const hasParticipant = Boolean(getStoredParticipant());
  const hasUser = Boolean(sessionStore.user);

  if (forceJoin || (!hasParticipant && !hasUser)) {
    const requested = route.query.lang;
    applyLocale(requested === 'sv' ? 'sv' : 'en');
    showJoinScreen.value = true;
  } else {
    showJoinScreen.value = false;
  }
  gateReady.value = true;
});

function onJoined(_p: MoodParticipant) {
  showJoinScreen.value = false;
}
</script>
