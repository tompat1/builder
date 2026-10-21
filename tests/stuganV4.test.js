import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUGAN_V4_HIGH_EAVE_MM,
  STUGAN_V4_ROOF_PITCH_DEG,
  STUGAN_V4_SIZE_ID,
  STUGAN_V4_STOREY_RISE_MM,
  STUGAN_V4_WIDTH_MM,
  isStuganV4,
  solveStuganV4Stair,
  stuganV4Conflicts,
  stuganV4LoftClearAtEastEdgeMm,
  stuganV4LoftClearWestMm,
  stuganV4LowEaveMm,
  stuganV4ProposedZones
} from '../src/store/stuganV4.ts';

test('Stugan V4 low eave follows 10° fall over 6000 mm width', () => {
  const expected = Math.round(STUGAN_V4_HIGH_EAVE_MM - STUGAN_V4_WIDTH_MM * Math.tan((STUGAN_V4_ROOF_PITCH_DEG * Math.PI) / 180));
  assert.equal(stuganV4LowEaveMm(), expected);
  assert.equal(stuganV4LowEaveMm(), 5342);
});

test('loft clear height drops toward the east edge of the loft strip', () => {
  const west = stuganV4LoftClearWestMm();
  const east = stuganV4LoftClearAtEastEdgeMm();
  assert.ok(west > east);
  assert.ok(east < 1900);
});

test('central U-stair is solved before bedroom walls lock', () => {
  const stair = solveStuganV4Stair();
  assert.equal(stair.type, 'u-stair');
  assert.equal(stair.storeyRiseMm, STUGAN_V4_STOREY_RISE_MM);
  assert.equal(stair.flights.length, 2);
  assert.ok(stair.fitsInCentralZone);
  assert.ok(stair.opening.widthMm > 0);
  assert.ok(stair.opening.depthMm > 0);
});

test('conflicts mark uncertain slab, crawlspace, and loft headroom', () => {
  const conflicts = stuganV4Conflicts();
  const ids = new Set(conflicts.map((item) => item.id));
  assert.ok(ids.has('slab-level'));
  assert.ok(ids.has('crawlspace'));
  assert.ok(ids.has('bedroom-walls'));
  assert.ok(ids.has('loft-headroom'));
  assert.equal(conflicts.find((item) => item.id === 'loft-headroom')?.severity, 'conflict');
});

test('proposed zones can lock master and guest after the stair fits', () => {
  const open = stuganV4ProposedZones(false);
  assert.equal(open.masterNorth.locked, false);
  const locked = stuganV4ProposedZones(true);
  assert.equal(locked.masterNorth.locked, true);
  assert.equal(locked.guestSouth.locked, true);
  assert.equal(isStuganV4(STUGAN_V4_SIZE_ID), true);
  assert.equal(isStuganV4('size-30'), false);
});

test('floor plan places bathroom, kitchen and loft bedrooms from the sketch', async () => {
  const { stuganV4PlacedRooms } = await import('../src/store/stuganV4.ts');
  const rooms = stuganV4PlacedRooms();
  assert.equal(rooms.bathroom_1.type, 'bathroom');
  assert.ok(rooms.bathroom_1.x < 0 && rooms.bathroom_1.z < 0);
  assert.equal(rooms.kitchen_1.type, 'kitchen');
  assert.ok(rooms.kitchen_1.x > 0 && rooms.kitchen_1.z < 0);
  assert.equal(rooms.bedroom_1.type, 'bedroom');
  assert.ok(rooms.bedroom_1.y > 1 && rooms.bedroom_1.z < 0);
  assert.equal(rooms.bedroom_2.type, 'bedroom');
  assert.ok(rooms.bedroom_2.y > 1 && rooms.bedroom_2.z > 0);
});

test('a straight 250 mm going flight does not fit the 2200 mm mid zone alone', () => {
  const goings = 15;
  const run = goings * 250;
  assert.ok(run > 2200);
  const stair = solveStuganV4Stair({ goingMm: 250 });
  assert.ok(stair.flights[0].runMm + stair.landingMm < run);
});
