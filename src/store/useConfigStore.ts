import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import {
  acceptNotes,
  freshNote,
  linkFromValue,
  NOTE_LIMIT,
  parseNotePin,
  type HouseNote
} from '../notes/board';
import { nextMeasure, type MeasurePoint } from '../measure/length';
import {
  normalizeHex,
  paintTitle,
  parseCustomPaint,
  parseSavedPaints,
  SAVED_PAINT_LIMIT,
  type CustomPaint,
  type SavedPaint
} from '../color/paint';
import { eaveLiftMm, gablePitchDegrees } from './roof';
import { floorAreaSqMeters } from './area';

export type ViewMode = 'utsida' | 'insida' | 'blueprint';
export type CategoryKey = 'size' | 'roof' | 'loft' | 'interior' | 'doors' | 'windows' | 'gates' | 'extras';
export type MaterialKey = 'wood' | 'falurod' | 'grey' | 'white' | 'black';
export type PanelOrientation = 'staende' | 'liggande';
export type InteractionMode =
  | 'default'
  | 'draw_wall'
  | 'place_utility'
  | 'place_room_bathroom'
  | 'place_room_bedroom'
  | 'place_room_kitchen'
  | 'place_room_storage';

/** Common Swedish exterior boards. 22×145 mm is the usual standard. */
export const CLADDING_SIZES = [
  { id: '22x95', thickness: 22, width: 95 },
  { id: '22x120', thickness: 22, width: 120 },
  { id: '22x145', thickness: 22, width: 145 },
  { id: '22x170', thickness: 22, width: 170 }
] as const;

export type CladdingSizeId = (typeof CLADDING_SIZES)[number]['id'];

export interface MaterialOption {
  id: MaterialKey;
  name: string;
  badge: string;
  colorHex: string;
  desc: string;
  priceDelta: number;
}

export const MATERIAL_OPTIONS: MaterialOption[] = [
  {
    id: 'wood',
    name: 'Obehandlad Gran',
    badge: 'Standard',
    colorHex: '#e8d8be',
    desc: 'Naturlig svensk granpanel med vacker synlig träådring.',
    priceDelta: 0
  },
  {
    id: 'falurod',
    name: 'Falu Rödfärg',
    badge: 'Klassisk',
    colorHex: '#8b2522',
    desc: 'Traditionell svensk slamfärg med vacker helmatt lyster.',
    priceDelta: 5400
  },
  {
    id: 'grey',
    name: 'Skandinavisk Grå',
    badge: 'Populär',
    colorHex: '#64748b',
    desc: 'Modern dämpad grå lasyr som harmonierar med naturen.',
    priceDelta: 5900
  },
  {
    id: 'white',
    name: 'Tidlös Vit',
    badge: 'Klassisk',
    colorHex: '#f8fafc',
    desc: 'Ljus och välkomnande täckmålad fasadpanel.',
    priceDelta: 6200
  },
  {
    id: 'black',
    name: 'Arkitektsvart',
    badge: 'Modern',
    colorHex: '#1e293b',
    desc: 'Stilren svart träpanel för samtida nordisk arkitektur.',
    priceDelta: 6800
  }
];

export interface SizeOption {
  id: string;
  name: string;
  badge: string;
  width: number;
  depth: number;
  height: number;
  areaSqMeters: number;
  basePrice: number;
  desc: string;
}

export interface OptionItem {
  id: string;
  name: string;
  desc: string;
  priceDelta: number;
  spec?: string;
  imageUrl?: string;
  doorType?: 'single' | 'double' | 'sliding';
}

export const SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'size-15',
    name: 'Friggebod 15 m²',
    badge: 'Bygglovsfritt',
    width: 4800,
    depth: 3125,
    height: 2800,
    areaSqMeters: 15.0,
    basePrice: 68900,
    desc: '4800 × 3125 mm. Optimal gäststuga eller hemmakontor.'
  },
  {
    id: 'size-25',
    name: 'Attefall 25 m²',
    badge: 'Bygganmälan',
    width: 5800,
    depth: 4310,
    height: 3000,
    areaSqMeters: 25.0,
    basePrice: 89500,
    desc: '5800 × 4310 mm. Populär storlek för året-runt-boende.'
  },
  {
    id: 'size-30',
    name: 'Attefallshus Max 30 m²',
    badge: 'Mest vald',
    width: 6040,
    depth: 3503,
    height: 5000,
    areaSqMeters: 29.9,
    basePrice: 103634,
    desc: '6040 × 3503 mm. Maximal bygglovsfri boendeyta.'
  },
  {
    id: 'size-40',
    name: 'Fritidshus 40 m²',
    badge: 'Större yta',
    width: 8000,
    depth: 5000,
    height: 3600,
    areaSqMeters: 40.0,
    basePrice: 145000,
    desc: '8000 × 5000 mm. Rymligt fritidshus med generösa rum.'
  }
];

/** High-end wall height cannot exceed 5 m. Width and length stay within a buildable range. */
export const BUILDING_LIMITS = {
  width: { min: 3600, max: 12000 },
  depth: { min: 2500, max: 10000 },
  height: { min: 2400, max: 5000 }
} as const;

export type BuildingAxis = keyof typeof BUILDING_LIMITS;

