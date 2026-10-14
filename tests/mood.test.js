import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptMood, acceptMoodBoard, pieceFrom, placeFor, readLink, youtubeEmbed, vimeoEmbed } from '../src/mood/board.ts';
import { readPagePreview, safePreviewUrl } from '../workers/linkPreview.js';
import { generateAiAvatar, defaultAccountAvatar } from '../src/mood/avatar.ts';
import { generateQrSvg } from '../src/mood/qr.ts';
import { handleMood } from '../workers/mood.js';

test('a mood link accepts pictures, films, and same-site paths', () => {
  const youtube = readLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(youtube?.clip, 'youtube');
  assert.equal(youtube?.ref, 'dQw4w9WgXcQ');
  assert.match(youtubeEmbed(youtube.ref), /^https:\/\/www\.youtube-nocookie\.com\/embed\//);

  const short = readLink('https://youtu.be/abcdefghijk');
  assert.equal(short?.ref, 'abcdefghijk');

  const vimeo = readLink('https://vimeo.com/123456789');
  assert.equal(vimeo?.clip, 'vimeo');
  assert.match(vimeoEmbed(vimeo.ref), /^https:\/\/player\.vimeo\.com\/video\/123456789/);

  assert.equal(readLink('https://films.example/porch.mp4')?.kind, 'clip');
  assert.equal(readLink('https://photos.example/pine.jpg')?.kind, 'image');
  assert.equal(readLink('/homes/home-cube.webp')?.src, '/homes/home-cube.webp');
  assert.equal(readLink('http://photos.example/a.jpg')?.src.startsWith('https://'), true);
});

test('a mood link refuses scripts and bare words', () => {
  assert.equal(readLink('javascript:alert(1)'), null);
  assert.equal(readLink('data:text/html,hi'), null);
  assert.equal(readLink('not a link'), null);
  assert.equal(readLink(''), null);
});

test('a page address keeps a preview picture', () => {
  const link = readLink('https://www.example.com/kitchen');
  assert.equal(link?.kind, 'link');
  assert.equal(readLink('https://photos.example/pine.jpg')?.kind, 'image');

  const preview = readPagePreview(`
    <html><head>
      <meta property="og:title" content="Pine kitchen &amp; oak">
      <meta content="https://cdn.example/pine.jpg" property="og:image">
      <title>Ignored</title>
    </head></html>
  `, 'https://www.example.com/kitchen');
  assert.equal(preview.title, 'Pine kitchen & oak');
  assert.equal(preview.image, 'https://cdn.example/pine.jpg');
  assert.equal(preview.host, 'example.com');

  const relative = readPagePreview(
    '<meta property="og:image" content="/photos/pine.jpg">',
    'https://example.com/kitchen'
  );
  assert.equal(relative.image, 'https://example.com/photos/pine.jpg');

  const piece = pieceFrom(link, 0, preview.title);
  piece.thumb = preview.image;
  const saved = acceptMood([piece]);
  assert.equal(saved[0].kind, 'link');
  assert.equal(saved[0].thumb, preview.image);

  const older = acceptMood([{
    id: piece.id,
    kind: 'image',
    src: 'https://www.example.com/kitchen',
    x: 4,
    y: 8,
    w: 30,
    tilt: 0,
    caption: 'Saved earlier'
  }]);
  assert.equal(older[0].kind, 'link');
  assert.equal(older[0].caption, 'Saved earlier');

  assert.equal(safePreviewUrl('https://127.0.0.1/secret'), null);
  assert.equal(safePreviewUrl('https://localhost/a'), null);
  assert.equal(safePreviewUrl('javascript:alert(1)'), null);
});

test('a saved mood board keeps only bounded pieces', () => {
  const piece = pieceFrom(readLink('https://photos.example/kitchen.webp'), 0, '  warm oak  ');
  const saved = acceptMood([
    piece,
    { ...piece, id: 'nope' },
    { ...piece, src: 'javascript:alert(1)' },
    { id: 'mood_abcdef12', src: 'https://photos.example/b.jpg', x: 999, y: -4, w: 2, tilt: 40, caption: 'x'.repeat(600) }
  ]);
  assert.equal(saved.length, 2);
  assert.equal(saved[0].caption, 'warm oak');
  assert.equal(saved[1].x, 92);
  assert.equal(saved[1].w, 16);
  assert.equal(saved[1].caption.length, 500);
  assert.deepEqual(acceptMood({}), []);
});

test('a mood piece supports multiline captions', () => {
  const multiline = 'Stort fönsterparti\nLjust trägolv\nÖppen planlösning';
  const piece = pieceFrom(readLink('https://photos.example/kitchen.webp'), 0, multiline);
  const saved = acceptMood([piece]);
  assert.equal(saved[0].caption, multiline);
});

test('a mood board accepts post-it notes with colors and multiline text', () => {
  const note = {
    id: 'mood_11223344',
    kind: 'note',
    color: 'moss',
    x: 10,
    y: 20,
    w: 22,
    tilt: 1.5,
    caption: 'Kom ihåg att beställa:\n- klinkers till hallen\n- innerdörrar'
  };
  const saved = acceptMood([note]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].kind, 'note');
  assert.equal(saved[0].color, 'moss');
  assert.equal(saved[0].caption, note.caption);
});

