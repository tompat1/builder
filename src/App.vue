<template>
  <router-view />
  <GlobalFeedback />
  <CookieConsent />
  <DoorSplash v-if="showSplash" :ready="isReady" :sound="true" :fade-in="splashFromPage" @done="showSplash = false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import GlobalFeedback from './components/GlobalFeedback.vue';
import DoorSplash from './components/brand/DoorSplash.vue';
import CookieConsent from './components/brand/CookieConsent.vue';

const router = useRouter();
const showSplash = ref(true);
const splashFromPage = ref(false);
const isReady = ref(false);

onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('builder:replay-splash', () => {
      splashFromPage.value = true;
      showSplash.value = false;
      setTimeout(() => {
        showSplash.value = true;
      }, 50);
    });
  }
  try {
    await router.isReady();
  } finally {
    isReady.value = true;
  }
});
</script>
