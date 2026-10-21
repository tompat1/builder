/**
 * Storage and management service for the Shopping List.
 * Co-exists alongside Expense Tracker for planning upcoming purchases:
 * Garden, Power Tools, Kitchen, Furniture, Materials, etc.
 */
export type ExpenseCategory =
  | 'materials'
  | 'ground'
  | 'framing'
  | 'windows_doors'
  | 'interior'
  | 'labor'
  | 'permits'
  | 'tools'
  | 'other';

export interface ExpenseAuthor {
  id?: string;
  name: string;
  avatar: string;
  email?: string;
}

const ACTIVE_HOUSE_KEY = 'builder.house.active';
const RATE_STORAGE_KEY = 'builder.currency.rate_pln_sek';
export const DEFAULT_RATE_PLN_TO_SEK = 2.54;

export function expenseHouseKey(): string {
  try {
    if (typeof localStorage === 'undefined') return 'draft';
    const id = localStorage.getItem(ACTIVE_HOUSE_KEY);
    return typeof id === 'string' && /^hus_[a-zA-Z0-9_-]{16,64}$/.test(id) ? id : 'draft';
  } catch {
    return 'draft';
  }
}

export function formatPLN(amount: number): string {
  const num = Number(amount || 0);
  const isInt = Number.isInteger(num);
  const str = isInt ? Math.round(num).toString() : (Math.round(num * 100) / 100).toString();
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = parts.length > 1 ? `${parts[0]},${parts[1]}` : parts[0];
  return `${formatted} zł`;
}

export function formatSEK(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('sv-SE').replace(/[\s\u00A0\u202F]/g, ' ')} kr`;
}

export function convertPlnToSek(amountPln: number, rate = DEFAULT_RATE_PLN_TO_SEK): number {
  return Math.round((Number(amountPln) || 0) * (Number(rate) || DEFAULT_RATE_PLN_TO_SEK));
}

export function convertSekToPln(amountSek: number, rate = DEFAULT_RATE_PLN_TO_SEK): number {
  const r = Number(rate) || DEFAULT_RATE_PLN_TO_SEK;
  return r > 0 ? Math.round((Number(amountSek) || 0) / r) : Math.round(Number(amountSek) || 0);
}

export function getStoredCurrencyRate(): { ratePlnToSek: number; rateSekToPln: number } {
  try {
    if (typeof localStorage === 'undefined') {
      return { ratePlnToSek: DEFAULT_RATE_PLN_TO_SEK, rateSekToPln: 1 / DEFAULT_RATE_PLN_TO_SEK };
    }
    const raw = localStorage.getItem(RATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ratePlnToSek === 'number' && parsed.ratePlnToSek > 0) {
        return {
          ratePlnToSek: parsed.ratePlnToSek,
          rateSekToPln: parsed.rateSekToPln || (1 / parsed.ratePlnToSek)
        };
      }
    }
  } catch {
    // ignore
  }
  return { ratePlnToSek: DEFAULT_RATE_PLN_TO_SEK, rateSekToPln: 1 / DEFAULT_RATE_PLN_TO_SEK };
}

export type ShoppingCategory =
  | 'garden'
  | 'power_tools'
  | 'kitchen'
  | 'furniture'
  | 'materials'
  | 'hardware_elec'
  | 'other';

export interface ShoppingCategoryMeta {
  id: ShoppingCategory;
  labelSv: string;
  labelEn: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  /** Suggested default ExpenseCategory when converted to an expense */
  defaultExpenseCategory: ExpenseCategory;
}

export const SHOPPING_CATEGORIES: ShoppingCategoryMeta[] = [
  {
    id: 'garden',
    labelSv: 'Trädgård & Utemiljö',
    labelEn: 'Garden & Outdoor',
    color: '#16a34a',
    badgeBg: 'rgba(22, 163, 74, 0.12)',
    badgeBorder: 'rgba(22, 163, 74, 0.3)',
    icon: '🌿',
    defaultExpenseCategory: 'other'
  },
  {
    id: 'power_tools',
    labelSv: 'Elverktyg & Byggmaskiner',
    labelEn: 'Power Tools & Machinery',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    icon: '⚡',
    defaultExpenseCategory: 'tools'
  },
  {
    id: 'kitchen',
    labelSv: 'Kök & Vitvaror',
    labelEn: 'Kitchen & Appliances',
    color: '#ea580c',
    badgeBg: 'rgba(234, 88, 12, 0.12)',
    badgeBorder: 'rgba(234, 88, 12, 0.3)',
    icon: '🍳',
    defaultExpenseCategory: 'interior'
  },
  {
    id: 'furniture',
    labelSv: 'Möbler & Inredning',
    labelEn: 'Furniture & Interior',
    color: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeBorder: 'rgba(139, 92, 246, 0.3)',
    icon: '🛋️',
    defaultExpenseCategory: 'interior'
  },
  {
    id: 'materials',
    labelSv: 'Byggmaterial & Virke',
    labelEn: 'Building Materials & Timber',
    color: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeBorder: 'rgba(217, 119, 6, 0.3)',
    icon: '🪵',
    defaultExpenseCategory: 'materials'
  },
  {
    id: 'hardware_elec',
    labelSv: 'VVS, El & Beslag',
    labelEn: 'Plumbing, Electric & Hardware',
    color: '#0284c7',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeBorder: 'rgba(2, 132, 199, 0.3)',
    icon: '🔧',
    defaultExpenseCategory: 'materials'
  },
  {
    id: 'other',
    labelSv: 'Övrigt',
    labelEn: 'Other',
    color: '#71717a',
    badgeBg: 'rgba(113, 113, 122, 0.12)',
    badgeBorder: 'rgba(113, 113, 122, 0.3)',
    icon: '📦',
    defaultExpenseCategory: 'other'
  }
];

export function getShoppingCategoryMeta(id: ShoppingCategory): ShoppingCategoryMeta {
  return SHOPPING_CATEGORIES.find((c) => c.id === id) || SHOPPING_CATEGORIES[SHOPPING_CATEGORIES.length - 1];
}

export type ShoppingPriority = 'high' | 'medium' | 'low';

export interface ShoppingItem {
  id: string;
  title: string;
  category: ShoppingCategory;
  /** Estimated price in PLN */
  estimatedPricePln: number;
  /** Estimated price in SEK (cached for display) */
  estimatedPriceSek?: number;
  quantity: number;
  unit?: string;
  priority: ShoppingPriority;
  isPurchased: boolean;
  purchasedPricePln?: number;
  purchasedAt?: string;
  /** Linked expense ID if this item has been logged into the expense tracker */
  loggedExpenseId?: string;
  notes?: string;
  storeOrUrl?: string;
  addedBy?: ExpenseAuthor;
  createdAt: string;
  updatedAt?: string;
}

export interface ShoppingState {
  houseKey: string;
  items: ShoppingItem[];
  updatedAt?: string;
}

export interface ShoppingCategorySummary {
  category: ShoppingCategory;
  labelSv: string;
  labelEn: string;
  color: string;
  totalPlannedPln: number;
  totalPlannedSek: number;
  totalPurchasedPln: number;
  totalPurchasedSek: number;
  totalCount: number;
  toBuyCount: number;
  purchasedCount: number;
}

export interface ShoppingSummary {
  totalCount: number;
  toBuyCount: number;
  purchasedCount: number;
  totalPlannedPln: number;
  totalPlannedSek: number;
  totalPurchasedPln: number;
  totalPurchasedSek: number;
  remainingToBuyPln: number;
  remainingToBuySek: number;
  categories: ShoppingCategorySummary[];
  exchangeRate: number;
}

const STORAGE_KEY = 'builder.shopping_list';

function shoppingItemId(): string {
  return `shop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function readBucket(): Record<string, ShoppingState> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeBucket(bucket: Record<string, ShoppingState>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bucket));
  } catch {
    // ignore
  }
}

