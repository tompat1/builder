import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ViewMode = 'utsida' | 'insida';
export type CategoryKey = 'size' | 'roof' | 'loft' | 'doors' | 'windows' | 'gates' | 'extras';
export type MaterialKey = 'wood' | 'falurod' | 'grey' | 'white' | 'black';

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
    height: 3503,
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

export const ROOF_OPTIONS: OptionItem[] = [
  {
    id: 'pulpettak',
    name: 'Pulpettak 6°',
    desc: 'Enkelt takfall, modernt uttryck och god vattenavrinning.',
    spec: 'Papp / Plåt, 6° lutning',
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
    id: 'flackt',
    name: 'Flackt Tak',
    desc: 'Modern kubisk funkis med diskret integrerat krön.',
    spec: 'EPDM gummiduk, 2° dold avrinning',
    priceDelta: 8200
  }
];

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
    priceDelta: 0
  },
  {
    id: 'FLENINGE',
    name: 'FLENINGE',
    desc: 'Ytterdörr Stabil, spårfräst 6 rutor spröjs, 10x21',
    spec: 'Mått 10×21, 3-glas isoler',
    priceDelta: 2400
  },
  {
    id: 'SVANSHALL',
    name: 'SVANSHALL',
    desc: 'Ytterdörr Stabil, helglasad pardörr, 16x21',
    spec: 'Mått 16×21, laminerat säkerhetsglas',
    priceDelta: 9800
  },
  {
    id: 'LERVIK',
    name: 'LERVIK',
    desc: 'Ytterdörr Stabil, slät m. vertikalt glas, 10x21',
    spec: 'Mått 10×21, dold gångjärnskonstruktion',
    priceDelta: 3200
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
}