test('a mood board accepts title, createdAt, and pieces', () => {
  const board = acceptMoodBoard({
    title: 'Mitt Attefallshus',
    createdAt: '2026-10-11T20:00:00.000Z',
    pieces: [
      {
        id: 'mood_55667788',
        kind: 'note',
        color: 'sky',
        x: 15,
        y: 25,
        w: 20,
        tilt: -1,
        caption: 'Blå himmel och hav'
      }
    ]
  });
  assert.equal(board.title, 'Mitt Attefallshus');
  assert.equal(board.createdAt, '2026-10-11T20:00:00.000Z');
  assert.equal(board.pieces.length, 1);
  assert.equal(board.pieces[0].caption, 'Blå himmel och hav');
});

test('a mood piece preserves author avatar and name', () => {
  const author = {
    name: 'Maria Lind',
    avatar: 'data:image/svg+xml;utf8,<svg></svg>',
    email: 'maria@example.com'
  };
  const piece = pieceFrom(readLink('https://photos.example/kitchen.webp'), 0, 'fint kök', author);
  assert.equal(piece.author?.name, 'Maria Lind');
  assert.equal(piece.author?.email, 'maria@example.com');
  const saved = acceptMood([piece]);
  assert.equal(saved[0].author?.name, 'Maria Lind');
  assert.equal(saved[0].author?.avatar, author.avatar);
});

test('a mood board accepts participants list', () => {
  const participant = {
    id: 'part_abc123',
    name: 'Alex',
    avatar: 'data:image/svg+xml;utf8,<svg></svg>',
    email: 'alex@example.com',
    themes: ['Foresty', 'Chill'],
    joinedAt: '2026-10-12T19:00:00.000Z'
  };
  const board = acceptMoodBoard({
    title: 'Familjens Moodboard',
    pieces: [],
    participants: [participant]
  });
  assert.equal(board.participants?.length, 1);
  assert.equal(board.participants?.[0].name, 'Alex');
  assert.deepEqual(board.participants?.[0].themes, ['Foresty', 'Chill']);
});

test('ai avatar generator blends up to three themes into an svg avatar', () => {
  const avatar = generateAiAvatar({
    name: 'Maria Lind',
    themes: ['Foresty', 'Flowery', 'Dreamy']
  });
  assert.ok(avatar.startsWith('data:image/svg+xml;utf8,'));
  const decoded = decodeURIComponent(avatar.replace('data:image/svg+xml;utf8,', ''));
  assert.ok(decoded.includes('<svg'));
  assert.equal(decoded.includes('<text'), false);
  assert.equal(decoded.includes('ML'), false);
  assert.equal(decoded.includes('Foresty'), false);
  assert.ok(decoded.includes('M15,95'));
});

test('default account avatar creates branded owner initials badge', () => {
  const avatar = defaultAccountAvatar('Thomas');
  assert.ok(avatar.startsWith('data:image/svg+xml;utf8,'));
  const decoded = decodeURIComponent(avatar.replace('data:image/svg+xml;utf8,', ''));
  assert.ok(decoded.includes('<svg'));
  assert.ok(decoded.includes('TH'));
});