export interface PolishStoreTricity {
  id: string;
  name: string;
  chain: string;
  city: 'Gdańsk' | 'Gdynia';
  location: string;
  address: string;
  searchUrl: (query: string) => string;
  specialty: string;
}

export const POLISH_TRICITY_STORES: PolishStoreTricity[] = [
  {
    id: 'castorama_oliwa',
    name: 'Castorama Gdańsk Oliwa',
    chain: 'Castorama',
    city: 'Gdańsk',
    location: 'Oliwa',
    address: 'al. Grunwaldzka 262, 80-314 Gdańsk',
    searchUrl: (q: string) => `https://www.castorama.pl/szukaj?query=${encodeURIComponent(q)}`,
    specialty: 'Power tools (DeWalt, Bosch), siding timber, decking, plumbing'
  },
  {
    id: 'castorama_osowa',
    name: 'Castorama Gdańsk Osowa',
    chain: 'Castorama',
    city: 'Gdańsk',
    location: 'Osowa',
    address: 'ul. Odyseusza 2, 80-299 Gdańsk',
    searchUrl: (q: string) => `https://www.castorama.pl/szukaj?query=${encodeURIComponent(q)}`,
    specialty: 'Garden machinery, laser levels, timber, hardware'
  },
  {
    id: 'castorama_gdynia',
    name: 'Castorama Gdynia',
    chain: 'Castorama',
    city: 'Gdynia',
    location: 'Morska',
    address: 'ul. Morska 10, 81-323 Gdynia',
    searchUrl: (q: string) => `https://www.castorama.pl/szukaj?query=${encodeURIComponent(q)}`,
    specialty: 'Framing hardware, cordless tools, structural fixings'
  },
  {
    id: 'leroy_karczemki',
    name: 'Leroy Merlin Gdańsk Karczemki',
    chain: 'Leroy Merlin',
    city: 'Gdańsk',
    location: 'Karczemki',
    address: 'ul. Szczęśliwa 7, 80-176 Gdańsk',
    searchUrl: (q: string) => `https://www.leroymerlin.pl/szukaj.html?q=${encodeURIComponent(q)}`,
    specialty: 'Large building depot, timber, sheet goods, garden center'
  },
  {
    id: 'leroy_oliwa',
    name: 'Leroy Merlin Gdańsk Oliwa',
    chain: 'Leroy Merlin',
    city: 'Gdańsk',
    location: 'Oliwa',
    address: 'al. Grunwaldzka 309, 80-309 Gdańsk',
    searchUrl: (q: string) => `https://www.leroymerlin.pl/szukaj.html?q=${encodeURIComponent(q)}`,
    specialty: 'Kitchen sinks, bathroom fittings, lighting, interior finishes'
  },
  {
    id: 'leroy_gdynia',
    name: 'Leroy Merlin Gdynia',
    chain: 'Leroy Merlin',
    city: 'Gdynia',
    location: 'Chylonia',
    address: 'ul. Kcyńska 27, 81-005 Gdynia',
    searchUrl: (q: string) => `https://www.leroymerlin.pl/szukaj.html?q=${encodeURIComponent(q)}`,
    specialty: 'Power tools, flooring, exterior paints, garden tools'
  },
  {
    id: 'bricoman_gdansk',
    name: 'Bricoman Gdańsk',
    chain: 'Bricoman',
    city: 'Gdańsk',
    location: 'Kowale / Szadółki',
    address: 'ul. Przywidzka 10B, 80-174 Gdańsk',
    searchUrl: (q: string) => `https://www.bricoman.pl/szukaj?q=${encodeURIComponent(q)}`,
    specialty: 'Trade supply, C24 structural timber, wheelbarrows, insulation'
  },
  {
    id: 'obi_matarnia',
    name: 'OBI Gdańsk Matarnia',
    chain: 'OBI',
    city: 'Gdańsk',
    location: 'Matarnia',
    address: 'ul. Złota Karczma 26, 80-298 Gdańsk',
    searchUrl: (q: string) => `https://www.obi.pl/search/${encodeURIComponent(q)}/`,
    specialty: 'Garden center, hoses, lawn care, outdoor lighting'
  },
  {
    id: 'ikea_gdansk',
    name: 'IKEA Gdańsk Matarnia',
    chain: 'IKEA',
    city: 'Gdańsk',
    location: 'Matarnia',
    address: 'ul. Złota Karczma 26, 80-298 Gdańsk',
    searchUrl: (q: string) => `https://www.ikea.com/pl/pl/search/?q=${encodeURIComponent(q)}`,
    specialty: 'Kitchen systems, appliances, continental beds, sofas, dining tables'
  },
  {
    id: 'mediaexpert_matarnia',
    name: 'Media Expert Gdańsk Matarnia',
    chain: 'Media Expert',
    city: 'Gdańsk',
    location: 'Matarnia',
    address: 'ul. Złota Karczma 26, 80-298 Gdańsk',
    searchUrl: (q: string) => `https://www.mediaexpert.pl/szukaj?query=${encodeURIComponent(q)}`,
    specialty: 'Integrated kitchen appliances, induction hobs, quiet fridge-freezers'
  },
  {
    id: 'jula_matarnia',
    name: 'Jula Gdańsk Matarnia',
    chain: 'Jula',
    city: 'Gdańsk',
    location: 'Matarnia',
    address: 'ul. Złota Karczma 26, 80-298 Gdańsk',
    searchUrl: (q: string) => `https://www.jula.pl/search/?query=${encodeURIComponent(q)}`,
    specialty: 'Workshop gear, patio furniture, garden equipment'
  }
];

