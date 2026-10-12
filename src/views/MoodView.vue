<template>
  <div class="relative h-screen w-screen overflow-hidden bg-[#F5F3EC]">
    <!-- If participant has not joined yet, show loading & onboarding page -->
    <MoodJoinLoading
      v-if="showJoinScreen"
      @joined="onJoined"
    />

    <!-- Once joined or if already a participant/user, show the dedicated Moodboard -->
    <MoodBoard
      v-else
      :standalone="true"
      @reopen-profile="showJoinScreen = true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MoodJoinLoading from '../components/MoodJoinLoading.vue';
import MoodBoard from '../components/MoodBoard.vue';
import { getStoredParticipant } from '../services/moodSave';
import { useSessionStore } from '../store/useSessionStore';
import type { MoodParticipant } from '../mood/board';

const route = useRoute();
const sessionStore = useSessionStore();

const showJoinScreen = ref(false);

onMounted(async () => {
  await sessionStore.ensureAccountState();

  // If forced via ?join=1, or if user is neither signed in nor a stored participant
  const forceJoin = route.query.join === '1';
  const hasParticipant = Boolean(getStoredParticipant());
  const hasUser = Boolean(sessionStore.user);

  if (forceJoin || (!hasParticipant && !hasUser)) {
    showJoinScreen.value = true;
  } else {
    showJoinScreen.value = false;
  }
});

function onJoined(_p: MoodParticipant) {
  showJoinScreen.value = false;
}
</script>
