import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptNotes, linkFromValue, linkToValue, noteTargetId, parseNotePin } from '../src/notes/board.ts';
import { inferNoteNormal, noteAxes } from '../src/notes/surface.ts';

test('a note keeps its writing and a link to one part of the house', () => {
  const notes = acceptNotes([
    {
      id: 'note_abc12345',
      text: '  Kontrollera syllen  ',
      color: 'moss',
      x: 12,
      y: 40,
      offsetX: 10,
      offsetY: -80,
      link: { kind: 'slot', slotId: 'front-0' },
      pin: { x: 0.25, y: 1.4, z: 1.75 }
    },
    { id: 'bad', text: 'nope', link: { kind: 'roof' } },
    {
      id: 'note_roofnote1',
      text: 'x'.repeat(300),
      color: 'nope',
      x: 400,
      y: -4,
      link: { kind: 'wall', wall: 'up' }
    }
  ]);

  assert.equal(notes.length, 2);
  assert.equal(notes[0].text, '  Kontrollera syllen  ');
  assert.equal(notes[0].link.kind, 'slot');
  assert.equal(noteTargetId(notes[0].link), 'slot:front-0');
  assert.deepEqual(notes[0].pin, { x: 0.25, y: 1.4, z: 1.75 });
  assert.equal(notes[1].pin, null);
  assert.equal(parseNotePin({ x: 1, y: 'no', z: 0 }), null);
  assert.equal(notes[1].text.length, 240);
  assert.equal(notes[1].color, 'sand');
  assert.equal(notes[1].x, 90);
  assert.equal(notes[1].y, 2);
  assert.equal(notes[1].link.kind, 'board');
});

test('a link value names the board or one house part', () => {
  assert.equal(linkToValue({ kind: 'roof' }), 'roof');
  assert.equal(linkToValue({ kind: 'wall', wall: 'left' }), 'wall:left');
  assert.deepEqual(linkFromValue('slot:back-2u'), { kind: 'slot', slotId: 'back-2u' });
  assert.deepEqual(linkFromValue('slot:roof'), { kind: 'board' });
  assert.equal(noteTargetId({ kind: 'board' }), null);
  assert.equal(noteTargetId({ kind: 'loft' }), 'loft');
});

test('a stuck note keeps the facing of the panel', () => {
  const pin = parseNotePin({ x: 0.25, y: 1.4, z: 1.75, nx: 0, ny: 0, nz: 1 });
  assert.deepEqual(pin, { x: 0.25, y: 1.4, z: 1.75, nx: 0, ny: 0, nz: 1 });
  const unfaced = parseNotePin({ x: 0.25, y: 1.4, z: 1.75, nx: 0, ny: 0, nz: 0 });
  assert.deepEqual(unfaced, { x: 0.25, y: 1.4, z: 1.75 });
});

test('a sheet on the front wall faces outward and stands upright', () => {
  const axes = noteAxes({ x: 0, y: 0, z: 1 });
  assert.deepEqual(axes.right, { x: 1, y: 0, z: 0 });
  assert.deepEqual(axes.up, { x: 0, y: 1, z: 0 });
  assert.deepEqual(axes.face, { x: 0, y: 0, z: 1 });
  assert.deepEqual(
    inferNoteNormal({ x: 0, y: 2, z: 1.74 }, { widthM: 6.04, depthM: 3.503, heightM: 5 }),
    { x: 0, y: 0, z: 1 }
  );
});
