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
      loftCount: store.loftCount,
      loftPlacement: store.loftPlacement,
      loftAreaSqMeters: store.selectedLoftSize,
      hasLoftStair: store.hasLoftStair,
      viewMode: store.viewMode,
      material: store.activeMaterial,
      showDimensions: store.showDimensions,
      selectedSlotId: store.selectedSlotId,
      wallSlots: store.wallSlots
    });

    // Wire raycast clicks & hover from 3D scene to store
    engine.onPanelClick = (slotId) => {
      store.selectSlot(slotId);
    };

    engine.onPanelHover = (slotId, x, y) => {
      store.setHoveredSlot(slotId, slotId && x && y ? { x, y } : null);
    };

    engine.onSlotScreenPositionUpdate = (pos) => {
      store.setSlotScreenPosition(pos);
    };

    engine.onDimensionLabels = (labels) => {
      store.setDimensionLabels(labels);
    };

    if (typeof window !== 'undefined') {
      (window as any).__houseScene = engine;
    }
  }
});

// Watch show dimensions toggle
watch(
  () => store.showDimensions,
  (show) => {
    engine?.updateConfig({ showDimensions: show });
  }
);

// Watch view mode (Outside / Inside)
watch(
  () => store.viewMode,
  (newMode) => {
    engine?.setViewMode(newMode);
    engine?.updateConfig({ viewMode: newMode });
  }
);

// Watch material
watch(
  () => store.activeMaterial,
  (mat) => {
    engine?.updateConfig({ material: mat });
  }
);

// Watch dimensions
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

// Watch loft toggle and settings
watch(
  [
    () => store.hasLoft,
    () => store.loftPlacement,
    () => store.selectedLoftSize,
    () => store.hasLoftStair,
    () => store.loftCount
  ],
  ([loft, placement, size, stair, count]) => {
    engine?.updateConfig({
      hasLoft: loft,
      loftPlacement: placement,
      loftAreaSqMeters: size,
      hasLoftStair: stair,
      loftCount: count
    });
  }
);

// Watch wall slots (doors, windows, gates placement)
watch(
  () => store.wallSlots,
  (slots) => {
    engine?.updateConfig({ wallSlots: slots });
  },
  { deep: true }
);

// Watch selected slot highlight
watch(
  () => store.selectedSlotId,
  (slotId) => {
    engine?.updateConfig({ selectedSlotId: slotId });
  }
);

onBeforeUnmount(() => {
  engine?.destroy();
});

defineExpose({
  getCanvas: () => engine?.getCanvas(),
  zoomIn: () => engine?.zoomIn(),
  zoomOut: () => engine?.zoomOut()
});
</script>
