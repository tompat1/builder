<template>
  <div class="relative w-full h-full" :class="{ 'measuring-active': store.measuring }">
    <div
      ref="canvasContainer"
      class="w-full h-full absolute inset-0 z-0"
      :class="{ 'cursor-crosshair': store.measuring }"
    ></div>

    <div
      v-if="store.viewMode === 'utsida'"
      id="compass-rose"
      class="compass-rose pointer-events-none absolute left-3 top-24 z-20 md:left-6 md:top-28"
      role="img"
      :aria-label="t('tools.facing')"
    >
      <span
        v-for="mark in compassMarks"
        :key="mark.id"
        class="compass-mark"
        :class="{ 'compass-north': mark.id === 'n' }"
        :style="{ transform: `translate(-50%, -50%) translate(${mark.x}px, ${mark.y}px)` }"
      >{{ mark.letter }}</span>
      <span class="compass-needle" :style="{ transform: `rotate(${compassDial}deg)` }" aria-hidden="true"></span>
      <span class="compass-hub" aria-hidden="true"></span>
    </div>

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

    <!-- Framing Walkthrough Component Inspector Tooltip -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="store.framingWalkthrough && hoveredFramingItem"
        data-testid="framing-hover-tooltip"
        class="fixed z-50 pointer-events-none select-none max-w-xs sm:max-w-sm rounded-xl p-3 shadow-2xl backdrop-blur-xl border transition-all duration-75"
        :style="framingTooltipStyle"
        style="background: rgba(15, 23, 42, 0.90); border-color: rgba(245, 158, 11, 0.45); box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.55), 0 0 20px -2px rgba(245, 158, 11, 0.2);"
      >
        <div class="flex items-center gap-2 mb-1">
          <span
            v-if="hoveredFramingItem.step"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            {{ locale === 'en' ? `Step ${hoveredFramingItem.step}` : `Steg ${hoveredFramingItem.step}` }}
          </span>
          <span class="text-[11px] font-medium text-slate-400 truncate">
            {{ locale === 'en' ? hoveredFramingItem.nameSv : hoveredFramingItem.nameEn }}
          </span>
        </div>

        <h4 class="text-sm font-bold text-white tracking-tight leading-snug drop-shadow-sm">
          {{ locale === 'en' ? hoveredFramingItem.nameEn : hoveredFramingItem.nameSv }}
        </h4>

        <div
          v-if="hoveredFramingItem.dimension"
          class="mt-2 flex items-center gap-1.5 pt-1.5 border-t border-slate-700/60 text-xs font-medium text-amber-200/90"
        >
          <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span class="font-mono text-[11px] tracking-wide">{{ hoveredFramingItem.dimension }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { HouseScene, type FramingHoverItem } from '../three-engine/HouseScene';
import { useConfigStore } from '../store/useConfigStore';
import type { RoofId } from '../store/roof';
import { noteTargetId, noteVisibleInView } from '../notes/board';
import { fitRoom, innerHalf } from '../three-engine/roomWalls';
import { isLoftRoom, loftDeckBounds } from '../three-engine/loftLevel';
import { useLabels } from '../i18n';
import Cms from './Cms.vue';

const canvasContainer = ref<HTMLElement | null>(null);
const store = useConfigStore();
const { t, locale } = useLabels();
let engine: HouseScene | null = null;
const showDragHint = ref(false);
const compassDial = ref(0);
const hoveredFramingItem = ref<FramingHoverItem | null>(null);

const framingTooltipStyle = computed(() => {
  if (!hoveredFramingItem.value) return {};
  const { screenX, screenY } = hoveredFramingItem.value;
  const tooltipWidth = 280;
  const tooltipHeight = 90;
  const padding = 16;

  let left = screenX + 16;
  let top = screenY + 16;

  if (typeof window !== 'undefined') {
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = screenX - tooltipWidth - 16;
    }
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = screenY - tooltipHeight - 16;
    }
  }

  return {
    left: `${Math.max(padding, left)}px`,
    top: `${Math.max(padding, top)}px`
  };
});
const compassMarks = computed(() => {
  const turn = (compassDial.value * Math.PI) / 180;
  const radius = 26;
  return [
    { id: 'n', letter: t('tools.letterNorth'), angle: 0 },
    { id: 'e', letter: t('tools.letterEast'), angle: Math.PI / 2 },
    { id: 's', letter: t('tools.letterSouth'), angle: Math.PI },
    { id: 'w', letter: t('tools.letterWest'), angle: -Math.PI / 2 }
  ].map((mark) => {
    const angle = mark.angle + turn;
    return {
      id: mark.id,
      letter: mark.letter,
      x: Math.sin(angle) * radius,
      y: -Math.cos(angle) * radius
    };
  });
});