/**
 * Curated shopping list items covering Garden, Power Tools, Kitchen, Furniture, Materials
 * specifically sourced and priced from Polish stores in Gdańsk & Gdynia (Trójmiasto).
 */
export function getCuratedSeedItems(): Omit<ShoppingItem, 'id' | 'createdAt'>[] {
  return [
    // 1. Garden & Outdoor (Polish stores in Gdańsk / Gdynia)
    {
      title: 'Robotic lawn mower with installation kit',
      category: 'garden',
      estimatedPricePln: 2800,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'For lawn area ~600–800 m², perimeter boundary wire & pegs included',
      storeOrUrl: 'Castorama Gdańsk Oliwa / Leroy Merlin Karczemki'
    },
    {
      title: 'Garden hose & 30m automatic retractable reel',
      category: 'garden',
      estimatedPricePln: 350,
      quantity: 1,
      unit: 'pcs',
      priority: 'medium',
      isPurchased: false,
      notes: 'Wall-mounted pivoting reel with adjustable brass nozzle set',
      storeOrUrl: 'Castorama Gdańsk Osowa / OBI Matarnia'
    },
    {
      title: 'Heavy-duty galvanized wheelbarrow 100L',
      category: 'garden',
      estimatedPricePln: 220,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Puncture-proof PU pneumatic tire for earthwork, gravel, and site clearing',
      storeOrUrl: 'Bricoman Gdańsk / Castorama Gdańsk'
    },
    {
      title: 'Outdoor patio lounge furniture set',
      category: 'garden',
      estimatedPricePln: 3200,
      quantity: 1,
      unit: 'set',
      priority: 'medium',
      isPurchased: false,
      notes: 'Weather-resistant 4-piece corner lounge with low table and cushions',
      storeOrUrl: 'IKEA Gdańsk Matarnia / Jula Matarnia'
    },

    // 2. Power Tools for house building (Gdańsk & Gdynia depots)
    {
      title: 'Sliding compound mitre saw 216mm with stand',
      category: 'power_tools',
      estimatedPricePln: 1600,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Crucial for facade cladding, framing joists, rafters, and deck boards',
      storeOrUrl: 'Castorama Gdańsk Oliwa (DeWalt / Bosch)'
    },
    {
      title: 'Plunge cut circular saw with 1400mm guide rail',
      category: 'power_tools',
      estimatedPricePln: 1200,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Millimeter-accurate splinter-free cuts in OSB, plywood sheets, and interior linings',
      storeOrUrl: 'Leroy Merlin Gdańsk Karczemki (Makita / Bosch)'
    },
    {
      title: '18V Brushless drill & impact driver combo kit (2 batteries)',
      category: 'power_tools',
      estimatedPricePln: 850,
      quantity: 1,
      unit: 'set',
      priority: 'high',
      isPurchased: false,
      notes: 'High torque cordless kit with fast charger and case for timber framing',
      storeOrUrl: 'Castorama Gdynia (ul. Morska 10) / Leroy Merlin Gdańsk'
    },
    {
      title: '360° Cross-line laser level with telescopic tripod',
      category: 'power_tools',
      estimatedPricePln: 450,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Self-leveling green beam for partition framing, kitchen heights, and ceiling leveling',
      storeOrUrl: 'Castorama Gdańsk Osowa'
    },
    {
      title: 'Wet & dry workshop vacuum cleaner 25L with power take-off',
      category: 'power_tools',
      estimatedPricePln: 550,
      quantity: 1,
      unit: 'pcs',
      priority: 'medium',
      isPurchased: false,
      notes: 'Synchronized auto-start socket activates dust extraction automatically with saw/sanders',
      storeOrUrl: 'Castorama Gdańsk Oliwa / Kärcher Gdynia'
    },

    // 3. Kitchen & Appliances (IKEA Gdańsk & Media Expert Matarnia)
    {
      title: '60cm Induction cooktop with boost & bridge zones',
      category: 'kitchen',
      estimatedPricePln: 1600,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Slim built-in design, flexible cooking zones, and power management timer',
      storeOrUrl: 'IKEA Gdańsk Matarnia / Media Expert Gdańsk'
    },
    {
      title: 'Built-in convection oven with fan & grill',
      category: 'kitchen',
      estimatedPricePln: 1800,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Black glass / stainless steel front with telescopic rails and soft-close door',
      storeOrUrl: 'IKEA Gdańsk Matarnia'
    },
    {
      title: 'Integrated fridge-freezer 178cm low-noise',
      category: 'kitchen',
      estimatedPricePln: 2400,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Quiet compressor (<35 dB), NoFrost technology, ideal for open-plan living layout',
      storeOrUrl: 'Media Expert Gdańsk Matarnia / IKEA Gdańsk'
    },
    {
      title: 'Undermount composite kitchen sink & mixer tap',
      category: 'kitchen',
      estimatedPricePln: 890,
      quantity: 1,
      unit: 'set',
      priority: 'high',
      isPurchased: false,
      notes: 'Black granite composite bowl with high-arc pull-out tap and siphon set',
      storeOrUrl: 'Castorama Gdańsk Oliwa / Leroy Merlin Gdańsk'
    },
    {
      title: 'Fully integrated 60cm dishwasher with floor beam',
      category: 'kitchen',
      estimatedPricePln: 1950,
      quantity: 1,
      unit: 'pcs',
      priority: 'medium',
      isPurchased: false,
      notes: 'Low water consumption, cutlery tray, and optical LED beam projected on the floor',
      storeOrUrl: 'IKEA Gdańsk Matarnia / Media Expert'
    },

    // 4. Furniture & Interior (IKEA Gdańsk Matarnia)
    {
      title: 'Queen continental bed 160×200cm for loft bedroom',
      category: 'furniture',
      estimatedPricePln: 2800,
      quantity: 1,
      unit: 'pcs',
      priority: 'high',
      isPurchased: false,
      notes: 'Multi-layer pocket-spring base with high-density topper and solid oak legs',
      storeOrUrl: 'IKEA Gdańsk Matarnia'
    },
    {
      title: 'Solid oak dining table 180cm + 6 chairs',
      category: 'furniture',
      estimatedPricePln: 3600,
      quantity: 1,
      unit: 'set',
      priority: 'medium',
      isPurchased: false,
      notes: 'Oiled natural solid oak top with durable Scandinavian dining chairs',
      storeOrUrl: 'IKEA Gdańsk Matarnia'
    },
    {
      title: '3-seater corner sofa with chaise lounge',
      category: 'furniture',
      estimatedPricePln: 4200,
      quantity: 1,
      unit: 'pcs',
      priority: 'medium',
      isPurchased: false,
      notes: 'Removable wash-friendly textured fabric cover in light neutral stone tone',
      storeOrUrl: 'IKEA Gdańsk Matarnia'
    },
    {
      title: 'Modular sliding wardrobe storage system',
      category: 'furniture',
      estimatedPricePln: 2100,
      quantity: 2,
      unit: 'pcs',
      priority: 'medium',
      isPurchased: false,
      notes: 'Fitted with interior drawers, pull-out wire baskets, and hanger rods',
      storeOrUrl: 'Castorama Gdańsk Oliwa / IKEA Gdańsk'
    },

    // 5. Building Materials & Fasteners (Gdańsk Trade Depots)
    {
      title: 'C24 Structural timber & framing joists (pack)',
      category: 'materials',
      estimatedPricePln: 1450,
      quantity: 1,
      unit: 'pack',
      priority: 'high',
      isPurchased: false,
      notes: 'Kiln-dried certified structural timber for floor joists and terrace substructure',
      storeOrUrl: 'Bricoman Gdańsk (ul. Przywidzka 10B)'
    },
    {
      title: 'Corrosion-resistant structural exterior screws & joist hangers',
      category: 'hardware_elec',
      estimatedPricePln: 380,
      quantity: 1,
      unit: 'pack',
      priority: 'high',
      isPurchased: false,
      notes: 'C4-coated structural torx screws (8x160mm) and heavy-duty angle brackets',
      storeOrUrl: 'Castorama Gdynia / Castorama Gdańsk'
    }
  ];
}

