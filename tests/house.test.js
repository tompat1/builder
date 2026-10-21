import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptHouse, acceptHouseId, acceptHouseName, handleHouse, houseAreaSqMeters } from '../workers/house.js';
import { acceptHouseThumb } from '../src/services/houseThumb.ts';
import { accountHouseConfig, chooseWorkingHouse } from '../src/services/houseSync.ts';

test('a house config is stored only as a bounded object', () => {
  const saved = acceptHouse({ config: { buildingWidth: 6040, wallSlots: { front: { itemId: 'STEHAG' } } } });
  assert.match(saved, /6040/);
  assert.equal(acceptHouse({ config: [] }), null);
  assert.equal(acceptHouse({}), null);
  assert.equal(acceptHouse({ config: { note: 'x'.repeat(100_001) } }), null);
});

test('a saved house summary includes its floor area', () => {
  assert.equal(houseAreaSqMeters({ buildingWidth: 6040, buildingDepth: 4950 }), 29.9);
  assert.equal(houseAreaSqMeters(JSON.stringify({ buildingWidth: 5800, buildingDepth: 4310 })), 25);
  assert.equal(houseAreaSqMeters({ buildingWidth: 6040 }), null);
  assert.equal(houseAreaSqMeters('not json'), null);
});

test('a house thumb is a short jpeg picture', () => {
  const jpeg = `data:image/jpeg;base64,${Buffer.alloc(48, 7).toString('base64')}`;
  assert.equal(acceptHouseThumb(jpeg), jpeg);
  assert.equal(acceptHouseThumb('data:image/png;base64,aaaa'), '');
  assert.equal(acceptHouseThumb(`${jpeg}${'A'.repeat(24_000)}`), '');
});

test('a saved house id is the account key', () => {
  assert.equal(acceptHouseId(`hus_${'a'.repeat(32)}`), `hus_${'a'.repeat(32)}`);
  assert.equal(acceptHouseId('hus_short'), '');
  assert.equal(acceptHouseId(''), '');
});

test('a saved house needs a short name', () => {
  assert.equal(acceptHouseName('  Röda huset  '), 'Röda huset');
  assert.equal(acceptHouseName('   '), null);
  assert.equal(acceptHouseName('x'.repeat(81)), null);
});

test('handleHouse updates house title via PUT', async () => {
  const updates = [];
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                updates.push({ sql, args });
                return { meta: { changes: 1 } };
              }
            };
          }
        };
      }
    }
  };
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const req = new Request('https://example.com/api/houses/hus_0123456789abcdef0123456789abcdef', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sommarstuga' })
  });
  const res = await handleHouse(req, env, {}, sessionUser);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.name, 'Sommarstuga');
  assert.match(updates[0].sql, /UPDATE saved_houses SET name = \?/);
});

test('house config preserves the inner walls drywall toggle', () => {
  const withDrywall = acceptHouse({ config: { buildingWidth: 6040, showInnerWalls: true } });
  assert.match(withDrywall, /"showInnerWalls":true/);
  const withoutDrywall = acceptHouse({ config: { buildingWidth: 6040, showInnerWalls: false } });
  assert.match(withoutDrywall, /"showInnerWalls":false/);
});

test('house config preserves the corner boards color and saved custom corner colors', () => {
  const withWhiteCorners = acceptHouse({ config: { buildingWidth: 6040, cornerColor: 'white' } });
  assert.match(withWhiteCorners, /"cornerColor":"white"/);
  const withCustomCorners = acceptHouse({ config: { buildingWidth: 6040, cornerColor: '#ffffff' } });
  assert.match(withCustomCorners, /"cornerColor":"#ffffff"/);
  const withMultipleCornerColors = acceptHouse({
    config: { buildingWidth: 6040, cornerColor: '#df9b9b', savedCornerColors: ['#df9b9b', '#336699'] }
  });
  assert.match(withMultipleCornerColors, /"savedCornerColors":\["#df9b9b","#336699"\]/);
});