function noteTargetIds() {
  if (!store.showNotes) return [];
  return [...new Set(
    store.notes
      .filter((note) => noteVisibleInView(note, store.viewMode))
      .map((note) => noteTargetId(note.link))
      .filter((id): id is string => Boolean(id))
  )];
}

function syncNotePins() {
  engine?.setNotePins(
    store.showNotes
      ? store.notes
        .filter((note) => noteVisibleInView(note, store.viewMode))
        .flatMap((note) => (note.pin ? [{ id: note.id, ...note.pin }] : []))
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
      loftStairPosition: store.loftStairPosition,
      interactionMode: store.interactionMode,
      viewMode: store.viewMode,
      loftView: store.selectedCategory === 'loft',
      interiorView: store.selectedCategory === 'interior',
      roofView: store.selectedCategory === 'roof',
      material: store.activeMaterial,
      customHex: store.paintPreview ?? store.customPaint?.hex ?? null,
      panelOrientation: store.panelOrientation,
      verticalDoorBay: store.verticalDoorBay,
      cornerColor: store.cornerColor,
      cornerBoards: store.cornerBoards,
      panelWidthMm: store.claddingSizeId === '22x95'
        ? 95
        : store.claddingSizeId === '22x120'
          ? 120
          : store.claddingSizeId === '22x170'
            ? 170
            : 145,
      showDimensions: store.showDimensions,
      showInnerWalls: store.showInnerWalls,
      selectedSlotId: store.selectedSlotId,
      wallSlots: store.wallSlots,
      doorCanopy: store.doorCanopy,
      flushRoof: store.flushRoof,
      terraces: store.terraces.map((item) => ({ ...item })),
      concreteBase: store.selectedSizeId === 'size-paabyggnad',
      concreteWidthMm: store.concreteWidth,
      concreteDepthMm: store.concreteDepth,
      concreteHeightMm: store.concreteHeight,
      concreteWalls: store.concreteWalls.map((wall) => ({ ...wall })),
      concreteColor: store.concreteColor,
      framingWalkthrough: store.framingWalkthrough,
      framingStep: store.framingStep,
      roofFallAxis: store.selectedSizeId === 'size-stugan-v4' ? 'width' : 'depth',
      pulpetPitchDeg: store.selectedSizeId === 'size-stugan-v4' ? 10 : undefined,
      roofOverhangs:
        store.selectedSizeId === 'size-stugan-v4'
          ? { front: 2.0, back: 0.4, left: 0.35, right: 0.35 }
          : undefined
    });

    (window as any).__houseScene = engine;
    (window as any).__configStore = store;

    // Wire raycast clicks & hover from 3D scene to store
    engine.onPanelClick = (slotId) => {
      store.selectSlot(slotId);
      const slot = store.wallSlots[slotId];
      if (slot?.type === 'door' || slot?.type === 'gate') store.selectCategory('doors');
      else if (slot?.type === 'window') store.selectCategory('windows');
    };

    engine.onSlotMove = (fromSlotId, toSlotId) => {
      return store.moveSlotItem(fromSlotId, toSlotId);
    };

    engine.onDragStateChange = (val) => {
      store.setDragging(val);
    };

    engine.onPanelHover = (slotId, x, y) => {
      store.setHoveredSlot(slotId, slotId && x && y ? { x, y } : null);
    };

    engine.onFramingItemHover = (item) => {
      hoveredFramingItem.value = item;
    };

    engine.onSlotScreenPositionUpdate = (pos) => {
      store.setSlotScreenPosition(pos);
    };
    engine.onWindowFitOffers = (ids) => {
      store.setWindowFitOffers(ids);
    };
    engine.publishWindowFitOffers();

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
      store.placedRooms[id] = { type, w, d, x, y, z, wallsVisible: true };
      store.selectRoom(id);
      store.commitRooms();
    };
    engine.onRoomResize = (id, w, d, x, y, z) => {
      if (store.placedRooms[id]) {
        store.placedRooms[id].w = w;
        store.placedRooms[id].d = d;
        store.placedRooms[id].x = x;
        store.placedRooms[id].y = y;
        store.placedRooms[id].z = z;
        store.commitRooms();
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

    engine.onCompassDial = (degrees) => {
      compassDial.value = degrees;
    };
    engine.setDaylight(store.sunHour, store.facing, compassLabels());
    engine.setDefaultView(store.defaultView);
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

function compassLabels() {
  return {
    north: t('tools.letterNorth'),
    east: t('tools.letterEast'),
    south: t('tools.letterSouth'),
    west: t('tools.letterWest')
  };
}

function syncPlacedRooms() {
  if (!engine) return;
  engine.pruneRooms(Object.keys(store.placedRooms));
  const { hx, hz } = innerHalf(store.dimensions.width / 1000, store.dimensions.depth / 1000);
  const loftBounds = store.activeLoft && store.activeLoft !== 'none'
    ? loftDeckBounds(
        store.dimensions.width / 1000,
        store.dimensions.depth / 1000,
        store.selectedLoftSize ?? 10.95,
        store.loftPlacement ?? 'vanster',
        store.loftCount === 'tva',
        store.selectedSizeId === 'size-paabyggnad'
      )
    : null;
  for (const [id, info] of Object.entries(store.placedRooms)) {
    const bounds = isLoftRoom(info.y) && loftBounds
      ? { minX: loftBounds.minX, maxX: loftBounds.maxX, minZ: loftBounds.minZ, maxZ: loftBounds.maxZ }
      : undefined;
    const fitted = fitRoom({ x: info.x, z: info.z, w: info.w, d: info.d }, hx, hz, bounds);
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
    engine.updateRoomSize(id, info.type, fitted.w, fitted.d, fitted.x, info.y, fitted.z, info.wallsVisible);
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

watch(
  () => store.showInnerWalls,
  (show) => {
    engine?.updateConfig({ showInnerWalls: show });
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

watch(
  () => store.interiorFocusSignal,
  () => {
    engine?.reframeInterior();
  }
);

// Watch material and cladding boards
watch(
  [
    () => store.activeMaterial,
    () => store.paintPreview ?? store.customPaint?.hex ?? null,
    () => store.panelOrientation,
    () => store.verticalDoorBay,
    () => store.claddingSizeId,
    () => store.cornerColor,
    () => store.cornerBoards
  ],
  ([mat, customHex, orientation, verticalDoorBay, sizeId, cornerColor, cornerBoards]) => {
    const width = sizeId === '22x95' ? 95 : sizeId === '22x120' ? 120 : sizeId === '22x170' ? 170 : 145;
    engine?.updateConfig({
      material: mat,
      customHex,
      panelOrientation: orientation,
      verticalDoorBay,
      panelWidthMm: width,
      cornerColor,
      cornerBoards
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

watch(
  () => [
    store.selectedSizeId,
    store.concreteWidth,
    store.concreteDepth,
    store.concreteHeight,
    store.concreteWalls.map((wall) => `${wall.id}:${wall.axis}:${wall.offsetMm}`).join('|'),
    store.concreteColor
  ] as const,
  ([id, width, depth, height]) => {
    engine?.updateConfig({
      concreteBase: id === 'size-paabyggnad',
      concreteWidthMm: width,
      concreteDepthMm: depth,
      concreteHeightMm: height,
      concreteWalls: store.concreteWalls.map((wall) => ({ ...wall })),
      concreteColor: store.concreteColor,
      roofFallAxis: id === 'size-stugan-v4' ? 'width' : 'depth',
      pulpetPitchDeg: id === 'size-stugan-v4' ? 10 : undefined,
      roofOverhangs:
        id === 'size-stugan-v4'
          ? { front: 2.0, back: 0.4, left: 0.35, right: 0.35 }
          : undefined
    });
  }
);

// Watch roof type
watch(
  [() => store.activeRoof, () => store.flushRoof],
  ([roof, flushRoof]) => {
    engine?.updateConfig({
      roofType: roof as RoofId,
      flushRoof
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
    () => store.loftStairPosition,
    () => store.loftCount
  ],
  ([loft, placement, size, stair, stairType, stairPosition, count]) => {
    engine?.updateConfig({
      hasLoft: loft,
      loftPlacement: placement,
      loftAreaSqMeters: size,
      hasLoftStair: stair,
      loftStairType: stairType,
      loftStairPosition: stairPosition,
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
  () => [
    store.sunHour,
    store.facing,
    t('tools.letterNorth'),
    t('tools.letterEast'),
    t('tools.letterSouth'),
    t('tools.letterWest')
  ],
  () => {
    engine?.setDaylight(store.sunHour, store.facing, compassLabels());
  }
);

watch(
  () => store.defaultView,
  (view) => {
    engine?.setDefaultView(view);
  },
  { deep: true }
);

watch(
  [
    () => store.doorCanopy,
    () => store.terraces.map((item) => `${item.side}:${item.depth}:${item.span}:${item.roof ? 1 : 0}:${item.building ?? 'none'}:${item.hotTub ? 1 : 0}:${item.buildingPlacement ?? 'right'}:${item.buildingRoof ?? 'pulpet'}:${item.buildingTurn ?? 0}:${item.buildingColor ?? 'natural'}:${item.buildingDoor ?? 'glass'}:${item.buildingWindow ?? 'panorama'}:${item.buildingWindowPlacement ?? 'yard'}:${item.buildingSize ?? 'standard'}:${item.buildingWindowSize ?? 'standard'}`).join('|')
  ],
  () => {
    engine?.updateConfig({
      doorCanopy: store.doorCanopy,
      terraces: store.terraces.map((item) => ({ ...item }))
    });
  }
);

watch(
  () => noteTargetIds().join('|'),
  (key) => {
    engine?.setNoteTargets(key ? key.split('|') : []);
  }
);

watch(
  () => store.notes.map((note) => (note.pin ? `${note.id}:${note.pin.x},${note.pin.y},${note.pin.z},${note.pin.nx ?? ''},${note.pin.ny ?? ''},${note.pin.nz ?? ''},${note.pin.scope ?? ''}` : '')).join('|')
    + `:${store.viewMode}`
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

// Watch structural framing walkthrough & step
watch(
  [() => store.framingWalkthrough, () => store.framingStep],
  ([walkthrough, step]) => {
    if (!walkthrough) {
      hoveredFramingItem.value = null;
    }
    engine?.updateConfig({
      framingWalkthrough: walkthrough,
      framingStep: step
    });
    if (walkthrough) {
      engine?.frameFramingStep(step);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onRoomKey);
  hoveredFramingItem.value = null;
  engine?.destroy();
});

defineExpose({
  getCanvas: () => engine?.getCanvas(),
  zoomIn: () => engine?.zoomIn(),
  zoomOut: () => engine?.zoomOut(),
  resetView: () => engine?.resetView(),
  reframeInterior: () => engine?.reframeInterior(),
  frameFramingStep: (step: number) => engine?.frameFramingStep(step),
  markView: () => {
    const view = engine?.captureView();
    if (view) store.markDefaultView(view);
  }
});
</script>

<style scoped>
.compass-rose {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  border: 1.5px solid #173d35;
  background: rgb(245 243 236 / 0.94);
  box-shadow: 0 8px 18px rgb(23 61 53 / 0.12);
}

.compass-mark {
  position: absolute;
  left: 50%;
  top: 50%;
  color: #173d35;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.compass-north {
  color: #ff5a00;
}

.compass-needle {
  position: absolute;
  left: 50%;
  top: calc(50% - 18px);
  width: 2px;
  height: 18px;
  margin-left: -1px;
  border-radius: 1px;
  background: #ff5a00;
  transform-origin: center bottom;
}

.compass-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 999px;
  background: #173d35;
}

.measuring-active,
.measuring-active :deep(canvas) {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 3v18M3 12h18' stroke='%23ffffff' stroke-width='3.5' stroke-linecap='square'/%3E%3Cpath d='M12 3v18M3 12h18' stroke='%230f172a' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E") 12 12, crosshair !important;
}
</style>