const SWEDISH_TO_ENGLISH_SEED_MAP: Record<string, Partial<ShoppingItem>> = {
  'robotgräsklippare': {
    title: 'Robotic lawn mower with installation kit',
    notes: 'For lawn area ~600–800 m², perimeter boundary wire & pegs included',
    storeOrUrl: 'Castorama Gdańsk Oliwa / Leroy Merlin Karczemki',
    unit: 'pcs'
  },
  'trädgårdsslang': {
    title: 'Garden hose & 30m automatic retractable reel',
    notes: 'Wall-mounted pivoting reel with adjustable brass nozzle set',
    storeOrUrl: 'Castorama Gdańsk Osowa / OBI Matarnia',
    unit: 'pcs'
  },
  'skottkärra': {
    title: 'Heavy-duty galvanized wheelbarrow 100L',
    notes: 'Puncture-proof PU pneumatic tire for earthwork, gravel, and site clearing',
    storeOrUrl: 'Bricoman Gdańsk / Castorama Gdańsk',
    unit: 'pcs'
  },
  'loungeset': {
    title: 'Outdoor patio lounge furniture set',
    notes: 'Weather-resistant 4-piece corner lounge with low table and cushions',
    storeOrUrl: 'IKEA Gdańsk Matarnia / Jula Matarnia',
    unit: 'set'
  },
  'kap- & gersåg': {
    title: 'Sliding compound mitre saw 216mm with stand',
    notes: 'Crucial for facade cladding, framing joists, rafters, and deck boards',
    storeOrUrl: 'Castorama Gdańsk Oliwa (DeWalt / Bosch)',
    unit: 'pcs'
  },
  'sänksåg': {
    title: 'Plunge cut circular saw with 1400mm guide rail',
    notes: 'Millimeter-accurate splinter-free cuts in OSB, plywood sheets, and interior linings',
    storeOrUrl: 'Leroy Merlin Gdańsk Karczemki (Makita / Bosch)',
    unit: 'pcs'
  },
  'borrskruvdragare': {
    title: '18V Brushless drill & impact driver combo kit (2 batteries)',
    notes: 'High torque cordless kit with fast charger and case for timber framing',
    storeOrUrl: 'Castorama Gdynia (ul. Morska 10) / Leroy Merlin Gdańsk',
    unit: 'set'
  },
  'korslinjelaser': {
    title: '360° Cross-line laser level with telescopic tripod',
    notes: 'Self-leveling green beam for partition framing, kitchen heights, and ceiling leveling',
    storeOrUrl: 'Castorama Gdańsk Osowa',
    unit: 'pcs'
  },
  'byggdammsugare': {
    title: 'Wet & dry workshop vacuum cleaner 25L with power take-off',
    notes: 'Synchronized auto-start socket activates dust extraction automatically with saw/sanders',
    storeOrUrl: 'Castorama Gdańsk Oliwa / Kärcher Gdynia',
    unit: 'pcs'
  },
  'induktionshäll': {
    title: '60cm Induction cooktop with boost & bridge zones',
    notes: 'Slim built-in design, flexible cooking zones, and power management timer',
    storeOrUrl: 'IKEA Gdańsk Matarnia / Media Expert Gdańsk',
    unit: 'pcs'
  },
  'inbyggnadsugn': {
    title: 'Built-in convection oven with fan & grill',
    notes: 'Black glass / stainless steel front with telescopic rails and soft-close door',
    storeOrUrl: 'IKEA Gdańsk Matarnia',
    unit: 'pcs'
  },
  'integrerad kyl': {
    title: 'Integrated fridge-freezer 178cm low-noise',
    notes: 'Quiet compressor (<35 dB), NoFrost technology, ideal for open-plan living layout',
    storeOrUrl: 'Media Expert Gdańsk Matarnia / IKEA Gdańsk',
    unit: 'pcs'
  },
  'underlimmad diskho': {
    title: 'Undermount composite kitchen sink & mixer tap',
    notes: 'Black granite composite bowl with high-arc pull-out tap and siphon set',
    storeOrUrl: 'Castorama Gdańsk Oliwa / Leroy Merlin Gdańsk',
    unit: 'set'
  },
  'integrerad diskmaskin': {
    title: 'Fully integrated 60cm dishwasher with floor beam',
    notes: 'Low water consumption, cutlery tray, and optical LED beam projected on the floor',
    storeOrUrl: 'IKEA Gdańsk Matarnia / Media Expert',
    unit: 'pcs'
  },
  'kontinentalsäng': {
    title: 'Queen continental bed 160×200cm for loft bedroom',
    notes: 'Multi-layer pocket-spring base with high-density topper and solid oak legs',
    storeOrUrl: 'IKEA Gdańsk Matarnia',
    unit: 'pcs'
  },
  'matbord massiv ek': {
    title: 'Solid oak dining table 180cm + 6 chairs',
    notes: 'Oiled natural solid oak top with durable Scandinavian dining chairs',
    storeOrUrl: 'IKEA Gdańsk Matarnia',
    unit: 'set'
  },
  'hörnsoffa': {
    title: '3-seater corner sofa with chaise lounge',
    notes: 'Removable wash-friendly textured fabric cover in light neutral stone tone',
    storeOrUrl: 'IKEA Gdańsk Matarnia',
    unit: 'pcs'
  },
  'garderobslösning': {
    title: 'Modular sliding wardrobe storage system',
    notes: 'Fitted with interior drawers, pull-out wire baskets, and hanger rods',
    storeOrUrl: 'Castorama Gdańsk Oliwa / IKEA Gdańsk',
    unit: 'pcs'
  }
};

