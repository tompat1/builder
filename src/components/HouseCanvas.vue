<template>
  <div ref="canvasContainer" class="w-full h-full absolute inset-0 z-0"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { HouseScene } from '../three-engine/HouseScene';
import { useConfigStore } from '../store/useConfigStore';
import { noteTargetId } from '../notes/board';

const canvasContainer = ref<HTMLElement | null>(null);
const store = useConfigStore();
let engine: HouseScene | null = null;

function noteTargetIds() {
  if (!store.showNotes) return [];
  return [...new Set(
    store.notes
      .map((note) => noteTargetId(note.link))
      .filter((id): id is string => Boolean(id))
  )];
}

function syncNotePins() {
  engine?.setNotePins(
    store.showNotes
      ? store.notes.flatMap((note) => (note.pin ? [{ id: note.id, ...note.pin }] : []))
      : []
  );
}

onMounted(() => {
  if (canvasContainer.value) {
    engine = new HouseScene(canvasContainer.value, {
      widthMm: store.dimensions.width,
      depthMm: store.dimensions.depth,
      heightMm: store.dimensions.height,
      roofType: store.activeRoof as 'pulpettak' | 'sadeltak' | 'flackt',
      roofCovering: store.roofCovering,
      hasLoft: store.hasLoft,
      loftCount: store.loftCount,
      loftPlacement: store.loftPlacement,
      loftAreaSqMeters: store.selectedLoftSize,
      hasLoftStair: store.hasLoftStair,
      viewMode: store.viewMode,
      loftView: store.selectedCategory === 'loft',
      material: store.activeMaterial,
      panelOrientation: store.panelOrientation,
      panelWidthMm: store.claddingSizeId === '22x95'
        ? 95
        : store.claddingSizeId === '22x120'
          ? 120
          : store.claddingSizeId === '22x170'
            ? 170
            : 145,
      showDimensions: store.showDimensions,
      selectedSlotId: store.selectedSlotId,
      wallSlots: store.wallSlots
    });

    // Wire raycast clicks & hover from 3D scene to store
    engine.onPanelClick = (slotId) => {
      store.selectSlot(slotId);
      const slot = store.wallSlots[slotId];
      if (slot?.type === 'door') store.selectCategory('doors');
      else if (slot?.type === 'window') store.selectCategory('windows');
      else if (slot?.type === 'gate') store.selectCategory('gates');
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

    engine.onNoteAnchors = (anchors) => {
      store.setNoteAnchors(anchors);
    };
    engine.setNoteTargets(noteTargetIds());
    syncNotePins();

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
  [() => store.viewMode, () => store.selectedCategory],
  ([mode, category]) => {
    engine?.updateConfig({
      viewMode: mode,
      loftView: category === 'loft'
    });
  }
);

// Watch material and cladding boards
watch(
  [() => store.activeMaterial, () => store.panelOrientation, () => store.claddingSizeId],
  ([mat, orientation, sizeId]) => {
    const width = sizeId === '22x95' ? 95 : sizeId === '22x120' ? 120 : sizeId === '22x170' ? 170 : 145;
    engine?.updateConfig({
      material: mat,
      panelOrientation: orientation,
      panelWidthMm: width
    });
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

watch(
  () => store.roofCovering,
  (covering) => {
    engine?.updateConfig({ roofCovering: covering });
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

watch(
  () => noteTargetIds().join('|'),
  (key) => {
    engine?.setNoteTargets(key ? key.split('|') : []);
  }
);

watch(
  () => store.notes.map((note) => (note.pin ? `${note.id}:${note.pin.x},${note.pin.y},${note.pin.z}` : '')).join('|')
    + (store.showNotes ? ':on' : ':off'),
  () => syncNotePins()
);

// Watch selected slot highlight
watch(
  () => store.selectedSlotId,
  (slotId) => {
    engine?.setSelectedSlot(slotId);
  }
);

// Watch fullscreen mode
watch(
  () => store.isFullscreen,
  (isFull) => {
    if (isFull) {
      store.selectSlot(null);
    }
    engine?.updateConfig({ isFullscreen: isFull });
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }
);

onBeforeUnmount(() => {
  engine?.destroy();
});

defineExpose({
  getCanvas: () => engine?.getCanvas(),
  zoomIn: () => engine?.zoomIn(),
  zoomOut: () => engine?.zoomOut(),
  resetView: () => engine?.resetView()
});
</script>