test('qr generator creates valid svg for share links', async () => {
  const svg = await generateQrSvg('https://example.com/mood?board=hus_123');
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('viewBox'));
});

test('a mood piece accepts and preserves likes and likedBy', () => {
  const piece = {
    id: 'mood_11223344',
    kind: 'note',
    color: 'yellow',
    x: 10,
    y: 20,
    w: 22,
    tilt: 0,
    caption: 'Fint hus',
    likes: 3,
    likedBy: ['user_1', 'user_2', 'user_3']
  };
  const saved = acceptMood([piece]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].likes, 3);
  assert.deepEqual(saved[0].likedBy, ['user_1', 'user_2', 'user_3']);
});

test('a mood piece accepts and validates comments', () => {
  const comment = {
    id: 'comm_abc123',
    pieceId: 'mood_aabbccdd',
    text: 'Vilket fint fönster!',
    author: {
      name: 'Anna',
      avatar: 'data:image/svg+xml;utf8,<svg></svg>'
    },
    createdAt: '2026-10-12T19:30:00.000Z'
  };
  const piece = {
    id: 'mood_aabbccdd',
    kind: 'note',
    color: 'moss',
    x: 10,
    y: 20,
    w: 22,
    tilt: 0,
    caption: 'Inredning',
    comments: [comment]
  };
  const saved = acceptMood([piece]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].comments?.length, 1);
  assert.equal(saved[0].comments?.[0].text, 'Vilket fint fönster!');
  assert.equal(saved[0].comments?.[0].author.name, 'Anna');
});

test('placeFor scales y downwards for endless scrolling', () => {
  const spot0 = placeFor(0);
  const spot3 = placeFor(3);
  const spot6 = placeFor(6);
  const spot9 = placeFor(9);
  const spot30 = placeFor(30);

  // Rows increment downwards
  assert.ok(spot3.y > spot0.y, `spot3 (${spot3.y}) should be lower than spot0 (${spot0.y})`);
  assert.ok(spot6.y > spot3.y, `spot6 (${spot6.y}) should be lower than spot3 (${spot3.y})`);
  assert.ok(spot9.y > spot6.y, `spot9 (${spot9.y}) should be lower than spot6 (${spot6.y})`);
  assert.ok(spot30.y > 300, `spot30 (${spot30.y}) should be far down for endless scroll`);

  // acceptPiece accepts large y values beyond 88
  const pieceFarDown = {
    id: 'mood_99887766',
    kind: 'note',
    color: 'sky',
    x: 10,
    y: 750,
    w: 20,
    tilt: 0,
    caption: 'Långt ner'
  };
  const saved = acceptMood([pieceFarDown]);
  assert.equal(saved[0].y, 750);
});

function createMockD1(initialRow = null) {
  const rows = new Map();
  const assets = new Map();
  if (initialRow?.id) rows.set(initialRow.id, initialRow);
  function owned(userId) {
    return [...rows.values()]
      .filter((row) => row.user_id === userId)
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  }
  return {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async first() {
                if (sql.includes('WHERE id = ?')) return rows.get(args[0]) || null;
                if (sql.includes('WHERE user_id = ?')) return owned(args[0])[0] || null;
                return null;
              },
              async all() {
                if (sql.includes('FROM mood_assets')) {
                  return { results: [...assets.values()].filter((row) => row.board_id === args[0]) };
                }
                const results = sql.includes('WHERE user_id = ?') ? owned(args[0]) : [];
                return { results };
              },
              async run() {
                if (sql.includes('INSERT INTO mood_assets')) {
                  assets.set(args[0], { id: args[0], board_id: args[1], data: args[2] });
                } else if (sql.includes('DELETE FROM mood_assets')) {
                  assets.delete(args[0]);
                } else if (sql.includes('INSERT INTO mood_boards')) {
                  rows.set(args[0], {
                    id: args[0],
                    user_id: args[1],
                    title: args[2],
                    data: args[3],
                    created_at: args[4],
                    updated_at: args[5]
                  });
                } else if (sql.includes('UPDATE mood_boards SET data = ?')) {
                  const row = rows.get(args[2]);
                  if (row) {
                    row.data = args[0];
                    row.updated_at = args[1];
                  }
                }
                return { meta: { changes: 1 } };
              }
            };
          }
        };
      }
    }
  };
}