/** Mono-pitch roof. Kept in the 10–15° band so the high eave still drains. */
export const PULPET_PITCH_DEG = 12;

export type RoofCovering = 'felt' | 'metal' | 'tiles' | 'shingles';

export const ROOF_COVERINGS: { id: RoofCovering; priceDelta: number }[] = [
  { id: 'felt', priceDelta: 0 },
  { id: 'metal', priceDelta: 6400 },
  { id: 'shingles', priceDelta: 5200 },
  { id: 'tiles', priceDelta: 9800 }
];

export const ROOF_OPTIONS: OptionItem[] = [
  {
    id: 'pulpettak',
    name: 'Pulpettak 12°',
    desc: 'Enkelt takfall, modernt uttryck och god vattenavrinning.',
    spec: 'Papp / Plåt, 12° lutning',
    priceDelta: 0
  },
  {
    id: 'sadeltak',
    name: 'Sadeltak 22°',
    desc: 'Klassisk svensk byggtradition med två symmetriska takfall.',
    spec: 'Betongpannor / Plåt, 22° lutning',
    priceDelta: 14800
  },
  {
    id: 'sadeltak14',
    name: 'Sadeltak med extra takhöjd',
    desc: 'Flackare sadeltak med takfoten lyft 400 mm, så rummet får mer ståhöjd.',
    spec: '14° lutning, +400 mm takhöjd',
    priceDelta: 18600
  },
  {
    id: 'flackt',
    name: 'Flackt Tak',
    desc: 'Modern kubisk funkis med diskret integrerat krön.',
    spec: 'EPDM gummiduk, 2° dold avrinning',
    priceDelta: 8200
  }
];

export type LoftCount = 'ett' | 'tva';
export type LoftPlacement = 'vanster' | 'hoger';
export type LoftTab = 'planlosning' | 'golv';

export interface LoftSizeItem {
  areaSqMeters: number;
  label: string;
  descId: string;
  desc: string;
  priceDelta: number;
}

export const LOFT_OPTIONS: OptionItem[] = [
  {
    id: 'none',
    name: 'Utan loft',
    desc: 'Full rymd öppet upp i nock för maximal luftighet.',
    spec: 'Invändig takhöjd upp till 3,5 m',
    priceDelta: 0
  },
  {
    id: 'sleeping',
    name: 'Sovloft med trappa',
    desc: 'Inbyggt loftplan med trappa i massiv furu och skyddsräcke.',
    spec: '+8,5 m² golvyta, bärighet 200 kg/m²',
    priceDelta: 21500
  },
  {
    id: 'half',
    name: 'Halvloft / Förvaring',
    desc: 'Kompakt förvaringsloft med fällbar inspektionsstege.',
    spec: '+4,5 m² stuvutrymme',
    priceDelta: 12900
  }
];

export const DOORS_OPTIONS: OptionItem[] = [
  {
    id: 'STEHAG',
    name: 'STEHAG',
    desc: 'Ytterdörr Stabil, slät m. klarglas, 10x21',
    spec: 'Mått 10×21, U-värde 0.8',
    priceDelta: 0,
    doorType: 'single'
  },
  {
    id: 'FLENINGE',
    name: 'FLENINGE',
    desc: 'Ytterdörr Stabil, spårfräst 6 rutor spröjs, 10x21',
    spec: 'Mått 10×21, 3-glas isoler',
    priceDelta: 2400,
    doorType: 'single'
  },
  {
    id: 'SVANSHALL',
    name: 'SVANSHALL',
    desc: 'Ytterdörr Stabil, helglasad pardörr, 16x21',
    spec: 'Mått 16×21, laminerat säkerhetsglas',
    priceDelta: 9800,
    doorType: 'double'
  },
  {
    id: 'LERVIK',
    name: 'LERVIK',
    desc: 'Ytterdörr Stabil, slät m. vertikalt glas, 10x21',
    spec: 'Mått 10×21, dold gångjärnskonstruktion',
    priceDelta: 3200,
    doorType: 'single'
  },
  {
    id: 'SKJUTDORR',
    name: 'SKANO',
    desc: 'Skjutdörr helglasad i aluminium, 20x21',
    spec: 'Mått 20×21, 3-glas isoler',
    priceDelta: 14500,
    doorType: 'sliding'
  }
];

export const WINDOWS_OPTIONS: OptionItem[] = [
  {
    id: 'standard-single',
    name: '3-glas Vridfönster',
    desc: 'Praktiskt vridfönster som putsas inifrån med barnspärr.',
    spec: 'Mått 10×12, U-värde 1.0',
    priceDelta: 0
  },
  {
    id: 'panorama',
    name: 'Fast Panoramafönster',
    desc: 'Golv-till-tak glasparti för spektakulärt ljusinsläpp.',
    spec: 'Mått 16×21, 3-glas energiglas',
    priceDelta: 7400
  },
  {
    id: 'sprojat',
    name: 'Spröjsat 2-lufts',
    desc: 'Klassiska vackra sidohängda fönster med träspröjs.',
    spec: 'Mått 12×12, äkta träprofil',
    priceDelta: 3900
  },
  {
    id: 'frost',
    name: 'Vädringsfönster',
    desc: 'Mindre öppningsbart fönster med frostat insynsskydd.',
    spec: 'Mått 6×6, frostat isolerglas',
    priceDelta: 1800
  }
];

