import { createI18n, useI18n } from 'vue-i18n';

export type AppLocale = 'sv' | 'en';

const STORAGE_KEY = 'builder.locale';

const sv = {
  lang: { label: 'Språk' },
  brand: { tagline: '3D Modulhus' },
  header: {
    save: 'Spara projekt',
    drawings: 'Ritningsunderlag',
    view: 'Visningsläge',
    outside: 'Utsida',
    inside: 'Insida',
    total: 'Totalpris',
    priceDetails: 'Visa prisdetaljer',
    next: 'NÄSTA',
    breakdown: 'Prisspecifikation',
    facade: 'Fasad ({name})',
    loftExtra: 'Sovloft tillval',
    totalVat: 'Totalt inkl. moms',
    saved: 'Projektet har sparats i webbläsarens lokala minne.'
  },
  panel: {
    label: 'Konfigurationspanel',
    title: 'Börja anpassa din byggnad',
    show: 'Visa panel ▲',
    hide: 'Minimera ▼',
    export: 'Exportera'
  },
  nav: {
    label: 'Konfigurationssteg',
    size: 'Storlek',
    roof: 'Tak',
    loft: 'Loft',
    doors: 'Dörrar',
    windows: 'Fönster',
    gates: 'Portar'
  },
  category: {
    hint: 'Välj alternativ för att anpassa din byggnad',
    options: '{count} alternativ',
    activeSlot: 'Aktiv panel i 3D: {id}',
    placeHint: 'Klicka på en produkt för att placera',
    sizeTitle: 'Storlek & Grundmått',
    roofTitle: 'Taktyp & Vinkel',
    covering: 'Takbeklädnad',
    felt: 'Takpapp',
    feltBody: 'Svart ytpapp',
    metal: 'Plåt',
    metalBody: 'Stående fals',
    tiles: 'Betongpannor',
    tilesBody: 'Profilerad panna',
    loftTitle: 'Loft & Rymd',
    doorsTitle: 'Ytterdörrar',
    windowsTitle: 'Fönsterpartier',
    gatesTitle: 'Portar & Partier',
    measures: 'Byggmått & Area',
    facade: 'Fasadmaterial & Kulör',
    selected: 'Vald: {name}',
    addLoft: 'Lägg till Loft',
    addLoftBody:
      'Maximera golvytan med loft. Perfekt för sängplatser eller förvaring. Detta tillval finns för samtliga tak med undantag för sadeltak 25°.',
    toggleLoft: 'Aktivera loft',
    plan: 'Planlösning',
    floor: 'Golv',
    oneLoft: 'Ett loft',
    twoLofts: 'Två loft',
    placement: 'Placering',
    left: 'Vänster',
    right: 'Höger',
    size: 'Storlek',
    buildingArea: 'Byggnadsarea: {area} m²',
    stair: 'Lofttrappa & Tillträde',
    stairName: 'Lofttrappa i massiv furu',
    stairBody: 'Inkl. vangstycken, steg och handledare (visas i 3D)',
    floorFinish: 'Loftgolv & Ytbehandling',
    floorSpruce: 'Granplank 28×120 mm (Standard)',
    floorSpruceBody: 'Hyvlad massiv svensk gran, spårad undersida',
    floorPine: 'Furu Obehandlad Ekologiskt',
    floorPineBody: 'Klassisk norrländsk kärnfuru för vacker patinering',
    floorBoard: 'Slät Undergolvsskiva 22 mm',
    floorBoardBody: 'Förberedd för direkt läggning av parkett eller matta',
    singleDoors: 'Enkeldörrar',
    doubleDoors: 'Pardörrar',
    series: 'Serie',
    seriesStabil: 'Stabil',
    seriesModern: 'Modern Funkis',
    seriesTraditional: 'Allmoge Trä',
    doorBlocked: 'Dörr kan inte placeras på markerad väggyta på byggnaden.',
    doorBlockedHint: 'Välj en marknära väggsektion eller byt till fönsterparti.'
  },
  tools: {
    label: '3D Vyverktyg',
    zoomIn: 'Zooma in',
    zoomOut: 'Zooma ut',
    measure: 'Visa måttsättning',
    undo: 'Ångra',
    redo: 'Gör om'
  },
  dims: {
    pitch: 'Taklutning',
    frontWall: 'Vägg fram',
    rearWall: 'Vägg bak',
    overall: 'Totalhöjd',
    ceiling: 'Invändig takhöjd'
  },
  slot: {
    hover: 'Panel {id} • Klicka för att välja',
    prev: 'Föregående panel',
    next: 'Nästa panel',
    chooseDoor: 'Välj dörr',
    door: 'Dörr ({id})',
    chooseWindow: 'Välj fönster',
    window: 'Fönster ({id})',
    remove: 'Ta bort',
    clear: 'Töm denna panel',
    marked: 'Markerad väggyta: {wall}',
    done: 'Klar med panel',
    cancel: 'Avbryt val'
  },
  export: {
    close: 'Stäng dialog',
    title: 'Exportera Byggsatshandlingar',
    body: 'Ladda ner ritningar, 3D-renderingar och specifikationer för din konfiguration.',
    blueprint: '2D Planritning (SVG)',
    blueprintBody: 'Måttskiss med yttermått och sektionsdata',
    download: 'Ladda ner',
    render: 'Högupplöst 3D-rendering (PNG)',
    renderBody: 'Ögonblicksbild från nuvarande kameravinkel',
    save: 'Spara',
    done: 'Klar'
  },
  ai: {
    title: 'AI Arkitektassistent',
    placeholder: "T.ex. 'Sadeltak med sovloft och dubbeldörr...'",
    generate: 'Generera',
    gableLoft: 'Sadeltak + Sovloft',
    gableLoftDone: 'Sadeltak och sovloft aktiverat',
    doubleDoor: 'Pardörr SVANSHALL',
    doubleDoorDone: 'SVANSHALL pardörr vald',
    max30: 'Attefallshus Max 30 m²',
    max30Done: 'Byggmått uppdaterade till 30 m²',
    applied: 'AI-konfiguration applicerad'
  },
  price: {
    included: 'Ingår',
    kr: 'kr'
  }
};

