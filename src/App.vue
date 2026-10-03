<template>
  <main class="relative w-screen h-screen overflow-hidden bg-gray-100">
    <HouseCanvas />
    <ConfiguratorUI />
  </main>
</template>

<script setup lang="ts">
import HouseCanvas from './components/HouseCanvas.vue';
import ConfiguratorUI from './components/ConfiguratorUI.vue';
</script>
