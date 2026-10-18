import { defineStore, acceptHMRUpdate } from 'pinia';
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
import { eaveLiftMm, gablePitchDegrees, wallPlateHeightM } from './roof';
import { floorAreaSqMeters } from './area';
import { isLoftRoom } from '../three-engine/loftLevel';
import {
  CONCRETE_DEFAULT_HEIGHT_MM,
  CONCRETE_PLAN_MM,
  PAABYGGNAD_MAX_HEIGHT_MM,
  acceptConcreteWalls,
  clampConcretePlan,
  clampConcreteWall,
  clampPaabyggnadPlan,
  paabyggnadLoftAreas,
  paabyggnadWallSlots,
  CONCRETE_WALL_LIMIT,
  type ConcreteWall
} from './paabyggnad';
import { overlightItem } from '../three-engine/windowFit';
import { acceptPlacedRooms, type PlacedRoom } from '../three-engine/roomWalls';
import {
  acceptTerraces,
  TERRACE_DEPTHS,
  TERRACE_SIDES,
  terracePrice,
  terracesFromLegacy,
  type HouseTerrace,
  type TerraceDepth,
  type TerraceSide,
  type TerraceSpan,
  type TerraceBuilding,
  TERRACE_BUILDINGS,
  type TerraceBuildingPlacement,
  TERRACE_BUILDING_PLACEMENTS,
  SAUNA_BUILDING_PRICE,
  SHED_BUILDING_PRICE
} from '../outside/terrace';
import {
  COMPASS_FACINGS,
  clampSunHour,
  type CompassFacing
} from '../three-engine/sunPosition';
import { moveWallSlot } from './slotMove';

export type { CompassFacing };

/** Camera pose restored by the toolbar reset for the ordinary outside view. */
export type CameraView = {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
};

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
    id: 'size-shed',
    name: 'Litet förråd',
    badge: 'Förråd',
    width: 4000,
    depth: 2500,
    height: 2500,
    areaSqMeters: 10.0,
    basePrice: 39900,
    desc: '4000 × 2500 mm. En låg bod med dörr och ett fönster.'
  },
  {
    id: 'size-sauna',
    name: 'Bastu',
    badge: 'Bastu',
    width: 5200,
    depth: 2800,
    height: 2700,
    areaSqMeters: 14.6,
    basePrice: 64900,
    desc: '5200 × 2800 mm. Låg stuga med dörr, frostat fönster och altan vid ingången.'
  },
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
    depth: 4950,
    height: 5000,
    areaSqMeters: 29.9,
    basePrice: 103634,
    desc: '6040 × 4950 mm. Maximal bygglovsfri boendeyta.'
  },
  {
    id: 'size-paabyggnad',
    name: 'Påbyggnad på betonghus',
    badge: 'Upp till 35 m²',
    width: 5200,
    depth: 6731,
    height: 5000,
    areaSqMeters: 35.0,
    basePrice: 98000,
    desc: '5200 × 5200 mm betonghus, 2,5 m högt. Gamla taket tas bort. Träloft och påbyggnad ovanför, höjd upp till 500 cm, yta upp till 35 m².'
  },
  {
    id: 'size-cube',
    name: 'Modern skandi-kub',
    badge: 'Kub',
    width: 6000,
    depth: 6000,
    height: 4800,
    areaSqMeters: 36.0,
    basePrice: 138000,
    desc: '6000 × 6000 mm. Dörr och lågt fönster till vänster, två fönster till höger, skjutdörrar bak och i hörnet, altan runt om.'
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

function presetSize(id: string | undefined) {
  return SIZE_OPTIONS.find((size) => size.id === id) ?? SIZE_OPTIONS.find((size) => size.id === 'size-30') ?? SIZE_OPTIONS[0];
}

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
    name: 'Flackt tak',
    desc: 'Skandi-kubens tak. Kubisk funkis med diskret krön.',
    spec: 'Skandi-kubens tak, 2° dold avrinning',
    priceDelta: 8200
  }
];

