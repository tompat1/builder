<template>
  <main class="relative w-screen h-screen overflow-hidden bg-slate-50 select-none">
    <!-- 3D Canvas Area (Centered in the visual viewport to the left of desktop sidebar) -->
    <div class="absolute inset-0 md:right-[434px] z-0">
      <HouseCanvas ref="canvasRef" />
    </div>

    <!-- UI Overlay Layer -->
    <ConfiguratorUI
      @zoom-in="canvasRef?.zoomIn()"
      @zoom-out="canvasRef?.zoomOut()"
      @reset-view="canvasRef?.resetView()"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HouseCanvas from './components/HouseCanvas.vue';
import ConfiguratorUI from './components/ConfiguratorUI.vue';

const canvasRef = ref<InstanceType<typeof HouseCanvas> | null>(null);
</script>