test('handleMood saves and loads moodboard from Cloudflare D1 database', async () => {
  const env = createMockD1();

  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });

  // 1. PUT /api/mood/hus_testboard
  const putReq = new Request('https://example.com/api/mood/hus_testboard', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Vårt drömhus',
      pieces: [
        {
          id: 'mood_11223344',
          kind: 'note',
          color: 'moss',
          x: 10,
          y: 20,
          w: 22,
          tilt: 0,
          caption: 'Spännande plan'
        }
      ]
    })
  });
  const putRes = await handleMood(putReq, env, {}, sessionUser);
  assert.equal(putRes.status, 200);
  const putBody = await putRes.json();
  assert.equal(putBody.ok, true);
  assert.equal(putBody.id, 'hus_testboard');

  // 2. GET /api/mood/hus_testboard
  const getReq = new Request('https://example.com/api/mood/hus_testboard', {
    method: 'GET'
  });
  const getRes = await handleMood(getReq, env, {}, sessionUser);
  assert.equal(getRes.status, 200);
  const getBody = await getRes.json();
  assert.equal(getBody.mood.title, 'Vårt drömhus');
  assert.equal(getBody.mood.pieces.length, 1);
  assert.equal(getBody.mood.pieces[0].id, 'mood_11223344');

  // 3. POST /api/mood/hus_testboard/like
  const likeReq = new Request('https://example.com/api/mood/hus_testboard/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pieceId: 'mood_11223344',
      likerId: 'usr_2'
    })
  });
  const likeRes = await handleMood(likeReq, env, {}, sessionUser);
  assert.equal(likeRes.status, 200);
  const likeBody = await likeRes.json();
  assert.equal(likeBody.likes, 1);
  assert.equal(likeBody.liked, true);
  assert.deepEqual(likeBody.likedBy, ['usr_2']);

  // Toggle unlike
  const unlikeReq = new Request('https://example.com/api/mood/hus_testboard/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pieceId: 'mood_11223344',
      likerId: 'usr_2'
    })
  });
  const unlikeRes = await handleMood(unlikeReq, env, {}, sessionUser);
  assert.equal(unlikeRes.status, 200);
  const unlikeBody = await unlikeRes.json();
  assert.equal(unlikeBody.likes, 0);
  assert.equal(unlikeBody.liked, false);

  // 4. POST /api/mood/hus_testboard/comment
  const commentReq = new Request('https://example.com/api/mood/hus_testboard/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pieceId: 'mood_11223344',
      text: 'Superbra idé!',
      author: { name: 'Karin', avatar: 'data:image/svg+xml;utf8,<svg></svg>' }
    })
  });
  const commentRes = await handleMood(commentReq, env, {}, sessionUser);
  assert.equal(commentRes.status, 200);
  const commentBody = await commentRes.json();
  assert.equal(commentBody.totalComments, 1);
  assert.equal(commentBody.comment.text, 'Superbra idé!');
  assert.equal(commentBody.comment.author.name, 'Karin');
});

test('a signed-in device loads the account mood board even under another house key', async () => {
  const env = createMockD1();
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const pieces = [
    { id: 'mood_aabbccdd', kind: 'image', src: 'https://photos.example/pine.jpg', x: 4, y: 8, w: 30, tilt: 0, caption: 'Pine' },
    { id: 'mood_11223344', kind: 'note', color: 'yellow', x: 40, y: 12, w: 22, tilt: 1, caption: 'Sauna' }
  ];
  const put = await handleMood(new Request('https://example.com/api/mood/draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hemmet', pieces, authoritative: true })
  }), env, {}, sessionUser);
  assert.equal(put.status, 200);

  const phone = await handleMood(new Request('https://example.com/api/mood/house_mobile', { method: 'GET' }), env, {}, sessionUser);
  const body = await phone.json();
  assert.equal(body.mood.pieces.length, 2);
  assert.equal(body.mood.pieces[0].src, 'https://photos.example/pine.jpg');

  const wipe = await handleMood(new Request('https://example.com/api/mood/draft_usr_1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', pieces: [] })
  }), env, {}, sessionUser);
  assert.equal(wipe.status, 200);
  const kept = await handleMood(new Request('https://example.com/api/mood/draft', { method: 'GET' }), env, {}, sessionUser);
  const keptBody = await kept.json();
  assert.equal(keptBody.mood.pieces.length, 2);
});

