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

test('conflicts mark uncertain slab, crawlspace, and unlocked bedrooms', () => {
  const conflicts = stuganV4Conflicts();
  const ids = new Set(conflicts.map((item) => item.id));
  assert.ok(ids.has('slab-level'));
  assert.ok(ids.has('crawlspace'));
  assert.ok(ids.has('bedroom-walls'));
  assert.ok(ids.has('loft-headroom'));
  assert.equal(conflicts.find((item) => item.id === 'bedroom-walls')?.severity, 'hold');
  assert.equal(conflicts.find((item) => item.id === 'loft-headroom')?.severity, 'conflict');
});

test('proposed zones keep master and guest unlocked', () => {
  const zones = stuganV4ProposedZones();
  assert.equal(zones.masterNorth.locked, false);
  assert.equal(zones.guestSouth.locked, false);
  assert.equal(zones.stairCentral.locked, false);
  assert.equal(isStuganV4(STUGAN_V4_SIZE_ID), true);
  assert.equal(isStuganV4('size-30'), false);
});

test('a straight 250 mm going flight does not fit the 2200 mm mid zone alone', () => {
  const goings = 15;
  const run = goings * 250;
  assert.ok(run > 2200);
  const stair = solveStuganV4Stair({ goingMm: 250 });
  assert.ok(stair.flights[0].runMm + stair.landingMm < run);
});
