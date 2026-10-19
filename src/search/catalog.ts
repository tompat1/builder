import type { CategoryKey } from '../store/useConfigStore';
import {
  DOORS_OPTIONS,
  GATES_OPTIONS,
  LOFT_OPTIONS,
  MATERIAL_OPTIONS,
  ROOF_COVERINGS,
  ROOF_OPTIONS,
  SIZE_OPTIONS,
  WINDOWS_OPTIONS
} from '../store/useConfigStore';
import { MERCH } from '../site/merch';

export type SearchTopic = 'size' | 'colour' | 'roof' | 'openings' | 'inside' | 'tools' | 'projects' | 'shop' | 'site';

export type SearchTool = 'sun' | 'view' | 'ruler' | 'notes' | 'mood' | 'ai' | 'projects';

export interface SearchEntry {
  id: string;
  topic: SearchTopic;
  titleKey?: string;
  title: string;
  hintKey?: string;
  hint: string;
  keywords: string[];
  path: string;
  category?: CategoryKey;
  focus?: string;
  sizeTab?: 'kulor' | 'panel';
  sizeId?: string;
  tool?: SearchTool;
  merchKind?: 'clothing' | 'accessories' | 'prints';
  merchId?: string;
  lead?: boolean;
  boost?: number;
}

const COLOUR_WORDS = ['color', 'colour', 'färg', 'kulör', 'kulor', 'paint', 'fasad'];

function entry(partial: SearchEntry): SearchEntry {
  return partial;
}

function optionEntry(
  option: { id: string; name: string; desc?: string; spec?: string; badge?: string },
  topic: SearchTopic,
  category: CategoryKey,
  focus: string,
  extra: Partial<SearchEntry> = {}
): SearchEntry {
  return entry({
    id: `${topic}-${option.id}`,
    topic,
    titleKey: `catalog.${option.id}.name`,
    title: option.name,
    hintKey: `catalog.${option.id}.desc`,
    hint: option.desc ?? '',
    keywords: [option.name, option.desc ?? '', option.spec ?? '', option.badge ?? ''].filter(Boolean),
    path: '/build',
    category,
    focus,
    ...extra
  });
}

const pages: SearchEntry[] = [
  entry({
    id: 'page-home',
    topic: 'site',
    titleKey: 'site.heroTitle',
    title: 'Builder',
    hintKey: 'site.heroLead',
    hint: '',
    keywords: ['start', 'hem', 'landing', 'home'],
    path: '/',
    lead: true
  }),
  entry({
    id: 'page-homes',
    topic: 'site',
    titleKey: 'site.explore',
    title: 'Utforska hus',
    hintKey: 'site.homesLead',
    hint: '',
    keywords: ['hus', 'homes', 'catalog', 'katalog', 'storlekar'],
    path: '/homes',
    lead: true
  }),
  entry({
    id: 'page-how',
    topic: 'site',
    titleKey: 'site.how',
    title: 'Så fungerar det',
    hintKey: 'site.howLead',
    hint: '',
    keywords: ['how it works', 'guide', 'steg'],
    path: '/homes',
    focus: 'how'
  }),
  entry({
    id: 'page-shop',
    topic: 'shop',
    titleKey: 'site.shopTitle',
    title: 'Butik',
    hintKey: 'site.shopLead',
    hint: '',
    keywords: ['merch', 'shop', 'butik', 'kläder', 'clothing'],
    path: '/merch',
    lead: true
  }),
  entry({
    id: 'page-login',
    topic: 'site',
    titleKey: 'site.login',
    title: 'Logga in',
    hintKey: 'account.github',
    hint: '',
    keywords: ['konto', 'account', 'sign in', 'log in', 'github', 'lösenord', 'password'],
    path: '/login',
    focus: 'btn-github',
    lead: true
  }),
  entry({
    id: 'page-build',
    topic: 'site',
    titleKey: 'onboard.houseTitle',
    title: 'Huset',
    hintKey: 'onboard.houseBody',
    hint: '',
    keywords: ['builder', '3d', 'modell', 'model', 'rita'],
    path: '/build',
    lead: true
  }),
  entry({
    id: 'page-mood',
    topic: 'tools',
    titleKey: 'mood.tool',
    title: 'Moodboard',
    hintKey: 'mood.lead',
    hint: '',
    keywords: ['mood', 'moodboard', 'tavla', 'inspiration', 'bilder', 'pictures', 'invite', 'bjud in', 'post-it', 'länk'],
    path: '/build',
    tool: 'mood',
    lead: true,
    boost: 24
  })
];