const en = {
  lang: { label: 'Language' },
  brand: { tagline: '3D modular house' },
  header: {
    save: 'Save project',
    drawings: 'Drawings',
    view: 'View',
    outside: 'Outside',
    inside: 'Inside',
    total: 'Total',
    priceDetails: 'Show price details',
    next: 'NEXT',
    breakdown: 'Price breakdown',
    facade: 'Facade ({name})',
    loftExtra: 'Sleeping loft',
    totalVat: 'Total incl. VAT',
    saved: 'The project was saved in this browser.'
  },
  panel: {
    label: 'Configuration panel',
    title: 'Start customising your building',
    show: 'Show panel ▲',
    hide: 'Minimise ▼',
    export: 'Export'
  },
  nav: {
    label: 'Configuration steps',
    size: 'Size',
    roof: 'Roof',
    loft: 'Loft',
    doors: 'Doors',
    windows: 'Windows',
    gates: 'Gates'
  },
  category: {
    hint: 'Choose an option to customise your building',
    options: '{count} options',
    activeSlot: 'Active panel in 3D: {id}',
    placeHint: 'Click a product to place it',
    sizeTitle: 'Size & footprint',
    roofTitle: 'Roof type & pitch',
    covering: 'Roof covering',
    felt: 'Felt',
    feltBody: 'Black cap sheet',
    metal: 'Metal',
    metalBody: 'Standing seam',
    tiles: 'Concrete tiles',
    tilesBody: 'Profiled tile',
    loftTitle: 'Loft & volume',
    doorsTitle: 'Exterior doors',
    windowsTitle: 'Windows',
    gatesTitle: 'Gates & openings',
    measures: 'Size & area',
    facade: 'Facade & colour',
    selected: 'Selected: {name}',
    addLoft: 'Add a loft',
    addLoftBody:
      'Gain floor area with a loft. Useful for sleeping or storage. Available on every roof except a 25° gable roof.',
    toggleLoft: 'Turn loft on',
    plan: 'Layout',
    floor: 'Floor',
    oneLoft: 'One loft',
    twoLofts: 'Two lofts',
    placement: 'Placement',
    left: 'Left',
    right: 'Right',
    size: 'Size',
    buildingArea: 'Building area: {area} m²',
    stair: 'Loft stair & access',
    stairName: 'Solid pine loft stair',
    stairBody: 'Includes strings, treads and handrail (shown in 3D)',
    floorFinish: 'Loft floor & finish',
    floorSpruce: 'Spruce boards 28×120 mm (standard)',
    floorSpruceBody: 'Planed solid Swedish spruce, grooved underside',
    floorPine: 'Untreated ecological pine',
    floorPineBody: 'Classic northern heartwood pine that patinates',
    floorBoard: 'Smooth subfloor board 22 mm',
    floorBoardBody: 'Ready for parquet or carpet',
    singleDoors: 'Single doors',
    doubleDoors: 'Double doors',
    series: 'Series',
    seriesStabil: 'Stabil',
    seriesModern: 'Modern functionalist',
    seriesTraditional: 'Traditional timber',
    doorBlocked: 'A door cannot be placed on the marked wall of the building.',
    doorBlockedHint: 'Choose a wall section at ground level, or switch to a window.'
  },
  tools: {
    label: '3D view tools',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    measure: 'Show dimensions',
    undo: 'Undo',
    redo: 'Redo'
  },
  dims: {
    pitch: 'Roof pitch',
    frontWall: 'Front wall',
    rearWall: 'Rear wall',
    overall: 'Overall height',
    ceiling: 'Interior ceiling height'
  },
  slot: {
    hover: 'Panel {id} • Click to select',
    prev: 'Previous panel',
    next: 'Next panel',
    chooseDoor: 'Choose door',
    door: 'Door ({id})',
    chooseWindow: 'Choose window',
    window: 'Window ({id})',
    remove: 'Remove',
    clear: 'Clear this panel',
    marked: 'Marked wall: {wall}',
    done: 'Done with panel',
    cancel: 'Cancel selection'
  },
  export: {
    close: 'Close dialog',
    title: 'Export building documents',
    body: 'Download drawings, 3D renders and the specification for this configuration.',
    blueprint: '2D plan (SVG)',
    blueprintBody: 'Measured sketch with outer dimensions and sections',
    download: 'Download',
    render: 'High-resolution 3D render (PNG)',
    renderBody: 'Snapshot from the current camera angle',
    save: 'Save',
    done: 'Done'
  },
  ai: {
    title: 'AI architect',
    placeholder: "For example, 'Gable roof with a sleeping loft and a double door...'",
    generate: 'Generate',
    gableLoft: 'Gable roof + loft',
    gableLoftDone: 'Gable roof and sleeping loft turned on',
    doubleDoor: 'SVANSHALL double door',
    doubleDoorDone: 'SVANSHALL double door selected',
    max30: 'Attefall house, max 30 m²',
    max30Done: 'Building size updated to 30 m²',
    applied: 'AI configuration applied'
  },
  price: {
    included: 'Included',
    kr: 'kr'
  },
  catalog: {
    wood: {
      name: 'Untreated spruce',
      badge: 'Standard',
      desc: 'Natural Swedish spruce cladding with visible grain.'
    },
    falurod: {
      name: 'Falu red',
      badge: 'Classic',
      desc: 'Traditional Swedish distemper paint with a full matt sheen.'
    },
    grey: {
      name: 'Scandinavian grey',
      badge: 'Popular',
      desc: 'A quiet grey stain that sits well in the landscape.'
    },
    white: {
      name: 'Timeless white',
      badge: 'Classic',
      desc: 'A light, painted facade cladding.'
    },
    black: {
      name: 'Architect black',
      badge: 'Modern',
      desc: 'A clean black timber cladding for contemporary Nordic buildings.'
    },
    'size-15': {
      name: 'Friggebod 15 m²',
      badge: 'No permit',
      desc: '4800 × 3125 mm. A guest cabin or home office.'
    },
    'size-25': {
      name: 'Attefall 25 m²',
      badge: 'Building notice',
      desc: '5800 × 4310 mm. A popular size for year-round use.'
    },
    'size-30': {
      name: 'Attefall house, max 30 m²',
      badge: 'Most chosen',
      desc: '6040 × 3503 mm. The largest permit-free living area.'
    },
    'size-40': {
      name: 'Holiday house 40 m²',
      badge: 'More space',
      desc: '8000 × 5000 mm. A roomy holiday house.'
    },
    pulpettak: {
      name: 'Mono-pitch 6°',
      desc: 'A single slope, a modern outline, and clear drainage.',
      spec: 'Felt / metal, 6° pitch'
    },
    sadeltak: {
      name: 'Gable roof 22°',
      desc: 'A classic Swedish roof with two matching slopes.',
      spec: 'Concrete tiles / metal, 22° pitch'
    },
    flackt: {
      name: 'Low roof',
      desc: 'A cubic modern roof with a discreet crown.',
      spec: 'EPDM membrane, 2° hidden drainage'
    },
    'loft-none': {
      name: 'No loft',
      desc: 'Open volume up to the ridge.',
      spec: 'Interior height up to 3.5 m'
    },
    'gate-none': {
      name: 'No gate',
      desc: 'A solid insulated facade panel, without a garage door.',
      spec: 'Vertical timber cladding, primed white'
    },
    sleeping: {
      name: 'Sleeping loft with stair',
      desc: 'A built-in loft with a solid pine stair and guard rail.',
      spec: '+8.5 m² floor, 200 kg/m² load'
    },
    half: {
      name: 'Half loft / storage',
      desc: 'A compact storage loft with a folding inspection ladder.',
      spec: '+4.5 m² storage'
    },
    STEHAG: {
      desc: 'Stabil exterior door, plain, with clear glass, 10×21'
    },
    FLENINGE: {
      desc: 'Stabil exterior door, routed, 6-pane glazing bars, 10×21'
    },
    SVANSHALL: {
      desc: 'Stabil exterior door, fully glazed double door, 16×21'
    },
    LERVIK: {
      desc: 'Stabil exterior door, plain, with a vertical light, 10×21'
    },
    'standard-single': {
      name: 'Triple-glazed tilt window',
      desc: 'A practical tilt window, cleaned from inside, with a child lock.',
      spec: 'Size 10×12, U-value 1.0'
    },
    panorama: {
      name: 'Fixed panorama window',
      desc: 'A floor-to-ceiling glazed section for a wide view.',
      spec: 'Size 16×21, triple energy glass'
    },
    sprojat: {
      name: 'Two-light window with bars',
      desc: 'Side-hung windows with timber glazing bars.',
      spec: 'Size 12×12, solid timber profile'
    },
    frost: {
      name: 'Vent window',
      desc: 'A smaller opening window with frosted privacy glass.',
      spec: 'Size 6×6, frosted insulating glass'
    },
    'wood-slag': {
      name: 'Timber side-hung gate',
      desc: 'Classic insulated double doors in Swedish pine cladding.',
      spec: 'Size 24×20, cylinder lock included'
    },
    overhead: {
      name: 'Modern sectional door, panelled',
      desc: 'An insulated sectional door with a panel pattern.',
      spec: 'Size 24×20, 40 mm polyurethane'
    },
    'overhead-flat': {
      name: 'Modern sectional door, flush',
      desc: 'A flush modern sectional door in white.',
      spec: 'Size 24×20, 40 mm polyurethane'
    }
  },
  loftSize: {
    'compact-storage': 'Compact sleeping loft / storage',
    generous: 'Generous sleeping loft',
    'large-room': 'Large living space / double loft',
    'full-floor': 'Full floor area / full loft level',
    compact: 'Compact sleeping loft',
    standard: 'Standard loft',
    large: 'Large sleeping loft',
    'whole-floor': 'Full floor area',
    alcove: 'Compact sleeping alcove',
    'large-plan': 'Large loft level'
  }
};

