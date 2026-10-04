<template>
  <main class="relative w-screen h-screen overflow-hidden bg-slate-50 select-none">
    <!-- 3D Canvas Area (Spans full width in fullscreen mode, otherwise leaves space for sidebar on desktop) -->
    <div
      class="absolute inset-0 z-0 transition-all duration-300"
      :class="store.isFullscreen ? 'right-0' : 'md:right-[434px]'"
    >
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
import { useConfigStore } from './store/useConfigStore';

const store = useConfigStore();
const canvasRef = ref<InstanceType<typeof HouseCanvas> | null>(null);
</script>