export const GATES_OPTIONS: OptionItem[] = [
  {
    id: 'none',
    name: 'Utan port',
    desc: 'Hel och isolerad fasadpanel utan garageport.',
    spec: 'Stående träpanel, grundmålad vit',
    priceDelta: 0
  },
  {
    id: 'wood-slag',
    name: 'Slagport Trä',
    desc: 'Klassiska isolerade pardörrar i svensk furupanel.',
    spec: 'Mått 24×20, cylinderlås ingår',
    priceDelta: 14200
  },
  {
    id: 'overhead',
    name: 'Takskjutport Modern Spegel',
    desc: 'Isolerad takskjutport med spegelmönster.',
    spec: 'Mått 24×20, 40mm polyuretanisolering',
    priceDelta: 23600
  },
  {
    id: 'overhead-flat',
    name: 'Takskjutport Modern Slät',
    desc: 'Slät modern takskjutport vit.',
    spec: 'Mått 24×20, 40mm polyuretanisolering',
    priceDelta: 24800
  }
];

export interface WallSlot {
  id: string;
  wall: 'front' | 'back' | 'left' | 'right';
  index: number;
  type: 'empty' | 'door' | 'window' | 'gate';
  itemId?: string;
  canAcceptDoor?: boolean;
  isUpper?: boolean;
}

const PANEL_COUNTS = { front: 4, back: 4, left: 3, right: 3 } as const;

/** Lower bay plus a separate upper panel above the mid-rail. Upper panels take windows only. */
export function createWallSlots(): Record<string, WallSlot> {
  const slots: Record<string, WallSlot> = {};
  (Object.keys(PANEL_COUNTS) as (keyof typeof PANEL_COUNTS)[]).forEach((wall) => {
    for (let index = 0; index < PANEL_COUNTS[wall]; index += 1) {
      const id = `${wall}-${index}`;
      slots[id] = { id, wall, index, type: 'empty', canAcceptDoor: true };
      const upperId = `${id}u`;
      slots[upperId] = {
        id: upperId,
        wall,
        index,
        type: 'empty',
        canAcceptDoor: false,
        isUpper: true
      };
    }
  });
  slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'STEHAG', canAcceptDoor: true };
  for (let index = 0; index < PANEL_COUNTS.front; index += 1) {
    const upperId = `front-${index}u`;
    slots[upperId] = { ...slots[upperId], type: 'window', itemId: 'standard-single' };
  }
  return slots;
}

function mergeWallSlots(saved: Record<string, WallSlot> | undefined): Record<string, WallSlot> {
  const slots = createWallSlots();
  if (!saved) return slots;
  for (const [id, slot] of Object.entries(saved)) {
    if (!slot || typeof slot !== 'object') continue;
    if (slot.isUpper && !id.endsWith('u')) {
      const upperId = `${id}u`;
      if (slots[upperId] && slot.type === 'window') {
        slots[upperId] = {
          ...slots[upperId],
          type: 'window',
          itemId: slot.itemId,
          isUpper: true,
          canAcceptDoor: false
        };
      }
      slots[id] = {
        ...slots[id],
        type: slot.type === 'window' ? 'empty' : slot.type,
        itemId: slot.type === 'window' ? undefined : slot.itemId,
        isUpper: false,
        canAcceptDoor: true
      };
      continue;
    }
    const upper = id.endsWith('u') || slot.isUpper === true;
    slots[id] = {
      ...slot,
      id,
      isUpper: upper,
      canAcceptDoor: upper ? false : slot.canAcceptDoor !== false
    };
  }
  return slots;
}