test('house config preserves the concrete walls color and saved custom concrete colors', () => {
  const withGraphite = acceptHouse({ config: { buildingWidth: 6040, concreteColor: '#334155' } });
  assert.match(withGraphite, /"concreteColor":"#334155"/);
  const withSaved = acceptHouse({
    config: { buildingWidth: 6040, concreteColor: '#9a4936', savedConcreteColors: ['#9a4936', '#334155'] }
  });
  assert.match(withSaved, /"savedConcreteColors":\["#9a4936","#334155"\]/);
});

test('house config preserves the corner boards toggle', () => {
  const withCorners = acceptHouse({ config: { buildingWidth: 6040, cornerBoards: true } });
  assert.match(withCorners, /"cornerBoards":true/);
  const withoutCorners = acceptHouse({ config: { buildingWidth: 6040, cornerBoards: false } });
  assert.match(withoutCorners, /"cornerBoards":false/);
});

test('handleHouse saves and loads active house via PUT and GET', async () => {
  let stored = null;
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                if (sql.includes('INSERT INTO houses')) {
                  stored = { config: args[1], updated_at: args[2] };
                }
                return { meta: { changes: 1 } };
              },
              async first() {
                if (sql.includes('FROM houses')) {
                  return stored;
                }
                return null;
              }
            };
          }
        };
      }
    }
  };
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });

  const putReq = new Request('https://example.com/api/houses/active', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activeId: 'hus_0123456789abcdef0123456789abcdef',
      name: 'Attefall',
      locale: 'en',
      config: { buildingWidth: 6040 }
    })
  });
  const putRes = await handleHouse(putReq, env, {}, sessionUser);
  assert.equal(putRes.status, 200);

  const getReq = new Request('https://example.com/api/houses/active', {
    method: 'GET'
  });
  const getRes = await handleHouse(getReq, env, {}, sessionUser);
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.equal(data.active.activeId, 'hus_0123456789abcdef0123456789abcdef');
  assert.equal(data.active.config.buildingWidth, 6040);
  assert.equal(data.active.locale, 'en');

  const keepLocale = new Request('https://example.com/api/houses/active', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { buildingWidth: 5000 } })
  });
  assert.equal((await handleHouse(keepLocale, env, {}, sessionUser)).status, 200);
  const again = await handleHouse(new Request('https://example.com/api/houses/active', { method: 'GET' }), env, {}, sessionUser);
  const kept = await again.json();
  assert.equal(kept.active.locale, 'en');
  assert.equal(kept.active.name, 'Attefall');
  assert.equal(kept.active.config.buildingWidth, 5000);
});

test('sign-in on another device opens the account house', () => {
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: true,
    localAt: '2026-10-13T10:00:00.000Z',
    syncedAt: ''
  }), 'account');
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: true,
    localAt: '2026-10-13T12:00:00.000Z',
    syncedAt: '2026-10-13T11:00:00.000Z'
  }), 'local');
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: false,
    localAt: '2026-10-13T10:00:00.000Z',
    syncedAt: ''
  }), 'local');
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: true,
    localAt: '',
    syncedAt: ''
  }), 'account');
  // Stale leftover storage on a phone must not hide a newer account save.
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: true,
    localAt: '2026-10-13T10:00:00.000Z',
    syncedAt: '2026-10-13T10:00:00.000Z',
    accountUpdatedAt: '2026-10-21T20:00:00.000Z'
  }), 'account');
  // Unsynced edits on this device that are newer than the account stay local.
  assert.equal(chooseWorkingHouse({
    hasAccountHouse: true,
    localAt: '2026-10-21T21:00:00.000Z',
    syncedAt: '2026-10-21T19:00:00.000Z',
    accountUpdatedAt: '2026-10-21T20:00:00.000Z'
  }), 'local');
});

test('an active house can be the wrapped copy or the older bare config', () => {
  assert.deepEqual(accountHouseConfig({ config: { buildingWidth: 6040 } }), { buildingWidth: 6040 });
  assert.deepEqual(accountHouseConfig({ buildingWidth: 6040 }), { buildingWidth: 6040 });
  assert.equal(accountHouseConfig(null), null);
  assert.equal(accountHouseConfig({ name: 'Attefall' }), null);
});
