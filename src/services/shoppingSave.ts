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

/**
 * Curated shopping list items covering Garden, Power Tools, Kitchen, Furniture, etc.
 */
export function getCuratedSeedItems(): Omit<ShoppingItem, 'id' | 'createdAt'>[] {
  return [
    // Garden & Outdoor
    {
      title: 'Robotgräsklippare med installationskit',
      category: 'garden',
      estimatedPricePln: 2800,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'För tomtyta ca 600–800 m²',
      storeOrUrl: 'Castorama / Leroy Merlin'
    },
    {
      title: 'Trädgårdsslang & automatisk vinda 30m',
      category: 'garden',
      estimatedPricePln: 350,
      quantity: 1,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      notes: 'Väggmonterad med munstycken',
      storeOrUrl: 'Bauhaus'
    },
    {
      title: 'Skottkärra 100L kraftig galvaniserad',
      category: 'garden',
      estimatedPricePln: 220,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Punkteringsfritt hjul för mark- och trädgårdsarbete',
      storeOrUrl: 'Castorama'
    },
    {
      title: 'Loungeset utemöbler till altanen',
      category: 'garden',
      estimatedPricePln: 3200,
      quantity: 1,
      unit: 'set',
      priority: 'medium',
      isPurchased: false,
      notes: 'Väderbeständigt loungeset med bord och dynor',
      storeOrUrl: 'Jula / IKEA'
    },

    // Power Tools for house building
    {
      title: 'Kap- & gersåg 216mm med sågbord',
      category: 'power_tools',
      estimatedPricePln: 1600,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Oumbärlig för fasadpanel, reglar och altandäck',
      storeOrUrl: 'Castorama (DeWalt / Bosch)'
    },
    {
      title: 'Sänksåg med 1400mm styrskena',
      category: 'power_tools',
      estimatedPricePln: 1200,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'För millimeterprecis sågning av skivmaterial och dörrfoder',
      storeOrUrl: 'Makita / Festool'
    },
    {
      title: 'Borrskruvdragare 18V kit med 2 batterier',
      category: 'power_tools',
      estimatedPricePln: 850,
      quantity: 1,
      unit: 'kit',
      priority: 'high',
      isPurchased: false,
      notes: 'Kompakt och kraftfull för träskruv och stombyggnad',
      storeOrUrl: 'Leroy Merlin'
    },
    {
      title: 'Korslinjelaser 360° med teleskopstativ',
      category: 'power_tools',
      estimatedPricePln: 450,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'För rak montering av innerväggar, kök och innertak',
      storeOrUrl: 'Castorama'
    },
    {
      title: 'Byggdammsugare grovdammsugare våt/torr 25L',
      category: 'power_tools',
      estimatedPricePln: 550,
      quantity: 1,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      notes: 'Med eluttag för automatisk start vid sågning',
      storeOrUrl: 'Kärcher / Castorama'
    },

    // Kitchen & Appliances
    {
      title: 'Induktionshäll 60cm med booster',
      category: 'kitchen',
      estimatedPricePln: 1600,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Inbyggnad med timer och fasövergång',
      storeOrUrl: 'IKEA / MediaMarkt'
    },
    {
      title: 'Inbyggnadsugn med varmluft & grill',
      category: 'kitchen',
      estimatedPricePln: 1800,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Svart glas eller rostfritt stål',
      storeOrUrl: 'IKEA'
    },
    {
      title: 'Integrerad kyl & frys 178cm',
      category: 'kitchen',
      estimatedPricePln: 2400,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Låg ljudnivå lämplig för öppen planlösning',
      storeOrUrl: 'Castorama / IKEA'
    },
    {
      title: 'Underlimmad diskho & köksblandare',
      category: 'kitchen',
      estimatedPricePln: 890,
      quantity: 1,
      unit: 'set',
      priority: 'high',
      isPurchased: false,
      notes: 'Komplett med vattenlås och anslutningsslangar',
      storeOrUrl: 'Castorama'
    },
    {
      title: 'Integrerad diskmaskin 60cm',
      category: 'kitchen',
      estimatedPricePln: 1950,
      quantity: 1,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      notes: 'Helintegrerad med golvlampa som lyser vid körning',
      storeOrUrl: 'IKEA / MediaMarkt'
    },

    // Furniture & Interior
    {
      title: 'Kontinentalsäng 160×200cm till sovloftet',
      category: 'furniture',
      estimatedPricePln: 2800,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'Inklusive bäddmadrass och sängben',
      storeOrUrl: 'IKEA / Jysk'
    },
    {
      title: 'Matbord massiv ek 180cm + 6 stolar',
      category: 'furniture',
      estimatedPricePln: 3600,
      quantity: 1,
      unit: 'grupp',
      priority: 'medium',
      isPurchased: false,
      notes: 'Tidlös design för matplatsen',
      storeOrUrl: 'IKEA'
    },
    {
      title: 'Hörnsoffa 3-sits med schäslong',
      category: 'furniture',
      estimatedPricePln: 4200,
      quantity: 1,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      notes: 'Avtagbar tvättbar klädsel i ljusgrå linneblandning',
      storeOrUrl: 'IKEA'
    },
    {
      title: 'Garderobslösning med skjutdörrar',
      category: 'furniture',
      estimatedPricePln: 2100,
      quantity: 2,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      notes: 'Inredning med trådkorgar och klädstång',
      storeOrUrl: 'Castorama / IKEA'
    }
  ];
}

