/**
 * Storage, access control, and calculation service for the Expense Tracker.
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

export interface CategoryMeta {
  id: ExpenseCategory;
  labelSv: string;
  labelEn: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'materials',
    labelSv: 'Material & Virke',
    labelEn: 'Materials & Timber',
    color: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeBorder: 'rgba(217, 119, 6, 0.3)',
    icon: '🪵'
  },
  {
    id: 'ground',
    labelSv: 'Mark & Grund',
    labelEn: 'Ground & Slab',
    color: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.12)',
    badgeBorder: 'rgba(100, 116, 139, 0.3)',
    icon: '🪨'
  },
  {
    id: 'framing',
    labelSv: 'Stomme & Tak',
    labelEn: 'Framing & Roof',
    color: '#0284c7',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeBorder: 'rgba(2, 132, 199, 0.3)',
    icon: '🏠'
  },
  {
    id: 'windows_doors',
    labelSv: 'Fönster & Dörrar',
    labelEn: 'Windows & Doors',
    color: '#0d9488',
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    badgeBorder: 'rgba(13, 148, 136, 0.3)',
    icon: '🪟'
  },
  {
    id: 'interior',
    labelSv: 'Inredning & Ytskikt',
    labelEn: 'Interior & Finishes',
    color: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeBorder: 'rgba(139, 92, 246, 0.3)',
    icon: '🛋️'
  },
  {
    id: 'labor',
    labelSv: 'Arbete & Entreprenad',
    labelEn: 'Labor & Contractors',
    color: '#16a34a',
    badgeBg: 'rgba(22, 163, 74, 0.12)',
    badgeBorder: 'rgba(22, 163, 74, 0.3)',
    icon: '👷'
  },
  {
    id: 'permits',
    labelSv: 'Bygglov & Avgifter',
    labelEn: 'Permits & Fees',
    color: '#ea580c',
    badgeBg: 'rgba(234, 88, 12, 0.12)',
    badgeBorder: 'rgba(234, 88, 12, 0.3)',
    icon: '📑'
  },
  {
    id: 'tools',
    labelSv: 'Verktyg & Utrustning',
    labelEn: 'Tools & Machinery',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    icon: '🪚'
  },
  {
    id: 'other',
    labelSv: 'Övrigt',
    labelEn: 'Other',
    color: '#71717a',
    badgeBg: 'rgba(113, 113, 122, 0.12)',
    badgeBorder: 'rgba(113, 113, 122, 0.3)',
    icon: '📦'
  }
];

export function getCategoryMeta(id: ExpenseCategory): CategoryMeta {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export interface ExpenseAuthor {
  id?: string;
  name: string;
  avatar: string;
  email?: string;
}

export interface ExpenseReceipt {
  name: string;
  type: string;
  dataUrl: string;
  sizeBytes?: number;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  /** Automatically assigned ISO timestamp when the expense is logged */
  createdAt: string;
  /** Optional custom date (YYYY-MM-DD) if recorded retroactively */
  date?: string;
  paidBy: ExpenseAuthor;
  receipt?: ExpenseReceipt;
  notes?: string;
}

export interface ExpenseState {
  houseKey: string;
  expenses: ExpenseItem[];
  inviteToken?: string;
  updatedAt?: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  labelSv: string;
  labelEn: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  categories: CategorySummary[];
  selectedCount?: number;
  selectedAmount?: number;
}

const ACTIVE_HOUSE_KEY = 'builder.house.active';
const PARTICIPANT_KEY = 'builder.mood.participant';
const STORAGE_KEY = 'builder.expenses';
const ACCESS_PREFIX = 'builder.expense.access.';

export function expenseHouseKey(): string {
  try {
    if (typeof localStorage === 'undefined') return 'draft';
    const id = localStorage.getItem(ACTIVE_HOUSE_KEY);
    return typeof id === 'string' && /^hus_[a-zA-Z0-9_-]{16,64}$/.test(id) ? id : 'draft';
  } catch {
    return 'draft';
  }
}

