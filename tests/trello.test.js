import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptBoardName,
  acceptTrelloCards,
  acceptTrelloLists,
  acceptTrelloToken,
  handleTrello
} from '../workers/trello.js';
import { trelloBoardPlanFromHouse, trelloCardsFromHouse } from '../src/trello/tasks.ts';

test('trello tokens are short opaque strings', () => {
  assert.equal(acceptTrelloToken('a'.repeat(64)), 'a'.repeat(64));
  assert.equal(acceptTrelloToken(' short '), '');
  assert.equal(acceptTrelloToken('bad token!'), '');
});

test('trello cards keep a bounded name, description, and list', () => {
  const cards = acceptTrelloCards([
    { name: '  Roof work  ', desc: 'Shingles', list: 'phase4' },
    { name: '', desc: 'skip' },
    { name: 'x'.repeat(200), desc: 'y'.repeat(20), list: 'nope' }
  ]);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].name, 'Roof work');
  assert.equal(cards[0].desc, 'Shingles');
  assert.equal(cards[0].list, 'phase4');
  assert.equal(cards[1].name.length, 160);
  assert.equal(cards[1].list, 'critical');
});

test('trello lists keep the ground-up build columns', () => {
  const lists = acceptTrelloLists([
    { key: 'critical', name: '  Kritiska beslut först  ' },
    { key: 'phase1', name: 'Fas 1: Markarbete' },
    { key: 'notes', name: 'Anteckningar' },
    { key: 'bogus', name: 'Nope' }
  ]);
  assert.equal(lists[0].name, 'Kritiska beslut först');
  assert.ok(lists.some((row) => row.key === 'phase2'));
  assert.ok(lists.some((row) => row.key === 'done'));
  assert.ok(!lists.some((row) => row.key === 'bogus'));
});

test('board names fall back to the house title', () => {
  assert.equal(acceptBoardName('  Summer cabin  ', 'House'), 'Summer cabin');
  assert.equal(acceptBoardName('   ', 'Röda huset'), 'Röda huset');
  assert.equal(acceptBoardName('', ''), 'Builder house');
});

test('house build phases populate ground-up with critical work first', () => {
  const plan = trelloBoardPlanFromHouse({
    name: 'Test house',
    locale: 'en',
    notes: [
      { text: 'Order windows', link: { kind: 'wall', wall: 'front' } },
      { text: '   ' }
    ],
    config: {
      buildingWidth: 6040,
      buildingDepth: 4950,
      buildingHeight: 5000,
      activeRoof: 'saddle',
      activeMaterial: 'wood',
      floorPlanDone: true,
      hasLoft: true,
      loftCount: 1,
      terraces: [{ side: 'front', depth: '2400' }],
      placedRooms: [{ id: 'room_1' }],
      wallSlots: {
        'front-0': { type: 'door', itemId: 'STEHAG' },
        'front-1': { type: 'window', itemId: 'WIN_10x12' }
      }
    }
  });
  assert.equal(plan.lists[0].key, 'critical');
  assert.equal(plan.lists[1].key, 'phase1');
  assert.ok(plan.lists.some((row) => row.key === 'phase6'));
  assert.ok(plan.lists.some((row) => row.key === 'done'));
  const cards = plan.cards;
  assert.ok(cards.some((card) => card.name.startsWith('1. Water') && card.list === 'critical'));
  assert.ok(cards.some((card) => card.name.startsWith('1.1 Site') && card.list === 'phase1'));
  assert.ok(cards.some((card) => card.name.startsWith('2.5 Concrete') && card.list === 'phase2'));
  assert.ok(cards.some((card) => card.name.startsWith('6.7 Final') && card.list === 'phase6'));
  assert.ok(cards.some((card) => card.name === 'Builder: roof chosen' && card.list === 'done'));
  assert.ok(cards.some((card) => card.name === 'Builder: floor plan done' && card.list === 'done'));
  assert.ok(cards.some((card) => card.name === 'Sleeping loft' && card.list === 'builder'));
  assert.ok(cards.some((card) => card.name === 'Order windows' && card.list === 'notes'));
  const plain = trelloBoardPlanFromHouse({
    name: 'Plain',
    locale: 'en',
    notes: [{ text: `  ${'Measure the gable'.repeat(8)}  ` }],
    config: {
      buildingWidth: 6040,
      buildingDepth: 4950,
      activeRoof: 'pulpettak',
      activeMaterial: 'wood',
      activeDoor: 'STEHAG',
      activeWindow: 'standard-single',
      activeLoft: 'none',
      hasLoft: false,
      placedRooms: { room_1: { type: 'bedroom' } }
    }
  });
  const facade = plain.cards.find((card) => card.name === 'Builder: facade chosen');
  const openingsCard = plain.cards.find((card) => card.name === 'Builder: openings placed');
  assert.equal(facade?.list, 'builder');
  assert.equal(openingsCard?.list, 'builder');
  assert.equal(plain.cards.some((card) => card.name === 'Sleeping loft'), false);
  assert.ok(plain.cards.some((card) => card.name === 'Interior walls and rooms' && card.desc.includes('1 placed room')));
  const note = plain.cards.find((card) => card.list === 'notes');
  assert.ok(note && note.name.endsWith('…') && note.desc.includes('Measure the gable'));
  const firstCritical = cards.findIndex((card) => card.list === 'critical');
  const firstPhase6 = cards.findIndex((card) => card.list === 'phase6');
  assert.ok(firstCritical >= 0 && firstPhase6 > firstCritical);
  assert.equal(trelloCardsFromHouse({ locale: 'sv', config: {} }).some((card) => card.name.includes('VA')), true);
  assert.ok(!cards.some((card) => !card.name.trim()));
});

