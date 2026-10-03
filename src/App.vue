<template>
  <main class="relative w-screen h-screen overflow-hidden bg-slate-100 select-none">
    <HouseCanvas ref="canvasRef" />
    <ConfiguratorUI
      @zoom-in="canvasRef?.zoomIn()"
      @zoom-out="canvasRef?.zoomOut()"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HouseCanvas from './components/HouseCanvas.vue';
import ConfiguratorUI from './components/ConfiguratorUI.vue';

const canvasRef = ref<InstanceType<typeof HouseCanvas> | null>(null);
</script>
