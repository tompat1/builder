import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed, reactive, watch } from 'vue';
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
import { loadDisplayPrefs, saveDisplayPrefs, type DisplayPrefs } from '../services/displayPrefs';
import { saveAccountDisplay, sessionToken } from '../services/account';
import {
  isLoftRoom,
  loftDeckBounds,
  loftStairClearOnDeck,
  maximizeLoftBedroom
} from '../three-engine/loftLevel';
import { fitRoom, innerHalf } from '../three-engine/roomWalls';
import {
  CONCRETE_DEFAULT_HEIGHT_MM,
  CONCRETE_PLAN_MM,
  PAABYGGNAD_MAX_HEIGHT_MM,
  acceptConcreteWalls,
  clampConcretePlan,
  clampConcreteWall,
  clampPaabyggnadPlan,
  isConcreteFoundationOnly,
  paabyggnadLoftAreas,
  paabyggnadWallSlots,
  CONCRETE_WALL_LIMIT,
  type ConcreteWall
} from './paabyggnad';
import {
  STUGAN_V4_CLADDING_HEX,
  STUGAN_V4_DECK_DEPTH_MM,
  STUGAN_V4_DEFAULT_LOFT_M2,
  STUGAN_V4_DEPTH_MM,
  STUGAN_V4_FOOTPRINT_M2,
  STUGAN_V4_HIGH_EAVE_MM,
  STUGAN_V4_ROOF_PITCH_DEG,
  STUGAN_V4_SIZE_ID,
  STUGAN_V4_WIDTH_MM,
  isStuganV4,
  solveStuganV4Stair,
  stuganV4Conflicts,
  stuganV4LoftAreaSqMeters,
  stuganV4PlacedRooms,
  type StuganConflict,
  type StuganStairSolution
} from './stuganV4';
import { overlightItem } from '../three-engine/windowFit';
import { acceptPlacedRooms, type PlacedRoom } from '../three-engine/roomWalls';
import {
  acceptTerraces,
  TERRACE_DEPTHS,
  MIN_TERRACE_DEPTH,
  MAX_TERRACE_DEPTH,
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
  type TerraceBuildingRoof,
  TERRACE_BUILDING_ROOFS,
  type SaunaTurn,
  SAUNA_TURNS,
  type SaunaColor,
  SAUNA_COLORS,
  type SaunaDoor,
  SAUNA_DOORS,
  type SaunaWindow,
  SAUNA_WINDOWS,
  type SaunaWindowPlacement,
  SAUNA_WINDOW_PLACEMENTS,
  type SaunaSize,
  SAUNA_SIZES,
  type SaunaWindowSize,
  SAUNA_WINDOW_SIZES,
  SAUNA_BUILDING_PRICE,
  SHED_BUILDING_PRICE,
  HOT_TUB_BUILDING_PRICE
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
export type CategoryKey = 'size' | 'color' | 'roof' | 'loft' | 'interior' | 'doors' | 'windows' | 'gates' | 'extras';
export type MaterialKey = 'wood' | 'falurod' | 'grey' | 'white' | 'black';

/** Saved facade + corner + frame combination. */
export interface ColorCombo {
  id: string;
  name: string;
  material: MaterialKey;
  paintId: string | null;
  paintHex: string | null;
  cornerColor: string;
  cornerBoards: boolean;
  frameColor: string;
}

export const COLOR_COMBO_LIMIT = 12;
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
    badge: 'Flexibel yta',
    width: 5200,
    depth: 6731,
    height: 5000,
    areaSqMeters: 35.0,
    basePrice: 98000,
    desc: '5200 × 5200 mm betonghus, 2,5 m högt. Gamla taket tas bort. Träloft och påbyggnad ovanför, höjd upp till 500 cm, flexibel yta.'
  },
  {
    id: STUGAN_V4_SIZE_ID,
    name: 'Stugan V4',
    badge: 'Koncept',
    width: STUGAN_V4_WIDTH_MM,
    depth: STUGAN_V4_DEPTH_MM,
    height: STUGAN_V4_HIGH_EAVE_MM,
    areaSqMeters: STUGAN_V4_FOOTPRINT_M2,
    basePrice: 168000,
    desc: '6000 × 6600 mm. Pulpet 10° öst→väst (6 m östvägg), loft längs öst, söderglas, trädäck 3 m. Koncept — se konflikter.'
  },
  {
    id: 'size-garage',
    name: 'Garage & carport',
    badge: 'Garage',
    width: 6000,
    depth: 6000,
    height: 3200,
    areaSqMeters: 36.0,
    basePrice: 125000,
    desc: '6000 × 6000 mm. Rymligt garage med plats för bil, förvaring och garageport.'
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

/** High-end wall height cannot exceed 5 m (Stugan V4 may reach the concept eave at 6.4 m). */
export const BUILDING_LIMITS = {
  width: { min: 3600, max: 12000 },
  depth: { min: 2500, max: 10000 },
  height: { min: 2400, max: 5000 }
} as const;

/** Concept eave for Stugan V4 — above the general 5 m cap. */
export const STUGAN_V4_HEIGHT_LIMIT = {
  min: 4500,
  max: STUGAN_V4_HIGH_EAVE_MM
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
export type LoftStairPosition = 'front' | 'back' | 'middle';

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
    id: 'BASTUDORR',
    name: 'BASTU HELGLAS',
    desc: 'Bastudörr i härdat säkerhetsglas m. träkarm & trähandtag, 9x21',
    spec: 'Mått 9×21, 8 mm härdat säkerhetsglas',
    priceDelta: 4900,
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

export type { HouseTerrace, TerraceDepth, TerraceSide, TerraceSpan, TerraceBuilding, TerraceBuildingPlacement, TerraceBuildingRoof, SaunaTurn };
export { TERRACE_BUILDINGS, TERRACE_BUILDING_PLACEMENTS, SAUNA_BUILDING_PRICE, SHED_BUILDING_PRICE, HOT_TUB_BUILDING_PRICE };

import {
  type WallSlot,
  type WindowRhythmCount,
  PANEL_COUNTS,
  panelCountForWall,
  createWallSlots,
  clearedWallSlots,
  cubeWallSlots,
  saunaWallSlots,
  shedWallSlots,
  garageWallSlots,
  stuganV4WallSlots,
  mergeWallSlots,
  freeLowerRunForRhythm,
  freeBandRunForRhythm,
  bandSlotId
} from './wallSlots';
import { clearWindowRhythmSlots, releaseWindowRhythmSlots } from './slotMove';

export type { WallSlot, WindowRhythmCount } from './wallSlots';
export {
  PANEL_COUNTS,
  panelCountForWall,
  createWallSlots,
  clearedWallSlots,
  cubeWallSlots,
  saunaWallSlots,
  shedWallSlots,
  garageWallSlots,
  stuganV4WallSlots,
  mergeWallSlots,
  paabyggnadWallSlots,
  freeLowerRunForRhythm,
  freeBandRunForRhythm,
  bandSlotId
};
export {
  STUGAN_V4_SIZE_ID,
  isStuganV4,
  solveStuganV4Stair,
  stuganV4Conflicts,
  stuganV4LoftAreaSqMeters
} from './stuganV4';
export type { StuganConflict, StuganStairSolution } from './stuganV4';

function parseColorCombos(raw: unknown): ColorCombo[] {
  if (!Array.isArray(raw)) return [];
  const materials = new Set(MATERIAL_OPTIONS.map((item) => item.id));
  const out: ColorCombo[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id : '';
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const material = typeof row.material === 'string' && materials.has(row.material as MaterialKey)
      ? (row.material as MaterialKey)
      : null;
    const corner = typeof row.cornerColor === 'string' ? row.cornerColor : null;
    const frame = typeof row.frameColor === 'string' ? row.frameColor : null;
    if (!id || !name || !material || !corner || !frame) continue;
    out.push({
      id,
      name: name.slice(0, 40),
      material,
      paintId: typeof row.paintId === 'string' ? row.paintId : null,
      paintHex: typeof row.paintHex === 'string' ? row.paintHex : null,
      cornerColor: corner,
      cornerBoards: row.cornerBoards !== false,
      frameColor: frame
    });
    if (out.length >= COLOR_COMBO_LIMIT) break;
  }
  return out;
}

export const useConfigStore = defineStore('config', () => {
  const displayPrefs = loadDisplayPrefs();
  const viewMode = ref<ViewMode>('utsida');
  const framingWalkthrough = ref<boolean>(false);
  const framingStep = ref<number>(1);
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
  /** Window / door frame colour: 'same' | 'white' | 'falurod' | 'grey' | 'black' | 'wood' | custom hex */
  const frameColor = ref<string>('white');
  /** Saved custom window frame colors */
  const savedFrameColors = ref<string[]>([]);
  /** Named facade + corner + frame combinations */
  const savedColorCombos = ref<ColorCombo[]>([]);
  const activeColorComboId = ref<string | null>(null);
  /** Exterior color of the concrete walls (hex code) */
  const concreteColor = ref<string>('#b7b3ac');
  /** Saved custom concrete colors */
  const savedConcreteColors = ref<string[]>([]);
  /** Exterior corner boards (knutbrädor) show/hide */
  const cornerBoards = ref<boolean>(true);
  const isFullscreen = ref<boolean>(false);
  const showDimensions = ref(displayPrefs.dimensions);
  const showInnerWalls = ref<boolean>(true);
  const showSun = ref(displayPrefs.sun);
  const isDragging = ref(false);
  const selectedSlotId = ref<string | null>(null);
  /** Window bays that still stick out of their wall, so the panel card can offer a fit. */
  const windowFitOffers = ref<string[]>([]);
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
  /** Stugan V4: bedroom partitions stay unlocked until the stair solution is accepted. */
  const stuganBedroomWallsLocked = ref(false);
  const selectedRoomId = ref<string | null>(null);
  const floorPlanDone = ref(false);

  const selectRoom = (id: string | null) => {
    selectedRoomId.value = id && placedRooms.value[id] ? id : null;
  }

  const removePlacedRoom = (id: string) => {
    if (!placedRooms.value[id]) return;
    const next = { ...placedRooms.value };
    delete next[id];
    placedRooms.value = next;
    if (selectedRoomId.value === id) selectedRoomId.value = null;
    if (Object.keys(next).length === 0) floorPlanDone.value = false;
  }

  const setFloorPlanDone = (done: boolean) => {
    if (done && Object.keys(placedRooms.value).length === 0) return;
    if (floorPlanDone.value === done) return;
    floorPlanDone.value = done;
    commitHouse();
  }

  const toggleRoomWalls = (id: string) => {
    const room = placedRooms.value[id];
    if (!room) return;
    const wallsVisible = !room.wallsVisible;
    let next = { ...room, wallsVisible };
    // Turning walls on for a loft bedroom: fill the deck zone and keep the stair clear.
    if (
      wallsVisible
      && room.type === 'bedroom'
      && isLoftRoom(room.y)
      && hasLoft.value
    ) {
      const widthM = buildingWidth.value / 1000;
      const depthM = buildingDepth.value / 1000;
      const loft = loftDeckBounds(
        widthM,
        depthM,
        selectedLoftSize.value ?? 10.95,
        loftPlacement.value,
        loftCount.value === 'tva',
        selectedSizeId.value === 'size-paabyggnad'
      );
      const maximized = maximizeLoftBedroom({
        x: room.x,
        z: room.z,
        loft,
        stair: loftStairClearOnDeck({
          loft,
          placement: loftPlacement.value,
          stairPosition: loftStairPosition.value,
          stairType: loftStairType.value,
          hasStair: hasLoftStair.value
        })
      });
      const { hx, hz } = innerHalf(widthM, depthM);
      const fitted = fitRoom(maximized, hx, hz, {
        minX: loft.minX,
        maxX: loft.maxX,
        minZ: loft.minZ,
        maxZ: loft.maxZ
      });
      next = { ...next, ...fitted };
    }
    placedRooms.value = {
      ...placedRooms.value,
      [id]: next
    };
    commitHouse();
  }

  const commitRooms = () => {
    commitHouse();
  }

  const clearLoftRooms = () => {
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
  const showNotes = ref(displayPrefs.notes);
  const showMood = ref(displayPrefs.mood);
  watch([showDimensions, showNotes, showSun, showMood], () => {
    const prefs: DisplayPrefs = {
      dimensions: showDimensions.value,
      notes: showNotes.value,
      sun: showSun.value,
      mood: showMood.value
    };
    saveDisplayPrefs(prefs);
    if (sessionToken()) {
      void saveAccountDisplay(prefs);
    }
  });

  const applyDisplayPrefs = (prefs: DisplayPrefs) => {
    showDimensions.value = prefs.dimensions;
    showNotes.value = prefs.notes;
    showSun.value = prefs.sun;
    showMood.value = prefs.mood;
    saveDisplayPrefs(prefs);
  }

  const activeNoteId = ref<string | null>(null);
  const noteAnchors = ref<Record<string, { x: number; y: number; visible: boolean }>>({});
  const noteCamera = ref('');
  const notePlanes = ref<Record<string, { transform: string; visible: boolean }>>({});

  // History stacks for Undo / Redo
  const history = ref<string[]>([]);
  const historyIndex = ref<number>(-1);

  const parseCameraView = (value: unknown): CameraView | null  => {
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

  const viewsMatch = (a: CameraView, b: CameraView) => {
    return (['x', 'y', 'z', 'tx', 'ty', 'tz'] as const).every((key) => Math.abs(a[key] - b[key]) < 0.01);
  }

  const houseState = () => {
    return {
      selectedSizeId: selectedSizeId.value,
      buildingWidth: buildingWidth.value,
      buildingDepth: buildingDepth.value,
      buildingHeight: buildingHeight.value,
      concreteWidth: concreteWidth.value,
      concreteDepth: concreteDepth.value,
      concreteHeight: concreteHeight.value,
      concreteWalls: concreteWalls.value.map((wall) => ({ ...wall })),
      concreteColor: concreteColor.value,
      savedConcreteColors: savedConcreteColors.value,
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
      frameColor: frameColor.value,
      savedFrameColors: savedFrameColors.value,
      savedColorCombos: savedColorCombos.value,
      activeColorComboId: activeColorComboId.value,
      cornerBoards: cornerBoards.value,
      wallSlots: wallSlots.value,
      notes: notes.value,
      placedRooms: placedRooms.value,
      stuganBedroomWallsLocked: stuganBedroomWallsLocked.value,
      floorPlanDone: floorPlanDone.value,
      showInnerWalls: showInnerWalls.value
    };
  }

  const saveSnapshot = () => {
    const snapshot = JSON.stringify(houseState());
    // Truncate forward history if we were in the middle
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(snapshot);
    historyIndex.value = history.value.length - 1;
  }

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      applySnapshot(history.value[historyIndex.value]);
    }
  }

  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      applySnapshot(history.value[historyIndex.value]);
    }
  }

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const applySnapshot = (snapshotStr: string) => {
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
      concreteWalls.value = data.selectedSizeId === 'size-paabyggnad'
        ? acceptConcreteWalls(data.concreteWalls, loadedHeight.width, loadedHeight.depth)
        : [];
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
      loftStairPosition.value =
        data.loftStairPosition === 'back'
          ? 'back'
          : data.loftStairPosition === 'middle'
            ? 'middle'
            : 'front';
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
      frameColor.value = typeof data.frameColor === 'string' ? data.frameColor : 'white';
      savedFrameColors.value = Array.isArray(data.savedFrameColors)
        ? data.savedFrameColors.filter((c: unknown): c is string => typeof c === 'string' && c.startsWith('#'))
        : (frameColor.value.startsWith('#') ? [frameColor.value] : []);
      if (frameColor.value.startsWith('#') && !savedFrameColors.value.includes(frameColor.value)) {
        savedFrameColors.value.push(frameColor.value);
      }
      savedColorCombos.value = parseColorCombos(data.savedColorCombos);
      activeColorComboId.value =
        typeof data.activeColorComboId === 'string' &&
        savedColorCombos.value.some((combo) => combo.id === data.activeColorComboId)
          ? data.activeColorComboId
          : null;
      concreteColor.value = typeof data.concreteColor === 'string' ? data.concreteColor : '#b7b3ac';
      savedConcreteColors.value = Array.isArray(data.savedConcreteColors)
        ? data.savedConcreteColors.filter((c: unknown): c is string => typeof c === 'string' && c.startsWith('#'))
        : (concreteColor.value.startsWith('#') && concreteColor.value !== '#b7b3ac' ? [concreteColor.value] : []);
      if (concreteColor.value.startsWith('#') && !savedConcreteColors.value.includes(concreteColor.value) && concreteColor.value !== '#b7b3ac') {
        savedConcreteColors.value.push(concreteColor.value);
      }
      cornerBoards.value = data.cornerBoards !== false;
      wallSlots.value = mergeWallSlots(data.wallSlots, data.selectedSizeId ?? selectedSizeId.value);
      if (data.selectedSizeId === 'size-paabyggnad' && (!wallSlots.value['back-2'] || wallSlots.value['back-2'].type === 'empty')) {
            wallSlots.value['back-2'] = {
              ...(wallSlots.value['back-2'] ?? { id: 'back-2', wall: 'back', index: 2 }),
              type: 'door',
              itemId: 'STEHAG',
              canAcceptDoor: true
            };
      }
      placedRooms.value = acceptPlacedRooms(data.placedRooms);
      stuganBedroomWallsLocked.value =
        isStuganV4(data.selectedSizeId) && data.stuganBedroomWallsLocked === true;
      if (data.selectedSizeId === 'size-paabyggnad') {
        if (placedRooms.value.bathroom_1) {
          const b = placedRooms.value.bathroom_1;
          if (Math.abs(b.x - -1.43) < 0.05 && Math.abs(b.z - -2.1955) < 0.05) {
            b.x = -1.10;
            b.z = -1.8655;
          }
        }
        const hasLoftBedrooms = Boolean(
          (placedRooms.value.bedroom_1 && isLoftRoom(placedRooms.value.bedroom_1.y)) ||
          (placedRooms.value.bedroom_2 && isLoftRoom(placedRooms.value.bedroom_2.y))
        );
        if (hasLoftBedrooms) {
          const b1 = placedRooms.value.bedroom_1;
          const b2 = placedRooms.value.bedroom_2;
          const refY = b1?.y ?? b2?.y ?? 2.8;
          const refZ = b1 && b1.z <= 2.2 ? b1.z : 1.69;

          if (!placedRooms.value.bedroom_1) {
            placedRooms.value.bedroom_1 = {
              type: 'bedroom',
              w: 2.4,
              d: 2.8,
              x: -1.21,
              y: refY,
              z: refZ,
              wallsVisible: b2?.wallsVisible ?? true
            };
          } else {
            placedRooms.value.bedroom_1.w = Math.min(placedRooms.value.bedroom_1.w, 2.4);
            if (placedRooms.value.bedroom_1.x > -0.2) placedRooms.value.bedroom_1.x = -1.21;
            if (placedRooms.value.bedroom_1.z > 2.2 || placedRooms.value.bedroom_1.z + placedRooms.value.bedroom_1.d / 2 > 3.18) {
              placedRooms.value.bedroom_1.z = refZ;
            }
          }

          if (!placedRooms.value.bedroom_2) {
            placedRooms.value.bedroom_2 = {
              type: 'bedroom',
              w: 2.4,
              d: 2.8,
              x: 1.21,
              y: refY,
              z: refZ,
              wallsVisible: b1?.wallsVisible ?? true
            };
          } else {
            placedRooms.value.bedroom_2.w = Math.min(placedRooms.value.bedroom_2.w, 2.4);
            if (placedRooms.value.bedroom_2.x < 0.2) placedRooms.value.bedroom_2.x = 1.21;
            if (placedRooms.value.bedroom_2.z > 2.2 || placedRooms.value.bedroom_2.z + placedRooms.value.bedroom_2.d / 2 > 3.18) {
              placedRooms.value.bedroom_2.z = refZ;
            }
          }
        }
      }
      floorPlanDone.value = data.floorPlanDone === true && Object.keys(placedRooms.value).length > 0;
      showInnerWalls.value = data.showInnerWalls !== false;
      notes.value = acceptNotes(data.notes);
    } catch {
      // ignore parse error
    }
  }

  const exportHouse = () => {
    return houseState();
  }

  const importHouse = (data: unknown) => {
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
    if (isStuganV4(selectedSizeId.value) && activeRoof.value === 'pulpettak') {
      return STUGAN_V4_ROOF_PITCH_DEG;
    }
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
    if (isStuganV4(selectedSizeId.value) && activeRoof.value === 'pulpettak') {
      return dimensions.value.height;
    }
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
      const span = isStuganV4(selectedSizeId.value) ? dimensions.value.width : dimensions.value.depth;
      const drop = Math.round(span * Math.tan((roofPitchAngle.value * Math.PI) / 180));
      return Math.max(Math.round(eaveHeight.value - drop), 1800);
    }
    return eaveHeight.value;
  });

  const stuganConflicts = computed(() =>
    isStuganV4(selectedSizeId.value) ? stuganV4Conflicts(solveStuganV4Stair()) : ([] as StuganConflict[])
  );

  const stuganStair = computed(() =>
    isStuganV4(selectedSizeId.value) ? solveStuganV4Stair() : null
  );

  const lockStuganBedroomWalls = (locked: boolean) => {
    if (!isStuganV4(selectedSizeId.value)) return;
    if (locked && stuganStair.value && !stuganStair.value.fitsInCentralZone) return;
    stuganBedroomWallsLocked.value = locked;
    saveSnapshot();
  };

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
    } else if (isStuganV4(selectedSizeId.value)) {
      // Same catalog as size-25 — no full-strip 23 m² option.
      return [
        { areaSqMeters: 8.21, label: '8,21 m²', descId: 'compact', desc: 'Kompakt sovloft', priceDelta: 16200 },
        { areaSqMeters: 12.32, label: '12,32 m²', descId: 'standard', desc: 'Standardloft', priceDelta: 21500 },
        { areaSqMeters: 16.4, label: '16,4 m²', descId: 'large', desc: 'Stort sovloft', priceDelta: 26800 },
        { areaSqMeters: 22.8, label: '22,8 m²', descId: 'whole-floor', desc: 'Hela golvytan', priceDelta: 32500 }
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

  const toggleViewMode = () => {
    framingWalkthrough.value = false;
    viewMode.value = viewMode.value === 'utsida' ? 'insida' : 'utsida';
  }

  const setViewMode = (mode: ViewMode) => {
    framingWalkthrough.value = false;
    viewMode.value = mode;
  }

  const startFramingWalkthrough = () => {
    framingWalkthrough.value = true;
    framingStep.value = 1;
  };

  const stopFramingWalkthrough = () => {
    framingWalkthrough.value = false;
  };

  const setFramingStep = (step: number) => {
    framingStep.value = Math.max(1, Math.min(7, Math.round(step || 1)));
  };

  const nextFramingStep = () => {
    if (framingStep.value < 7) {
      framingStep.value++;
    }
  };

  const prevFramingStep = () => {
    if (framingStep.value > 1) {
      framingStep.value--;
    }
  };

  const setInteractionMode = (mode: InteractionMode) => {
    interactionMode.value = mode;
  }

  const triggerGenerateElectrical = () => {
    generateElectricalSignal.value++;
  }

  let viewModeBeforeLoft: ViewMode | null = null;

  const selectCategory = (category: CategoryKey) => {
    framingWalkthrough.value = false;
    const effectiveCategory = category === 'gates' ? 'doors' : category;
    if (effectiveCategory === 'doors' || effectiveCategory === 'windows' || effectiveCategory === 'extras' || effectiveCategory === 'color') {
      viewMode.value = 'utsida';
      viewModeBeforeLoft = null;
    } else if (effectiveCategory === 'loft') {
      if (selectedCategory.value !== 'loft') {
        viewModeBeforeLoft = viewMode.value;
      }
      viewMode.value = 'insida';
    } else if (effectiveCategory === 'interior') {
      if (selectedCategory.value !== 'interior') {
        viewModeBeforeLoft = viewMode.value;
      }
      viewMode.value = 'insida';
      interiorFocusSignal.value++;
    } else if (['loft', 'interior'].includes(selectedCategory.value) && !['loft', 'interior'].includes(effectiveCategory) && viewModeBeforeLoft) {
      viewMode.value = viewModeBeforeLoft;
      viewModeBeforeLoft = null;
    }
    if (effectiveCategory !== 'interior') {
      interactionMode.value = 'default';
    }
    selectedCategory.value = effectiveCategory;
    categoryRequest.value += 1;
  }

  const clampMeasure = (axis: BuildingAxis, value: number) => {
    const limit =
      axis === 'height' && isStuganV4(selectedSizeId.value)
        ? STUGAN_V4_HEIGHT_LIMIT
        : BUILDING_LIMITS[axis];
    if (!Number.isFinite(value)) {
      if (axis === 'width') return buildingWidth.value;
      if (axis === 'depth') return buildingDepth.value;
      return buildingHeight.value;
    }
    return Math.round(Math.min(limit.max, Math.max(limit.min, value)));
  }

  const applyPresetSize = (id: string) => {
    const preset = SIZE_OPTIONS.find((size) => size.id === id);
    if (!preset) return;
    buildingWidth.value = preset.width;
    buildingDepth.value = preset.depth;
    buildingHeight.value = preset.height;
  }

  const applyCubeShell = () => {
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

  const applySaunaShell = () => {
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

  const applyShedShell = () => {
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

  const applyGarageShell = () => {
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
    wallSlots.value = garageWallSlots();
    activeDoor.value = 'STEHAG';
    activeGate.value = 'overhead-white';
    activeWindow.value = 'standard-single';
    selectedSlotId.value = null;
  }

  const applyPlainShell = () => {
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

  /**
   * Stugan V4 massing: east→west 10° pulpet (6 m east wall), east loft, south deck + glazing.
   * Bedroom partitions stay unlocked until the central U-stair is accepted.
   */
  const applyStuganV4Shell = () => {
    panelOrientation.value = 'liggande';
    verticalDoorBay.value = true;
    doorCanopy.value = false;
    flushRoof.value = false;
    claddingSizeId.value = '22x170';
    terraces.value = [
      {
        side: 'front',
        depth: STUGAN_V4_DECK_DEPTH_MM / 1000,
        span: 'full',
        roof: false
      }
    ];
    activeRoof.value = 'pulpettak';
    roofCovering.value = 'metal';
    flushRoof.value = false;
    activeMaterial.value = 'wood';
    // Screen stand-in for Nordsjö H7.15.53 — listed as uncertain in conflicts.
    const paint = parseCustomPaint({ hex: STUGAN_V4_CLADDING_HEX, system: 'hex' });
    if (paint) {
      const id = `paint_stugan_v4_${STUGAN_V4_CLADDING_HEX.replace('#', '')}`;
      const existing = savedPaints.value.find((item) => item.hex.toLowerCase() === paint.hex.toLowerCase());
      if (existing) activePaintId.value = existing.id;
      else {
        savedPaints.value = [{ id, ...paint }, ...savedPaints.value].slice(0, SAVED_PAINT_LIMIT);
        activePaintId.value = id;
      }
    } else {
      activePaintId.value = null;
    }
    activeLoft.value = 'sleeping';
    loftCount.value = 'ett';
    loftPlacement.value = 'hoger';
    hasLoftStair.value = true;
    loftStairType.value = 'straight';
    loftStairPosition.value = 'middle';
    selectedLoftSize.value = STUGAN_V4_DEFAULT_LOFT_M2;
    facing.value = 'south';
    wallSlots.value = stuganV4WallSlots();
    activeDoor.value = 'LERVIK';
    activeWindow.value = 'panorama';
    selectedSlotId.value = null;
    // Bottenplan + loftväggar enligt planer.svg; trappa centrerad med standardbredd 900 mm.
    placedRooms.value = stuganV4PlacedRooms();
    stuganBedroomWallsLocked.value = true;
    floorPlanDone.value = true;
  };

  const selectSize = (id: string) => {
    const shelled =
      id === 'size-cube' ||
      id === 'size-sauna' ||
      id === 'size-shed' ||
      id === 'size-garage' ||
      id === 'size-paabyggnad' ||
      isStuganV4(id);
    const leavingShell =
      !shelled &&
      (selectedSizeId.value === 'size-cube' ||
        selectedSizeId.value === 'size-sauna' ||
        selectedSizeId.value === 'size-shed' ||
        selectedSizeId.value === 'size-garage' ||
        selectedSizeId.value === 'size-paabyggnad' ||
        isStuganV4(selectedSizeId.value));
    selectedSizeId.value = id;
    applyPresetSize(id);
    if (id === 'size-cube') applyCubeShell();
    else if (id === 'size-sauna') applySaunaShell();
    else if (id === 'size-shed') applyShedShell();
    else if (id === 'size-garage') applyGarageShell();
    else if (isStuganV4(id)) applyStuganV4Shell();
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
      const slots = paabyggnadWallSlots(buildingWidth.value, buildingDepth.value);
      if (slots['front-0']) {
        slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'STEHAG', canAcceptDoor: true };
      }
      if (slots['back-2']) {
        slots['back-2'] = { ...slots['back-2'], type: 'door', itemId: 'STEHAG', canAcceptDoor: true };
      }
      wallSlots.value = slots;
      selectedSlotId.value = null;
      placedRooms.value = {
        bathroom_1: {
          type: 'bathroom',
          w: 2,
          d: 2,
          x: -1.10,
          y: 0.3,
          z: -1.8655,
          wallsVisible: true
        },
        bedroom_1: {
          type: 'bedroom',
          w: 2.4,
          d: 2.8,
          x: -1.21,
          y: 2.8,
          z: 1.69,
          wallsVisible: true
        },
        bedroom_2: {
          type: 'bedroom',
          w: 2.4,
          d: 2.8,
          x: 1.21,
          y: 2.8,
          z: 1.69,
          wallsVisible: true
        }
      };
      terraces.value = [
        {
          side: 'back',
          depth: 2.4,
          span: 'full',
          roof: false,
          building: 'sauna',
          buildingPlacement: 'right',
          buildingRoof: 'pulpet'
        }
      ];
    } else {
      concreteWalls.value = [];
    }
    // Ensure selectedLoftSize is valid for this new size
    const available = availableLoftSizes.value;
    if (available.length > 0 && !available.some((s) => Math.abs(s.areaSqMeters - selectedLoftSize.value) < 0.1)) {
      selectedLoftSize.value = available[0].areaSqMeters;
    }
    saveSnapshot();
  }

  const reconcileWallSlots = () => {
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
          const isStandardFront = wall === 'front' && selectedSizeId.value !== 'size-sauna' && selectedSizeId.value !== 'size-shed' && selectedSizeId.value !== 'size-garage';
          const isWindow = isPaabyggnadFront || isStandardFront;
          updated[upperId] = {
            id: upperId,
            wall,
            index: i,
            type: isWindow ? 'window' : 'empty',
            itemId: isWindow ? 'standard-single' : undefined,
            canAcceptDoor: false,
            isUpper: true,
            fitToWall: isWindow ? true : undefined
          };
          changed = true;
        }
      }
    });

    if (changed) {
      wallSlots.value = updated;
    }
  }

  const setBuildingMeasure = (axis: BuildingAxis, value: number) => {
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

  const setConcreteMeasure = (axis: BuildingAxis, value: number) => {
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

  const addConcreteWall = () => {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
    if (isConcreteFoundationOnly(concreteHeight.value)) return;
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

  const setConcreteWall = (id: string, patch: Partial<Pick<ConcreteWall, 'axis' | 'offsetMm'>>) => {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
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

  const removeConcreteWall = (id: string) => {
    if (selectedSizeId.value !== 'size-paabyggnad') return;
    if (!concreteWalls.value.some((wall) => wall.id === id)) return;
    concreteWalls.value = concreteWalls.value.filter((wall) => wall.id !== id);
    saveSnapshot();
  }

  const swapConcretePlan = () => {
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

  const swapBuildingPlan = () => {
    const nextWidth = clampMeasure('width', buildingDepth.value);
    const nextDepth = clampMeasure('depth', buildingWidth.value);
    if (nextWidth === buildingWidth.value && nextDepth === buildingDepth.value) return;
    buildingWidth.value = nextWidth;
    buildingDepth.value = nextDepth;
    reconcileWallSlots();
    saveSnapshot();
  }

  const selectRoof = (id: string) => {
    activeRoof.value = id;
    saveSnapshot();
  }

  const setFlushRoof = (flush: boolean) => {
    if (flushRoof.value === flush) return;
    flushRoof.value = flush;
    saveSnapshot();
  }

  const selectRoofCovering = (id: RoofCovering) => {
    roofCovering.value = id;
    saveSnapshot();
  }

  const selectLoft = (id: string) => {
    activeLoft.value = id;
    if (id === 'none') clearLoftRooms();
    saveSnapshot();
  }

  const toggleHasLoft = (forceState?: boolean) => {
    const next = forceState !== undefined ? forceState : activeLoft.value === 'none';
    activeLoft.value = next ? 'sleeping' : 'none';
    if (!next) clearLoftRooms();
    saveSnapshot();
  }

  const setLoftCount = (count: LoftCount) => {
    loftCount.value = count;
    saveSnapshot();
  }

  const setLoftPlacement = (placement: LoftPlacement) => {
    loftPlacement.value = placement;
    saveSnapshot();
  }

  const setLoftSize = (area: number) => {
    selectedLoftSize.value = area;
    saveSnapshot();
  }

  const toggleLoftStair = () => {
    hasLoftStair.value = !hasLoftStair.value;
    saveSnapshot();
  }

  const setLoftStairType = (type: LoftStairType) => {
    loftStairType.value = type;
    hasLoftStair.value = true;
    saveSnapshot();
  }

  const setLoftStairPosition = (position: LoftStairPosition) => {
    if (position !== 'front' && position !== 'back' && position !== 'middle') return;
    loftStairPosition.value = position;
    hasLoftStair.value = true;
    saveSnapshot();
  }

  const setLoftTab = (tab: LoftTab) => {
    loftTab.value = tab;
  }

  const selectDoor = (id: string) => {
    activeDoor.value = id;
    saveSnapshot();
  }

  const selectWindow = (id: string) => {
    activeWindow.value = id;
    saveSnapshot();
  }

  const selectGate = (id: string) => {
    activeGate.value = id;
    saveSnapshot();
  }

  const setDoorCanopy = (on: boolean) => {
    if (doorCanopy.value === on) return;
    doorCanopy.value = on;
    saveSnapshot();
  }

  const replaceTerrace = (side: TerraceSide, patch: Partial<HouseTerrace>) => {
    const current = terraces.value.find((item) => item.side === side);
    if (!current) return;
    const [next] = acceptTerraces([{ ...current, ...patch, side: patch.side ?? current.side }]);
    if (!next) return;
    const buildingChanged = (next.building ?? 'none') !== (current.building ?? 'none');
    const hotTubChanged = Boolean(next.hotTub) !== Boolean(current.hotTub);
    const placementChanged = (next.buildingPlacement ?? 'right') !== (current.buildingPlacement ?? 'right');
    const buildingRoofChanged = (next.buildingRoof ?? 'pulpet') !== (current.buildingRoof ?? 'pulpet');
    const buildingTurnChanged = (next.buildingTurn ?? 0) !== (current.buildingTurn ?? 0);
    const buildingColorChanged = (next.buildingColor ?? 'natural') !== (current.buildingColor ?? 'natural');
    const buildingDoorChanged = (next.buildingDoor ?? 'glass') !== (current.buildingDoor ?? 'glass');
    const buildingWindowChanged = (next.buildingWindow ?? 'panorama') !== (current.buildingWindow ?? 'panorama');
    const buildingWindowPlacementChanged = (next.buildingWindowPlacement ?? 'yard') !== (current.buildingWindowPlacement ?? 'yard');
    const buildingSizeChanged = (next.buildingSize ?? 'standard') !== (current.buildingSize ?? 'standard');
    const buildingWindowSizeChanged = (next.buildingWindowSize ?? 'standard') !== (current.buildingWindowSize ?? 'standard');
    if (
      next.side === current.side &&
      next.depth === current.depth &&
      next.span === current.span &&
      next.roof === current.roof &&
      !buildingChanged &&
      !hotTubChanged &&
      !placementChanged &&
      !buildingRoofChanged &&
      !buildingTurnChanged &&
      !buildingColorChanged &&
      !buildingDoorChanged &&
      !buildingWindowChanged &&
      !buildingWindowPlacementChanged &&
      !buildingSizeChanged &&
      !buildingWindowSizeChanged
    ) {
      return;
    }
    if (next.side !== current.side && terraces.value.some((item) => item.side === next.side)) return;
    terraces.value = terraces.value.map((item) => (item.side === side ? next : item));
    saveSnapshot();
  }

  const addTerrace = (initial?: Partial<HouseTerrace>) => {
    const used = new Set(terraces.value.map((item) => item.side));
    const side = initial?.side && !used.has(initial.side)
      ? initial.side
      : TERRACE_SIDES.find((item) => !used.has(item));
    if (!side) return;
    terraces.value = [
      ...terraces.value,
      { side, depth: 1.8, span: 'door', roof: false, ...initial }
    ];
    saveSnapshot();
  }

  const removeTerrace = (side: TerraceSide) => {
    if (!terraces.value.some((item) => item.side === side)) return;
    terraces.value = terraces.value.filter((item) => item.side !== side);
    saveSnapshot();
  }

  const setTerraceSide = (side: TerraceSide, next: TerraceSide) => {
    replaceTerrace(side, { side: next });
  }

  const setTerraceDepth = (side: TerraceSide, depth: TerraceDepth) => {
    if (typeof depth !== 'number' || Number.isNaN(depth)) return;
    const clamped = Math.min(MAX_TERRACE_DEPTH, Math.max(MIN_TERRACE_DEPTH, depth));
    const rounded = Math.round(clamped * 10) / 10;
    replaceTerrace(side, { depth: rounded });
  }

  const setTerraceSpan = (side: TerraceSide, span: TerraceSpan) => {
    replaceTerrace(side, { span });
  }

  const setTerraceRoof = (side: TerraceSide, roof: boolean) => {
    replaceTerrace(side, { roof });
  }

  const setTerraceBuilding = (side: TerraceSide, building: TerraceBuilding) => {
    const current = terraces.value.find((item) => item.side === side);
    const hasCabin = building === 'sauna' || building === 'shed';
    const minimumDepth = building === 'sauna' ? 2.0 : current?.hotTub ? 2.2 : 0;
    const depth = current && minimumDepth > 0 && current.depth < minimumDepth ? minimumDepth : undefined;
    replaceTerrace(side, {
      building,
      ...(depth ? { depth } : {}),
      ...(hasCabin && current?.hotTub ? { span: 'full' as const } : {})
    });
  }

  const setTerraceHotTub = (side: TerraceSide, hotTub: boolean) => {
    const current = terraces.value.find((item) => item.side === side);
    const minimumDepth = hotTub ? 2.2 : 0;
    const depth = current && hotTub && current.depth < minimumDepth ? minimumDepth : undefined;
    replaceTerrace(side, {
      hotTub,
      ...(depth ? { depth } : {}),
      ...(hotTub ? { span: 'full' as const } : {})
    });
  }

  const setTerraceBuildingPlacement = (side: TerraceSide, buildingPlacement: TerraceBuildingPlacement) => {
    replaceTerrace(side, { buildingPlacement });
  }

  const setTerraceBuildingRoof = (side: TerraceSide, buildingRoof: TerraceBuildingRoof) => {
    if (!TERRACE_BUILDING_ROOFS.includes(buildingRoof)) return;
    replaceTerrace(side, { buildingRoof });
  }

  const setTerraceBuildingTurn = (side: TerraceSide, buildingTurn: SaunaTurn) => {
    if (!SAUNA_TURNS.includes(buildingTurn)) return;
    replaceTerrace(side, { buildingTurn: buildingTurn === 0 ? undefined : buildingTurn });
  }

  const setTerraceBuildingColor = (side: TerraceSide, buildingColor: SaunaColor) => {
    if (!SAUNA_COLORS.includes(buildingColor)) return;
    replaceTerrace(side, { buildingColor });
  }

  const setTerraceBuildingDoor = (side: TerraceSide, buildingDoor: SaunaDoor) => {
    if (!SAUNA_DOORS.includes(buildingDoor)) return;
    replaceTerrace(side, { buildingDoor });
  }

  const setTerraceBuildingWindow = (side: TerraceSide, buildingWindow: SaunaWindow) => {
    if (!SAUNA_WINDOWS.includes(buildingWindow)) return;
    replaceTerrace(side, { buildingWindow });
  }

  const setTerraceBuildingWindowPlacement = (side: TerraceSide, buildingWindowPlacement: SaunaWindowPlacement) => {
    if (!SAUNA_WINDOW_PLACEMENTS.includes(buildingWindowPlacement)) return;
    replaceTerrace(side, { buildingWindowPlacement });
  }

  const setTerraceBuildingSize = (side: TerraceSide, buildingSize: SaunaSize) => {
    if (!SAUNA_SIZES.includes(buildingSize)) return;
    const current = terraces.value.find((item) => item.side === side);
    const minDepth = buildingSize === 'large' ? 2.2 : (buildingSize === 'standard' ? 2.0 : 1.6);
    const depth = current && current.depth < minDepth ? minDepth : undefined;
    replaceTerrace(side, { buildingSize, ...(depth ? { depth } : {}) });
  }

  const setTerraceBuildingWindowSize = (side: TerraceSide, buildingWindowSize: SaunaWindowSize) => {
    if (!SAUNA_WINDOW_SIZES.includes(buildingWindowSize)) return;
    replaceTerrace(side, { buildingWindowSize });
  }

  const setFacing = (next: CompassFacing) => {
    if (facing.value === next) return;
    facing.value = next;
    saveSnapshot();
  }

  const previewSunHour = (hour: number) => {
    sunHour.value = clampSunHour(hour);
  }

  const commitSunHour = (hour: number) => {
    const next = clampSunHour(hour);
    sunHour.value = next;
    if (next === sunHourAtSnapshot) return;
    sunHourAtSnapshot = next;
    saveSnapshot();
  }

  const markDefaultView = (view: CameraView) => {
    const next = parseCameraView(view);
    if (!next) return;
    if (defaultView.value && viewsMatch(defaultView.value, next)) return;
    defaultView.value = next;
    saveSnapshot();
  }

  const clearActiveColorCombo = () => {
    if (activeColorComboId.value) activeColorComboId.value = null;
  };

  const selectMaterial = (id: MaterialKey) => {
    activeMaterial.value = id;
    activePaintId.value = null;
    paintPreview.value = null;
    clearActiveColorCombo();
    saveSnapshot();
  }

  const selectCornerColor = (color: string) => {
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
    clearActiveColorCombo();
    saveSnapshot();
  }

  const selectFrameColor = (color: string) => {
    if (color.startsWith('#')) {
      const normalized = normalizeHex(color) ?? color.toLowerCase();
      if (!savedFrameColors.value.includes(normalized)) {
        savedFrameColors.value = [...savedFrameColors.value, normalized].slice(-12);
      }
      if (frameColor.value === normalized) return;
      frameColor.value = normalized;
    } else {
      if (frameColor.value === color) return;
      frameColor.value = color;
    }
    clearActiveColorCombo();
    saveSnapshot();
  };

  const addFrameColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    if (!savedFrameColors.value.includes(normalized)) {
      savedFrameColors.value = [...savedFrameColors.value, normalized].slice(-12);
    }
    frameColor.value = normalized;
    clearActiveColorCombo();
    saveSnapshot();
  };

  const removeFrameColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    savedFrameColors.value = savedFrameColors.value.filter((c) => c !== normalized && c !== color);
    if (frameColor.value === normalized || frameColor.value === color) {
      frameColor.value = savedFrameColors.value[savedFrameColors.value.length - 1] ?? 'white';
    }
    clearActiveColorCombo();
    saveSnapshot();
  };

  const updateFrameColor = (oldColor: string, newColor: string) => {
    const normOld = normalizeHex(oldColor) ?? oldColor.toLowerCase();
    const normNew = normalizeHex(newColor) ?? newColor.toLowerCase();
    savedFrameColors.value = savedFrameColors.value.map((c) => (c === normOld ? normNew : c));
    if (frameColor.value === normOld || frameColor.value === oldColor) {
      frameColor.value = normNew;
    }
    clearActiveColorCombo();
    saveSnapshot();
  };

  const currentColorComboSnapshot = (): Omit<ColorCombo, 'id' | 'name'> => ({
    material: activeMaterial.value,
    paintId: activePaintId.value,
    paintHex: customPaint.value?.hex ?? null,
    cornerColor: cornerColor.value,
    cornerBoards: cornerBoards.value,
    frameColor: frameColor.value
  });

  const saveColorCombo = (name?: string) => {
    const label =
      (name?.trim() || `Kulör ${savedColorCombos.value.length + 1}`).slice(0, 40);
    const combo: ColorCombo = {
      id: `combo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: label,
      ...currentColorComboSnapshot()
    };
    savedColorCombos.value = [combo, ...savedColorCombos.value].slice(0, COLOR_COMBO_LIMIT);
    activeColorComboId.value = combo.id;
    saveSnapshot();
    return combo;
  };

  const applyColorCombo = (id: string) => {
    const combo = savedColorCombos.value.find((item) => item.id === id);
    if (!combo) return;
    activeMaterial.value = combo.material;
    paintPreview.value = null;
    const paint =
      (combo.paintId && savedPaints.value.find((item) => item.id === combo.paintId)) ||
      (combo.paintHex
        ? savedPaints.value.find((item) => item.hex.toLowerCase() === combo.paintHex!.toLowerCase())
        : undefined);
    if (paint) {
      activePaintId.value = paint.id;
    } else if (combo.paintHex) {
      const parsed = parseCustomPaint({ hex: combo.paintHex, system: 'hex' });
      if (parsed) {
        const newId = `paint_combo_${combo.paintHex.replace('#', '')}`;
        const existing = savedPaints.value.find(
          (item) => item.hex.toLowerCase() === parsed.hex.toLowerCase()
        );
        if (existing) activePaintId.value = existing.id;
        else {
          savedPaints.value = [{ id: newId, ...parsed }, ...savedPaints.value].slice(0, SAVED_PAINT_LIMIT);
          activePaintId.value = newId;
        }
      } else {
        activePaintId.value = null;
      }
    } else {
      activePaintId.value = null;
    }
    cornerColor.value = combo.cornerColor;
    if (combo.cornerColor.startsWith('#') && !savedCornerColors.value.includes(combo.cornerColor)) {
      savedCornerColors.value = [...savedCornerColors.value, combo.cornerColor].slice(-12);
    }
    cornerBoards.value = combo.cornerBoards;
    frameColor.value = combo.frameColor;
    if (combo.frameColor.startsWith('#') && !savedFrameColors.value.includes(combo.frameColor)) {
      savedFrameColors.value = [...savedFrameColors.value, combo.frameColor].slice(-12);
    }
    activeColorComboId.value = combo.id;
    saveSnapshot();
  };

  const removeColorCombo = (id: string) => {
    savedColorCombos.value = savedColorCombos.value.filter((item) => item.id !== id);
    if (activeColorComboId.value === id) activeColorComboId.value = null;
    saveSnapshot();
  };

  const renameColorCombo = (id: string, name: string) => {
    const label = name.trim().slice(0, 40);
    if (!label) return;
    savedColorCombos.value = savedColorCombos.value.map((item) =>
      item.id === id ? { ...item, name: label } : item
    );
    saveSnapshot();
  };

  const addCornerColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    if (!savedCornerColors.value.includes(normalized)) {
      savedCornerColors.value = [...savedCornerColors.value, normalized].slice(-12);
    }
    cornerColor.value = normalized;
    clearActiveColorCombo();
    saveSnapshot();
  }

  const removeCornerColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    savedCornerColors.value = savedCornerColors.value.filter((c) => c !== normalized && c !== color);
    if (cornerColor.value === normalized || cornerColor.value === color) {
      cornerColor.value = savedCornerColors.value[savedCornerColors.value.length - 1] ?? 'same';
    }
    clearActiveColorCombo();
    saveSnapshot();
  }

  const updateCornerColor = (oldColor: string, newColor: string) => {
    const normOld = normalizeHex(oldColor) ?? oldColor.toLowerCase();
    const normNew = normalizeHex(newColor) ?? newColor.toLowerCase();
    savedCornerColors.value = savedCornerColors.value.map((c) => (c === normOld ? normNew : c));
    if (cornerColor.value === normOld || cornerColor.value === oldColor) {
      cornerColor.value = normNew;
    }
    clearActiveColorCombo();
    saveSnapshot();
  }

  const selectConcreteColor = (color: string) => {
    if (color.startsWith('#')) {
      const normalized = normalizeHex(color) ?? color.toLowerCase();
      if (!savedConcreteColors.value.includes(normalized) && normalized !== '#b7b3ac') {
        savedConcreteColors.value = [...savedConcreteColors.value, normalized].slice(-12);
      }
      if (concreteColor.value === normalized) return;
      concreteColor.value = normalized;
    } else {
      if (concreteColor.value === color) return;
      concreteColor.value = color;
    }
    saveSnapshot();
  }

  const addConcreteColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    if (!savedConcreteColors.value.includes(normalized)) {
      savedConcreteColors.value = [...savedConcreteColors.value, normalized].slice(-12);
    }
    concreteColor.value = normalized;
    saveSnapshot();
  }

  const removeConcreteColor = (color: string) => {
    const normalized = normalizeHex(color) ?? color.toLowerCase();
    savedConcreteColors.value = savedConcreteColors.value.filter((c) => c !== normalized && c !== color);
    if (concreteColor.value === normalized || concreteColor.value === color) {
      concreteColor.value = savedConcreteColors.value[savedConcreteColors.value.length - 1] ?? '#b7b3ac';
    }
    saveSnapshot();
  }

  const updateConcreteColor = (oldColor: string, newColor: string) => {
    const normOld = normalizeHex(oldColor) ?? oldColor.toLowerCase();
    const normNew = normalizeHex(newColor) ?? newColor.toLowerCase();
    savedConcreteColors.value = savedConcreteColors.value.map((c) => (c === normOld ? normNew : c));
    if (concreteColor.value === normOld || concreteColor.value === oldColor) {
      concreteColor.value = normNew;
    }
    saveSnapshot();
  }

  const toggleCornerBoards = () => {
    cornerBoards.value = !cornerBoards.value;
    clearActiveColorCombo();
    saveSnapshot();
  }

  const setCornerBoards = (visible: boolean) => {
    if (cornerBoards.value === visible) return;
    cornerBoards.value = visible;
    clearActiveColorCombo();
    saveSnapshot();
  }

  const selectSavedPaint = (id: string) => {
    if (!savedPaints.value.some((paint) => paint.id === id)) return;
    paintPreview.value = null;
    if (activePaintId.value === id) return;
    activePaintId.value = id;
    clearActiveColorCombo();
    saveSnapshot();
  }

  const setPaintPreview = (hex: string | null) => {
    paintPreview.value = hex ? normalizeHex(hex) : null;
  }

  const setCustomPaint = (paint: CustomPaint) => {
    const next = parseCustomPaint(paint);
    if (!next) return;
    paintPreview.value = null;
    clearActiveColorCombo();
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

  const effectiveFrameHex = computed(() => {
    if (frameColor.value && frameColor.value !== 'same') {
      if (frameColor.value.startsWith('#')) return frameColor.value;
      if (frameColor.value === 'white') return '#f8fafc';
      if (frameColor.value === 'falurod') return '#892622';
      if (frameColor.value === 'grey') return '#64748b';
      if (frameColor.value === 'black') return '#1a1c1b';
      if (frameColor.value === 'wood') return '#e8d8be';
      const found = MATERIAL_OPTIONS.find((m) => m.id === frameColor.value);
      if (found) return found.colorHex;
    }
    if (paintPreview.value) return paintPreview.value;
    if (customPaint.value?.hex) return customPaint.value.hex;
    const currentMat = MATERIAL_OPTIONS.find((m) => m.id === activeMaterial.value);
    return currentMat ? currentMat.colorHex : '#e8d8be';
  });

  const removeSavedPaint = (id: string) => {
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

  const selectPanelOrientation = (orientation: PanelOrientation) => {
    panelOrientation.value = orientation;
    saveSnapshot();
  }

  const selectCladdingSize = (id: CladdingSizeId) => {
    if (!CLADDING_SIZES.some((size) => size.id === id)) return;
    claddingSizeId.value = id;
    saveSnapshot();
  }

  const selectSlot = (slotId: string | null) => {
    selectedSlotId.value = slotId;
  }

  const commitHouse = () => {
    const next = JSON.stringify(houseState());
    if (history.value[historyIndex.value] === next) return;
    saveSnapshot();
  }

  const noteById = (id: string) => {
    return notes.value.find((note) => note.id === id);
  }

  const replaceNote = (id: string, patch: Partial<HouseNote>) => {
    const current = noteById(id);
    if (!current) return;
    const [next] = acceptNotes([{ ...current, ...patch, id: current.id }]);
    if (!next) return;
    notes.value = notes.value.map((note) => (note.id === id ? next : note));
  }

  const addNote = () => {
    if (notes.value.length >= NOTE_LIMIT) return null;
    const id = `note_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
    notes.value = [...notes.value, freshNote(notes.value.length, id)];
    showNotes.value = true;
    activeNoteId.value = id;
    commitHouse();
    return id;
  }

  const removeNote = (id: string) => {
    if (!noteById(id)) return;
    notes.value = notes.value.filter((note) => note.id !== id);
    if (activeNoteId.value === id) activeNoteId.value = null;
    commitHouse();
  }

  const setNoteText = (id: string, text: string) => {
    replaceNote(id, { text });
  }

  const setNoteLink = (id: string, value: string) => {
    const link = linkFromValue(value);
    replaceNote(id, { link });
    activeNoteId.value = id;
    commitHouse();
  }

  const moveNote = (id: string, place: { x?: number; y?: number; offsetX?: number; offsetY?: number }) => {
    replaceNote(id, place);
  }

  const setNotePin = (id: string, pin: { x: number; y: number; z: number; nx?: number; ny?: number; nz?: number; scope?: 'outside' | 'inside' } | null) => {
    replaceNote(id, { pin: pin ? parseNotePin(pin) : null });
  }

  const resizeNote = (id: string, width: number, height: number) => {
    replaceNote(id, { width, height });
  }

  const setNotePlanes = (camera: string, planes: Record<string, { transform: string; visible: boolean }>) => {
    noteCamera.value = camera;
    notePlanes.value = planes;
  }

  const commitNotes = () => {
    commitHouse();
  }

  const toggleNotes = () => {
    if (showNotes.value) {
      showNotes.value = false;
      return;
    }
    showNotes.value = true;
    if (!notes.value.length) addNote();
  }

  const setNoteAnchors = (next: Record<string, { x: number; y: number; visible: boolean }>) => {
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

  const releaseWideDoor = (slotId: string) => {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    if (slot.itemId === 'SKJUTDORR' || slot.itemId === 'SKJUTDORR3') {
      for (const other of Object.values(wallSlots.value)) {
        if (other.coveredBy === slotId) other.coveredBy = undefined;
      }
    }
    const hostId = slot.coveredBy;
    if (!hostId) return;
    const host = wallSlots.value[hostId];
    if (host?.windowRhythm) return;
    slot.coveredBy = undefined;
    if (host?.itemId !== 'SKJUTDORR' && host?.itemId !== 'SKJUTDORR3') return;
    host.type = 'empty';
    host.itemId = undefined;
    for (const other of Object.values(wallSlots.value)) {
      if (other.coveredBy === hostId) other.coveredBy = undefined;
    }
  }

  const clearWallWindowRhythm = (hostId: string) => {
    clearWindowRhythmSlots(wallSlots.value, hostId);
  }

  const setWallWindowRhythm = (
    wall: WallSlot['wall'],
    count: WindowRhythmCount,
    itemId: string,
    anchorIndex?: number,
    isUpper = false
  ) => {
    const panelCount = panelCountForWall(wall, buildingWidth.value, buildingDepth.value);
    const selected = selectedSlotId.value ? wallSlots.value[selectedSlotId.value] : null;
    const anchor = anchorIndex
      ?? (selected && selected.wall === wall && Boolean(selected.isUpper) === isUpper
        ? selected.index
        : 0);
    const run = freeBandRunForRhythm(wallSlots.value, wall, panelCount, anchor, isUpper);
    if (run.length < 2) return;
    const n = Math.min(count, run.length, 4) as WindowRhythmCount;
    if (n < 2) return;

    // Drop any existing rhythm on this wall band before rebuilding the run.
    for (let i = 0; i < panelCount; i += 1) {
      const id = bandSlotId(wall, i, isUpper);
      const s = wallSlots.value[id];
      if (!s) continue;
      if (s.windowRhythm) clearWallWindowRhythm(id);
      else if (s.coveredBy && wallSlots.value[s.coveredBy]?.windowRhythm) {
        clearWallWindowRhythm(s.coveredBy);
      }
    }

    const hostIndex = run[0];
    const hostId = bandSlotId(wall, hostIndex, isUpper);
    for (const i of run) {
      const id = bandSlotId(wall, i, isUpper);
      const s = wallSlots.value[id];
      if (!s) continue;
      if (i === hostIndex) {
        s.type = 'window';
        s.itemId = itemId;
        s.windowRhythm = n;
        s.coveredBy = undefined;
        s.fitToWall = true;
      } else {
        s.type = 'empty';
        s.itemId = undefined;
        s.windowRhythm = undefined;
        s.coveredBy = hostId;
        s.fitToWall = undefined;
      }
    }
    selectedSlotId.value = hostId;
    saveSnapshot();
  }

  /** Count windows on a wall band (a rhythm host counts as its pane count). */
  const windowRowCount = (wall: WallSlot['wall'], isUpper: boolean) => {
    const panelCount = panelCountForWall(wall, buildingWidth.value, buildingDepth.value);
    let count = 0;
    let itemId: string | undefined;
    let anchor = 0;
    let aligned = false;
    for (let i = 0; i < panelCount; i += 1) {
      const s = wallSlots.value[bandSlotId(wall, i, isUpper)];
      if (!s) continue;
      if (s.windowRhythm) {
        return {
          count: s.windowRhythm,
          itemId: s.itemId,
          anchor: s.index,
          aligned: true,
          hostId: s.id
        };
      }
      if (s.type === 'window' && s.itemId) {
        count += 1;
        if (!itemId) {
          itemId = s.itemId;
          anchor = s.index;
        }
      }
    }
    return { count, itemId, anchor, aligned, hostId: null as string | null };
  }

  /** @deprecated Use windowRowCount(wall, false). */
  const lowerWindowRowCount = (wall: WallSlot['wall']) => windowRowCount(wall, false);

  /**
   * Evenly space every window on this wall band (lower or upper).
   * Keeps the current window count and type; click any panel on the row to use it.
   */
  const alignWallWindows = (slotId: string) => {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    const isUpper = slot.isUpper === true || slotId.endsWith('u');
    const row = windowRowCount(slot.wall, isUpper);
    if (row.aligned || row.count < 2 || !row.itemId) return;
    const n = Math.min(4, Math.max(2, row.count)) as WindowRhythmCount;
    setWallWindowRhythm(slot.wall, n, row.itemId, slot.index, isUpper);
  }

  const assignSlotItem = (slotId: string, type: 'empty' | 'door' | 'window' | 'gate', itemId?: string) => {
    const slot = wallSlots.value[slotId];
    if (!slot) return;
    const isUpper = slot.isUpper === true || slotId.endsWith('u');
    if ((type === 'door' || type === 'gate') && isUpper) return;
    releaseWindowRhythmSlots(wallSlots.value, slotId);
    releaseWideDoor(slotId);
    slot.type = type;
    slot.itemId = itemId;
    slot.coveredBy = undefined;
    slot.windowRhythm = undefined;
    slot.fitToWall = type === 'window' ? true : undefined;
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

  const removeSlotItem = (slotId: string) => {
    const slot = wallSlots.value[slotId];
    if (slot?.windowRhythm) {
      clearWallWindowRhythm(slotId);
      saveSnapshot();
      return;
    }
    if (slot?.coveredBy && wallSlots.value[slot.coveredBy]?.windowRhythm) {
      clearWallWindowRhythm(slot.coveredBy);
      saveSnapshot();
      return;
    }
    assignSlotItem(slotId, 'empty', undefined);
  }

  const moveSlotItem = (fromId: string, toId: string): boolean  => {
    const success = moveWallSlot(wallSlots.value, fromId, toId);
    if (success) {
      selectedSlotId.value = toId;
      saveSnapshot();
    }
    return success;
  }

  const toggleDimensions = () => {
    showDimensions.value = !showDimensions.value;
  }

  const setDisplay = (key: 'dimensions' | 'notes' | 'sun' | 'mood', shown: boolean) => {
    if (key === 'dimensions') showDimensions.value = shown;
    else if (key === 'notes') showNotes.value = shown;
    else if (key === 'sun') showSun.value = shown;
    else showMood.value = shown;
  }

  const toggleInnerWalls = () => {
    showInnerWalls.value = !showInnerWalls.value;
  }

  const setShowInnerWalls = (val: boolean) => {
    showInnerWalls.value = val;
  }

  const toggleSunShown = () => {
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

  const clearMeasure = () => {
    measureStart.value = null;
    measureEnd.value = null;
    measureCursor.value = null;
    measureScreen.start.visible = false;
    measureScreen.end.visible = false;
  }

  const toggleMeasure = () => {
    measuring.value = !measuring.value;
    clearMeasure();
  }

  const placeMeasurePoint = (point: MeasurePoint) => {
    if (!measuring.value) return;
    const next = nextMeasure(measureStart.value, measureEnd.value, point);
    measureStart.value = next.start;
    measureEnd.value = next.end;
    measureCursor.value = next.end ? null : point;
  }

  const setMeasureCursor = (point: MeasurePoint | null) => {
    if (!measuring.value || measureEnd.value) return;
    measureCursor.value = point;
  }

  const setMeasureScreen = (next: {
    start: { x: number; y: number; visible: boolean };
    end: { x: number; y: number; visible: boolean };
  } | null) => {
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

  const setHoveredSlot = (slotId: string | null, pos?: { x: number; y: number } | null) => {
    hoveredSlotId.value = slotId;
    hoveredSlotPos.value = pos ?? null;
  }

  const setDragging = (val: boolean) => {
    isDragging.value = val;
  }

  const setSlotScreenPosition = (pos: { x: number; y: number; visible: boolean } | null) => {
    slotScreenPosition.value = pos;
  }

  const setWindowFitOffers = (ids: string[]) => {
    const next = [...ids].sort();
    const prev = windowFitOffers.value;
    if (prev.length === next.length && prev.every((id, index) => id === next[index])) return;
    windowFitOffers.value = next;
  }

  const fitWindowToWall = (slotId: string) => {
    const slot = wallSlots.value[slotId];
    if (!slot || slot.type !== 'window') return;
    slot.fitToWall = true;
    saveSnapshot();
  }

  const setDimensionLabels = (next: Record<string, { x: number; y: number; visible: boolean }>) => {
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

  const cycleSlot = (direction: 'prev' | 'next') => {
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

  const deselectSlot = () => {
    selectedSlotId.value = null;
    slotScreenPosition.value = null;
  }

  const factoryHouse = JSON.stringify(houseState());

  const isFactoryHouse = (data: unknown) => {
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
    frameColor,
    savedFrameColors,
    savedColorCombos,
    activeColorComboId,
    cornerBoards,
    effectiveCornerHex,
    effectiveFrameHex,
    selectCornerColor,
    addCornerColor,
    removeCornerColor,
    updateCornerColor,
    selectFrameColor,
    addFrameColor,
    removeFrameColor,
    updateFrameColor,
    saveColorCombo,
    applyColorCombo,
    removeColorCombo,
    renameColorCombo,
    removeSavedPaint,
    toggleCornerBoards,
    setCornerBoards,
    selectedSlotId,
    hoveredSlotId,
    hoveredSlotPos,
    slotScreenPosition,
    windowFitOffers,
    setWindowFitOffers,
    fitWindowToWall,
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
    stuganBedroomWallsLocked,
    stuganConflicts,
    stuganStair,
    lockStuganBedroomWalls,
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
    framingWalkthrough,
    framingStep,
    startFramingWalkthrough,
    stopFramingWalkthrough,
    setFramingStep,
    nextFramingStep,
    prevFramingStep,
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
    concreteColor,
    savedConcreteColors,
    setConcreteMeasure,
    swapConcretePlan,
    addConcreteWall,
    setConcreteWall,
    removeConcreteWall,
    selectConcreteColor,
    addConcreteColor,
    removeConcreteColor,
    updateConcreteColor,
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
    setTerraceHotTub,
    setTerraceBuildingPlacement,
    setTerraceBuildingRoof,
    setTerraceBuildingTurn,
    setTerraceBuildingColor,
    setTerraceBuildingDoor,
    setTerraceBuildingWindow,
    setTerraceBuildingWindowPlacement,
    setTerraceBuildingSize,
    setTerraceBuildingWindowSize,
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
    setWallWindowRhythm,
    clearWallWindowRhythm,
    alignWallWindows,
    windowRowCount,
    lowerWindowRowCount,
    moveSlotItem,
    toggleDimensions,
    setDisplay,
    applyDisplayPrefs,
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