export function migrateShoppingItemsToEnglish(items: ShoppingItem[]): { items: ShoppingItem[]; migratedCount: number } {
  let migratedCount = 0;
  const migrated = items.map((item) => {
    let updated = { ...item };
    const lowerTitle = (item.title || '').toLowerCase();

    // Check seed translation map
    for (const [swKey, englishData] of Object.entries(SWEDISH_TO_ENGLISH_SEED_MAP)) {
      if (lowerTitle.includes(swKey)) {
        updated = {
          ...updated,
          ...englishData
        };
        migratedCount++;
        break;
      }
    }

    // Convert Swedish units
    if (updated.unit === 'st') {
      updated.unit = 'pcs';
      migratedCount++;
    } else if (updated.unit === 'grupp') {
      updated.unit = 'set';
      migratedCount++;
    } else if (updated.unit === 'pkt') {
      updated.unit = 'pack';
      migratedCount++;
    } else if (updated.unit === 'rulle') {
      updated.unit = 'roll';
      migratedCount++;
    }

    // Update Swedish store names to Polish Gdańsk/Gdynia branches
    if (updated.storeOrUrl) {
      if (updated.storeOrUrl === 'Bauhaus') {
        updated.storeOrUrl = 'Castorama Gdańsk Osowa / OBI Matarnia';
        migratedCount++;
      } else if (updated.storeOrUrl === 'Castorama / Leroy Merlin') {
        updated.storeOrUrl = 'Castorama Gdańsk Oliwa / Leroy Merlin Karczemki';
        migratedCount++;
      } else if (updated.storeOrUrl === 'Castorama') {
        updated.storeOrUrl = 'Castorama Gdańsk Oliwa';
        migratedCount++;
      } else if (updated.storeOrUrl === 'Jula / IKEA') {
        updated.storeOrUrl = 'IKEA Gdańsk Matarnia / Jula Matarnia';
        migratedCount++;
      } else if (updated.storeOrUrl === 'IKEA') {
        updated.storeOrUrl = 'IKEA Gdańsk Matarnia';
        migratedCount++;
      } else if (updated.storeOrUrl === 'IKEA / MediaMarkt') {
        updated.storeOrUrl = 'IKEA Gdańsk Matarnia / Media Expert Gdańsk';
        migratedCount++;
      }
    }

    return updated;
  });

  return { items: migrated, migratedCount };
}

