import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ViewMode = 'utsida' | 'insida';
export type CategoryKey = 'size' | 'roof' | 'loft' | 'doors' | 'windows' | 'gates';

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
    height: 3100,
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
    height: 3400,
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
    spec: 'Invändig takhöjd upp till 3,1 m',
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
    name: 'STEHAG Ytterdörr',
    desc: 'Stabil slät dörr med smalt klarglas och rostfria beslag.',
    spec: 'Mått 10×21, U-värde 0.8',
    priceDelta: 0
  },
  {
    id: 'FLENINGE',
    name: 'FLENINGE Allmoge',
    desc: 'Spårfräst traditionell ytterdörr med 6 spröjsade rutor.',
    spec: 'Mått 10×21, 3-glas isoler',
    priceDelta: 2400
  },
  {
    id: 'SVANSHALL',
    name: 'SVANSHALL Pardörr',
    desc: 'Dubbeldörr med generösa glaspartier mot altan.',
    spec: 'Mått 16×21, laminerat säkerhetsglas',
    priceDelta: 9800
  },
  {
    id: 'LERVIK',
    name: 'LERVIK Minimalist',
    desc: 'Arkitektritad slät dörr med vertikalt infällt ljusband.',
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
    name: 'Takskjutport Motor',
    desc: 'Isolerad takskjutport med fjärrstyrd elmotor och fotoceller.',
    spec: 'Mått 25×21, 40mm polyuretanisolering',
    priceDelta: 23600
  }
];

export const useConfigStore = defineStore('config', () => {
  const viewMode = ref<ViewMode>('utsida');
  const selectedCategory = ref<CategoryKey>('size');

  const selectedSizeId = ref<string>('size-30');
  const activeRoof = ref<string>('pulpettak');
  const activeLoft = ref<string>('none');
  const activeDoor = ref<string>('STEHAG');
  const activeWindow = ref<string>('standard-single');
  const activeGate = ref<string>('none');

  const currentSize = computed(() => {
    return SIZE_OPTIONS.find((s) => s.id === selectedSizeId.value) ?? SIZE_OPTIONS[2];
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

    const roof = ROOF_OPTIONS.find((r) => r.id === activeRoof.value);
    if (roof) total += roof.priceDelta;

    const loft = LOFT_OPTIONS.find((l) => l.id === activeLoft.value);
    if (loft) total += loft.priceDelta;

    const door = DOORS_OPTIONS.find((d) => d.id === activeDoor.value);
    if (door) total += door.priceDelta;

    const windowOpt = WINDOWS_OPTIONS.find((w) => w.id === activeWindow.value);
    if (windowOpt) total += windowOpt.priceDelta;

    const gate = GATES_OPTIONS.find((g) => g.id === activeGate.value);
    if (gate) total += gate.priceDelta;

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
  }

  function selectRoof(id: string) {
    activeRoof.value = id;
  }

  function selectLoft(id: string) {
    activeLoft.value = id;
  }

  function selectDoor(id: string) {
    activeDoor.value = id;
  }

  function selectWindow(id: string) {
    activeWindow.value = id;
  }

  function selectGate(id: string) {
    activeGate.value = id;
  }

  return {
    viewMode,
    selectedCategory,
    selectedSizeId,
    activeRoof,
    activeLoft,
    activeDoor,
    activeWindow,
    activeGate,
    currentSize,
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
    selectGate
  };
});