function readStoredParticipant(): Record<string, unknown> | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(PARTICIPANT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function writeStoredParticipant(p: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

function expenseId(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `exp_${hex}`;
}

export function generateExpenseToken(houseKey = expenseHouseKey()): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `exp_tok_${token}`;
}

/**
 * Access Control Rule:
 * Expense tracker is invitation-only.
 * - Logged-in owners or local house creators have access.
 * - Users with an explicit expense invitation token or stored expense permission have access.
 * - Users who have expense access can also use the mood board, but users who ONLY have
 *   mood board access cannot use the expense tracker without an invitation.
 */
export function hasExpenseAccess(houseKey = expenseHouseKey()): boolean {
  if (typeof localStorage === 'undefined') return true;

  // 1. Logged in account owner
  const hasAccount = Boolean(localStorage.getItem('account_token'));
  if (hasAccount) return true;

  // 2. Explicit access stored for this house
  const explicitHouseAccess = localStorage.getItem(`${ACCESS_PREFIX}${houseKey}`);
  if (explicitHouseAccess === 'granted') return true;

  // 3. Participant profile with expense access permission
  const participant = readStoredParticipant();
  if (participant?.hasExpenseAccess) return true;

  // 4. Default unshared local draft if not an invited moodboard guest
  const isMoodOnlyGuest = Boolean(
    (localStorage.getItem('builder.mood.participant') || localStorage.getItem('mood_participant')) &&
    !participant?.hasExpenseAccess
  );

  if (isMoodOnlyGuest) {
    return false;
  }

  // Local owner/creator of standard draft
  return true;
}

export function grantExpenseAccess(houseKey = expenseHouseKey()): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${ACCESS_PREFIX}${houseKey}`, 'granted');
    const participant = readStoredParticipant();
    if (participant) {
      participant.hasExpenseAccess = true;
      writeStoredParticipant(participant);
    }
  } catch {
    // ignore
  }
}

function readBucket(): Record<string, ExpenseState> {
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

function writeBucket(bucket: Record<string, ExpenseState>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bucket));
  } catch {
    // ignore
  }
}

export function loadExpenses(houseKey = expenseHouseKey()): ExpenseState {
  const bucket = readBucket();
  const current = bucket[houseKey];
  if (current && Array.isArray(current.expenses)) {
    return {
      houseKey,
      expenses: current.expenses,
      inviteToken: current.inviteToken || generateExpenseToken(houseKey),
      updatedAt: current.updatedAt || new Date().toISOString()
    };
  }
  const defaultState: ExpenseState = {
    houseKey,
    expenses: [],
    inviteToken: generateExpenseToken(houseKey),
    updatedAt: new Date().toISOString()
  };
  bucket[houseKey] = defaultState;
  writeBucket(bucket);
  return defaultState;
}

export function saveExpenses(state: ExpenseState, houseKey = expenseHouseKey()): void {
  const bucket = readBucket();
  bucket[houseKey] = {
    ...state,
    houseKey,
    updatedAt: new Date().toISOString()
  };
  writeBucket(bucket);
}

export function addExpense(
  data: Omit<ExpenseItem, 'id' | 'createdAt'>,
  houseKey = expenseHouseKey()
): ExpenseItem {
  const state = loadExpenses(houseKey);
  const now = new Date();
  const createdAt = now.toISOString();
  const dateStr = data.date || now.toISOString().slice(0, 10);

  const item: ExpenseItem = {
    ...data,
    id: expenseId(),
    createdAt,
    date: dateStr,
    amount: Math.max(0, Math.round(Number(data.amount) || 0))
  };

  state.expenses = [item, ...state.expenses];
  saveExpenses(state, houseKey);
  return item;
}

export function updateExpense(
  id: string,
  updates: Partial<ExpenseItem>,
  houseKey = expenseHouseKey()
): ExpenseItem | null {
  const state = loadExpenses(houseKey);
  const index = state.expenses.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = state.expenses[index];
  const updated: ExpenseItem = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    amount: updates.amount !== undefined ? Math.max(0, Math.round(Number(updates.amount) || 0)) : current.amount
  };

  state.expenses[index] = updated;
  saveExpenses(state, houseKey);
  return updated;
}

export function deleteExpense(id: string, houseKey = expenseHouseKey()): boolean {
  const state = loadExpenses(houseKey);
  const initialLength = state.expenses.length;
  state.expenses = state.expenses.filter((item) => item.id !== id);
  if (state.expenses.length !== initialLength) {
    saveExpenses(state, houseKey);
    return true;
  }
  return false;
}

export function calculateExpenseSummary(
  expenses: ExpenseItem[],
  selectedIds?: Set<string>
): ExpenseSummary {
  const totalCount = expenses.length;
  let totalAmount = 0;

  const categoryTotals: Record<ExpenseCategory, { total: number; count: number }> = {
    materials: { total: 0, count: 0 },
    ground: { total: 0, count: 0 },
    framing: { total: 0, count: 0 },
    windows_doors: { total: 0, count: 0 },
    interior: { total: 0, count: 0 },
    labor: { total: 0, count: 0 },
    permits: { total: 0, count: 0 },
    tools: { total: 0, count: 0 },
    other: { total: 0, count: 0 }
  };

  let selectedCount = 0;
  let selectedAmount = 0;

  for (const item of expenses) {
    const amt = item.amount || 0;
    totalAmount += amt;

    const cat = item.category in categoryTotals ? item.category : 'other';
    categoryTotals[cat].total += amt;
    categoryTotals[cat].count += 1;

    if (selectedIds && selectedIds.has(item.id)) {
      selectedCount += 1;
      selectedAmount += amt;
    }
  }

  const averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

  const categories = EXPENSE_CATEGORIES.map((cat) => {
    const data = categoryTotals[cat.id] || { total: 0, count: 0 };
    const percentage = totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0;
    return {
      category: cat.id,
      labelSv: cat.labelSv,
      labelEn: cat.labelEn,
      color: cat.color,
      total: data.total,
      count: data.count,
      percentage
    };
  }).filter((c) => c.count > 0 || c.total > 0).sort((a, b) => b.total - a.total);

  return {
    totalAmount,
    totalCount,
    averageAmount,
    categories,
    ...(selectedIds ? { selectedCount, selectedAmount } : {})
  };
}

export function formatSEK(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('sv-SE').replace(/[\s\u00A0\u202F]/g, ' ')} kr`;
}