export const useConfigStore = defineStore('config', () => {
  const viewMode = ref<ViewMode>('utsida');
  const interactionMode = ref<InteractionMode>('default');
  const generateElectricalSignal = ref(0);
  const selectedCategory = ref<CategoryKey>('size');
  const activeMaterial = ref<MaterialKey>('wood');
  const savedPaints = ref<SavedPaint[]>([]);
  const activePaintId = ref<string | null>(null);
  const customPaint = computed(() => savedPaints.value.find((paint) => paint.id === activePaintId.value) ?? null);
  const paintPreview = ref<string | null>(null);
  const panelOrientation = ref<PanelOrientation>('staende');
  const claddingSizeId = ref<CladdingSizeId>('22x145');
  const isFullscreen = ref<boolean>(false);
  const showDimensions = ref<boolean>(true);
  const selectedSlotId = ref<string | null>(null);
  const hoveredSlotId = ref<string | null>(null);
  const hoveredSlotPos = ref<{ x: number; y: number } | null>(null);
  const slotScreenPosition = ref<{ x: number; y: number; visible: boolean } | null>(null);
  const dimensionLabels = reactive<Record<string, { x: number; y: number; visible: boolean }>>({
    width: { x: 0, y: 0, visible: false },
    frontHeight: { x: 0, y: 0, visible: false },
    rearHeight: { x: 0, y: 0, visible: false },
    pitch: { x: 0, y: 0, visible: false },
    ceiling: { x: 0, y: 0, visible: false }
  });

  const selectedSizeId = ref<string>('size-30');
  const startingSize = SIZE_OPTIONS.find((size) => size.id === 'size-30') ?? SIZE_OPTIONS[2];
  const buildingWidth = ref(startingSize.width);
  const buildingDepth = ref(startingSize.depth);
  const buildingHeight = ref(startingSize.height);
  const activeRoof = ref<string>('pulpettak');
  const roofCovering = ref<RoofCovering>('felt');
  const activeLoft = ref<string>('none');
  const hasLoft = computed(() => activeLoft.value !== 'none');
  const loftCount = ref<LoftCount>('ett');
  const loftPlacement = ref<LoftPlacement>('vanster');
  const selectedLoftSize = ref<number>(10.95);
  const hasLoftStair = ref<boolean>(true);
  const loftTab = ref<LoftTab>('planlosning');
  const activeDoor = ref<string>('STEHAG');
  const activeWindow = ref<string>('standard-single');
  const activeGate = ref<string>('none');

  // Wall panel modular slots (matching Skånska Byggvaror reference layout)
  const wallSlots = ref<Record<string, WallSlot>>(createWallSlots());

  const notes = ref<HouseNote[]>([]);
  const showNotes = ref(false);
  const activeNoteId = ref<string | null>(null);
  const noteAnchors = ref<Record<string, { x: number; y: number; visible: boolean }>>({});
  const noteCamera = ref('');
  const notePlanes = ref<Record<string, { transform: string; visible: boolean }>>({});

  // History stacks for Undo / Redo
  const history = ref<string[]>([]);
  const historyIndex = ref<number>(-1);

  function houseState() {
    return {
      selectedSizeId: selectedSizeId.value,
      buildingWidth: buildingWidth.value,
      buildingDepth: buildingDepth.value,
      buildingHeight: buildingHeight.value,
      activeRoof: activeRoof.value,
      roofCovering: roofCovering.value,
      activeLoft: activeLoft.value,
      hasLoft: hasLoft.value,
      loftCount: loftCount.value,
      loftPlacement: loftPlacement.value,
      selectedLoftSize: selectedLoftSize.value,
      hasLoftStair: hasLoftStair.value,
      activeDoor: activeDoor.value,
      activeWindow: activeWindow.value,
      activeGate: activeGate.value,
      activeMaterial: activeMaterial.value,
      savedPaints: savedPaints.value,
      activePaintId: activePaintId.value,
      customPaint: customPaint.value,
      panelOrientation: panelOrientation.value,
      claddingSizeId: claddingSizeId.value,
      wallSlots: wallSlots.value,
      notes: notes.value
    };
  }

  function saveSnapshot() {
    const snapshot = JSON.stringify(houseState());
    // Truncate forward history if we were in the middle
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(snapshot);
    historyIndex.value = history.value.length - 1;
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      applySnapshot(history.value[historyIndex.value]);
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      applySnapshot(history.value[historyIndex.value]);
    }
  }

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  function applySnapshot(snapshotStr: string) {
    try {
      const data = JSON.parse(snapshotStr);
      selectedSizeId.value = data.selectedSizeId;
      const preset = SIZE_OPTIONS.find((size) => size.id === data.selectedSizeId) ?? SIZE_OPTIONS[2];
      buildingWidth.value = clampMeasure('width', data.buildingWidth ?? preset.width);
      buildingDepth.value = clampMeasure('depth', data.buildingDepth ?? preset.depth);
      buildingHeight.value = clampMeasure('height', data.buildingHeight ?? preset.height);
      activeRoof.value = data.activeRoof;
      if (ROOF_COVERINGS.some((item) => item.id === data.roofCovering)) {
        roofCovering.value = data.roofCovering;
      }
      if (typeof data.hasLoft === 'boolean') {
        activeLoft.value = data.hasLoft
          ? (data.activeLoft && data.activeLoft !== 'none' ? data.activeLoft : 'sleeping')
          : 'none';
      } else if (data.activeLoft !== undefined) {
        activeLoft.value = data.activeLoft;
      }
      if (data.loftCount) loftCount.value = data.loftCount;
      if (data.loftPlacement) loftPlacement.value = data.loftPlacement;
      if (data.selectedLoftSize) selectedLoftSize.value = data.selectedLoftSize;
      if (data.hasLoftStair !== undefined) hasLoftStair.value = data.hasLoftStair;
      if (data.activeDoor) activeDoor.value = data.activeDoor;
      if (data.activeWindow) activeWindow.value = data.activeWindow;
      if (data.activeGate) activeGate.value = data.activeGate;
      activeMaterial.value = MATERIAL_OPTIONS.some((item) => item.id === data.activeMaterial)
        ? data.activeMaterial
        : 'wood';
      savedPaints.value = parseSavedPaints(
        data.savedPaints,
        data.savedPaints === undefined ? data.customPaint : undefined
      );
      const requested = typeof data.activePaintId === 'string' ? data.activePaintId : '';
      const parsedActive = parseCustomPaint(data.customPaint);
      const fromId = savedPaints.value.find((paint) => paint.id === requested);
      const fromPaint = parsedActive
        ? savedPaints.value.find((paint) => paint.hex === parsedActive.hex && paint.ral === parsedActive.ral && paint.pantone === parsedActive.pantone)
        : undefined;
      activePaintId.value = (fromId ?? fromPaint)?.id ?? null;
      panelOrientation.value = data.panelOrientation === 'liggande' ? 'liggande' : 'staende';
      claddingSizeId.value = CLADDING_SIZES.some((size) => size.id === data.claddingSizeId)
        ? data.claddingSizeId
        : '22x145';
      wallSlots.value = mergeWallSlots(data.wallSlots);
      notes.value = acceptNotes(data.notes);
      if (notes.value.length) showNotes.value = true;
    } catch {
      // ignore parse error
    }
  }

  function exportHouse() {
    return houseState();
  }

  function importHouse(data: unknown) {
    applySnapshot(JSON.stringify(data));
    const snapshot = JSON.stringify(houseState());
    history.value = [snapshot];
    historyIndex.value = 0;
  }

  // Initial snapshot
  saveSnapshot();

  const currentSize = computed(() => {
    return SIZE_OPTIONS.find((s) => s.id === selectedSizeId.value) ?? SIZE_OPTIONS[2];
  });

  const currentMaterial = computed(() => {
    if (customPaint.value) {
      return {
        id: 'custom' as const,
        name: paintTitle(customPaint.value),
        badge: '',
        colorHex: customPaint.value.hex,
        desc: '',
        priceDelta: 0
      };
    }
    return MATERIAL_OPTIONS.find((m) => m.id === activeMaterial.value) ?? MATERIAL_OPTIONS[0];
  });

  const dimensions = computed(() => {
    const width = buildingWidth.value;
    const depth = buildingDepth.value;
    return {
      width,
      depth,
      height: buildingHeight.value,
      areaSqMeters: floorAreaSqMeters(width, depth)
    };
  });

  const roofPitchAngle = computed(() => {
    switch (activeRoof.value) {
      case 'pulpettak':
        return PULPET_PITCH_DEG;
      case 'sadeltak':
      case 'sadeltak14':
        return gablePitchDegrees(activeRoof.value);
      case 'flackt':
        return 2;
      default:
        return PULPET_PITCH_DEG;
    }
  });

  /** Wall top the roof sits on. The extra-height gable lifts the plate 400 mm. */
  const eaveHeight = computed(() => dimensions.value.height + eaveLiftMm(activeRoof.value));

  const rearHeight = computed(() => {
    if (activeRoof.value === 'pulpettak') {
      const drop = Math.round(dimensions.value.depth * Math.tan((roofPitchAngle.value * Math.PI) / 180));
      return Math.max(dimensions.value.height - drop, 2400);
    }
    return dimensions.value.height;
  });

  const innerCeilingHeight = computed(() => {
    const base = viewMode.value === 'insida' ? 2595 : 2144;
    return base + eaveLiftMm(activeRoof.value);
  });

  const availableLoftSizes = computed<LoftSizeItem[]>(() => {
    if (selectedSizeId.value === 'size-30') {
      return [
        { areaSqMeters: 10.95, label: '10,95 m²', descId: 'compact-storage', desc: 'Kompakt sovloft / förvaring', priceDelta: 18500 },
        { areaSqMeters: 16.43, label: '16,43 m²', descId: 'generous', desc: 'Generöst sovloft', priceDelta: 24900 },
        { areaSqMeters: 21.9, label: '21,9 m²', descId: 'large-room', desc: 'Stort allrum / dubbelloft', priceDelta: 31200 },
        { areaSqMeters: 27.38, label: '27,38 m²', descId: 'full-floor', desc: 'Hela golvytan / fullt loftplan', priceDelta: 37800 }
      ];
    } else if (selectedSizeId.value === 'size-25') {
      return [
        { areaSqMeters: 8.21, label: '8,21 m²', descId: 'compact', desc: 'Kompakt sovloft', priceDelta: 16200 },
        { areaSqMeters: 12.32, label: '12,32 m²', descId: 'standard', desc: 'Standardloft', priceDelta: 21500 },
        { areaSqMeters: 16.4, label: '16,4 m²', descId: 'large', desc: 'Stort sovloft', priceDelta: 26800 },
        { areaSqMeters: 22.8, label: '22,8 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 32500 }
      ];
    } else if (selectedSizeId.value === 'size-15') {
      return [
        { areaSqMeters: 5.5, label: '5,5 m²', descId: 'alcove', desc: 'Kompakt sovalkov', priceDelta: 12500 },
        { areaSqMeters: 8.2, label: '8,2 m²', descId: 'standard', desc: 'Standardloft', priceDelta: 16800 },
        { areaSqMeters: 11.0, label: '11,0 m²', descId: 'large', desc: 'Stort sovloft', priceDelta: 20500 },
        { areaSqMeters: 13.7, label: '13,7 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 24800 }
      ];
    } else {
      return [
        { areaSqMeters: 14.6, label: '14,6 m²', descId: 'compact', desc: 'Kompakt sovloft', priceDelta: 22500 },
        { areaSqMeters: 21.9, label: '21,9 m²', descId: 'generous', desc: 'Generöst sovloft', priceDelta: 30500 },
        { areaSqMeters: 29.2, label: '29,2 m²', descId: 'large-plan', desc: 'Stort loftplan', priceDelta: 38500 },
        { areaSqMeters: 36.5, label: '36,5 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 46500 }
      ];
    }
  });

  const totalPriceSek = computed(() => {
    let total = currentSize.value.basePrice;

    // Material price
    total += currentMaterial.value.priceDelta;

    // Roof price
    const roof = ROOF_OPTIONS.find((r) => r.id === activeRoof.value);
    if (roof) total += roof.priceDelta;
    const covering = ROOF_COVERINGS.find((item) => item.id === roofCovering.value);
    if (covering) total += covering.priceDelta;

    // Loft price
    if (hasLoft.value) {
      const match = availableLoftSizes.value.find(
        (s) => Math.abs(s.areaSqMeters - selectedLoftSize.value) < 0.1
      );
      total += match ? match.priceDelta : 21500;
    }

    // Wall slots (doors, windows, gates)
    Object.values(wallSlots.value).forEach((slot) => {
      if (slot.type === 'door' && slot.itemId) {
        const d = DOORS_OPTIONS.find((opt) => opt.id === slot.itemId);
        if (d) total += d.priceDelta;
      } else if (slot.type === 'window' && slot.itemId) {
        const w = WINDOWS_OPTIONS.find((opt) => opt.id === slot.itemId);
        if (w) total += w.priceDelta;
      } else if (slot.type === 'gate' && slot.itemId) {
        const g = GATES_OPTIONS.find((opt) => opt.id === slot.itemId);
        if (g) total += g.priceDelta;
      }
    });

    return total;
  });

  function toggleViewMode() {
    viewMode.value = viewMode.value === 'utsida' ? 'insida' : 'utsida';
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
  }

  function setInteractionMode(mode: InteractionMode) {
    interactionMode.value = mode;
  }

  function triggerGenerateElectrical() {
    generateElectricalSignal.value++;
  }

  let viewModeBeforeLoft: ViewMode | null = null;

  function selectCategory(category: CategoryKey) {
    if (category === 'loft' && selectedCategory.value !== 'loft') {
      viewModeBeforeLoft = viewMode.value;
      viewMode.value = 'insida';
    } else if (category === 'interior' && selectedCategory.value !== 'interior') {
      viewModeBeforeLoft = viewMode.value;
      viewMode.value = 'blueprint';
    } else if (['loft', 'interior'].includes(selectedCategory.value) && !['loft', 'interior'].includes(category) && viewModeBeforeLoft) {
      viewMode.value = viewModeBeforeLoft;
      viewModeBeforeLoft = null;
    }
    if (category !== 'interior') {
      interactionMode.value = 'default';
    }
    selectedCategory.value = category;
  }

  function clampMeasure(axis: BuildingAxis, value: number) {
    const limit = BUILDING_LIMITS[axis];
    if (!Number.isFinite(value)) {
      if (axis === 'width') return buildingWidth.value;
      if (axis === 'depth') return buildingDepth.value;
      return buildingHeight.value;
    }
    return Math.round(Math.min(limit.max, Math.max(limit.min, value)));
  }

  function applyPresetSize(id: string) {
    const preset = SIZE_OPTIONS.find((size) => size.id === id);
    if (!preset) return;
    buildingWidth.value = preset.width;
    buildingDepth.value = preset.depth;
    buildingHeight.value = preset.height;
  }

  function selectSize(id: string) {
    selectedSizeId.value = id;
    applyPresetSize(id);
    // Ensure selectedLoftSize is valid for this new size
    const available = availableLoftSizes.value;
    if (available.length > 0 && !available.some((s) => Math.abs(s.areaSqMeters - selectedLoftSize.value) < 0.1)) {
      selectedLoftSize.value = available[0].areaSqMeters;
    }
    saveSnapshot();
  }

  function setBuildingMeasure(axis: BuildingAxis, value: number) {
    const next = clampMeasure(axis, value);
    if (axis === 'width') buildingWidth.value = next;
    else if (axis === 'depth') buildingDepth.value = next;
    else buildingHeight.value = next;
    saveSnapshot();
  }

  function selectRoof(id: string) {
    activeRoof.value = id;
    saveSnapshot();
  }

  function selectRoofCovering(id: RoofCovering) {
    roofCovering.value = id;
    saveSnapshot();
  }

  function selectLoft(id: string) {
    activeLoft.value = id;
    saveSnapshot();
  }

  function toggleHasLoft(forceState?: boolean) {
    const next = forceState !== undefined ? forceState : activeLoft.value === 'none';
    activeLoft.value = next ? 'sleeping' : 'none';
    saveSnapshot();
  }

  function setLoftCount(count: LoftCount) {
    loftCount.value = count;
    saveSnapshot();
  }

  function setLoftPlacement(placement: LoftPlacement) {
    loftPlacement.value = placement;
    saveSnapshot();
  }

  function setLoftSize(area: number) {
    selectedLoftSize.value = area;
    saveSnapshot();
  }

  function toggleLoftStair() {
    hasLoftStair.value = !hasLoftStair.value;
    saveSnapshot();
  }

  function setLoftTab(tab: LoftTab) {
    loftTab.value = tab;
  }

  function selectDoor(id: string) {
    activeDoor.value = id;
    saveSnapshot();
  }

  function selectWindow(id: string) {
    activeWindow.value = id;
    saveSnapshot();
  }

  function selectGate(id: string) {
    activeGate.value = id;
    saveSnapshot();
  }

  function selectMaterial(id: MaterialKey) {
    activeMaterial.value = id;
    activePaintId.value = null;
    paintPreview.value = null;
    saveSnapshot();
  }

  function selectSavedPaint(id: string) {
    if (!savedPaints.value.some((paint) => paint.id === id)) return;
    paintPreview.value = null;
    if (activePaintId.value === id) return;
    activePaintId.value = id;
    saveSnapshot();
  }

  function setPaintPreview(hex: string | null) {
    paintPreview.value = hex ? normalizeHex(hex) : null;
  }

  function setCustomPaint(paint: CustomPaint) {
    const next = parseCustomPaint(paint);
    if (!next) return;
    paintPreview.value = null;
    const existing = savedPaints.value.find((item) => item.hex === next.hex && item.ral === next.ral && item.pantone === next.pantone);
    if (existing) {
      if (activePaintId.value === existing.id) return;
      activePaintId.value = existing.id;
      saveSnapshot();
      return;
    }
    const id = `paint-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let kept = savedPaints.value;
    if (kept.length >= SAVED_PAINT_LIMIT) {
      const oldest = kept.find((item) => item.id !== activePaintId.value) ?? kept[0];
      kept = kept.filter((item) => item.id !== oldest.id);
    }
    savedPaints.value = [...kept, { ...next, id }];
    activePaintId.value = id;
    saveSnapshot();
  }

  function selectPanelOrientation(orientation: PanelOrientation) {
    panelOrientation.value = orientation;
    saveSnapshot();
  }

  function selectCladdingSize(id: CladdingSizeId) {
    if (!CLADDING_SIZES.some((size) => size.id === id)) return;
    claddingSizeId.value = id;
    saveSnapshot();
  }

  function selectSlot(slotId: string | null) {
    selectedSlotId.value = slotId;
  }

  function commitHouse() {
    const next = JSON.stringify(houseState());
    if (history.value[historyIndex.value] === next) return;
    saveSnapshot();
  }

  function noteById(id: string) {
    return notes.value.find((note) => note.id === id);
  }

  function replaceNote(id: string, patch: Partial<HouseNote>) {
    const current = noteById(id);
    if (!current) return;
    const [next] = acceptNotes([{ ...current, ...patch, id: current.id }]);
    if (!next) return;
    notes.value = notes.value.map((note) => (note.id === id ? next : note));
  }

  function addNote() {
    if (notes.value.length >= NOTE_LIMIT) return null;
    const id = `note_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
    notes.value = [...notes.value, freshNote(notes.value.length, id)];
    showNotes.value = true;
    activeNoteId.value = id;
    commitHouse();
    return id;
  }

  function removeNote(id: string) {
    if (!noteById(id)) return;
    notes.value = notes.value.filter((note) => note.id !== id);
    if (activeNoteId.value === id) activeNoteId.value = null;
    commitHouse();
  }

  function setNoteText(id: string, text: string) {
    replaceNote(id, { text });
  }

  function setNoteLink(id: string, value: string) {
    const link = linkFromValue(value);
    replaceNote(id, { link });
    activeNoteId.value = id;
    commitHouse();
  }

  function moveNote(id: string, place: { x?: number; y?: number; offsetX?: number; offsetY?: number }) {
    replaceNote(id, place);
  }

  function setNotePin(id: string, pin: { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number } | null) {
    replaceNote(id, { pin: pin ? parseNotePin(pin) : null });
  }

  function setNotePlanes(camera: string, planes: Record<string, { transform: string; visible: boolean }>) {
    noteCamera.value = camera;
    notePlanes.value = planes;
  }

  function commitNotes() {
    commitHouse();
  }

  function toggleNotes() {
    if (showNotes.value) {
      showNotes.value = false;
      return;
    }
    showNotes.value = true;
    if (!notes.value.length) addNote();
  }

  function setNoteAnchors(next: Record<string, { x: number; y: number; visible: boolean }>) {
    const current = noteAnchors.value;
    const keys = Object.keys(next);
    const sameKeys = keys.length === Object.keys(current).length && keys.every((key) => current[key]);
    if (sameKeys) {
      const moved = keys.some((key) => {
        const before = current[key];
        const after = next[key];
        return Math.abs(before.x - after.x) >= 0.5
          || Math.abs(before.y - after.y) >= 0.5
          || before.visible !== after.visible;
      });
      if (!moved) return;
    }
    noteAnchors.value = next;
  }

  function assignSlotItem(slotId: string, type: 'empty' | 'door' | 'window' | 'gate', itemId?: string) {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    if ((type === 'door' || type === 'gate') && slot.canAcceptDoor === false) return;
    slot.type = type;
    slot.itemId = itemId;
    saveSnapshot();
  }

  function removeSlotItem(slotId: string) {
    assignSlotItem(slotId, 'empty', undefined);
  }

  function toggleDimensions() {
    showDimensions.value = !showDimensions.value;
  }

  const measuring = ref(false);
  const measureStart = ref<MeasurePoint | null>(null);
  const measureEnd = ref<MeasurePoint | null>(null);
  const measureCursor = ref<MeasurePoint | null>(null);
  const measureScreen = reactive({
    start: { x: 0, y: 0, visible: false },
    end: { x: 0, y: 0, visible: false }
  });

  function clearMeasure() {
    measureStart.value = null;
    measureEnd.value = null;
    measureCursor.value = null;
    measureScreen.start.visible = false;
    measureScreen.end.visible = false;
  }

  function toggleMeasure() {
    measuring.value = !measuring.value;
    clearMeasure();
  }

  function placeMeasurePoint(point: MeasurePoint) {
    if (!measuring.value) return;
    const next = nextMeasure(measureStart.value, measureEnd.value, point);
    measureStart.value = next.start;
    measureEnd.value = next.end;
    measureCursor.value = next.end ? null : point;
  }

  function setMeasureCursor(point: MeasurePoint | null) {
    if (!measuring.value || measureEnd.value) return;
    measureCursor.value = point;
  }

  function setMeasureScreen(next: {
    start: { x: number; y: number; visible: boolean };
    end: { x: number; y: number; visible: boolean };
  } | null) {
    const start = next?.start ?? { x: 0, y: 0, visible: false };
    const end = next?.end ?? { x: 0, y: 0, visible: false };
    for (const [current, value] of [
      [measureScreen.start, start],
      [measureScreen.end, end]
    ] as const) {
      if (
        Math.abs(current.x - value.x) < 0.5 &&
        Math.abs(current.y - value.y) < 0.5 &&
        current.visible === value.visible
      ) {
        continue;
      }
      current.x = value.x;
      current.y = value.y;
      current.visible = value.visible;
    }
  }

  const selectedSlotCanAcceptDoor = computed(() => {
    if (!selectedSlotId.value) return true;
    const slot = wallSlots.value[selectedSlotId.value];
    if (!slot) return true;
    return slot.canAcceptDoor !== false;
  });

  function setHoveredSlot(slotId: string | null, pos?: { x: number; y: number } | null) {
    hoveredSlotId.value = slotId;
    hoveredSlotPos.value = pos ?? null;
  }

  function setSlotScreenPosition(pos: { x: number; y: number; visible: boolean } | null) {
    slotScreenPosition.value = pos;
  }

  function setDimensionLabels(next: Record<string, { x: number; y: number; visible: boolean }>) {
    for (const key of Object.keys(next)) {
      const current = dimensionLabels[key];
      const value = next[key];
      if (!current || !value) continue;
      if (
        Math.abs(current.x - value.x) < 0.5 &&
        Math.abs(current.y - value.y) < 0.5 &&
        current.visible === value.visible
      ) {
        continue;
      }
      current.x = value.x;
      current.y = value.y;
      current.visible = value.visible;
    }
  }

  function cycleSlot(direction: 'prev' | 'next') {
    const keys = Object.keys(wallSlots.value);
    if (!selectedSlotId.value) {
      selectedSlotId.value = keys[0];
      return;
    }
    const currentIndex = keys.indexOf(selectedSlotId.value);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % keys.length
      : (currentIndex - 1 + keys.length) % keys.length;
    selectedSlotId.value = keys[nextIndex];
  }

  function deselectSlot() {
    selectedSlotId.value = null;
    slotScreenPosition.value = null;
  }

  return {
    viewMode,
    interactionMode,
    generateElectricalSignal,
    selectedCategory,
    activeMaterial,
    customPaint,
    savedPaints,
    paintPreview,
    setPaintPreview,
    setCustomPaint,
    selectSavedPaint,
    panelOrientation,
    claddingSizeId,
    selectedSlotId,
    hoveredSlotId,
    hoveredSlotPos,
    slotScreenPosition,
    dimensionLabels,
    showDimensions,
    wallSlots,
    selectedSizeId,
    activeRoof,
    roofCovering,
    activeLoft,
    activeDoor,
    activeWindow,
    activeGate,
    currentSize,
    currentMaterial,
    dimensions,
    roofPitchAngle,
    eaveHeight,
    rearHeight,
    innerCeilingHeight,
    hasLoft,
    loftCount,
    loftPlacement,
    selectedLoftSize,
    hasLoftStair,
    loftTab,
    availableLoftSizes,
    totalPriceSek,
    selectedSlotCanAcceptDoor,
    toggleViewMode,
    setViewMode,
    setInteractionMode,
    triggerGenerateElectrical,
    selectCategory,
    selectSize,
    setBuildingMeasure,
    selectRoof,
    selectRoofCovering,
    selectLoft,
    toggleHasLoft,
    setLoftCount,
    setLoftPlacement,
    setLoftSize,
    toggleLoftStair,
    setLoftTab,
    selectDoor,
    selectWindow,
    selectGate,
    selectMaterial,
    selectPanelOrientation,
    selectCladdingSize,
    selectSlot,
    setHoveredSlot,
    setSlotScreenPosition,
    setDimensionLabels,
    cycleSlot,
    deselectSlot,
    assignSlotItem,
    removeSlotItem,
    toggleDimensions,
    measuring,
    measureStart,
    measureEnd,
    measureCursor,
    measureScreen,
    toggleMeasure,
    placeMeasurePoint,
    setMeasureCursor,
    setMeasureScreen,
    isFullscreen,
    setIsFullscreen: (val: boolean) => { isFullscreen.value = val; },
    canUndo,
    canRedo,
    undo,
    redo,
    exportHouse,
    importHouse,
    notes,
    showNotes,
    activeNoteId,
    noteAnchors,
    noteCamera,
    notePlanes,
    setNotePlanes,
    addNote,
    removeNote,
    setNoteText,
    setNoteLink,
    moveNote,
    setNotePin,
    commitNotes,
    toggleNotes,
    setNoteAnchors
  };
});
