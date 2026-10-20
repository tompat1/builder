import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPENSE_CATEGORIES,
  getCategoryMeta
} from '../src/services/expenseSave.ts';
import {
  loadExpenses,
  saveExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  calculateExpenseSummary,
  formatPLN,
  formatSEK,
  formatDualCurrency,
  formatExpenseDate,
  generateSummaryText,
  generateCsv,
  hasExpenseAccess,
  grantExpenseAccess,
  generateExpenseToken,
  convertPlnToSek,
  convertSekToPln,
  getStoredCurrencyRate,
  setCustomExchangeRate,
  resetToDefaultExchangeRate
} from '../src/services/expenseSave.ts';

// Mock localStorage for test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();

test('expense categories define comprehensive construction categories with bilingual labels and colors', () => {
  assert.ok(EXPENSE_CATEGORIES.length >= 8);

  const ids = EXPENSE_CATEGORIES.map((c) => c.id);
  assert.ok(ids.includes('materials'));
  assert.ok(ids.includes('ground'));
  assert.ok(ids.includes('framing'));
  assert.ok(ids.includes('windows_doors'));
  assert.ok(ids.includes('labor'));
  assert.ok(ids.includes('permits'));
  assert.ok(ids.includes('tools'));
  assert.ok(ids.includes('other'));

  for (const cat of EXPENSE_CATEGORIES) {
    assert.ok(cat.labelSv.length > 2);
    assert.ok(cat.labelEn.length > 2);
    assert.ok(cat.color.startsWith('#'));
    assert.ok(cat.icon.length > 0);
  }

  const mat = getCategoryMeta('materials');
  assert.equal(mat.labelSv, 'Material & Virke');
  assert.equal(mat.labelEn, 'Materials & Timber');
});

test('addExpense automatically generates unique ID, ISO timestamp, and default date', () => {
  globalThis.localStorage.clear();
  const testHouse = 'test_house_1';

  const before = Date.now();
  const item = addExpense(
    {
      title: 'Syllisolering EPDM & expanderbult',
      amount: 4250,
      category: 'materials',
      paidBy: { name: 'Thomas', avatar: '👤' },
      notes: 'Beijer Bygg'
    },
    testHouse
  );
  const after = Date.now();

  assert.ok(item.id.startsWith('exp_'));
  assert.equal(item.title, 'Syllisolering EPDM & expanderbult');
  assert.equal(item.amount, 4250);
  assert.equal(item.category, 'materials');
  assert.equal(item.notes, 'Beijer Bygg');
  assert.equal(item.paidBy.name, 'Thomas');

  // Verify automatic ISO timestamp
  assert.ok(item.createdAt);
  const createdTime = new Date(item.createdAt).getTime();
  assert.ok(createdTime >= before - 1000 && createdTime <= after + 1000);

  // Verify default date string
  assert.equal(item.date, new Date().toISOString().slice(0, 10));

  // Verify item is saved in state
  const loaded = loadExpenses(testHouse);
  assert.equal(loaded.expenses.length, 1);
  assert.equal(loaded.expenses[0].id, item.id);
});

test('expense updates and deletion maintain list integrity', () => {
  globalThis.localStorage.clear();
  const testHouse = 'test_house_2';

  const item1 = addExpense({ title: 'Virke 45x145', amount: 8000, category: 'materials', paidBy: { name: 'Anna', avatar: '👤' } }, testHouse);
  const item2 = addExpense({ title: 'Betongskruv', amount: 1200, category: 'materials', paidBy: { name: 'Anna', avatar: '👤' } }, testHouse);

  let loaded = loadExpenses(testHouse);
  assert.equal(loaded.expenses.length, 2);

  // Update item 1
  const updated = updateExpense(item1.id, { amount: 8900, notes: 'Kompletterande reglar' }, testHouse);
  assert.ok(updated);
  assert.equal(updated.amount, 8900);
  assert.equal(updated.notes, 'Kompletterande reglar');

  loaded = loadExpenses(testHouse);
  const found = loaded.expenses.find((i) => i.id === item1.id);
  assert.equal(found?.amount, 8900);

  // Delete item 2
  const deleted = deleteExpense(item2.id, testHouse);
  assert.equal(deleted, true);

  loaded = loadExpenses(testHouse);
  assert.equal(loaded.expenses.length, 1);
  assert.equal(loaded.expenses[0].id, item1.id);
});

