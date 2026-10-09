<template>
  <div class="relative w-full h-full">
    <div ref="canvasContainer" class="w-full h-full absolute inset-0 z-0"></div>

    <!-- Drag to orbit hint -->
    <transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-500 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showDragHint"
        class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
      >
        <div class="flex items-center gap-2.5 bg-ivory/95 backdrop-blur-md text-slate-700 px-4 py-2.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-slate-200/60">
          <svg class="w-[18px] h-[18px] text-slate-500 animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <!-- Top Right -->
            <path d="M12 3a9 9 0 0 1 7.7 4.3" />
            <polyline points="16 7.3 19.7 7.3 19.7 3.5" />
            <!-- Bottom Right -->
            <path d="M21 12a9 9 0 0 1-4.3 7.7" />
            <polyline points="16.7 16 16.7 19.7 20.5 19.7" />
            <!-- Bottom Left -->
            <path d="M12 21a9 9 0 0 1-7.7-4.3" />
            <polyline points="8 16.7 4.3 16.7 4.3 20.5" />
            <!-- Top Left -->
            <path d="M3 12a9 9 0 0 1 4.3-7.7" />
            <polyline points="7.3 8 7.3 4.3 3.5 4.3" />
          </svg>
          <span class="text-sm font-semibold tracking-wide"><Cms k="canvas.orbit" fallback="Drag to orbit" /></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { HouseScene } from '../three-engine/HouseScene';
import { useConfigStore } from '../store/useConfigStore';
import type { RoofId } from '../store/roof';
import { noteTargetId } from '../notes/board';
import { fitRoom, innerHalf } from '../three-engine/roomWalls';
import Cms from './Cms.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const store = useConfigStore();
let engine: HouseScene | null = null;
const showDragHint = ref(false);

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
  // Check if this is the first time visiting the canvas
  if (typeof window !== 'undefined' && !localStorage.getItem('builder_has_orbited')) {
    showDragHint.value = true;
  }

  function handleInteraction() {
    if (showDragHint.value) {
      showDragHint.value = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('builder_has_orbited', '1');
      }
    }
  }

  if (canvasContainer.value) {
    canvasContainer.value.addEventListener('mousedown', handleInteraction, { once: true });
    canvasContainer.value.addEventListener('touchstart', handleInteraction, { once: true });

    engine = new HouseScene(canvasContainer.value, {
      widthMm: store.dimensions.width,
      depthMm: store.dimensions.depth,
      heightMm: store.dimensions.height,
      roofType: store.activeRoof as RoofId,
      roofCovering: store.roofCovering,
      hasLoft: store.hasLoft,
      loftCount: store.loftCount,
      loftPlacement: store.loftPlacement,
      loftAreaSqMeters: store.selectedLoftSize,
      hasLoftStair: store.hasLoftStair,
      loftStairType: store.loftStairType,
      interactionMode: store.interactionMode,
      viewMode: store.viewMode,
      loftView: store.selectedCategory === 'loft',
      interiorView: store.selectedCategory === 'interior',
      roofView: store.selectedCategory === 'roof',
      material: store.activeMaterial,
      customHex: store.paintPreview ?? store.customPaint?.hex ?? null,
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
      wallSlots: store.wallSlots,
      doorCanopy: store.doorCanopy,
      terrace: store.terrace,
      terraceCeiling: store.terraceCeiling,
      bigTerrace: store.bigTerrace,
      terraceSide: store.terraceSide
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
    engine.onNotePlanes = (camera, planes) => {
      store.setNotePlanes(camera, planes);
    };

    engine.onMeasurePick = (point) => {
      store.placeMeasurePoint(point);
    };
    engine.onMeasureCursor = (point) => {
      store.setMeasureCursor(point);
    };
    engine.onMeasureScreen = (screen) => {
      store.setMeasureScreen(screen);
    };
    engine.onRoomPlaced = (id, type, w, d, x, y, z) => {
      store.placedRooms[id] = { type, w, d, x, y, z };
      store.selectRoom(id);
    };
    engine.onRoomResize = (id, w, d, x, y, z) => {
      if (store.placedRooms[id]) {
        store.placedRooms[id].w = w;
        store.placedRooms[id].d = d;
        store.placedRooms[id].x = x;
        store.placedRooms[id].y = y;
        store.placedRooms[id].z = z;
      }
    };
    engine.onRoomSelect = (id) => {
      store.selectRoom(id);
    };
    engine.onInteractionComplete = () => {
      store.setInteractionMode('default');
    };
    engine.setNoteTargets(noteTargetIds());
    syncNotePins();

    if (typeof window !== 'undefined') {
      (window as any).__houseScene = engine;
    }
    syncPlacedRooms();
    window.addEventListener('keydown', onRoomKey);
  }
});