export function loadShoppingList(houseKey = expenseHouseKey()): ShoppingState {
  const bucket = readBucket();
  const current = bucket[houseKey];
  if (current && Array.isArray(current.items)) {
    // Automatically migrate legacy Swedish items or units to English & Gdańsk stores
    const { items: migratedItems, migratedCount } = migrateShoppingItemsToEnglish(current.items);
    if (migratedCount > 0) {
      current.items = migratedItems;
      current.updatedAt = new Date().toISOString();
      bucket[houseKey] = current;
      writeBucket(bucket);
    }
    return {
      houseKey,
      items: current.items,
      updatedAt: current.updatedAt || new Date().toISOString()
    };
  }

  // Pre-seed with curated English starter items focused on Gdańsk & Gdynia stores
  const now = new Date().toISOString();
  const seededItems: ShoppingItem[] = getCuratedSeedItems().map((item) => ({
    ...item,
    id: shoppingItemId(),
    createdAt: now
  }));

  const defaultState: ShoppingState = {
    houseKey,
    items: seededItems,
    updatedAt: now
  };
  bucket[houseKey] = defaultState;
  writeBucket(bucket);
  return defaultState;
}

export function resetShoppingListToSeeds(houseKey = expenseHouseKey()): ShoppingState {
  const bucket = readBucket();
  const now = new Date().toISOString();
  const seededItems: ShoppingItem[] = getCuratedSeedItems().map((item) => ({
    ...item,
    id: shoppingItemId(),
    createdAt: now
  }));

  const resetState: ShoppingState = {
    houseKey,
    items: seededItems,
    updatedAt: now
  };
  bucket[houseKey] = resetState;
  writeBucket(bucket);
  return resetState;
}