test('calculateExpenseSummary calculates accurate totals, category breakdown percentages, and averages', () => {
  const items = [
    { id: '1', title: 'Reglar', amount: 10000, category: 'materials', createdAt: '2026-10-20T10:00:00Z', paidBy: { name: 'A', avatar: '' } },
    { id: '2', title: 'Takstolar', amount: 30000, category: 'framing', createdAt: '2026-10-20T11:00:00Z', paidBy: { name: 'A', avatar: '' } },
    { id: '3', title: 'Skruv', amount: 2000, category: 'materials', createdAt: '2026-10-20T12:00:00Z', paidBy: { name: 'A', avatar: '' } },
    { id: '4', title: 'Bygglov', amount: 8000, category: 'permits', createdAt: '2026-10-20T13:00:00Z', paidBy: { name: 'A', avatar: '' } }
  ];

  const summary = calculateExpenseSummary(items);
  assert.equal(summary.totalCount, 4);
  assert.equal(summary.totalAmount, 50000);
  assert.equal(summary.averageAmount, 12500);

  // Category breakdowns
  const framing = summary.categories.find((c) => c.category === 'framing');
  assert.ok(framing);
  assert.equal(framing.total, 30000);
  assert.equal(framing.count, 1);
  assert.equal(framing.percentage, 60); // 30k / 50k = 60%

  const materials = summary.categories.find((c) => c.category === 'materials');
  assert.ok(materials);
  assert.equal(materials.total, 12000);
  assert.equal(materials.count, 2);
  assert.equal(materials.percentage, 24); // 12k / 50k = 24%

  const permits = summary.categories.find((c) => c.category === 'permits');
  assert.ok(permits);
  assert.equal(permits.total, 8000);
  assert.equal(permits.count, 1);
  assert.equal(permits.percentage, 16); // 8k / 50k = 16%
});

test('calculateExpenseSummary supports manual selection subtotal calculation', () => {
  const items = [
    { id: 'exp_1', title: 'Inköp 1', amount: 5000, category: 'materials', createdAt: '2026-10-20T10:00:00Z', paidBy: { name: 'A', avatar: '' } },
    { id: 'exp_2', title: 'Inköp 2', amount: 15000, category: 'framing', createdAt: '2026-10-20T11:00:00Z', paidBy: { name: 'A', avatar: '' } },
    { id: 'exp_3', title: 'Inköp 3', amount: 3000, category: 'tools', createdAt: '2026-10-20T12:00:00Z', paidBy: { name: 'A', avatar: '' } }
  ];

  const selected = new Set(['exp_1', 'exp_3']);
  const summary = calculateExpenseSummary(items, selected);

  assert.equal(summary.totalAmount, 23000);
  assert.equal(summary.selectedCount, 2);
  assert.equal(summary.selectedAmount, 8000); // 5000 + 3000
});

test('receipt attachment data is correctly saved and formatted in summary and csv', () => {
  const items = [
    {
      id: 'exp_rec_1',
      title: 'Skjutdörr 20x21',
      amount: 22000,
      category: 'windows_doors',
      createdAt: '2026-10-20T14:30:00Z',
      date: '2026-10-20',
      paidBy: { name: 'Erik', avatar: '' },
      notes: 'Skånska Byggvaror',
      receipt: {
        name: 'kvitto_skjutdorr.jpg',
        type: 'image/jpeg',
        dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        sizeBytes: 42000
      }
    }
  ];

  // Summary text
  const text = generateSummaryText(items);
  assert.ok(text.includes('Skjutdörr 20x21'));
  assert.ok(text.includes('22 000 zł'));
  assert.ok(text.includes('Skånska Byggvaror'));
  assert.ok(text.includes('Erik'));
  assert.ok(text.includes('Revolut'));

  // CSV export
  const csv = generateCsv(items);
  assert.ok(csv.includes('Datum;Titel;Kategori;Belopp (PLN);Motsvarande (SEK);Växelkurs;Betald av;Anteckningar;Har kvitto'));
  assert.ok(csv.includes('2026-10-20;"Skjutdörr 20x21";"Fönster & Dörrar";22000;55880;2.54;"Erik";"Skånska Byggvaror";Ja'));
});