export function loadShoppingList(houseKey = expenseHouseKey()): ShoppingState {
  const bucket = readBucket();
  const current = bucket[houseKey];
  if (current && Array.isArray(current.items)) {
    return {
      houseKey,
      items: current.items,
      updatedAt: current.updatedAt || new Date().toISOString()
    };
  }

  // Pre-seed with curated starter items if completely new
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
  title = 'Inköpslista & Planerade Inköp'
): string {
  const summary = calculateShoppingSummary(items);
  const lines: string[] = [];
  lines.push(`=== ${title} ===`);
  lines.push(`Revolut-kurs: 1 PLN = ${summary.exchangeRate} SEK`);
  lines.push(`Planerad budget: ${formatPLN(summary.totalPlannedPln)} (≈ ${formatSEK(summary.totalPlannedSek)}) · ${summary.totalCount} st artiklar`);
  lines.push(`Redan inköpt: ${formatPLN(summary.totalPurchasedPln)} (≈ ${formatSEK(summary.totalPurchasedSek)}) (${summary.purchasedCount} st)`);
  lines.push(`Kvar att köpa: ${formatPLN(summary.remainingToBuyPln)} (≈ ${formatSEK(summary.remainingToBuySek)}) (${summary.toBuyCount} st)`);
  lines.push('');
  lines.push('--- KATEGORIER ---');
  for (const cat of summary.categories) {
    lines.push(`• ${cat.labelSv}: ${formatPLN(cat.totalPlannedPln)} (≈ ${formatSEK(cat.totalPlannedSek)}) (${cat.toBuyCount} kvar av ${cat.totalCount})`);
  }
  lines.push('');
  lines.push('--- ARTIKLAR ---');
  for (const item of items) {
    const meta = getShoppingCategoryMeta(item.category);
    const status = item.isPurchased ? '[X] INKÖPT' : '[ ] ATT KÖPA';
    const sekAmt = convertPlnToSek(item.estimatedPricePln, summary.exchangeRate);
    const storeStr = item.storeOrUrl ? ` @ ${item.storeOrUrl}` : '';
    const noteStr = item.notes ? ` (${item.notes})` : '';
    lines.push(`${status} ${item.title} (${item.quantity} ${item.unit || 'st'}) | ${meta.labelSv} | ${formatPLN(item.estimatedPricePln)} (≈ ${formatSEK(sekAmt)})${storeStr}${noteStr}`);
  }
  lines.push('');
  lines.push(`Genererad: ${new Date().toLocaleDateString('sv-SE')} via Builder`);
  return lines.join('\n');
}

export function generateShoppingCsv(items: ShoppingItem[]): string {
  const rate = getStoredCurrencyRate().ratePlnToSek;
  const header = ['Status', 'Artikel', 'Kategori', 'Prioritet', 'Antal', 'Enhet', 'Estimerat pris (PLN)', 'Estimerat pris (SEK)', 'Inköpt pris (PLN)', 'Butik/Länk', 'Anteckningar'];
  const rows = items.map((item) => {
    const meta = getShoppingCategoryMeta(item.category);
    const sekAmt = convertPlnToSek(item.estimatedPricePln, rate);
    return [
      item.isPurchased ? 'Inköpt' : 'Att köpa',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${meta.labelSv}"`,
      item.priority,
      String(item.quantity || 1),
      `"${(item.unit || 'st').replace(/"/g, '""')}"`,
      String(item.estimatedPricePln || 0),
      String(sekAmt),
      String(item.purchasedPricePln ?? ''),
      `"${(item.storeOrUrl || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ];
  });
  return [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}
