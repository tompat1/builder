import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptBoardName,
  acceptTrelloCards,
  acceptTrelloToken,
  handleTrello
} from '../workers/trello.js';
import { trelloCardsFromHouse } from '../src/trello/tasks.ts';

test('trello tokens are short opaque strings', () => {
  assert.equal(acceptTrelloToken('a'.repeat(64)), 'a'.repeat(64));
  assert.equal(acceptTrelloToken(' short '), '');
  assert.equal(acceptTrelloToken('bad token!'), '');
});

test('trello cards keep a bounded name and description', () => {
  const cards = acceptTrelloCards([
    { name: '  Roof work  ', desc: 'Shingles' },
    { name: '', desc: 'skip' },
    { name: 'x'.repeat(200), desc: 'y'.repeat(20) }
  ]);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].name, 'Roof work');
  assert.equal(cards[0].desc, 'Shingles');
  assert.equal(cards[1].name.length, 160);
});

test('board names fall back to the house title', () => {
  assert.equal(acceptBoardName('  Summer cabin  ', 'House'), 'Summer cabin');
  assert.equal(acceptBoardName('   ', 'Röda huset'), 'Röda huset');
  assert.equal(acceptBoardName('', ''), 'Builder house');
});

test('house notes and checklist become trello cards', () => {
  const cards = trelloCardsFromHouse({
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
      hasLoft: true,
      loftCount: 1,
      terraces: [{ side: 'front', depth: '2400' }],
      placedRooms: [{ id: 'room_1' }]
    }
  });
  assert.ok(cards.some((card) => card.name === 'Project overview'));
  assert.ok(cards.some((card) => card.name === 'Sleeping loft'));
  assert.ok(cards.some((card) => card.name === 'Terrace / deck'));
  assert.ok(cards.some((card) => card.name === 'Order windows'));
  assert.ok(!cards.some((card) => !card.name.trim()));
});

function memoryDb(seed = {}) {
  const tokens = new Map(Object.entries(seed.tokens || {}));
  const boards = new Map(Object.entries(seed.boards || {}));
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
        if (/DELETE FROM trello_tokens/.test(sql)) {
          tokens.delete(args[0]);
          return { meta: { changes: 1 } };
        }
        if (/INSERT INTO house_trello_boards/.test(sql)) {
          boards.set(`${args[0]}:${args[1]}`, {
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
      body: JSON.stringify({ origin: 'http://localhost:5173' })
    }),
    env,
    {},
    sessionUser
  );
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.match(data.url, /trello\.com\/1\/authorize/);
  assert.match(data.url, /key=key123/);
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
});

test('create board posts to trello and stores the link', async () => {
  const houseId = 'hus_0123456789abcdef0123456789abcdef';
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/boards?') && !url.includes('/lists')) {
      return new Response(JSON.stringify({
        id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        url: 'https://trello.com/b/newboard'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/lists')) {
      return new Response(JSON.stringify([{ id: 'list1', name: 'To Do' }]), {
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
          cards: [{ name: 'Foundation', desc: 'Pour slab' }]
        })
      }),
      env,
      {},
      sessionUser
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.existing, false);
    assert.equal(data.cardsCreated, 1);
    assert.equal(data.board.url, 'https://trello.com/b/newboard');
    assert.ok(calls.some((url) => url.includes('/boards?')));
    assert.ok(calls.some((url) => url.includes('/cards?')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