function memoryDb(seed = {}) {
  const tokens = new Map(Object.entries(seed.tokens || {}));
  const boards = new Map(Object.entries(seed.boards || {}));
  const states = new Map();
  const houses = new Map(Object.entries(seed.houses || {
    hus_0123456789abcdef0123456789abcdef: { id: 'hus_0123456789abcdef0123456789abcdef', name: 'Cabin', user_id: 'usr_1' }
  }));

  function statement(sql, args = []) {
    return {
      bind(...next) {
        return statement(sql, next);
      },
      async first() {
        if (/FROM trello_tokens/.test(sql)) {
          const token = tokens.get(args[0]);
          return token ? { token } : null;
        }
        if (/FROM trello_auth_states/.test(sql)) {
          return states.get(args[0]) || null;
        }
        if (/FROM house_trello_boards/.test(sql)) {
          const key = `${args[0]}:${args[1]}`;
          return boards.get(key) || null;
        }
        if (/FROM saved_houses/.test(sql)) {
          const row = houses.get(args[0]);
          if (!row || row.user_id !== args[1]) return null;
          return { id: row.id, name: row.name };
        }
        return null;
      },
      async run() {
        if (/INSERT INTO trello_tokens/.test(sql)) {
          tokens.set(args[0], args[1]);
          return { meta: { changes: 1 } };
        }
        if (/INSERT INTO trello_auth_states/.test(sql)) {
          states.set(args[0], { state: args[1], created_at: args[2] });
          return { meta: { changes: 1 } };
        }
        if (/DELETE FROM trello_auth_states/.test(sql)) {
          states.delete(args[0]);
          return { meta: { changes: 1 } };
        }
        if (/DELETE FROM trello_tokens/.test(sql)) {
          tokens.delete(args[0]);
          return { meta: { changes: 1 } };
        }
        if (/DELETE FROM house_trello_boards/.test(sql)) {
          const key = `${args[0]}:${args[1]}`;
          const row = boards.get(key);
          if (!row) return { meta: { changes: 0 } };
          if (/pending/.test(sql) && row.board_id !== 'pending') return { meta: { changes: 0 } };
          boards.delete(key);
          return { meta: { changes: 1 } };
        }
        if (/INSERT INTO house_trello_boards/.test(sql)) {
          const key = `${args[0]}:${args[1]}`;
          if (/DO NOTHING/.test(sql) && boards.has(key)) return { meta: { changes: 0 } };
          boards.set(key, {
            board_id: args[2],
            board_url: args[3],
            board_name: args[4],
            created_at: args[5]
          });
          return { meta: { changes: 1 } };
        }
        if (/CREATE TABLE/.test(sql)) return { meta: { changes: 0 } };
        return { meta: { changes: 0 } };
      }
    };
  }

  return {
    prepare(sql) {
      return statement(sql);
    }
  };
}

test('authorize requires an allowed origin and api key', async () => {
  const env = {
    DB: memoryDb(),
    SESSION_SECRET: 'secret',
    TRELLO_API_KEY: 'key123',
    ALLOWED_ORIGINS: 'http://localhost:5173'
  };
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const bad = await handleTrello(
    new Request('https://example.com/api/trello/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: 'https://evil.example' })
    }),
    env,
    {},
    sessionUser
  );
  assert.equal(bad.status, 400);

  const ok = await handleTrello(
    new Request('https://example.com/api/trello/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'http://localhost:5173',
        state: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      })
    }),
    env,
    {},
    sessionUser
  );
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.match(data.url, /trello\.com\/1\/authorize/);
  assert.match(data.url, /key=key123/);
  const authorize = new URL(data.url);
  const returnUrl = new URL(authorize.searchParams.get('return_url'));
  assert.equal(returnUrl.searchParams.get('trello_state'), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

  const missingState = await handleTrello(
    new Request('https://example.com/api/trello/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: 'http://localhost:5173' })
    }),
    env,
    {},
    sessionUser
  );
  assert.equal(missingState.status, 400);
});