export type LoftCount = 'ett' | 'tva';
export const LOFT_PLACEMENTS = ['vanster', 'hoger', 'fram', 'bak'] as const;
export type LoftPlacement = (typeof LOFT_PLACEMENTS)[number];
export type LoftTab = 'planlosning' | 'golv';
export type LoftStairType = 'straight' | 'curved';
export type LoftStairPosition = 'front' | 'back';

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
  },
  {
    id: 'SKJUTDORR3',
    name: 'FALSTERBO',
    desc: 'Skjutdörr helglasad i aluminium, tre lufter, 30x21',
    spec: 'Mått 30×21, 3-glas isoler',
    priceDelta: 21900,
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
    id: 'narrow-tall',
    name: 'Smalhögt fönster',
    desc: 'Smalt och elegant fönster i stående format för smala väggpartier.',
    spec: 'Mått 6×18, 3-glas energiglas',
    priceDelta: 3200
  },
  {
    id: 'overlight',
    name: 'Fast överljus',
    desc: 'Lågt fönster ovanför dörren, i samma bredd som dörrfältet.',
    spec: 'Mått 11×4, fast glas',
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
    id: 'panorama-portrait',
    name: 'Stående panoramafönster',
    desc: 'Fast glas i stående format som fyller en hög väggsektion.',
    spec: 'Mått 10×21, 3-glas energiglas',
    priceDelta: 6400
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

export const OUTSIDE_PRICES = {
  doorCanopy: 9600,
  terrace: 28400,
  terraceCeiling: 14200,
  bigTerrace: 72600
} as const;

export type { HouseTerrace, TerraceDepth, TerraceSide, TerraceSpan, TerraceBuilding, TerraceBuildingPlacement };
export { TERRACE_BUILDINGS, TERRACE_BUILDING_PLACEMENTS, SAUNA_BUILDING_PRICE, SHED_BUILDING_PRICE };

import {
  type WallSlot,
  PANEL_COUNTS,
  panelCountForWall,
  createWallSlots,
  clearedWallSlots,
  cubeWallSlots,
  saunaWallSlots,
  shedWallSlots,
  mergeWallSlots
} from './wallSlots';

export type { WallSlot } from './wallSlots';
export {
  PANEL_COUNTS,
  panelCountForWall,
  createWallSlots,
  clearedWallSlots,
  cubeWallSlots,
  saunaWallSlots,
  shedWallSlots,
  mergeWallSlots,
  paabyggnadWallSlots
};

export const useConfigStore = defineStore('config', () => {
  const viewMode = ref<ViewMode>('utsida');
  const interactionMode = ref<InteractionMode>('default');
  const generateElectricalSignal = ref(0);
  const interiorFocusSignal = ref(0);
  const selectedCategory = ref<CategoryKey>('size');
  const categoryRequest = ref(0);
  const activeMaterial = ref<MaterialKey>('wood');
  const savedPaints = ref<SavedPaint[]>([]);
  const activePaintId = ref<string | null>(null);
  const customPaint = computed(() => savedPaints.value.find((paint) => paint.id === activePaintId.value) ?? null);
  const paintPreview = ref<string | null>(null);
  const panelOrientation = ref<PanelOrientation>('staende');
  /** Horizontal cladding keeps upright boards on the front door bay. */
  const verticalDoorBay = ref(false);
  const claddingSizeId = ref<CladdingSizeId>('22x145');
  /** Exterior corner boards (knutbrädor) color: 'same' | 'white' | 'falurod' | 'grey' | 'black' | 'wood' | custom hex */
  const cornerColor = ref<string>('same');
  /** Saved custom corner board colors */
  const savedCornerColors = ref<string[]>([]);
  /** Exterior corner boards (knutbrädor) show/hide */
  const cornerBoards = ref<boolean>(true);
  const isFullscreen = ref<boolean>(false);
  const showDimensions = ref<boolean>(true);
  const showInnerWalls = ref<boolean>(true);
  const showSun = ref(false);
  const isDragging = ref(false);
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
  const startingSize = presetSize('size-30');
  const buildingWidth = ref(startingSize.width);
  const buildingDepth = ref(startingSize.depth);
  const buildingHeight = ref(startingSize.height);
  const concreteWidth = ref(CONCRETE_PLAN_MM);
  const concreteDepth = ref(CONCRETE_PLAN_MM);
  const concreteHeight = ref(CONCRETE_DEFAULT_HEIGHT_MM);
  const concreteWalls = ref<ConcreteWall[]>([]);
  const activeRoof = ref<string>('pulpettak');
  const roofCovering = ref<RoofCovering>('felt');
  const activeLoft = ref<string>('none');
  const hasLoft = computed(() => activeLoft.value !== 'none');
  const loftCount = ref<LoftCount>('ett');
  const loftPlacement = ref<LoftPlacement>('vanster');
  const selectedLoftSize = ref<number>(10.95);
  const hasLoftStair = ref<boolean>(true);
  const loftStairType = ref<LoftStairType>('straight');
  const loftStairPosition = ref<LoftStairPosition>('front');
  const loftTab = ref<LoftTab>('planlosning');
  const activeDoor = ref<string>('STEHAG');
  const activeWindow = ref<string>('standard-single');
  const activeGate = ref<string>('none');
  const doorCanopy = ref(false);
  /** Tin roof ends at the walls, with a metal band over the roof edge. */
  const flushRoof = ref(false);
  const terraces = ref<HouseTerrace[]>([]);
  const facing = ref<CompassFacing>('south');
  const sunHour = ref(12);
  let sunHourAtSnapshot = 12;
  const defaultView = ref<CameraView | null>(null);

  // Interior rooms
  const placedRooms = ref<Record<string, PlacedRoom>>({});
  const selectedRoomId = ref<string | null>(null);
  const floorPlanDone = ref(false);

  function selectRoom(id: string | null) {
    selectedRoomId.value = id && placedRooms.value[id] ? id : null;
  }

  function removePlacedRoom(id: string) {
    if (!placedRooms.value[id]) return;
    const next = { ...placedRooms.value };
    delete next[id];
    placedRooms.value = next;
    if (selectedRoomId.value === id) selectedRoomId.value = null;
    if (Object.keys(next).length === 0) floorPlanDone.value = false;
  }

  function setFloorPlanDone(done: boolean) {
    if (done && Object.keys(placedRooms.value).length === 0) return;
    if (floorPlanDone.value === done) return;
    floorPlanDone.value = done;
    commitHouse();
  }

  function toggleRoomWalls(id: string) {
    const room = placedRooms.value[id];
    if (!room) return;
    placedRooms.value = {
      ...placedRooms.value,
      [id]: { ...room, wallsVisible: !room.wallsVisible }
    };
    commitHouse();
  }

  function commitRooms() {
    commitHouse();
  }

  function clearLoftRooms() {
    const next = { ...placedRooms.value };
    let changed = false;
    for (const [id, room] of Object.entries(next)) {
      if (!isLoftRoom(room.y)) continue;
      delete next[id];
      changed = true;
      if (selectedRoomId.value === id) selectedRoomId.value = null;
    }
    if (changed) {
      placedRooms.value = next;
      if (Object.keys(next).length === 0) floorPlanDone.value = false;
    }
  }

  // Wall panel modular slots (matching Skånska Byggvaror reference layout)
  const wallSlots = ref<Record<string, WallSlot>>(createWallSlots());

  const notes = ref<HouseNote[]>([]);
  const showNotes = ref(false);
  const showMood = ref(false);
  const activeNoteId = ref<string | null>(null);
  const noteAnchors = ref<Record<string, { x: number; y: number; visible: boolean }>>({});
  const noteCamera = ref('');
  const notePlanes = ref<Record<string, { transform: string; visible: boolean }>>({});

  // History stacks for Undo / Redo
  const history = ref<string[]>([]);
  const historyIndex = ref<number>(-1);

  function parseCameraView(value: unknown): CameraView | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const numbers = [record.x, record.y, record.z, record.tx, record.ty, record.tz].map(Number);
    if (numbers.some((entry) => !Number.isFinite(entry) || Math.abs(entry) > 80)) return null;
    return {
      x: numbers[0],
      y: numbers[1],
      z: numbers[2],
      tx: numbers[3],
      ty: numbers[4],
      tz: numbers[5]
    };
  }

  function viewsMatch(a: CameraView, b: CameraView) {
    return (['x', 'y', 'z', 'tx', 'ty', 'tz'] as const).every((key) => Math.abs(a[key] - b[key]) < 0.01);
  }

  function houseState() {
    return {
      selectedSizeId: selectedSizeId.value,
      buildingWidth: buildingWidth.value,
      buildingDepth: buildingDepth.value,
      buildingHeight: buildingHeight.value,
      concreteWidth: concreteWidth.value,
      concreteDepth: concreteDepth.value,
      concreteHeight: concreteHeight.value,
      concreteWalls: concreteWalls.value.map((wall) => ({ ...wall })),
      activeRoof: activeRoof.value,
      roofCovering: roofCovering.value,
      activeLoft: activeLoft.value,
      hasLoft: hasLoft.value,
      loftCount: loftCount.value,
      loftPlacement: loftPlacement.value,
      selectedLoftSize: selectedLoftSize.value,
      hasLoftStair: hasLoftStair.value,
      loftStairType: loftStairType.value,
      loftStairPosition: loftStairPosition.value,
      activeDoor: activeDoor.value,
      activeWindow: activeWindow.value,
      activeGate: activeGate.value,
      doorCanopy: doorCanopy.value,
      flushRoof: flushRoof.value,
      terraces: terraces.value.map((item) => ({ ...item })),
      facing: facing.value,
      sunHour: sunHour.value,
      defaultView: defaultView.value ? { ...defaultView.value } : null,
      activeMaterial: activeMaterial.value,
      savedPaints: savedPaints.value,
      activePaintId: activePaintId.value,
      customPaint: customPaint.value,
      panelOrientation: panelOrientation.value,
      verticalDoorBay: verticalDoorBay.value,
      claddingSizeId: claddingSizeId.value,
      cornerColor: cornerColor.value,
      savedCornerColors: savedCornerColors.value,
      cornerBoards: cornerBoards.value,
      wallSlots: wallSlots.value,
      notes: notes.value,
      placedRooms: placedRooms.value,
      floorPlanDone: floorPlanDone.value,
      showInnerWalls: showInnerWalls.value
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
      const preset = presetSize(data.selectedSizeId);
      buildingWidth.value = clampMeasure('width', data.buildingWidth ?? preset.width);
      buildingDepth.value = clampMeasure('depth', data.buildingDepth ?? preset.depth);
      buildingHeight.value = clampMeasure('height', data.buildingHeight ?? preset.height);
      const loadedConcrete = clampConcretePlan('width', {
        width: Number.isFinite(data.concreteWidth) ? data.concreteWidth : CONCRETE_PLAN_MM,
        depth: Number.isFinite(data.concreteDepth) ? data.concreteDepth : CONCRETE_PLAN_MM,
        height: Number.isFinite(data.concreteHeight) ? data.concreteHeight : CONCRETE_DEFAULT_HEIGHT_MM
      });
      const loadedDepth = clampConcretePlan('depth', loadedConcrete);
      const loadedHeight = clampConcretePlan('height', loadedDepth);
      concreteWidth.value = loadedHeight.width;
      concreteDepth.value = loadedHeight.depth;
      concreteHeight.value = loadedHeight.height;
      concreteWalls.value = acceptConcreteWalls(data.concreteWalls, loadedHeight.width, loadedHeight.depth);
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
      if (LOFT_PLACEMENTS.includes(data.loftPlacement)) loftPlacement.value = data.loftPlacement;
      if (data.selectedLoftSize) selectedLoftSize.value = data.selectedLoftSize;
      if (data.hasLoftStair !== undefined) hasLoftStair.value = data.hasLoftStair;
      loftStairType.value = data.loftStairType === 'curved' ? 'curved' : 'straight';
      loftStairPosition.value = data.loftStairPosition === 'back' ? 'back' : 'front';
      if (data.activeDoor) activeDoor.value = data.activeDoor;
      if (data.activeWindow) activeWindow.value = data.activeWindow;
      if (data.activeGate) activeGate.value = data.activeGate;
      doorCanopy.value = data.doorCanopy === true;
      flushRoof.value = data.flushRoof === true;
      terraces.value = Array.isArray(data.terraces) ? acceptTerraces(data.terraces) : terracesFromLegacy(data);
      facing.value = COMPASS_FACINGS.includes(data.facing) ? data.facing : 'south';
      sunHour.value = clampSunHour(typeof data.sunHour === 'number' ? data.sunHour : 12);
      sunHourAtSnapshot = sunHour.value;
      defaultView.value = parseCameraView(data.defaultView);
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
      verticalDoorBay.value = data.verticalDoorBay === true;
      claddingSizeId.value = CLADDING_SIZES.some((size) => size.id === data.claddingSizeId)
        ? data.claddingSizeId
        : '22x145';
      cornerColor.value = typeof data.cornerColor === 'string' ? data.cornerColor : 'same';
      savedCornerColors.value = Array.isArray(data.savedCornerColors)
        ? data.savedCornerColors.filter((c: unknown): c is string => typeof c === 'string' && c.startsWith('#'))
        : (cornerColor.value.startsWith('#') ? [cornerColor.value] : []);
      if (cornerColor.value.startsWith('#') && !savedCornerColors.value.includes(cornerColor.value)) {
        savedCornerColors.value.push(cornerColor.value);
      }
      cornerBoards.value = data.cornerBoards !== false;
      wallSlots.value = mergeWallSlots(data.wallSlots, data.selectedSizeId ?? selectedSizeId.value);
      placedRooms.value = acceptPlacedRooms(data.placedRooms);
      floorPlanDone.value = data.floorPlanDone === true && Object.keys(placedRooms.value).length > 0;
      showInnerWalls.value = data.showInnerWalls !== false;
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
    return presetSize(selectedSizeId.value);
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

  const effectiveCornerHex = computed(() => {
    if (cornerColor.value && cornerColor.value !== 'same') {
      if (cornerColor.value.startsWith('#')) return cornerColor.value;
      const found = MATERIAL_OPTIONS.find((m) => m.id === cornerColor.value);
      if (found) return found.colorHex;
    }
    if (paintPreview.value) return paintPreview.value;
    if (customPaint.value?.hex) return customPaint.value.hex;
    const currentMat = MATERIAL_OPTIONS.find((m) => m.id === activeMaterial.value);
    return currentMat ? currentMat.colorHex : '#e8d8be';
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

  /** Wall plate the roof sits on. Derived so that total height from ground to highest roof point matches dimensions.height. */
  const eaveHeight = computed(() => {
    return Math.round(
      wallPlateHeightM(
        activeRoof.value,
        dimensions.value.depth / 1000,
        dimensions.value.height / 1000,
        flushRoof.value
      ) * 1000
    );
  });

  const rearHeight = computed(() => {
    if (activeRoof.value === 'pulpettak') {
      const drop = Math.round(dimensions.value.depth * Math.tan((roofPitchAngle.value * Math.PI) / 180));
      return Math.max(Math.round(eaveHeight.value - drop), 1800);
    }
    return eaveHeight.value;
  });

  const innerCeilingHeight = computed(() => {
    return Math.max(2100, eaveHeight.value - 300);
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
    } else if (selectedSizeId.value === 'size-15' || selectedSizeId.value === 'size-sauna') {
      return [
        { areaSqMeters: 5.5, label: '5,5 m²', descId: 'alcove', desc: 'Kompakt sovalkov', priceDelta: 12500 },
        { areaSqMeters: 8.2, label: '8,2 m²', descId: 'standard', desc: 'Standardloft', priceDelta: 16800 },
        { areaSqMeters: 11.0, label: '11,0 m²', descId: 'large', desc: 'Stort sovloft', priceDelta: 20500 },
        { areaSqMeters: 13.7, label: '13,7 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 24800 }
      ];
    } else if (selectedSizeId.value === 'size-paabyggnad') {
      const areas = paabyggnadLoftAreas(buildingWidth.value, buildingDepth.value);
      const copy = [
        { descId: 'compact', desc: 'Sovloft över betongen', priceDelta: 18500 },
        { descId: 'generous', desc: 'Större loft', priceDelta: 26800 },
        { descId: 'full-floor', desc: 'Hela den nya våningen', priceDelta: 34800 }
      ];
      return areas.map((areaSqMeters, index) => {
        const item = copy[Math.min(index, copy.length - 1)];
        return {
          areaSqMeters,
          label: `${areaSqMeters.toLocaleString('sv-SE')} m²`,
          descId: item.descId,
          desc: item.desc,
          priceDelta: item.priceDelta
        };
      });
    } else if (selectedSizeId.value === 'size-shed') {
      return [
        { areaSqMeters: 4.2, label: '4,2 m²', descId: 'alcove', desc: 'Kompakt förvaring', priceDelta: 9800 },
        { areaSqMeters: 6.0, label: '6,0 m²', descId: 'compact', desc: 'Halvt loft', priceDelta: 12800 },
        { areaSqMeters: 8.0, label: '8,0 m²', descId: 'standard', desc: 'Större loft', priceDelta: 15600 },
        { areaSqMeters: 9.5, label: '9,5 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 18200 }
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

    if (doorCanopy.value) total += OUTSIDE_PRICES.doorCanopy;
    for (const deck of terraces.value) total += terracePrice(deck);

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
    if (category === 'doors' || category === 'windows' || category === 'gates' || category === 'extras') {
      viewMode.value = 'utsida';
      viewModeBeforeLoft = null;
    } else if (category === 'loft') {
      if (selectedCategory.value !== 'loft') {
        viewModeBeforeLoft = viewMode.value;
      }
      viewMode.value = 'insida';
    } else if (category === 'interior') {
      if (selectedCategory.value !== 'interior') {
        viewModeBeforeLoft = viewMode.value;
      }
      viewMode.value = 'insida';
      interiorFocusSignal.value++;
    } else if (['loft', 'interior'].includes(selectedCategory.value) && !['loft', 'interior'].includes(category) && viewModeBeforeLoft) {
      viewMode.value = viewModeBeforeLoft;
      viewModeBeforeLoft = null;
    }
    if (category !== 'interior') {
      interactionMode.value = 'default';
    }
    selectedCategory.value = category;
    categoryRequest.value += 1;
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

  function applyCubeShell() {
    panelOrientation.value = 'liggande';
    verticalDoorBay.value = true;
    doorCanopy.value = true;
    flushRoof.value = true;
    claddingSizeId.value = '22x170';
    terraces.value = [
      { side: 'back', depth: 2.4, span: 'full', roof: true },
      { side: 'front', depth: 1.8, span: 'full', roof: false },
      { side: 'left', depth: 1.8, span: 'full', roof: false },
      { side: 'right', depth: 1.8, span: 'full', roof: false }
    ];
    activeRoof.value = 'flackt';
    roofCovering.value = 'metal';
    activeMaterial.value = 'black';
    activePaintId.value = null;
    activeLoft.value = 'sleeping';
    loftCount.value = 'ett';
    loftPlacement.value = 'hoger';
    selectedLoftSize.value = 14.6;
    wallSlots.value = cubeWallSlots();
    activeDoor.value = 'LERVIK';
    activeWindow.value = 'panorama';
    selectedSlotId.value = null;
  }

  function applySaunaShell() {
    panelOrientation.value = 'liggande';
    verticalDoorBay.value = true;
    doorCanopy.value = true;
    flushRoof.value = false;
    claddingSizeId.value = '22x145';
    terraces.value = [{ side: 'front', depth: 1.2, span: 'door', roof: false }];
    activeRoof.value = 'sadeltak';
    roofCovering.value = 'shingles';
    activeMaterial.value = 'wood';
    activePaintId.value = null;
    activeLoft.value = 'none';
    loftCount.value = 'ett';
    loftPlacement.value = 'vanster';
    wallSlots.value = saunaWallSlots();
    activeDoor.value = 'LERVIK';
    activeWindow.value = 'frost';
    selectedSlotId.value = null;
  }

  function applyShedShell() {
    panelOrientation.value = 'staende';
    verticalDoorBay.value = false;
    doorCanopy.value = false;
    flushRoof.value = false;
    claddingSizeId.value = '22x145';
    terraces.value = [];
    activeRoof.value = 'sadeltak';
    roofCovering.value = 'felt';
    activeMaterial.value = 'falurod';
    activePaintId.value = null;
    activeLoft.value = 'none';
    loftCount.value = 'ett';
    loftPlacement.value = 'vanster';
    wallSlots.value = shedWallSlots();
    activeDoor.value = 'STEHAG';
    activeWindow.value = 'standard-single';
    selectedSlotId.value = null;
  }

  function applyPlainShell() {
    panelOrientation.value = 'staende';
    verticalDoorBay.value = false;
    doorCanopy.value = false;
    flushRoof.value = false;
    claddingSizeId.value = '22x145';
    activeLoft.value = 'none';
    loftPlacement.value = 'vanster';
    terraces.value = [];
    activeRoof.value = 'pulpettak';
    roofCovering.value = 'felt';
    wallSlots.value = createWallSlots(buildingWidth.value, buildingDepth.value);
    activeDoor.value = 'STEHAG';
    activeWindow.value = 'standard-single';
    selectedSlotId.value = null;
  }

  function selectSize(id: string) {
    const shelled = id === 'size-cube' || id === 'size-sauna' || id === 'size-shed' || id === 'size-paabyggnad';
    const leavingShell = !shelled && (selectedSizeId.value === 'size-cube' || selectedSizeId.value === 'size-sauna' || selectedSizeId.value === 'size-shed' || selectedSizeId.value === 'size-paabyggnad');
    selectedSizeId.value = id;
    applyPresetSize(id);
    if (id === 'size-cube') applyCubeShell();
    else if (id === 'size-sauna') applySaunaShell();
    else if (id === 'size-shed') applyShedShell();
    else if (leavingShell) applyPlainShell();
    if (id === 'size-paabyggnad') {
      activeRoof.value = 'pulpettak';
      buildingHeight.value = PAABYGGNAD_MAX_HEIGHT_MM;
      concreteWidth.value = CONCRETE_PLAN_MM;
      concreteDepth.value = CONCRETE_PLAN_MM;
      concreteHeight.value = CONCRETE_DEFAULT_HEIGHT_MM;
      concreteWalls.value = [];
      activeLoft.value = 'sleeping';
      loftPlacement.value = 'fram';
      const loftAreas = paabyggnadLoftAreas(buildingWidth.value, buildingDepth.value);
      selectedLoftSize.value = loftAreas[0] ?? 15.8;
      wallSlots.value = paabyggnadWallSlots(buildingWidth.value, buildingDepth.value);
      selectedSlotId.value = null;
    }
    // Ensure selectedLoftSize is valid for this new size
    const available = availableLoftSizes.value;
    if (available.length > 0 && !available.some((s) => Math.abs(s.areaSqMeters - selectedLoftSize.value) < 0.1)) {
      selectedLoftSize.value = available[0].areaSqMeters;
    }
    saveSnapshot();
  }

  function reconcileWallSlots() {
    const w = buildingWidth.value;
    const d = buildingDepth.value;
    const walls = ['front', 'back', 'left', 'right'] as const;
    const updated = { ...wallSlots.value };
    let changed = false;

    walls.forEach((wall) => {
      const count = panelCountForWall(wall, w, d);
      for (const [id, slot] of Object.entries(updated)) {
        if (slot.wall === wall && slot.index >= count) {
          delete updated[id];
          changed = true;
          if (selectedSlotId.value === id) selectedSlotId.value = null;
        }
      }
      for (let i = 0; i < count; i++) {
        const lowerId = `${wall}-${i}`;
        if (!updated[lowerId]) {
          updated[lowerId] = {
            id: lowerId,
            wall,
            index: i,
            type: 'empty',
            canAcceptDoor: true
          };
          changed = true;
        }
        const upperId = `${wall}-${i}u`;
        if (!updated[upperId]) {
          const isPaabyggnadFront = selectedSizeId.value === 'size-paabyggnad' && wall === 'front';
          const isStandardFront = wall === 'front' && selectedSizeId.value !== 'size-sauna' && selectedSizeId.value !== 'size-shed';
          const isWindow = isPaabyggnadFront || isStandardFront;
          updated[upperId] = {
            id: upperId,
            wall,
            index: i,
            type: isWindow ? 'window' : 'empty',
            itemId: isWindow ? 'standard-single' : undefined,
            canAcceptDoor: false,
            isUpper: true
          };
          changed = true;
        }
      }
    });

    if (changed) {
      wallSlots.value = updated;
    }
  }

  function setBuildingMeasure(axis: BuildingAxis, value: number) {
    const next = clampMeasure(axis, value);
    if (selectedSizeId.value === 'size-paabyggnad') {
      const plan = clampPaabyggnadPlan(
        axis,
        axis === 'width' ? next : buildingWidth.value,
        axis === 'depth' ? next : buildingDepth.value,
        axis === 'height' ? next : buildingHeight.value
      );
      buildingWidth.value = plan.width;
      buildingDepth.value = plan.depth;
      buildingHeight.value = plan.height;
      const loftAreas = paabyggnadLoftAreas(plan.width, plan.depth);
      const whole = loftAreas[loftAreas.length - 1];
      if (selectedLoftSize.value > whole + 0.05) selectedLoftSize.value = whole;
      reconcileWallSlots();
      saveSnapshot();
      return;
    }
    if (axis === 'width') buildingWidth.value = next;
    else if (axis === 'depth') buildingDepth.value = next;
    else buildingHeight.value = next;
    reconcileWallSlots();
    saveSnapshot();
  }

  function setConcreteMeasure(axis: BuildingAxis, value: number) {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
    const concrete = {
      width: axis === 'width' ? value : concreteWidth.value,
      depth: axis === 'depth' ? value : concreteDepth.value,
      height: axis === 'height' ? value : concreteHeight.value
    };
    const fitted = clampConcretePlan(axis, concrete);
    concreteWidth.value = fitted.width;
    concreteDepth.value = fitted.depth;
    concreteHeight.value = fitted.height;
    concreteWalls.value = concreteWalls.value.map((wall) => clampConcreteWall(wall, fitted.width, fitted.depth));
    saveSnapshot();
  }

  function addConcreteWall() {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
    if (concreteWalls.value.length >= CONCRETE_WALL_LIMIT) return;
    const axis: ConcreteWall['axis'] = concreteWalls.value.length % 2 === 0 ? 'x' : 'z';
    const same = concreteWalls.value.filter((wall) => wall.axis === axis).length;
    const wall = clampConcreteWall({
      id: `cw_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`,
      axis,
      offsetMm: same * 800
    }, concreteWidth.value, concreteDepth.value);
    concreteWalls.value = [...concreteWalls.value, wall];
    saveSnapshot();
  }

  function setConcreteWall(id: string, patch: Partial<Pick<ConcreteWall, 'axis' | 'offsetMm'>>) {
    concreteWalls.value = concreteWalls.value.map((wall) => {
      if (wall.id !== id) return wall;
      return clampConcreteWall({
        ...wall,
        axis: patch.axis === 'x' || patch.axis === 'z' ? patch.axis : wall.axis,
        offsetMm: Number.isFinite(patch.offsetMm) ? patch.offsetMm! : wall.offsetMm
      }, concreteWidth.value, concreteDepth.value);
    });
    saveSnapshot();
  }

  function removeConcreteWall(id: string) {
    if (!concreteWalls.value.some((wall) => wall.id === id)) return;
    concreteWalls.value = concreteWalls.value.filter((wall) => wall.id !== id);
    saveSnapshot();
  }

  function swapConcretePlan() {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
    const width = concreteDepth.value;
    const depth = concreteWidth.value;
    if (width === concreteWidth.value && depth === concreteDepth.value) return;
    const swapped = clampConcretePlan('depth', clampConcretePlan('width', {
      width,
      depth,
      height: concreteHeight.value
    }));
    concreteWidth.value = swapped.width;
    concreteDepth.value = swapped.depth;
    concreteWalls.value = concreteWalls.value.map((wall) => clampConcreteWall(wall, swapped.width, swapped.depth));
    saveSnapshot();
  }

  function swapBuildingPlan() {
    const nextWidth = clampMeasure('width', buildingDepth.value);
    const nextDepth = clampMeasure('depth', buildingWidth.value);
    if (nextWidth === buildingWidth.value && nextDepth === buildingDepth.value) return;
    buildingWidth.value = nextWidth;
    buildingDepth.value = nextDepth;
    saveSnapshot();
  }

  function selectRoof(id: string) {
    activeRoof.value = id;
    saveSnapshot();
  }

  function setFlushRoof(flush: boolean) {
    if (flushRoof.value === flush) return;
    flushRoof.value = flush;
    saveSnapshot();
  }

  function selectRoofCovering(id: RoofCovering) {
    roofCovering.value = id;
    saveSnapshot();
  }

  function selectLoft(id: string) {
    activeLoft.value = id;
    if (id === 'none') clearLoftRooms();
    saveSnapshot();
  }

  function toggleHasLoft(forceState?: boolean) {
    const next = forceState !== undefined ? forceState : activeLoft.value === 'none';
    activeLoft.value = next ? 'sleeping' : 'none';
    if (!next) clearLoftRooms();
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

  function setLoftStairType(type: LoftStairType) {
    loftStairType.value = type;
    hasLoftStair.value = true;
    saveSnapshot();
  }

  function setLoftStairPosition(position: LoftStairPosition) {
    loftStairPosition.value = position;
    hasLoftStair.value = true;
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

  function setDoorCanopy(on: boolean) {
    if (doorCanopy.value === on) return;
    doorCanopy.value = on;
    saveSnapshot();
  }

  function replaceTerrace(side: TerraceSide, patch: Partial<HouseTerrace>) {
    const current = terraces.value.find((item) => item.side === side);
    if (!current) return;
    const [next] = acceptTerraces([{ ...current, ...patch, side: patch.side ?? current.side }]);
    if (!next) return;
    if (next.side === current.side && next.depth === current.depth && next.span === current.span && next.roof === current.roof) return;
    if (next.side !== current.side && terraces.value.some((item) => item.side === next.side)) return;
    terraces.value = terraces.value.map((item) => (item.side === side ? next : item));
    saveSnapshot();
  }

  function addTerrace() {
    const used = new Set(terraces.value.map((item) => item.side));
    const side = TERRACE_SIDES.find((item) => !used.has(item));
    if (!side) return;
    terraces.value = [...terraces.value, { side, depth: 1.8, span: 'door', roof: false }];
    saveSnapshot();
  }

  function removeTerrace(side: TerraceSide) {
    if (!terraces.value.some((item) => item.side === side)) return;
    terraces.value = terraces.value.filter((item) => item.side !== side);
    saveSnapshot();
  }

  function setTerraceSide(side: TerraceSide, next: TerraceSide) {
    replaceTerrace(side, { side: next });
  }

  function setTerraceDepth(side: TerraceSide, depth: TerraceDepth) {
    if (!TERRACE_DEPTHS.includes(depth)) return;
    replaceTerrace(side, { depth });
  }

  function setTerraceSpan(side: TerraceSide, span: TerraceSpan) {
    replaceTerrace(side, { span });
  }

  function setTerraceRoof(side: TerraceSide, roof: boolean) {
    replaceTerrace(side, { roof });
  }

  function setTerraceBuilding(side: TerraceSide, building: TerraceBuilding) {
    replaceTerrace(side, { building });
  }

  function setTerraceBuildingPlacement(side: TerraceSide, buildingPlacement: TerraceBuildingPlacement) {
    replaceTerrace(side, { buildingPlacement });
  }

  function setFacing(next: CompassFacing) {
    if (facing.value === next) return;
    facing.value = next;
    saveSnapshot();
  }

  function previewSunHour(hour: number) {
    sunHour.value = clampSunHour(hour);
  }

  function commitSunHour(hour: number) {
    const next = clampSunHour(hour);
    sunHour.value = next;
    if (next === sunHourAtSnapshot) return;
    sunHourAtSnapshot = next;
    saveSnapshot();
  }

  function markDefaultView(view: CameraView) {
    const next = parseCameraView(view);
    if (!next) return;
    if (defaultView.value && viewsMatch(defaultView.value, next)) return;
    defaultView.value = next;
    saveSnapshot();
  }

  function selectMaterial(id: MaterialKey) {
    activeMaterial.value = id;
    activePaintId.value = null;
    paintPreview.value = null;
    saveSnapshot();
  }

  function selectCornerColor(color: string) {
    if (color.startsWith('#')) {
      const normalized = normalizeHex(color) ?? color.toLowerCase();
      if (!savedCornerColors.value.includes(normalized)) {
        savedCornerColors.value = [...savedCornerColors.value, normalized].slice(-12);
      }
      if (cornerColor.value === normalized) return;
      cornerColor.value = normalized;
    } else {
      if (cornerColor.value === color) return;
      cornerColor.value = color;
    }
    saveSnapshot();
  }

  function addCornerColor(color: string) {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    if (!savedCornerColors.value.includes(normalized)) {
      savedCornerColors.value = [...savedCornerColors.value, normalized].slice(-12);
    }
    cornerColor.value = normalized;
    saveSnapshot();
  }

  function removeCornerColor(color: string) {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    savedCornerColors.value = savedCornerColors.value.filter((c) => c !== normalized && c !== color);
    if (cornerColor.value === normalized || cornerColor.value === color) {
      cornerColor.value = savedCornerColors.value[savedCornerColors.value.length - 1] ?? 'same';
    }
    saveSnapshot();
  }

  function updateCornerColor(oldColor: string, newColor: string) {
    const normOld = normalizeHex(oldColor) ?? oldColor.toLowerCase();
    const normNew = normalizeHex(newColor) ?? newColor.toLowerCase();
    savedCornerColors.value = savedCornerColors.value.map((c) => (c === normOld ? normNew : c));
    if (cornerColor.value === normOld || cornerColor.value === oldColor) {
      cornerColor.value = normNew;
    }
    saveSnapshot();
  }

  function toggleCornerBoards() {
    cornerBoards.value = !cornerBoards.value;
    saveSnapshot();
  }

  function setCornerBoards(visible: boolean) {
    if (cornerBoards.value === visible) return;
    cornerBoards.value = visible;
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

  function removeSavedPaint(id: string) {
    savedPaints.value = savedPaints.value.filter((paint) => paint.id !== id);
    if (activePaintId.value === id) {
      const next = savedPaints.value[savedPaints.value.length - 1];
      if (next) {
        activePaintId.value = next.id;
      } else {
        activePaintId.value = null;
        activeMaterial.value = 'falurod';
      }
    }
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

  function setNotePin(id: string, pin: { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number; scope?: 'outside' | 'inside' } | null) {
    replaceNote(id, { pin: pin ? parseNotePin(pin) : null });
  }

  function resizeNote(id: string, width: number, height: number) {
    replaceNote(id, { width, height });
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

  function releaseWideDoor(slotId: string) {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    if (slot.itemId === 'SKJUTDORR' || slot.itemId === 'SKJUTDORR3') {
      for (const other of Object.values(wallSlots.value)) {
        if (other.coveredBy === slotId) other.coveredBy = undefined;
      }
    }
    const hostId = slot.coveredBy;
    if (!hostId) return;
    slot.coveredBy = undefined;
    const host = wallSlots.value[hostId];
    if (host?.itemId !== 'SKJUTDORR' && host?.itemId !== 'SKJUTDORR3') return;
    host.type = 'empty';
    host.itemId = undefined;
    for (const other of Object.values(wallSlots.value)) {
      if (other.coveredBy === hostId) other.coveredBy = undefined;
    }
  }

  function assignSlotItem(slotId: string, type: 'empty' | 'door' | 'window' | 'gate', itemId?: string) {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    const isUpper = slot.isUpper === true || slotId.endsWith('u');
    if ((type === 'door' || type === 'gate') && isUpper) return;
    releaseWideDoor(slotId);
    slot.type = type;
    slot.itemId = itemId;
    slot.coveredBy = undefined;
    if ((itemId === 'SKJUTDORR' || itemId === 'SKJUTDORR3') && !slot.isUpper) {
      const count = slot.wall === 'front' || slot.wall === 'back' ? 4 : 3;
      const partnerIndex = slot.index + 1 < count ? slot.index + 1 : slot.index - 1;
      const partner = wallSlots.value[`${slot.wall}-${partnerIndex}`];
      if (partner && !partner.isUpper) {
        releaseWideDoor(partner.id);
        partner.type = 'empty';
        partner.itemId = undefined;
        partner.coveredBy = slotId;
      }
    }
    saveSnapshot();
  }

  function removeSlotItem(slotId: string) {
    assignSlotItem(slotId, 'empty', undefined);
  }

  function moveSlotItem(fromId: string, toId: string): boolean {
    const success = moveWallSlot(wallSlots.value, fromId, toId);
    if (success) {
      selectedSlotId.value = toId;
      saveSnapshot();
    }
    return success;
  }

  function toggleDimensions() {
    showDimensions.value = !showDimensions.value;
  }

  function toggleInnerWalls() {
    showInnerWalls.value = !showInnerWalls.value;
  }

  function setShowInnerWalls(val: boolean) {
    showInnerWalls.value = val;
  }

  function toggleSunShown() {
    showSun.value = !showSun.value;
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
    const isUpper = slot.isUpper === true || selectedSlotId.value.endsWith('u');
    return !isUpper;
  });

  function setHoveredSlot(slotId: string | null, pos?: { x: number; y: number } | null) {
    hoveredSlotId.value = slotId;
    hoveredSlotPos.value = pos ?? null;
  }

  function setDragging(val: boolean) {
    isDragging.value = val;
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

  const factoryHouse = JSON.stringify(houseState());

  function isFactoryHouse(data: unknown) {
    try {
      return JSON.stringify(data) === factoryHouse;
    } catch {
      return false;
    }
  }

  return {
    viewMode,
    interactionMode,
    generateElectricalSignal,
    interiorFocusSignal,
    selectedCategory,
    categoryRequest,
    activeMaterial,
    customPaint,
    savedPaints,
    paintPreview,
    setPaintPreview,
    setCustomPaint,
    selectSavedPaint,
    panelOrientation,
    verticalDoorBay,
    claddingSizeId,
    cornerColor,
    savedCornerColors,
    cornerBoards,
    effectiveCornerHex,
    selectCornerColor,
    addCornerColor,
    removeCornerColor,
    updateCornerColor,
    removeSavedPaint,
    toggleCornerBoards,
    setCornerBoards,
    selectedSlotId,
    hoveredSlotId,
    hoveredSlotPos,
    slotScreenPosition,
    dimensionLabels,
    showDimensions,
    showInnerWalls,
    showSun,
    wallSlots,
    selectedSizeId,
    activeRoof,
    roofCovering,
    activeLoft,
    activeDoor,
    activeWindow,
    activeGate,
    doorCanopy,
    flushRoof,
    terraces,
    facing,
    sunHour,
    defaultView,
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
    loftStairType,
    loftStairPosition,
    loftTab,
    placedRooms,
    floorPlanDone,
    setFloorPlanDone,
    selectedRoomId,
    selectRoom,
    removePlacedRoom,
    toggleRoomWalls,
    commitRooms,
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
    swapBuildingPlan,
    concreteWidth,
    concreteDepth,
    concreteHeight,
    concreteWalls,
    setConcreteMeasure,
    swapConcretePlan,
    addConcreteWall,
    setConcreteWall,
    removeConcreteWall,
    selectRoof,
    setFlushRoof,
    selectRoofCovering,
    selectLoft,
    toggleHasLoft,
    setLoftCount,
    setLoftPlacement,
    setLoftSize,
    toggleLoftStair,
    setLoftStairType,
    setLoftStairPosition,
    setLoftTab,
    selectDoor,
    selectWindow,
    selectGate,
    setDoorCanopy,
    addTerrace,
    removeTerrace,
    setTerraceSide,
    setTerraceDepth,
    setTerraceSpan,
    setTerraceRoof,
    setTerraceBuilding,
    setTerraceBuildingPlacement,
    setFacing,
    previewSunHour,
    commitSunHour,
    markDefaultView,
    selectMaterial,
    selectPanelOrientation,
    selectCladdingSize,
    selectSlot,
    setHoveredSlot,
    isDragging,
    setDragging,
    setSlotScreenPosition,
    setDimensionLabels,
    cycleSlot,
    deselectSlot,
    assignSlotItem,
    removeSlotItem,
    moveSlotItem,
    toggleDimensions,
    toggleInnerWalls,
    setShowInnerWalls,
    toggleSunShown,
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
    isFactoryHouse,
    notes,
    showNotes,
    showMood,
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
    resizeNote,
    commitNotes,
    toggleNotes,
    setNoteAnchors
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
