import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOPPING_CATEGORIES,
  getShoppingCategoryMeta,
  loadShoppingList,
  saveShoppingList,
  addShoppingItem,
  updateShoppingItem,
  toggleShoppingItemPurchased,
  deleteShoppingItem,
  seedCuratedItemsToShoppingList,
  calculateShoppingSummary,
  generateShoppingSummaryText,
  generateShoppingCsv,
  getCuratedSeedItems,
  POLISH_TRICITY_STORES,
  resetShoppingListToSeeds
} from '../src/services/shoppingSave.ts';

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

test('shopping categories cover garden, power tools, kitchen, furniture and construction', () => {
  assert.ok(SHOPPING_CATEGORIES.length >= 7);

  const ids = SHOPPING_CATEGORIES.map((c) => c.id);
  assert.ok(ids.includes('garden'), 'must include garden');
  assert.ok(ids.includes('power_tools'), 'must include power tools');
  assert.ok(ids.includes('kitchen'), 'must include kitchen');
  assert.ok(ids.includes('furniture'), 'must include furniture');
  assert.ok(ids.includes('materials'), 'must include materials');
  assert.ok(ids.includes('hardware_elec'), 'must include plumbing and electrical');
  assert.ok(ids.includes('other'), 'must include other');

  // Verify bilingual metadata & icon
  const garden = getShoppingCategoryMeta('garden');
  assert.equal(garden.labelSv, 'Trädgård & Utemiljö');
  assert.equal(garden.labelEn, 'Garden & Outdoor');
  assert.equal(garden.icon, '🌿');

  const tools = getShoppingCategoryMeta('power_tools');
  assert.equal(tools.labelSv, 'Elverktyg & Byggmaskiner');
  assert.equal(tools.defaultExpenseCategory, 'tools');

  const kitchen = getShoppingCategoryMeta('kitchen');
  assert.equal(kitchen.labelSv, 'Kök & Vitvaror');
  assert.equal(kitchen.defaultExpenseCategory, 'interior');

  const furniture = getShoppingCategoryMeta('furniture');
  assert.equal(furniture.labelSv, 'Möbler & Inredning');
  assert.equal(furniture.defaultExpenseCategory, 'interior');
});

test('curated seed items provide comprehensive starter items for house building and living', () => {
  const seeds = getCuratedSeedItems();
  assert.ok(seeds.length >= 15);

  const categories = new Set(seeds.map((s) => s.category));
  assert.ok(categories.has('garden'));
  assert.ok(categories.has('power_tools'));
  assert.ok(categories.has('kitchen'));
  assert.ok(categories.has('furniture'));

  // Verify specific requested items exist in seeds in English
  assert.ok(seeds.some((s) => s.title.toLowerCase().includes('lawn mower') || s.title.toLowerCase().includes('mower')));
  assert.ok(seeds.some((s) => s.title.toLowerCase().includes('saw') || s.title.toLowerCase().includes('drill')));
  assert.ok(seeds.some((s) => s.title.toLowerCase().includes('induction') || s.title.toLowerCase().includes('fridge')));
  assert.ok(seeds.some((s) => s.title.toLowerCase().includes('bed') || s.title.toLowerCase().includes('sofa') || s.title.toLowerCase().includes('table')));

  // Verify Polish Gdańsk / Gdynia stores are referenced
  assert.ok(seeds.some((s) => s.storeOrUrl?.includes('Gdańsk') || s.storeOrUrl?.includes('Gdynia')));
  assert.ok(seeds.some((s) => s.storeOrUrl?.includes('Castorama')));
  assert.ok(seeds.some((s) => s.storeOrUrl?.includes('Leroy Merlin')));
  assert.ok(seeds.some((s) => s.storeOrUrl?.includes('IKEA Gdańsk')));
  assert.ok(seeds.some((s) => s.storeOrUrl?.includes('Bricoman Gdańsk')));
});

test('loadShoppingList initializes and pre-seeds a new house project shopping list', () => {
  globalThis.localStorage.clear();
  const state = loadShoppingList('house_test_project_1');

  assert.equal(state.houseKey, 'house_test_project_1');
  assert.ok(Array.isArray(state.items));
  assert.ok(state.items.length >= 15);

  // Each item should have a generated id and timestamp
  for (const item of state.items) {
    assert.ok(item.id.startsWith('shop_'));
    assert.ok(item.createdAt);
    assert.equal(item.isPurchased, false);
  }

  // Second load should retrieve exact same items from storage
  const reloaded = loadShoppingList('house_test_project_1');
  assert.equal(reloaded.items.length, state.items.length);
  assert.equal(reloaded.items[0].id, state.items[0].id);
});