test('status reports connection and linked board', async () => {
  const houseId = 'hus_0123456789abcdef0123456789abcdef';
  const env = {
    DB: memoryDb({
      tokens: { usr_1: 't'.repeat(64) },
      boards: {
        [`${houseId}:usr_1`]: {
          board_id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
          board_url: 'https://trello.com/b/abc',
          board_name: 'Cabin',
          created_at: '2026-01-01T00:00:00.000Z'
        }
      }
    }),
    SESSION_SECRET: 'secret',
    TRELLO_API_KEY: 'key123'
  };
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'me' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  try {
  const res = await handleTrello(
    new Request(`https://example.com/api/trello/status?houseId=${houseId}`),
    env,
    {},
    sessionUser
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.configured, true);
  assert.equal(data.connected, true);
  assert.equal(data.board.url, 'https://trello.com/b/abc');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('create board posts to trello and stores the link', async () => {
  const houseId = 'hus_0123456789abcdef0123456789abcdef';
  const calls = [];
  const originalFetch = globalThis.fetch;
  let listSeq = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || 'GET';
    calls.push(`${method} ${url}`);
    if (url.includes('members/me/boards')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('members/me')) {
      return new Response(JSON.stringify({ id: 'me' }), { status: 200 });
    }
    if (url.includes('/lists')) {
      listSeq += 1;
      return new Response(JSON.stringify({ id: `list${listSeq}`, name: 'List' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('/cards')) {
      return new Response(JSON.stringify({ id: 'card1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.includes('/boards')) {
      return new Response(JSON.stringify({
        id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        url: 'https://trello.com/b/newboard'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  };

  try {
    const env = {
      DB: memoryDb({ tokens: { usr_1: 't'.repeat(64) } }),
      SESSION_SECRET: 'secret',
      TRELLO_API_KEY: 'key123'
    };
    const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
    const res = await handleTrello(
      new Request('https://example.com/api/trello/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseId,
          name: 'Cabin board',
          lists: [
            { key: 'critical', name: 'Critical first' },
            { key: 'phase1', name: 'Earthworks' },
            { key: 'done', name: 'Done' }
          ],
          cards: [
            { name: 'VA capacity', desc: 'Critical', list: 'critical' },
            { name: 'Excavation', desc: 'Dig footprint', list: 'phase1' }
          ]
        })
      }),
      env,
      {},
      sessionUser
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.existing, false);
    assert.equal(data.cardsCreated, 2);
    assert.equal(data.board.url, 'https://trello.com/b/newboard');
    assert.ok(calls.some((line) => line.startsWith('POST ') && line.includes('/boards?')));
    assert.ok(calls.some((line) => line.startsWith('POST ') && line.includes('/lists?')));
    assert.ok(calls.some((line) => line.startsWith('POST ') && line.includes('/cards?')));
    assert.equal(calls.some((line) => line.startsWith('GET ') && line.includes('/lists?')), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a revoked trello token is reported as disconnected', async () => {
  const env = {
    DB: memoryDb({ tokens: { usr_1: 't'.repeat(64) } }),
    SESSION_SECRET: 'secret',
    TRELLO_API_KEY: 'key123'
  };
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'invalid token' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
  try {
    const res = await handleTrello(
      new Request('https://example.com/api/trello/status'),
      env,
      {},
      sessionUser
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.connected, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async () => new Response('{}', { status: 500 });
  try {
    const again = await handleTrello(
      new Request('https://example.com/api/trello/status'),
      env,
      {},
      sessionUser
    );
    const body = await again.json();
    assert.equal(body.connected, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a board is not linked when a list fails', async () => {
  const houseId = 'hus_0123456789abcdef0123456789abcdef';
  const calls = [];
  const originalFetch = globalThis.fetch;
  let lists = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || 'GET';
    calls.push(`${method} ${url}`);
    if (url.includes('members/me/boards')) {
      return new Response('[]', { status: 200 });
    }
    if (url.includes('members/me')) {
      return new Response(JSON.stringify({ id: 'me' }), { status: 200 });
    }
    if (url.includes('/lists') && method === 'GET') {
      return new Response('[]', { status: 200 });
    }
    if (url.includes('/lists')) {
      lists += 1;
      const status = lists === 1 ? 429 : 200;
      return new Response(JSON.stringify({ id: `list${lists}` }), { status });
    }
    if (method === 'DELETE') return new Response('', { status: 200 });
    if (url.includes('/boards')) {
      return new Response(JSON.stringify({
        id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        url: 'https://trello.com/b/partial'
      }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };

  try {
    const env = {
      DB: memoryDb({ tokens: { usr_1: 't'.repeat(64) } }),
      SESSION_SECRET: 'secret',
      TRELLO_API_KEY: 'key123'
    };
    const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
    const res = await handleTrello(
      new Request('https://example.com/api/trello/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseId,
          name: 'Cabin board',
          lists: [{ key: 'critical', name: 'Critical first' }],
          cards: [{ name: 'VA capacity', desc: 'Critical', list: 'critical' }]
        })
      }),
      env,
      {},
      sessionUser
    );
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.error, 'lists');
    assert.ok(calls.some((line) => line.startsWith('DELETE ')));

    globalThis.fetch = async () => new Response(JSON.stringify({ id: 'me' }), { status: 200 });
    const status = await handleTrello(
      new Request(`https://example.com/api/trello/status?houseId=${houseId}`),
      env,
      {},
      sessionUser
    );
    const body = await status.json();
    assert.equal(body.board, null);
    assert.equal(body.connected, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