export function formatExpenseDate(isoDate: string, lang = 'sv'): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) {
      return lang === 'en' ? `Today at ${timeStr}` : `Idag kl. ${timeStr}`;
    }
    if (isYesterday) {
      return lang === 'en' ? `Yesterday at ${timeStr}` : `Igår kl. ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return `${dateStr}, ${timeStr}`;
  } catch {
    return isoDate;
  }
}

export async function compressReceiptFile(file: File): Promise<ExpenseReceipt> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.FileReader) {
      resolve({
        name: file.name,
        type: file.type || 'image/jpeg',
        dataUrl: '',
        sizeBytes: file.size
      });
      return;
    }

    // PDF files or other documents keep data URL directly if small
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: 'application/pdf',
          dataUrl: String(reader.result || ''),
          sizeBytes: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            dataUrl: String(e.target?.result || ''),
            sizeBytes: file.size
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          name: file.name,
          type: 'image/jpeg',
          dataUrl,
          sizeBytes: Math.round((dataUrl.length * 3) / 4)
        });
      };
      img.onerror = () => {
        resolve({
          name: file.name,
          type: file.type || 'image/jpeg',
          dataUrl: String(e.target?.result || ''),
          sizeBytes: file.size
        });
      };
      img.src = String(e.target?.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function generateSummaryText(expenses: ExpenseItem[], title = 'Kostnadssammanställning'): string {
  const summary = calculateExpenseSummary(expenses);
  const lines: string[] = [];
  lines.push(`=== ${title} ===`);
  lines.push(`Totalt: ${formatSEK(summary.totalAmount)} (${summary.totalCount} st utlägg)`);
  lines.push(`Snittkostnad: ${formatSEK(summary.averageAmount)} / utlägg`);
  lines.push('');
  lines.push('--- KATEGORIER ---');
  for (const cat of summary.categories) {
    lines.push(`• ${cat.labelSv}: ${formatSEK(cat.total)} (${cat.count} st, ${cat.percentage}%)`);
  }
  lines.push('');
  lines.push('--- SPECIFIKATION ---');
  for (const item of expenses) {
    const meta = getCategoryMeta(item.category);
    const dateStr = item.date || item.createdAt.slice(0, 10);
    const paidByStr = item.paidBy?.name ? ` [${item.paidBy.name}]` : '';
    const noteStr = item.notes ? ` (${item.notes})` : '';
    lines.push(`${dateStr} | ${item.title} | ${meta.labelSv} | ${formatSEK(item.amount)}${paidByStr}${noteStr}`);
  }
  lines.push('');
  lines.push(`Skapad: ${new Date().toLocaleDateString('sv-SE')} via Builder`);
  return lines.join('\n');
}

export function generateCsv(expenses: ExpenseItem[]): string {
  const header = ['Datum', 'Titel', 'Kategori', 'Belopp (SEK)', 'Betald av', 'Anteckningar', 'Har kvitto'];
  const rows = expenses.map((item) => {
    const meta = getCategoryMeta(item.category);
    return [
      item.date || item.createdAt.slice(0, 10),
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${meta.labelSv}"`,
      String(item.amount || 0),
      `"${(item.paidBy?.name || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      item.receipt?.dataUrl ? 'Ja' : 'Nej'
    ];
  });
  return [header.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}
