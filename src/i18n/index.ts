import { createI18n, useI18n } from 'vue-i18n';
import { useContentStore } from '../store/useContentStore';

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
    saved: 'Huset är sparat på ditt konto.',
    savedLocal: 'Huset är sparat i den här webbläsaren. Logga in med GitHub om det ska följa med till kontot.',
    saveFailed: 'Huset kunde inte sparas.'
  },
  cms: {
    edit: 'Redigera',
    done: 'Klar'
  },
  account: {
    login: 'Logga in',
    logout: 'Logga ut',
    close: 'Stäng konto',
    github: 'Fortsätt med GitHub',
    githubMissing: 'GitHub-inloggningen saknar klientnycklar på workern.',
    loginName: 'GitHub-namn',
    password: 'Lösenord',
    passwordLogin: 'Logga in med lösenord',
    currentPassword: 'Nuvarande lösenord',
    newPassword: 'Nytt lösenord',
    savePassword: 'Spara lösenord',
    avatar: 'Byt bild',
    admin: 'Admin',
    saved: 'Sparat.',
    badLogin: 'Fel namn eller lösenord.',
    tooShort: 'Lösenordet behöver minst 10 tecken.',
    badCurrent: 'Nuvarande lösenord stämmer inte.',
    badImage: 'Använd en PNG-, JPEG- eller WebP-bild.',
    bigImage: 'Bilden får vara högst 600 kB.',
    signIn: 'Logga in först.',
    origin: 'Den här sidan får inte starta en inloggning.',
    storage: 'Kontolagret är inte kopplat.',
    denied: 'Det GitHub-kontot är inte admin.',
    resources: 'Kunskap',
    resourceTitle: 'Rubrik',
    resourceBody: 'Svar',
    resourceKeywords: 'Ord, kommaseparerade',
    resourceLink: 'Källa, https',
    resourceAdd: 'Lägg till sida',
    resourceRemove: 'Ta bort',
    resourceSaved: 'Sidan finns i kunskapsbasen.',
    badResource: 'Skriv en rubrik och ett svar.',
    badLink: 'Källan ska vara en https-länk.',
    references: 'Referenssidor',
    referenceAdd: 'Spara',
    referenceSaved: 'Adressen är sparad.'
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
    replaceHint: 'Klicka på en produkt för att byta ut den',
    sizeTitle: 'Storlek & Grundmått',
    roofTitle: 'Taktyp & Vinkel',
    covering: 'Takbeklädnad',
    felt: 'Takpapp',
    feltBody: 'Svart ytpapp',
    metal: 'Plåt',
    metalBody: 'Stående fals',
    tiles: 'Betongpannor',
    tilesBody: 'Profilerad panna',
    shingles: 'Takshingel',
    shinglesBody: 'Överlappande asfalt',
    loftTitle: 'Loft & Rymd',
    doorsTitle: 'Ytterdörrar',
    windowsTitle: 'Fönsterpartier',
    gatesTitle: 'Portar & Partier',
    measures: 'Byggmått & Area',
    width: 'Bredd',
    depth: 'Längd',
    height: 'Höjd',
    unitMm: 'mm',
    heightHint: 'Höjden är den högsta sidan. Max 5 000 mm.',
    facade: 'Fasadmaterial & Kulör',
    cladding: 'Paneltyp & dimension',
    standing: 'Stående',
    lying: 'Liggande',
    standardBoard: 'Standard',
    claddingHint: 'Standard är stående ytterpanel 22×145 mm.',
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
    redo: 'Gör om',
    fullscreen: 'Helskärm',
    exitFullscreen: 'Lämna helskärm',
    resetView: 'Återställ vy'
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
    hoverPlaced: '{name} • Klicka för att byta eller ta bort',
    prev: 'Föregående panel',
    next: 'Nästa panel',
    chooseDoor: 'Välj dörr',
    door: 'Dörr ({id})',
    chooseWindow: 'Välj fönster',
    window: 'Fönster ({id})',
    replace: 'Byt',
    remove: 'Ta bort',
    clear: 'Töm denna panel',
    marked: 'Markerad väggyta: {wall}',
    upper: 'övre',
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
    title: 'Kunskap',
    placeholder: 'Fråga om bleck, tak, panel eller bygglov…',
    ask: 'Fråga',
    sources: 'Källor',
    show: 'Visa i huset',
    shown: 'Visas i huset',
    miss: 'Det finns inget svar på det ännu. Fråga om höjd, bleck, taklutning, panel, takbeklädnad eller bygglov.',
    asking: 'Frågar…',
    workers: 'Workers AI valde sidan. Texten står i kunskapsbasen.',
    base: 'Kunskapsbasen',
    model: 'Workers AI',
    belt: 'Var sitter blecket?',
    cladding: 'Vilken panel är standard?',
    air: 'Hur stor är luftspalten?',
    wall: 'Hur är ytterväggen uppbyggd?',
    permit: 'Behövs bygglov?'
  },
  houseImport: {
    title: 'AI-husimport',
    picture: 'Bild från idé',
    pictureBody: 'Ladda upp foton eller en skiss och skriv en mening. Du får en bild tillbaka. Kunskapsbasen kan styra formuleringen mot vägg, tak och skiva. 3D-huset ändras inte.',
    photos: 'Foton eller skiss',
    five: 'Högst fem bilder.',
    modelFour: 'Modellen tar högst fyra bilder. En rättning räknar den förra bilden som en av dem.',
    prompt: 'Prompt',
    promptHint: 'Ett rött hus med stående panel och pulpettak',
    show: 'Visa bild',
    working: 'Skapar bilden…',
    pictureNote: 'Det här är en bild, inte huset i 3D-vyn.',
    enlarge: 'Visa större',
    closePreview: 'Stäng',
    download: 'Ladda ner',
    revise: 'Ändra bilden',
    reviseHint: 'Taket ska vara platt',
    reviseApply: 'Uppdatera bilden',
    revising: 'Uppdaterar bilden…',
    steered: 'Kunskapsbasen:',
    failed: 'Bilden kunde inte skapas.',
    drawing: 'Ritning till 3D',
    drawingBody: 'En PDF med mått sätter bredd, djup, höjd, tak och öppningar på det rektangulära huset.',
    pdf: 'PDF-ritning',
    read: 'Läs ritning',
    reading: 'Läser ritningen…',
    readingPicture: 'Läser måtten i ritningens bilder…',
    applied: 'Huset följer de mått som gick att läsa.',
    empty: 'Ritningen har inga läsbara mått, så huset är oförändrat.',
    bigPdf: 'PDF-filen är för stor.'
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
    saved: 'The house is saved on your account.',
    savedLocal: 'The house is saved in this browser. Sign in with GitHub to keep it on your account.',
    saveFailed: 'The house could not be saved.'
  },
  cms: {
    edit: 'Edit',
    done: 'Done'
  },
  account: {
    login: 'Sign in',
    logout: 'Sign out',
    close: 'Close account',
    github: 'Continue with GitHub',
    githubMissing: 'GitHub login still needs client keys on the worker.',
    loginName: 'GitHub name',
    password: 'Password',
    passwordLogin: 'Sign in with password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    savePassword: 'Save password',
    avatar: 'Change picture',
    admin: 'Admin',
    saved: 'Saved.',
    badLogin: 'Wrong name or password.',
    tooShort: 'Use at least 10 characters.',
    badCurrent: 'The current password does not match.',
    badImage: 'Use a PNG, JPEG, or WebP image.',
    bigImage: 'The image must be under 600 kB.',
    signIn: 'Sign in first.',
    origin: 'This site cannot start a login.',
    storage: 'Account storage is not connected.',
    denied: 'That GitHub account is not an admin.',
    resources: 'Knowledge',
    resourceTitle: 'Title',
    resourceBody: 'Answer',
    resourceKeywords: 'Words, comma separated',
    resourceLink: 'Source, https',
    resourceAdd: 'Add page',
    resourceRemove: 'Remove',
    resourceSaved: 'The page is in the knowledge base.',
    badResource: 'Write a title and an answer.',
    badLink: 'The source must be an https link.',
    references: 'Reference sites',
    referenceAdd: 'Save',
    referenceSaved: 'The address is saved.'
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
    replaceHint: 'Click a product to replace it',
    sizeTitle: 'Size & footprint',
    roofTitle: 'Roof type & pitch',
    covering: 'Roof covering',
    felt: 'Felt',
    feltBody: 'Black cap sheet',
    metal: 'Metal',
    metalBody: 'Standing seam',
    tiles: 'Concrete tiles',
    tilesBody: 'Profiled tile',
    shingles: 'Shingles',
    shinglesBody: 'Overlapping asphalt',
    loftTitle: 'Loft & volume',
    doorsTitle: 'Exterior doors',
    windowsTitle: 'Windows',
    gatesTitle: 'Gates & openings',
    measures: 'Size & area',
    width: 'Width',
    depth: 'Length',
    height: 'Height',
    unitMm: 'mm',
    heightHint: 'Height is the high end of the house. Maximum 5,000 mm.',
    facade: 'Facade & colour',
    cladding: 'Cladding & board size',
    standing: 'Vertical',
    lying: 'Horizontal',
    standardBoard: 'Standard',
    claddingHint: 'The standard board is vertical cladding, 22×145 mm.',
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
    redo: 'Redo',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    resetView: 'Reset view'
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
    hoverPlaced: '{name} • Click to replace or remove',
    prev: 'Previous panel',
    next: 'Next panel',
    chooseDoor: 'Choose door',
    door: 'Door ({id})',
    chooseWindow: 'Choose window',
    window: 'Window ({id})',
    replace: 'Replace',
    remove: 'Remove',
    clear: 'Clear this panel',
    marked: 'Marked wall: {wall}',
    upper: 'upper',
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
    title: 'Knowledge',
    placeholder: 'Ask about the metal belt, roof, cladding, or a permit…',
    ask: 'Ask',
    sources: 'Sources',
    show: 'Show on the house',
    shown: 'Shown on the house',
    miss: 'There is no answer for that yet. Ask about height, the metal belt, roof pitch, cladding, roof covering, or a permit.',
    asking: 'Asking…',
    workers: 'Workers AI chose this page. The wording is from the knowledge base.',
    base: 'Knowledge base',
    model: 'Workers AI',
    belt: 'Where is the metal belt?',
    cladding: 'Which board is standard?',
    air: 'How big is the air gap?',
    wall: 'How is the outer wall built?',
    permit: 'Does it need a permit?'
  },
  houseImport: {
    title: 'AI house import',
    picture: 'Picture from an idea',
    pictureBody: 'Upload photos or a sketch and write a sentence. You get a picture back. The knowledge base can steer the wording toward the wall, roof, and board. The 3D house stays as it is.',
    photos: 'Photos or a sketch',
    five: 'Up to five pictures.',
    modelFour: 'The model takes four pictures at most. A revision counts the previous picture as one of them.',
    prompt: 'Prompt',
    promptHint: 'A red house with standing boards and a mono-pitch roof',
    show: 'Show picture',
    working: 'Making the picture…',
    pictureNote: 'This is a picture, not the house in the 3D view.',
    enlarge: 'Show larger',
    closePreview: 'Close',
    download: 'Download',
    revise: 'Change the picture',
    reviseHint: 'The roof should be flat',
    reviseApply: 'Update the picture',
    revising: 'Updating the picture…',
    steered: 'Knowledge base:',
    failed: 'The picture could not be made.',
    drawing: 'Drawing to 3D',
    drawingBody: 'A PDF with measurements sets the width, depth, height, roof, and openings on the rectangular house.',
    pdf: 'PDF drawing',
    read: 'Read drawing',
    reading: 'Reading the drawing…',
    readingPicture: 'Reading the measurements in the drawing pictures…',
    applied: 'The house follows the measurements that could be read.',
    empty: 'The drawing has no readable measurements, so the house is unchanged.',
    bigPdf: 'The PDF is too large.'
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
      name: 'Mono-pitch 12°',
      desc: 'A single slope, a modern outline, and clear drainage.',
      spec: 'Felt / metal, 12° pitch'
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
  const { t: translate, te, locale } = useI18n();
  const content = useContentStore();

  function t(key: string, named?: Record<string, unknown>) {
    const base = named ? String(translate(key, named)) : String(translate(key));
    if (named) return base;
    return content.text(`${locale.value}:${key}`, base);
  }

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
