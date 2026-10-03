<template>
  <div ref="canvasContainer" class="w-full h-full absolute inset-0 z-0"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { HouseScene } from '../three-engine/HouseScene';
import { useConfigStore } from '../store/useConfigStore';

const canvasContainer = ref<HTMLElement | null>(null);
const store = useConfigStore();
let engine: HouseScene | null = null;

onMounted(() => {
  if (canvasContainer.value) {
    engine = new HouseScene(canvasContainer.value, {
      widthMm: store.dimensions.width,
      depthMm: store.dimensions.depth,
      heightMm: store.dimensions.height,
      roofType: store.activeRoof as 'pulpettak' | 'sadeltak' | 'flackt',
      hasLoft: store.hasLoft,
      viewMode: store.viewMode
    });
  }
});

// Watch view mode (Outside / Inside)
watch(
  () => store.viewMode,
  (newMode) => {
    engine?.setViewMode(newMode);
  }
);

// Watch architectural dimensions
watch(
  () => store.dimensions,
  (dims) => {
    engine?.updateConfig({
      widthMm: dims.width,
      depthMm: dims.depth,
      heightMm: dims.height
    });
  },
  { deep: true }
);

// Watch roof type
watch(
  () => store.activeRoof,
  (roof) => {
    engine?.updateConfig({
      roofType: roof as 'pulpettak' | 'sadeltak' | 'flackt'
    });
  }
);

// Watch loft toggle
watch(
  () => store.hasLoft,
  (loft) => {
    engine?.updateConfig({
      hasLoft: loft
    });
  }
);

onBeforeUnmount(() => {
  engine?.destroy();
});

defineExpose({
  getCanvas: () => engine?.getCanvas()
});
</script>
