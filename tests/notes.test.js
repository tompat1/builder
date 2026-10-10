import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptNotes, linkFromValue, linkToValue, NOTE_WIDTH, noteTargetId, parseNotePin } from '../src/notes/board.ts';
import { inferNoteNormal, noteAxes, NOTE_SURFACE_SCALE, stickFacing } from '../src/notes/surface.ts';

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
  assert.equal(notes[0].width, 176);
  assert.equal(notes[1].height, 156);
});

test('a note keeps a size inside the paper limits', () => {
  const notes = acceptNotes([
    { id: 'note_sizednote', text: 'Stor', width: 240, height: 200 },
    { id: 'note_toobig001', text: 'För stor', width: 900, height: 12 }
  ]);
  assert.equal(notes[0].width, 240);
  assert.equal(notes[0].height, 200);
  assert.equal(notes[1].width, 280);
  assert.equal(notes[1].height, 120);
});

test('a fresh sheet is 1.6 metres wide on the wall', () => {
  assert.equal(Math.round(NOTE_SURFACE_SCALE * NOTE_WIDTH * 1000), 1600);
});

test('a wall hit keeps a square facing', () => {
  assert.deepEqual(stickFacing({ x: 0.04, y: -0.02, z: 0.99 }), { x: 0, y: 0, z: 1 });
  assert.deepEqual(stickFacing({ x: 0.2, y: 0.98, z: 0.05 }).y, 1);
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