export function saveShoppingList(state: ShoppingState, houseKey = expenseHouseKey()): void {
  const bucket = readBucket();
  bucket[houseKey] = {
    ...state,
    houseKey,
    updatedAt: new Date().toISOString()
  };
  writeBucket(bucket);
}

export function addShoppingItem(
  data: Omit<ShoppingItem, 'id' | 'createdAt'>,
  houseKey = expenseHouseKey()
): ShoppingItem {
  const state = loadShoppingList(houseKey);
  const now = new Date().toISOString();
  const currentRate = getStoredCurrencyRate().ratePlnToSek;

  const item: ShoppingItem = {
    ...data,
    id: shoppingItemId(),
    estimatedPricePln: Math.max(0, Math.round(Number(data.estimatedPricePln) || 0)),
    estimatedPriceSek: convertPlnToSek(data.estimatedPricePln, currentRate),
    quantity: Math.max(1, Math.round(Number(data.quantity) || 1)),
    createdAt: now,
    updatedAt: now
  };

  state.items = [item, ...state.items];
  saveShoppingList(state, houseKey);
  return item;
}

export function updateShoppingItem(
  id: string,
  updates: Partial<ShoppingItem>,
  houseKey = expenseHouseKey()
): ShoppingItem | null {
  const state = loadShoppingList(houseKey);
  const index = state.items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = state.items[index];
  const now = new Date().toISOString();
  const currentRate = getStoredCurrencyRate().ratePlnToSek;

  const updated: ShoppingItem = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: now,
    estimatedPricePln: updates.estimatedPricePln !== undefined
      ? Math.max(0, Math.round(Number(updates.estimatedPricePln) || 0))
      : current.estimatedPricePln,
    estimatedPriceSek: updates.estimatedPricePln !== undefined
      ? convertPlnToSek(Number(updates.estimatedPricePln), currentRate)
      : current.estimatedPriceSek
  };

  state.items[index] = updated;
  saveShoppingList(state, houseKey);
  return updated;
}

export function toggleShoppingItemPurchased(
  id: string,
  houseKey = expenseHouseKey()
): ShoppingItem | null {
  const state = loadShoppingList(houseKey);
  const item = state.items.find((i) => i.id === id);
  if (!item) return null;

  const nextPurchased = !item.isPurchased;
  item.isPurchased = nextPurchased;
  if (nextPurchased) {
    item.purchasedAt = new Date().toISOString();
    if (item.purchasedPricePln === undefined) {
      item.purchasedPricePln = item.estimatedPricePln;
    }
  } else {
    item.purchasedAt = undefined;
  }
  item.updatedAt = new Date().toISOString();

  saveShoppingList(state, houseKey);
  return item;
}

export function deleteShoppingItem(id: string, houseKey = expenseHouseKey()): boolean {
  const state = loadShoppingList(houseKey);
  const initialLength = state.items.length;
  state.items = state.items.filter((item) => item.id !== id);
  if (state.items.length !== initialLength) {
    saveShoppingList(state, houseKey);
    return true;
  }
  return false;
}

export function seedCuratedItemsToShoppingList(houseKey = expenseHouseKey()): ShoppingItem[] {
  const state = loadShoppingList(houseKey);
  const now = new Date().toISOString();
  const existingTitles = new Set(state.items.map((i) => i.title.trim().toLowerCase()));

  const added: ShoppingItem[] = [];
  for (const seed of getCuratedSeedItems()) {
    if (!existingTitles.has(seed.title.trim().toLowerCase())) {
      const newItem: ShoppingItem = {
        ...seed,
        id: shoppingItemId(),
        createdAt: now
      };
      state.items.push(newItem);
      added.push(newItem);
    }
  }

  saveShoppingList(state, houseKey);
  return state.items;
}