function onRoomKey(event: KeyboardEvent) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return;
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
  if (store.selectedCategory !== 'interior' || !store.selectedRoomId) return;
  event.preventDefault();
  store.removePlacedRoom(store.selectedRoomId);
}

function syncPlacedRooms() {
  if (!engine) return;
  engine.pruneRooms(Object.keys(store.placedRooms));
  const { hx, hz } = innerHalf(store.dimensions.width / 1000, store.dimensions.depth / 1000);
  for (const [id, info] of Object.entries(store.placedRooms)) {
    const fitted = fitRoom({ x: info.x, z: info.z, w: info.w, d: info.d }, hx, hz);
    if (
      Math.abs(fitted.w - info.w) > 1e-4
      || Math.abs(fitted.d - info.d) > 1e-4
      || Math.abs(fitted.x - info.x) > 1e-4
      || Math.abs(fitted.z - info.z) > 1e-4
    ) {
      info.w = fitted.w;
      info.d = fitted.d;
      info.x = fitted.x;
      info.z = fitted.z;
    }
    engine.updateRoomSize(id, info.type, fitted.w, fitted.d, fitted.x, info.y, fitted.z);
  }
}

// Watch show dimensions toggle
watch(
  () => [
    store.measuring,
    store.measureStart,
    store.measureEnd,
    store.measureCursor
  ],
  () => {
    const start = store.measureStart;
    const end = store.measureEnd ?? (store.measuring ? store.measureCursor : null);
    engine?.setMeasureMode(store.measuring, Boolean(start && store.measureEnd));
    engine?.setMeasureLine(start, start && end ? end : null);
  }
);

watch(
  () => store.showDimensions,
  (show) => {
    engine?.updateConfig({ showDimensions: show });
  }
);

// Watch view mode and interaction mode
watch(
  [() => store.viewMode, () => store.selectedCategory, () => store.interactionMode],
  ([mode, category, interaction], [, previousCategory]) => {
    engine?.updateConfig({
      viewMode: mode,
      interactionMode: interaction,
      loftView: category === 'loft',
      interiorView: category === 'interior',
      roofView: category === 'roof'
    });
    if (
      previousCategory !== category
      && (category === 'doors' || category === 'windows' || category === 'gates')
    ) {
      engine?.resetView();
    }
  }
);

watch(
  () => store.generateElectricalSignal,
  () => {
    engine?.generateStandardElectrical();
  }
);

// Watch material and cladding boards
watch(
  [() => store.activeMaterial, () => store.paintPreview ?? store.customPaint?.hex ?? null, () => store.panelOrientation, () => store.claddingSizeId],
  ([mat, customHex, orientation, sizeId]) => {
    const width = sizeId === '22x95' ? 95 : sizeId === '22x120' ? 120 : sizeId === '22x170' ? 170 : 145;
    engine?.updateConfig({
      material: mat,
      customHex,
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
      roofType: roof as RoofId
    });
  }
);

watch(
  () => store.roofCovering,
  (covering) => {
    engine?.updateConfig({ roofCovering: covering });
  }
);

watch(() => store.placedRooms, syncPlacedRooms, { deep: true });

// Watch loft toggle and settings
watch(
  [
    () => store.hasLoft,
    () => store.loftPlacement,
    () => store.selectedLoftSize,
    () => store.hasLoftStair,
    () => store.loftStairType,
    () => store.loftCount
  ],
  ([loft, placement, size, stair, stairType, count]) => {
    engine?.updateConfig({
      hasLoft: loft,
      loftPlacement: placement,
      loftAreaSqMeters: size,
      hasLoftStair: stair,
      loftStairType: stairType,
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
  [
    () => store.doorCanopy,
    () => store.terrace,
    () => store.terraceCeiling,
    () => store.bigTerrace,
    () => store.terraceSide
  ],
  ([doorCanopy, terrace, terraceCeiling, bigTerrace, terraceSide]) => {
    engine?.updateConfig({ doorCanopy, terrace, terraceCeiling, bigTerrace, terraceSide });
  }
);

watch(
  () => noteTargetIds().join('|'),
  (key) => {
    engine?.setNoteTargets(key ? key.split('|') : []);
  }
);

watch(
  () => store.notes.map((note) => (note.pin ? `${note.id}:${note.pin.x},${note.pin.y},${note.pin.z},${note.pin.nx ?? ''},${note.pin.ny ?? ''},${note.pin.nz ?? ''}` : '')).join('|')
    + (store.showNotes ? ':on' : ':off'),
  () => syncNotePins()
);

watch(
  () => store.selectedRoomId,
  (id) => {
    engine?.setSelectedRoom(id);
  }
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
  window.removeEventListener('keydown', onRoomKey);
  engine?.destroy();
});

defineExpose({
  getCanvas: () => engine?.getCanvas(),
  zoomIn: () => engine?.zoomIn(),
  zoomOut: () => engine?.zoomOut(),
  resetView: () => engine?.resetView()
});
</script>