test('CRUD operations for shopping list items work accurately with currency conversion', () => {
  globalThis.localStorage.clear();
  const houseKey = 'house_crud_test';

  // 1. Add item
  const added = addShoppingItem({
    title: 'Kapskiva 125mm',
    category: 'power_tools',
    estimatedPricePln: 150,
    quantity: 2,
    unit: 'st',
    priority: 'high',
    isPurchased: false,
    notes: 'Extra skivor till vinkelslipen',
    storeOrUrl: 'Castorama'
  }, houseKey);

  assert.ok(added.id.startsWith('shop_'));
  assert.equal(added.title, 'Kapskiva 125mm');
  assert.equal(added.estimatedPricePln, 150);
  assert.equal(added.quantity, 2);
  assert.equal(added.estimatedPriceSek, Math.round(150 * 2.54)); // 381 kr

  // 2. Update item
  const updated = updateShoppingItem(added.id, {
    estimatedPricePln: 200,
    priority: 'medium',
    notes: 'Uppdaterade till 200 PLN'
  }, houseKey);

  assert.ok(updated);
  assert.equal(updated.estimatedPricePln, 200);
  assert.equal(updated.priority, 'medium');
  assert.equal(updated.notes, 'Uppdaterade till 200 PLN');
  assert.equal(updated.estimatedPriceSek, Math.round(200 * 2.54)); // 508 kr

  // 3. Toggle purchased status
  const toggled = toggleShoppingItemPurchased(added.id, houseKey);
  assert.ok(toggled);
  assert.equal(toggled.isPurchased, true);
  assert.ok(toggled.purchasedAt);
  assert.equal(toggled.purchasedPricePln, 200);

  // Untoggle
  const untoggled = toggleShoppingItemPurchased(added.id, houseKey);
  assert.ok(untoggled);
  assert.equal(untoggled.isPurchased, false);
  assert.equal(untoggled.purchasedAt, undefined);

  // 4. Delete item
  const deleted = deleteShoppingItem(added.id, houseKey);
  assert.equal(deleted, true);

  const state = loadShoppingList(houseKey);
  assert.ok(!state.items.some((i) => i.id === added.id));
});

test('calculateShoppingSummary calculates budget, counts, and category breakdowns in PLN and SEK', () => {
  const items = [
    {
      id: 'item_1',
      title: 'Skruvdragare 18V',
      category: 'power_tools',
      estimatedPricePln: 800,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: true,
      purchasedPricePln: 750,
      createdAt: '2026-10-20T10:00:00Z'
    },
    {
      id: 'item_2',
      title: 'Robotgräsklippare',
      category: 'garden',
      estimatedPricePln: 2500,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      createdAt: '2026-10-20T10:00:00Z'
    },
    {
      id: 'item_3',
      title: 'Induktionshäll',
      category: 'kitchen',
      estimatedPricePln: 1500,
      quantity: 1,
      unit: 'st',
      priority: 'medium',
      isPurchased: false,
      createdAt: '2026-10-20T10:00:00Z'
    }
  ];

  const summary = calculateShoppingSummary(items, 2.5); // Rate 2.5 SEK/PLN
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.toBuyCount, 2);
  assert.equal(summary.purchasedCount, 1);

  // Total planned: 800 + 2500 + 1500 = 4800 PLN
  assert.equal(summary.totalPlannedPln, 4800);
  assert.equal(summary.totalPlannedSek, 4800 * 2.5); // 12 000 SEK

  // Total purchased: 750 PLN
  assert.equal(summary.totalPurchasedPln, 750);
  assert.equal(summary.totalPurchasedSek, 750 * 2.5); // 1 875 SEK

  // Remaining to buy: 4800 - 750 = 4050 PLN
  assert.equal(summary.remainingToBuyPln, 4050);
  assert.equal(summary.remainingToBuySek, 4050 * 2.5); // 10 125 SEK

  // Category breakdown
  assert.equal(summary.categories.length, 3);
  const gardenCat = summary.categories.find((c) => c.category === 'garden');
  assert.ok(gardenCat);
  assert.equal(gardenCat.totalPlannedPln, 2500);
  assert.equal(gardenCat.toBuyCount, 1);
  assert.equal(gardenCat.purchasedCount, 0);

  const toolsCat = summary.categories.find((c) => c.category === 'power_tools');
  assert.ok(toolsCat);
  assert.equal(toolsCat.totalPlannedPln, 800);
  assert.equal(toolsCat.totalPurchasedPln, 750);
  assert.equal(toolsCat.purchasedCount, 1);
});