export const useConfigStore = defineStore('config', () => {
  const viewMode = ref<ViewMode>('utsida');
  const selectedCategory = ref<CategoryKey>('size');
  const activeMaterial = ref<MaterialKey>('wood');
  const showDimensions = ref<boolean>(true);
  const selectedSlotId = ref<string | null>('front-1');

  const selectedSizeId = ref<string>('size-30');
  const activeRoof = ref<string>('pulpettak');
  const activeLoft = ref<string>('none');
  const activeDoor = ref<string>('STEHAG');
  const activeWindow = ref<string>('standard-single');
  const activeGate = ref<string>('none');

  // Wall panel modular slots
  const wallSlots = ref<Record<string, WallSlot>>({
    'front-0': { id: 'front-0', wall: 'front', index: 0, type: 'empty' },
    'front-1': { id: 'front-1', wall: 'front', index: 1, type: 'door', itemId: 'STEHAG' },
    'front-2': { id: 'front-2', wall: 'front', index: 2, type: 'window', itemId: 'standard-single' },
    'front-3': { id: 'front-3', wall: 'front', index: 3, type: 'empty' },
    'left-0': { id: 'left-0', wall: 'left', index: 0, type: 'empty' },
    'left-1': { id: 'left-1', wall: 'left', index: 1, type: 'empty' },
    'left-2': { id: 'left-2', wall: 'left', index: 2, type: 'empty' },
    'right-0': { id: 'right-0', wall: 'right', index: 0, type: 'empty' },
    'right-1': { id: 'right-1', wall: 'right', index: 1, type: 'empty' },
    'right-2': { id: 'right-2', wall: 'right', index: 2, type: 'empty' },
    'back-0': { id: 'back-0', wall: 'back', index: 0, type: 'empty' },
    'back-1': { id: 'back-1', wall: 'back', index: 1, type: 'empty' },
    'back-2': { id: 'back-2', wall: 'back', index: 2, type: 'empty' },
    'back-3': { id: 'back-3', wall: 'back', index: 3, type: 'empty' }
  });

  // History stacks for Undo / Redo
  const history = ref<string[]>([]);
  const historyIndex = ref<number>(-1);

  function saveSnapshot() {
    const snapshot = JSON.stringify({
      selectedSizeId: selectedSizeId.value,
      activeRoof: activeRoof.value,
      activeLoft: activeLoft.value,
      activeDoor: activeDoor.value,
      activeWindow: activeWindow.value,
      activeGate: activeGate.value,
      activeMaterial: activeMaterial.value,
      wallSlots: wallSlots.value
    });
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

  function applySnapshot(snapshotStr: string) {
    try {
      const data = JSON.parse(snapshotStr);
      selectedSizeId.value = data.selectedSizeId;
      activeRoof.value = data.activeRoof;
      activeLoft.value = data.activeLoft;
      if (data.activeDoor) activeDoor.value = data.activeDoor;
      if (data.activeWindow) activeWindow.value = data.activeWindow;
      if (data.activeGate) activeGate.value = data.activeGate;
      activeMaterial.value = data.activeMaterial;
      wallSlots.value = data.wallSlots;
    } catch {
      // ignore parse error
    }
  }

  // Initial snapshot
  saveSnapshot();

  const currentSize = computed(() => {
    return SIZE_OPTIONS.find((s) => s.id === selectedSizeId.value) ?? SIZE_OPTIONS[2];
  });

  const currentMaterial = computed(() => {
    return MATERIAL_OPTIONS.find((m) => m.id === activeMaterial.value) ?? MATERIAL_OPTIONS[0];
  });

  const dimensions = computed(() => ({
    width: currentSize.value.width,
    depth: currentSize.value.depth,
    height: currentSize.value.height,
    areaSqMeters: currentSize.value.areaSqMeters
  }));

  const hasLoft = computed(() => activeLoft.value !== 'none');

  const totalPriceSek = computed(() => {
    let total = currentSize.value.basePrice;

    // Material price
    total += currentMaterial.value.priceDelta;

    // Roof price
    const roof = ROOF_OPTIONS.find((r) => r.id === activeRoof.value);
    if (roof) total += roof.priceDelta;

    // Loft price
    const loft = LOFT_OPTIONS.find((l) => l.id === activeLoft.value);
    if (loft) total += loft.priceDelta;

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

  function selectCategory(category: CategoryKey) {
    selectedCategory.value = category;
  }

  function selectSize(id: string) {
    selectedSizeId.value = id;
    saveSnapshot();
  }

  function selectRoof(id: string) {
    activeRoof.value = id;
    saveSnapshot();
  }

  function selectLoft(id: string) {
    activeLoft.value = id;
    saveSnapshot();
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
    saveSnapshot();
  }

  function selectSlot(slotId: string | null) {
    selectedSlotId.value = slotId;
  }

  function assignSlotItem(slotId: string, type: 'empty' | 'door' | 'window' | 'gate', itemId?: string) {
    if (wallSlots.value[slotId]) {
      wallSlots.value[slotId].type = type;
      wallSlots.value[slotId].itemId = itemId;
      saveSnapshot();
    }
  }

  function removeSlotItem(slotId: string) {
    assignSlotItem(slotId, 'empty', undefined);
  }

  function toggleDimensions() {
    showDimensions.value = !showDimensions.value;
  }

  return {
    viewMode,
    selectedCategory,
    activeMaterial,
    selectedSlotId,
    showDimensions,
    wallSlots,
    selectedSizeId,
    activeRoof,
    activeLoft,
    activeDoor,
    activeWindow,
    activeGate,
    currentSize,
    currentMaterial,
    dimensions,
    hasLoft,
    totalPriceSek,
    toggleViewMode,
    setViewMode,
    selectCategory,
    selectSize,
    selectRoof,
    selectLoft,
    selectDoor,
    selectWindow,
    selectGate,
    selectMaterial,
    selectSlot,
    assignSlotItem,
    removeSlotItem,
    toggleDimensions,
    undo,
    redo
  };
});