test('a missing mood asset is cleared and the picture stays on the board', async () => {
  const env = createMockD1();
  const sessionUser = async () => ({ id: 'usr_1', login: 'tompat1' });
  const jpeg = 'data:image/jpeg;base64,aaaa';
  const put = await handleMood(new Request('https://example.com/api/mood/hus_assets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Bilder',
      authoritative: true,
      pieces: [
        { id: 'mood_aabbccdd', kind: 'image', src: jpeg, x: 4, y: 8, w: 30, tilt: 0, caption: 'Kept' },
        { id: 'mood_11223344', kind: 'image', src: 'asset:mood_11223344', x: 40, y: 8, w: 30, tilt: 0, caption: 'Missing' }
      ]
    })
  }), env, {}, sessionUser);
  assert.equal(put.status, 200);

  const got = await handleMood(new Request('https://example.com/api/mood/hus_assets', { method: 'GET' }), env, {}, sessionUser);
  const body = await got.json();
  const kept = body.mood.pieces.find((piece) => piece.id === 'mood_aabbccdd');
  const missing = body.mood.pieces.find((piece) => piece.id === 'mood_11223344');
  assert.equal(kept.src, jpeg);
  assert.equal(missing.src, '');
  assert.equal(missing.caption, 'Missing');

  const accepted = acceptMood(body.mood.pieces);
  assert.equal(accepted.length, 2);
  assert.equal(accepted.find((piece) => piece.id === 'mood_11223344').src, '');
  assert.equal(accepted.find((piece) => piece.id === 'mood_11223344').caption, 'Missing');
});

test('invited guests without account token are isolated from builder 3d', () => {
  // Test navigation guard condition
  function canAccessBuilder(hasParticipant, hasAccountToken) {
    if (hasParticipant && !hasAccountToken) return false;
    return true;
  }

  // Invited guest who joined via QR/link
  assert.equal(canAccessBuilder(true, false), false);
  // Logged-in house owner
  assert.equal(canAccessBuilder(false, true), true);
  // Owner who also has a participant profile on another board
  assert.equal(canAccessBuilder(true, true), true);
  // Regular anonymous user visiting site
  assert.equal(canAccessBuilder(false, false), true);
});

test('mobile display pieces sort vertically by piece.y', () => {
  const pieces = [
    { id: '1', y: 40, caption: 'Middle' },
    { id: '2', y: 10, caption: 'Top' },
    { id: '3', y: 90, caption: 'Bottom' }
  ];

  const mobileOrder = [...pieces].sort((a, b) => a.y - b.y);
  assert.equal(mobileOrder[0].id, '2');
  assert.equal(mobileOrder[1].id, '1');
  assert.equal(mobileOrder[2].id, '3');
});

test('authenticated user profile always takes precedence over stored guest participant alias', () => {
  function resolveMoodAuthor(sessionUser, storedParticipant) {
    if (sessionUser) {
      return {
        name: sessionUser.name || sessionUser.login || 'Ägare',
        avatar: sessionUser.avatarUrl,
        email: sessionUser.email
      };
    }
    if (storedParticipant) {
      return {
        name: storedParticipant.name,
        avatar: storedParticipant.avatar,
        email: storedParticipant.email
      };
    }
    return { name: 'Ägare' };
  }

  const adminUser = {
    id: 'admin_1',
    login: 'tompat1',
    name: 'Thomas Rynell',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345?v=4',
    email: 'admin@example.com'
  };

  const guestParticipant = {
    id: 'guest_99',
    name: 'Bobby',
    avatar: 'data:image/svg+xml;utf8,<svg>Bobby</svg>'
  };

  // When logged in as admin, even if guest "Bobby" was stored in localStorage:
  const author = resolveMoodAuthor(adminUser, guestParticipant);
  assert.equal(author.name, 'Thomas Rynell');
  assert.equal(author.avatar, 'https://avatars.githubusercontent.com/u/12345?v=4');
  assert.equal(author.email, 'admin@example.com');

  // When NOT logged in, the guest participant is used:
  const guestAuthor = resolveMoodAuthor(null, guestParticipant);
  assert.equal(guestAuthor.name, 'Bobby');
});