test('generateShoppingSummaryText and generateShoppingCsv output well-structured export documents', () => {
  const items = [
    {
      id: 'item_1',
      title: 'Kap- & gersåg 216mm',
      category: 'power_tools',
      estimatedPricePln: 1600,
      quantity: 1,
      unit: 'st',
      priority: 'high',
      isPurchased: false,
      notes: 'DeWalt med sågbord',
      storeOrUrl: 'Castorama',
      createdAt: '2026-10-20T10:00:00Z'
    }
  ];

  const text = generateShoppingSummaryText(items);
  assert.ok(text.includes('=== Shopping List & Planned Purchases ==='));
  assert.ok(text.includes('1 600 zł'));
  assert.ok(text.includes('Kap- & gersåg 216mm'));
  assert.ok(text.includes('Castorama'));

  const csv = generateShoppingCsv(items);
  assert.ok(csv.startsWith('Status;Item;Category;Priority;Quantity;Unit;Estimated Price (PLN);Estimated Price (SEK);Purchased Price (PLN);Store/Link;Notes'));
  assert.ok(csv.includes('"Kap- & gersåg 216mm"'));
  assert.ok(csv.includes('"Power Tools & Machinery"'));
});

test('saveShoppingList persists state and seedCuratedItemsToShoppingList appends non-duplicate seeds', () => {
  globalThis.localStorage.clear();
  const houseKey = 'house_seed_test';

  saveShoppingList({
    houseKey,
    items: [
      {
        id: 'existing_1',
        title: 'Robotic lawn mower with installation kit',
        category: 'garden',
        estimatedPricePln: 2800,
        quantity: 1,
        priority: 'high',
        isPurchased: false,
        createdAt: '2026-10-20T10:00:00Z'
      }
    ]
  }, houseKey);

  const initial = loadShoppingList(houseKey);
  assert.equal(initial.items.length, 1);
  assert.ok(initial.items[0].title.toLowerCase().includes('lawn mower'));

  // Seed curated items: should add all items except the one already present
  const updated = seedCuratedItemsToShoppingList(houseKey);
  assert.ok(updated.length > 15);
  // Ensure the robotic lawn mower was not duplicated
  const mowers = updated.filter((i) => i.title.toLowerCase().includes('lawn mower'));
  assert.equal(mowers.length, 1);
});

test('POLISH_TRICITY_STORES covers major home improvement retailers in Gdańsk and Gdynia', () => {
  assert.ok(POLISH_TRICITY_STORES.length >= 7);
  const cities = new Set(POLISH_TRICITY_STORES.map((s) => s.city));
  assert.ok(cities.has('Gdańsk'));
  assert.ok(cities.has('Gdynia'));

  assert.ok(POLISH_TRICITY_STORES.some((s) => s.name.includes('Castorama Gdańsk')));
  assert.ok(POLISH_TRICITY_STORES.some((s) => s.name.includes('Leroy Merlin')));
  assert.ok(POLISH_TRICITY_STORES.some((s) => s.name.includes('Bricoman Gdańsk')));
  assert.ok(POLISH_TRICITY_STORES.some((s) => s.name.includes('IKEA Gdańsk')));
  assert.ok(POLISH_TRICITY_STORES.some((s) => s.name.includes('OBI Gdańsk')));
});

test('resetShoppingListToSeeds resets house items to fresh English Gdańsk/Gdynia seed catalogue', () => {
  globalThis.localStorage.clear();
  const houseKey = 'house_reset_test';

  const resetState = resetShoppingListToSeeds(houseKey);
  assert.ok(resetState.items.length >= 15);
  for (const item of resetState.items) {
    assert.ok(item.title);
    assert.ok(item.storeOrUrl?.includes('Gdańsk') || item.storeOrUrl?.includes('Gdynia'));
  }
});