const actions: SearchEntry[] = [
  entry({
    id: 'custom-colour',
    topic: 'colour',
    titleKey: 'paint.add',
    title: 'Egen kulör',
    hintKey: 'paint.pick',
    hint: 'Välj på paletten',
    keywords: [
      'egen kulör', 'blanda', 'blanda färg', 'färgblandning', 'custom colour', 'custom color',
      'mix', 'mixing', 'palette', 'palett', 'hex', 'ral', 'pantone', 'färgprov', 'sample',
      ...COLOUR_WORDS
    ],
    path: '/build',
    category: 'size',
    sizeTab: 'kulor',
    focus: 'custom-paint',
    lead: true,
    boost: 48
  }),
  entry({
    id: 'facade-colour',
    topic: 'colour',
    titleKey: 'category.colourTab',
    title: 'Kulör',
    hintKey: 'paint.palette',
    hint: '',
    keywords: ['fasad', 'facade', 'träfärg', ...COLOUR_WORDS],
    path: '/build',
    category: 'size',
    sizeTab: 'kulor',
    focus: 'size-tab-colour',
    lead: true,
    boost: 20
  }),
  entry({
    id: 'facade-panel',
    topic: 'colour',
    titleKey: 'category.facadePanel',
    title: 'Fasad och panel',
    hintKey: 'category.cornerBoardsHint',
    hint: '',
    keywords: ['panel', 'liggande', 'stående', 'cladding', 'board', 'fasad'],
    path: '/build',
    category: 'size',
    sizeTab: 'panel',
    focus: 'size-tab-facade'
  }),
  entry({
    id: 'corner-custom',
    topic: 'colour',
    titleKey: 'category.cornerCustom',
    title: 'Egen kulör på knutarna',
    hintKey: 'category.cornerBoards',
    hint: '',
    keywords: ['knutbrädor', 'corner boards', 'hörn', ...COLOUR_WORDS],
    path: '/build',
    category: 'size',
    sizeTab: 'panel',
    focus: 'corner-color-custom'
  }),
  entry({
    id: 'custom-size',
    topic: 'size',
    titleKey: 'search.customSize',
    title: 'Egna mått',
    hintKey: 'search.customSizeHint',
    hint: 'Bredd, längd och höjd i centimeter.',
    keywords: [
      'egna mått', 'custom size', 'custom sizes', 'bredd', 'längd', 'höjd', 'djup',
      'width', 'length', 'height', 'depth', 'centimeter', 'cm', 'dimension', 'mått'
    ],
    path: '/build',
    category: 'size',
    focus: 'measure-width',
    lead: true,
    boost: 48
  }),
  entry({
    id: 'concrete-size',
    topic: 'size',
    titleKey: 'category.concreteSize',
    title: 'Betonghuset',
    hintKey: 'category.paabyggnadHint',
    hint: '',
    keywords: ['betong', 'concrete', 'påbyggnad', 'addition', 'grund', 'höjd'],
    path: '/build',
    category: 'size',
    sizeId: 'size-paabyggnad',
    focus: 'measure-concrete-width'
  }),
  entry({
    id: 'concrete-wall',
    topic: 'inside',
    titleKey: 'category.addConcreteWall',
    title: 'Lägg till vägg',
    hintKey: 'search.concreteWallHint',
    hint: '',
    keywords: ['extra vägg', 'betongvägg', 'concrete wall', 'innervägg'],
    path: '/build',
    category: 'interior',
    sizeId: 'size-paabyggnad',
    focus: 'btn-add-concrete-wall'
  }),
  entry({
    id: 'roof-overhang',
    topic: 'roof',
    titleKey: 'category.roofOverhang',
    title: 'Utsprång',
    hintKey: 'category.roofOverhangBody',
    hint: '',
    keywords: ['överhäng', 'overhang', 'takfot', 'eave', 'utsprång'],
    path: '/build',
    category: 'roof',
    focus: 'option-roof-overhang'
  }),
  entry({
    id: 'roof-flush',
    topic: 'roof',
    titleKey: 'category.roofFlush',
    title: 'Liv med väggen',
    hintKey: 'category.roofFlushBody',
    hint: '',
    keywords: ['flush', 'liv', 'vägg', 'parapet', 'skandi kub', 'cube roof', 'utan utsprång'],
    path: '/build',
    category: 'roof',
    focus: 'option-roof-flush',
    lead: true
  }),
  entry({
    id: 'terrace',
    topic: 'openings',
    titleKey: 'search.terrace',
    title: 'Altan',
    hintKey: 'search.terraceHint',
    hint: '',
    keywords: ['altan', 'terrace', 'deck', 'uteplats'],
    path: '/build',
    category: 'extras',
    focus: 'btn-add-terrace'
  }),
  entry({
    id: 'canopy',
    topic: 'openings',
    titleKey: 'search.canopy',
    title: 'Skärmtak',
    hint: '',
    keywords: ['skärmtak', 'canopy', 'porch', 'entré'],
    path: '/build',
    category: 'extras',
    focus: 'option-door-canopy'
  }),
  entry({
    id: 'room-bedroom',
    topic: 'inside',
    titleKey: 'interior.bedroom',
    title: 'Sovrum',
    hintKey: 'interior.rooms',
    hint: '',
    keywords: ['sovrum', 'bedroom', 'rum', 'room'],
    path: '/build',
    category: 'interior'
  }),
  entry({
    id: 'room-bathroom',
    topic: 'inside',
    titleKey: 'interior.bathroom',
    title: 'Badrum',
    hintKey: 'interior.plumbing',
    hint: '',
    keywords: ['badrum', 'bathroom', 'våtrum', 'wc'],
    path: '/build',
    category: 'interior'
  }),
  entry({
    id: 'room-kitchen',
    topic: 'inside',
    titleKey: 'interior.kitchen',
    title: 'Kök',
    hintKey: 'interior.rooms',
    hint: '',
    keywords: ['kök', 'kitchen', 'pentry', 'pantry'],
    path: '/build',
    category: 'interior'
  }),
  entry({
    id: 'electrical',
    topic: 'inside',
    titleKey: 'interior.electrical',
    title: 'El',
    hintKey: 'interior.smartElecDesc',
    hint: '',
    keywords: ['el', 'electrical', 'uttag', 'outlet', 'strömbrytare', 'switch'],
    path: '/build',
    category: 'interior'
  }),
  entry({
    id: 'tool-sun',
    topic: 'tools',
    titleKey: 'onboard.sunTitle',
    title: 'Solen',
    hintKey: 'onboard.sunBody',
    hint: '',
    keywords: ['sol', 'sun', 'dagsljus', 'daylight', 'väderstreck', 'facing', 'tid'],
    path: '/build',
    tool: 'sun'
  }),
  entry({
    id: 'tool-view',
    topic: 'tools',
    titleKey: 'onboard.viewTitle',
    title: 'Vyn',
    hintKey: 'onboard.viewBody',
    hint: '',
    keywords: ['vy', 'view', 'reset', 'innerväggar', 'inner walls'],
    path: '/build',
    tool: 'view'
  }),
  entry({
    id: 'tool-measure',
    topic: 'tools',
    titleKey: 'onboard.rulerTitle',
    title: 'Måttet',
    hintKey: 'onboard.rulerBody',
    hint: '',
    keywords: ['mått', 'measure', 'ruler', 'måttband', 'tape', 'linjal'],
    path: '/build',
    tool: 'ruler'
  }),
  entry({
    id: 'tool-notes',
    topic: 'tools',
    titleKey: 'onboard.notesTitle',
    title: 'Anteckningarna',
    hintKey: 'onboard.notesBody',
    hint: '',
    keywords: ['anteckning', 'notes', 'lapp', 'sticky'],
    path: '/build',
    tool: 'notes'
  }),
  entry({
    id: 'tool-ai',
    topic: 'tools',
    titleKey: 'onboard.aiTitle',
    title: 'Assistenten',
    hintKey: 'onboard.aiBody',
    hint: '',
    keywords: ['assistent', 'assistant', 'ai', 'concierge', 'ritning', 'drawing', 'bild', 'picture'],
    path: '/build',
    tool: 'ai',
    lead: true
  }),
  entry({
    id: 'projects',
    topic: 'projects',
    titleKey: 'onboard.projectTitle',
    title: 'Projektet',
    hintKey: 'onboard.projectBody',
    hint: '',
    keywords: ['projekt', 'projects', 'spara', 'save', 'hus'],
    path: '/build',
    tool: 'projects',
    lead: true
  }),
  entry({
    id: 'trello',
    topic: 'projects',
    titleKey: 'onboard.boardTitle',
    title: 'Tavlan',
    hintKey: 'onboard.boardBody',
    hint: '',
    keywords: ['trello', 'tavla', 'board', 'uppgifter', 'tasks'],
    path: '/build',
    tool: 'projects',
    focus: 'house-save-panel',
    lead: true
  }),
  entry({
    id: 'onboarding',
    topic: 'site',
    titleKey: 'onboard.replay',
    title: 'Så fungerar det',
    hintKey: 'search.replayHint',
    hint: '',
    keywords: ['onboarding', 'rundtur', 'tour', 'how it works', 'guide'],
    path: '/build',
    tool: 'projects',
    focus: 'btn-onboarding'
  })
];

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...pages,
  ...actions,
  ...SIZE_OPTIONS.map((size) => optionEntry(size, 'size', 'size', `option-${size.id}`, {
    sizeId: size.id,
    keywords: [size.name, size.desc, size.badge, `${size.areaSqMeters} m2`, 'storlek', 'size', 'house']
  })),
  ...MATERIAL_OPTIONS.map((material) => optionEntry(material, 'colour', 'size', `material-${material.id}`, {
    sizeTab: 'kulor',
    keywords: [material.name, material.desc, material.badge, ...COLOUR_WORDS]
  })),
  ...ROOF_OPTIONS.map((roof) => optionEntry(roof, 'roof', 'roof', `option-${roof.id}`, {
    keywords: [roof.name, roof.desc, roof.spec ?? '', 'tak', 'roof']
  })),
  ...ROOF_COVERINGS.map((cover) => entry({
    id: `roof-${cover.id}`,
    topic: 'roof',
    titleKey: `category.${cover.id}`,
    title: cover.id,
    hintKey: `category.${cover.id}Body`,
    hint: '',
    keywords: [cover.id, 'tak', 'roof', 'covering', 'ytskikt', 'papp', 'plåt', 'tegel', 'shingles', 'felt', 'metal', 'tiles'],
    path: '/build',
    category: 'roof',
    focus: `option-roof-${cover.id}`
  })),
  ...LOFT_OPTIONS.map((loft) => optionEntry(loft, 'inside', 'loft', `option-${loft.id}`, {
    keywords: [loft.name, loft.desc, 'loft', 'sovloft']
  })),
  ...DOORS_OPTIONS.map((door) => optionEntry(door, 'openings', 'doors', `option-${door.id}`, {
    keywords: [door.name, door.desc, door.spec ?? '', 'dörr', 'door', 'ytterdörr']
  })),
  ...WINDOWS_OPTIONS.map((win) => optionEntry(win, 'openings', 'windows', `option-${win.id}`, {
    keywords: [win.name, win.desc, win.spec ?? '', 'fönster', 'window']
  })),
  ...GATES_OPTIONS.map((gate) => optionEntry(gate, 'openings', 'gates', `option-${gate.id}`, {
    keywords: [gate.name, gate.desc, gate.spec ?? '', 'port', 'gate', 'garage']
  })),
  ...MERCH.map((item) => entry({
    id: `merch-${item.id}`,
    topic: 'shop',
    titleKey: item.nameKey,
    title: item.id,
    hintKey: item.infoKey,
    hint: '',
    keywords: [item.id.replace(/-/g, ' '), item.kind, 'merch', 'shop', 'butik', ...item.sizes],
    path: '/merch',
    merchKind: item.kind,
    merchId: item.id,
    focus: `merch-${item.id}`
  }))
];

export const SEARCH_TOPICS: SearchTopic[] = ['size', 'colour', 'roof', 'openings', 'inside', 'tools', 'projects', 'shop', 'site'];