test('expense access control enforces invitation requirement while granting mood board access to expense users', () => {
  globalThis.localStorage.clear();
  const houseId = 'house_private_abc';

  // 1. Unauthenticated generic guest who only joined mood board
  globalThis.localStorage.setItem('builder.mood.participant', JSON.stringify({
    id: 'p_guest',
    name: 'Mood Guest',
    avatar: '🎨'
  }));

  // Guest only has mood board access, NOT expense access
  assert.equal(hasExpenseAccess(houseId), false);

  // 2. Granting expense access via invitation token
  const token = generateExpenseToken(houseId);
  assert.ok(token.startsWith('exp_tok_'));

  grantExpenseAccess(houseId);
  assert.equal(hasExpenseAccess(houseId), true);

  // 3. The participant's stored profile now has hasExpenseAccess: true
  const stored = JSON.parse(globalThis.localStorage.getItem('builder.mood.participant'));
  assert.equal(stored.hasExpenseAccess, true);

  // Users with expense access can naturally access the mood board
  assert.ok(stored.name === 'Mood Guest');
  assert.ok(stored.hasExpenseAccess === true);

  // 4. Authenticated account owners always have expense access
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('account_token', 'jwt_owner_session');
  assert.equal(hasExpenseAccess(houseId), true);
});

test('saveExpenses and format helpers work accurately', () => {
  globalThis.localStorage.clear();
  const houseKey = 'house_test_fmt';

  // Test saveExpenses directly
  const customState = {
    houseKey,
    expenses: [
      {
        id: 'exp_fmt_1',
        title: 'Takstolar',
        amount: 45000,
        category: 'framing',
        createdAt: '2026-10-20T10:00:00.000Z',
        paidBy: { name: 'Anna', avatar: '' }
      }
    ],
    inviteToken: 'exp_tok_123',
    updatedAt: new Date().toISOString()
  };

  saveExpenses(customState, houseKey);
  const loaded = loadExpenses(houseKey);
  assert.equal(loaded.expenses.length, 1);
  assert.equal(loaded.expenses[0].title, 'Takstolar');

  // Test formatSEK
  assert.equal(formatSEK(0), '0 kr');
  assert.equal(formatSEK(1500), '1 500 kr');
  assert.equal(formatSEK(125000), '125 000 kr');

  // Test formatExpenseDate
  const today = new Date().toISOString();
  assert.ok(formatExpenseDate(today, 'sv').startsWith('Idag kl.'));
  assert.ok(formatExpenseDate(today, 'en').startsWith('Today at'));

  const fixedDate = '2025-05-15T14:30:00.000Z';
  const formattedSv = formatExpenseDate(fixedDate, 'sv');
  assert.ok(formattedSv.includes('15') || formattedSv.includes('maj'));
});

test('polish złoty (PLN) is main currency with Revolut exchange rate conversion to SEK', () => {
  globalThis.localStorage.clear();

  // 1. Formatting PLN
  assert.equal(formatPLN(0), '0 zł');
  assert.equal(formatPLN(1500), '1 500 zł');
  assert.equal(formatPLN(24900.5), '24 900,5 zł');

  // 2. Dual currency formatting
  const dual = formatDualCurrency(1000, 2.54);
  assert.equal(dual.pln, '1 000 zł');
  assert.equal(dual.sek, '2 540 kr');
  assert.equal(dual.combined, '1 000 zł (≈ 2 540 kr)');

  // 3. Conversion helpers
  assert.equal(convertPlnToSek(1000, 2.54), 2540);
  assert.equal(convertSekToPln(2540, 2.54), 1000);

  // 4. Rate storage and manual override
  const initial = getStoredCurrencyRate();
  assert.equal(initial.ratePlnToSek, 2.54);
  assert.ok(initial.sourceLabel.includes('Revolut'));

  // Setting custom Revolut rate from receipt
  const updated = setCustomExchangeRate(2.62);
  assert.equal(updated.ratePlnToSek, 2.62);
  assert.equal(getStoredCurrencyRate().ratePlnToSek, 2.62);
  assert.equal(convertPlnToSek(1000), 2620);

  // Resetting to default
  const reset = resetToDefaultExchangeRate();
  assert.equal(reset.ratePlnToSek, 2.54);

  // 5. Adding expense entered in SEK converts to PLN main currency
  const itemInSek = addExpense({
    title: 'Bauhaus skruv',
    amount: 0,
    currency: 'SEK',
    originalAmount: 2540,
    category: 'materials',
    paidBy: { name: 'Tomasz', avatar: '' }
  }, 'house_currency_test');

  assert.equal(itemInSek.currency, 'SEK');
  assert.equal(itemInSek.originalAmount, 2540);
  assert.equal(itemInSek.amount, 1000); // 2540 SEK / 2.54 = 1000 PLN

  // Summary includes both PLN and SEK
  const summary = calculateExpenseSummary([itemInSek]);
  assert.equal(summary.totalAmount, 1000); // 1000 PLN
  assert.equal(summary.totalAmountSek, 2540); // 2540 SEK
  assert.equal(summary.exchangeRate, 2.54);
});