export function calculateShoppingSummary(
  items: ShoppingItem[],
  customRate?: number
): ShoppingSummary {
  const rateInfo = getStoredCurrencyRate();
  const exchangeRate = customRate ?? rateInfo.ratePlnToSek;

  let totalPlannedPln = 0;
  let totalPurchasedPln = 0;
  let toBuyCount = 0;
  let purchasedCount = 0;

  const categoryMap = new Map<ShoppingCategory, {
    plannedPln: number;
    purchasedPln: number;
    count: number;
    toBuy: number;
    purchased: number;
  }>();

  for (const cat of SHOPPING_CATEGORIES) {
    categoryMap.set(cat.id, {
      plannedPln: 0,
      purchasedPln: 0,
      count: 0,
      toBuy: 0,
      purchased: 0
    });
  }

  for (const item of items) {
    const qty = Math.max(1, item.quantity || 1);
    const est = (item.estimatedPricePln || 0) * qty;
    totalPlannedPln += est;

    const catData = categoryMap.get(item.category) || {
      plannedPln: 0,
      purchasedPln: 0,
      count: 0,
      toBuy: 0,
      purchased: 0
    };
    catData.plannedPln += est;
    catData.count += 1;

    if (item.isPurchased) {
      purchasedCount += 1;
      const actualCost = (item.purchasedPricePln ?? item.estimatedPricePln ?? 0) * qty;
      totalPurchasedPln += actualCost;
      catData.purchasedPln += actualCost;
      catData.purchased += 1;
    } else {
      toBuyCount += 1;
      catData.toBuy += 1;
    }
  }

  const remainingToBuyPln = Math.max(0, totalPlannedPln - totalPurchasedPln);
  const totalPlannedSek = convertPlnToSek(totalPlannedPln, exchangeRate);
  const totalPurchasedSek = convertPlnToSek(totalPurchasedPln, exchangeRate);
  const remainingToBuySek = convertPlnToSek(remainingToBuyPln, exchangeRate);

  const categories: ShoppingCategorySummary[] = SHOPPING_CATEGORIES.map((cat) => {
    const data = categoryMap.get(cat.id)!;
    return {
      category: cat.id,
      labelSv: cat.labelSv,
      labelEn: cat.labelEn,
      color: cat.color,
      totalPlannedPln: data.plannedPln,
      totalPlannedSek: convertPlnToSek(data.plannedPln, exchangeRate),
      totalPurchasedPln: data.purchasedPln,
      totalPurchasedSek: convertPlnToSek(data.purchasedPln, exchangeRate),
      totalCount: data.count,
      toBuyCount: data.toBuy,
      purchasedCount: data.purchased
    };
  }).filter((c) => c.totalCount > 0);

  return {
    totalCount: items.length,
    toBuyCount,
    purchasedCount,
    totalPlannedPln,
    totalPlannedSek,
    totalPurchasedPln,
    totalPurchasedSek,
    remainingToBuyPln,
    remainingToBuySek,
    categories,
    exchangeRate
  };
}

export function generateShoppingSummaryText(
  items: ShoppingItem[],
  title = 'Shopping List & Planned Purchases'
): string {
  const summary = calculateShoppingSummary(items);
  const lines: string[] = [];
  lines.push(`=== ${title} ===`);
  lines.push(`Revolut Rate: 1 PLN = ${summary.exchangeRate} SEK`);
  lines.push(`Planned budget: ${formatPLN(summary.totalPlannedPln)} (≈ ${formatSEK(summary.totalPlannedSek)}) · ${summary.totalCount} items`);
  lines.push(`Already purchased: ${formatPLN(summary.totalPurchasedPln)} (≈ ${formatSEK(summary.totalPurchasedSek)}) (${summary.purchasedCount} items)`);
  lines.push(`Remaining to buy: ${formatPLN(summary.remainingToBuyPln)} (≈ ${formatSEK(summary.remainingToBuySek)}) (${summary.toBuyCount} items)`);
  lines.push('');
  lines.push('--- CATEGORIES ---');
  for (const cat of summary.categories) {
    lines.push(`• ${cat.labelEn || cat.labelSv}: ${formatPLN(cat.totalPlannedPln)} (≈ ${formatSEK(cat.totalPlannedSek)}) (${cat.toBuyCount} left of ${cat.totalCount})`);
  }
  lines.push('');
  lines.push('--- ITEMS ---');
  for (const item of items) {
    const meta = getShoppingCategoryMeta(item.category);
    const status = item.isPurchased ? '[X] PURCHASED' : '[ ] TO BUY';
    const sekAmt = convertPlnToSek(item.estimatedPricePln, summary.exchangeRate);
    const storeStr = item.storeOrUrl ? ` @ ${item.storeOrUrl}` : '';
    const noteStr = item.notes ? ` (${item.notes})` : '';
    lines.push(`${status} ${item.title} (${item.quantity} ${item.unit || 'pcs'}) | ${meta.labelEn || meta.labelSv} | ${formatPLN(item.estimatedPricePln)} (≈ ${formatSEK(sekAmt)})${storeStr}${noteStr}`);
  }
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)} via Builder`);
  return lines.join('\n');
}

export function generateShoppingCsv(items: ShoppingItem[]): string {
  const rate = getStoredCurrencyRate().ratePlnToSek;
  const header = ['Status', 'Item', 'Category', 'Priority', 'Quantity', 'Unit', 'Estimated Price (PLN)', 'Estimated Price (SEK)', 'Purchased Price (PLN)', 'Store/Link', 'Notes'];
  const rows = items.map((item) => {
    const meta = getShoppingCategoryMeta(item.category);
    const sekAmt = convertPlnToSek(item.estimatedPricePln, rate);
    return [
      item.isPurchased ? 'Purchased' : 'To Buy',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${meta.labelEn || meta.labelSv}"`,
      item.priority,
      String(item.quantity || 1),
      `"${(item.unit || 'pcs').replace(/"/g, '""')}"`,
      String(item.estimatedPricePln || 0),
      String(sekAmt),
      String(item.purchasedPricePln ?? ''),
      `"${(item.storeOrUrl || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ];
  });
  return [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}
