<template>
  <router-view />
  <GlobalFeedback />
  <DoorSplash v-if="showSplash" :ready="isReady" @done="showSplash = false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import GlobalFeedback from './components/GlobalFeedback.vue';
import DoorSplash from './components/brand/DoorSplash.vue';

const router = useRouter();
const showSplash = ref(true);
const isReady = ref(false);

onMounted(async () => {
  try {
    await router.isReady();
  } finally {
    isReady.value = true;
  }
});
</script>
