<template>
  <main class="relative h-dvh w-full select-none overflow-hidden bg-slate-50">
    <div
      class="absolute inset-0 z-0 transition-all duration-300 min-[1180px]:right-[434px]"
      :style="{ right: store.isFullscreen ? '0px' : undefined }"
    >
      <HouseCanvas ref="canvasRef" />
    </div>
    <ConfiguratorUI
      @zoom-in="canvasRef?.zoomIn()"
      @zoom-out="canvasRef?.zoomOut()"
      @reset-view="canvasRef?.resetView()"
      @mark-view="canvasRef?.markView()"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HouseCanvas from '../components/HouseCanvas.vue';
import ConfiguratorUI from '../components/ConfiguratorUI.vue';
import { useConfigStore } from '../store/useConfigStore';

const store = useConfigStore();
const canvasRef = ref<InstanceType<typeof HouseCanvas> | null>(null);
</script>
