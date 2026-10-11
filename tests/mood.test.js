import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptMood, pieceFrom, readLink, youtubeEmbed, vimeoEmbed } from '../src/mood/board.ts';

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
    { id: 'mood_abcdef12', src: 'https://photos.example/b.jpg', x: 999, y: -4, w: 2, tilt: 40, caption: 'x'.repeat(200) }
  ]);
  assert.equal(saved.length, 2);
  assert.equal(saved[0].caption, 'warm oak');
  assert.equal(saved[1].x, 92);
  assert.equal(saved[1].w, 16);
  assert.equal(saved[1].caption.length, 80);
  assert.deepEqual(acceptMood({}), []);
});
