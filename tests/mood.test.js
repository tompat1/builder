import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptMood, acceptMoodBoard, pieceFrom, readLink, youtubeEmbed, vimeoEmbed } from '../src/mood/board.ts';
import { generateAiAvatar, defaultAccountAvatar } from '../src/mood/avatar.ts';
import { generateQrSvg } from '../src/mood/qr.ts';

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
  assert.ok(decoded.includes('ML'));
  assert.ok(decoded.includes('Foresty'));
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