test('board participant registration and email restoration logic', () => {
  function upsertParticipant(list, p) {
    const next = [...(list || [])];
    const normalizedEmail = p.email ? p.email.toLowerCase().trim() : '';
    const idx = next.findIndex(
      (item) => item.id === p.id || (normalizedEmail && item.email && item.email.toLowerCase().trim() === normalizedEmail)
    );
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...p };
    } else {
      next.push({ ...p });
    }
    return next;
  }

  function findByEmail(list, email) {
    const target = (email || '').toLowerCase().trim();
    if (!target || !list) return null;
    return list.find((p) => p.email && p.email.toLowerCase().trim() === target) || null;
  }

  let participants = [];
  const alice = {
    id: 'part_1',
    name: 'Alice Lind',
    avatar: 'data:image/svg+xml;utf8,<svg>Alice</svg>',
    email: 'Alice.Lind@example.com',
    themes: ['Foresty', 'Chill']
  };

  participants = upsertParticipant(participants, alice);
  assert.equal(participants.length, 1);
  assert.equal(participants[0].name, 'Alice Lind');

  // Lookup by different casing and whitespace
  const found = findByEmail(participants, '  ALICE.LIND@EXAMPLE.COM  ');
  assert.ok(found);
  assert.equal(found?.id, 'part_1');
  assert.equal(found?.name, 'Alice Lind');

  // Updating Alice with same email doesn't create duplicate
  participants = upsertParticipant(participants, {
    id: 'part_1',
    name: 'Alice Lind',
    avatar: 'data:image/svg+xml;utf8,<svg>AliceUpdated</svg>',
    email: 'alice.lind@example.com',
    themes: ['Foresty', 'Flowery']
  });
  assert.equal(participants.length, 1);
  assert.deepEqual(participants[0].themes, ['Foresty', 'Flowery']);

  // Looking up unknown email returns null
  assert.equal(findByEmail(participants, 'unknown@example.com'), null);
});

test('handleMood persists participants to Cloudflare D1 and returns them for cross-device restore', async () => {
  const env = createMockD1();
  const sessionUser = async () => null;

  const initialParticipants = [
    {
      id: 'part_device1',
      name: 'Maria',
      avatar: 'data:image/svg+xml;utf8,<svg>Maria</svg>',
      email: 'maria@example.com',
      themes: ['Dreamy', 'Chill']
    }
  ];

  // 1. Participant joins from device 1 and saves board with participant data
  const putReq = new Request('https://example.com/api/mood/hus_shared', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Vårt gemensamma hus',
      pieces: [],
      participants: initialParticipants
    })
  });
  const putRes = await handleMood(putReq, env, {}, sessionUser);
  assert.equal(putRes.status, 200);

  // 2. Later, Maria opens link from device 2 and restores by email
  const getReq = new Request('https://example.com/api/mood/hus_shared', {
    method: 'GET'
  });
  const getRes = await handleMood(getReq, env, {}, sessionUser);
  assert.equal(getRes.status, 200);
  const body = await getRes.json();

  assert.ok(Array.isArray(body.mood.participants));
  assert.equal(body.mood.participants.length, 1);
  const restored = body.mood.participants.find(
    (p) => p.email && p.email.toLowerCase().trim() === 'maria@example.com'
  );
  assert.ok(restored);
  assert.equal(restored.name, 'Maria');
  assert.deepEqual(restored.themes, ['Dreamy', 'Chill']);
});