export const i18n = createI18n({
  legacy: false,
  locale: 'sv',
  fallbackLocale: 'sv',
  messages: { sv, en },
  missingWarn: false,
  fallbackWarn: false
});

export function readStoredLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'sv') return saved;
  } catch {
    /* Storage can be blocked. Swedish remains the product default. */
  }
  return 'sv';
}

export function applyLocale(next: AppLocale) {
  i18n.global.locale.value = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* The choice still applies for this visit. */
  }
}

export function useLabels() {
  const { t, te, locale } = useI18n();

  function catalog(id: string, field: 'name' | 'desc' | 'spec' | 'badge', fallback: string) {
    const key = `catalog.${id}.${field}`;
    return te(key) ? String(t(key)) : fallback;
  }

  function loftDesc(descId: string, fallback: string) {
    const key = `loftSize.${descId}`;
    return te(key) ? String(t(key)) : fallback;
  }

  function money(amount: number) {
    const loc = locale.value === 'en' ? 'en-GB' : 'sv-SE';
    return `${amount.toLocaleString(loc)} ${t('price.kr')}`;
  }

  function delta(amount: number) {
    if (amount === 0) return t('price.included');
    const loc = locale.value === 'en' ? 'en-GB' : 'sv-SE';
    return `+${amount.toLocaleString(loc)} ${t('price.kr')}`;
  }

  return { t, te, locale, catalog, loftDesc, money, delta };
}
