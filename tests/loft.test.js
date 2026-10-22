import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERIOR_FLOOR_TOP,
  LOFT_FLOORBOARD,
  LOFT_JOIST,
  LOFT_MIN_ABOVE_FLOOR,
  doorFrameTop,
  loftEndPoint,
  loftIsGhosted,
  loftJoistTop,
  curvedLoftStair,
  loftStairOpening,
  loftStairRun,
  loftStairTreads,
  straightLoftStair,
  isLoftRoom,
  loftWallStudsVisible,
  loftDeckBounds,
  maximizeLoftBedroom,
  loftRailBlockedSpans,
  subtractRailSpans,
  loftStairClearOnDeck
} from '../src/three-engine/loftLevel.ts';
import {
  ceilingStations,
  heightAt,
  loftCeilingY,
  roofPlateY,
  sliceStations
} from '../src/three-engine/roofClearance.ts';

test('the loft deck is at least 2.5 m above the interior floor and above the door frame', () => {
  const wall = 5;
  const joistTop = loftJoistTop(wall);
  const walkingSurface = joistTop + LOFT_FLOORBOARD;
  const joistUnderside = joistTop - LOFT_JOIST;
  const frame = doorFrameTop(wall);

  assert.ok(walkingSurface >= INTERIOR_FLOOR_TOP + LOFT_MIN_ABOVE_FLOOR - 1e-9);
  assert.ok(Math.abs(walkingSurface - (INTERIOR_FLOOR_TOP + 2.5)) < 1e-9);
  assert.ok(joistUnderside > frame);
  assert.ok(frame > 2.3);
});

test('a room on the loft deck counts as a loft room, and a ground-floor room does not', () => {
  assert.equal(isLoftRoom(INTERIOR_FLOOR_TOP), false);
  assert.equal(isLoftRoom(loftJoistTop(5) + LOFT_FLOORBOARD), true);
});

test('the interior loft is solid only while a loft room is being edited', () => {
  assert.equal(loftIsGhosted('insida', false), true);
  assert.equal(loftIsGhosted('insida', true), false);
  assert.equal(loftIsGhosted('insida', false, true), false);
  assert.equal(loftIsGhosted('utsida', false), false);
  assert.equal(loftIsGhosted('blueprint', false), false);
});

const pulpet = { kind: 'shed', degrees: 12, anchor: 'front', minRear: 2.4 };
const gable = { kind: 'gable', degrees: 22 };
const lowGable = { kind: 'gable', degrees: 14 };

test('a loft ceiling follows the mono-pitch roof and stays under the plate', () => {
  const depth = 4.95;
  const wall = 5;
  const front = roofPlateY(pulpet, depth, wall, depth / 2);
  const rear = roofPlateY(pulpet, depth, wall, -depth / 2);
  const drop = Math.tan((12 * Math.PI) / 180) * depth;

  assert.ok(Math.abs(front - wall) < 1e-6);
  assert.ok(Math.abs(rear - (wall - drop)) < 1e-6);
  assert.ok(loftCeilingY(pulpet, depth, wall, 0) < roofPlateY(pulpet, depth, wall, 0));
  assert.ok(loftCeilingY(pulpet, depth, wall, 1) > loftCeilingY(pulpet, depth, wall, -1));
});

test('a gable loft ceiling peaks at the ridge and meets both eaves', () => {
  const depth = 5;
  const wall = 5;
  const ridge = roofPlateY(gable, depth, wall, 0);
  const eave = roofPlateY(gable, depth, wall, depth / 2);

  assert.ok(Math.abs(eave - wall) < 1e-6);
  assert.ok(Math.abs(roofPlateY(gable, depth, wall, -depth / 2) - wall) < 1e-6);
  assert.ok(ridge > eave);
  assert.equal(roofPlateY(gable, depth, wall, 0.8), roofPlateY(gable, depth, wall, -0.8));
  assert.ok(loftCeilingY(lowGable, depth, wall + 0.4, 0) > wall + 0.4);
});

test('a loft wall picks up the ridge when the room crosses it', () => {
  const stations = ceilingStations(gable, -1.2, 0.8, 0.2);
  assert.deepEqual(stations, [-1.2, -0.2, 0.8]);
  assert.deepEqual(ceilingStations(pulpet, -1.2, 0.8, 0.2), [-1.2, 0.8]);

  const profile = [
    { at: -1, top: 1.2 },
    { at: 0, top: 2 },
    { at: 1, top: 1.2 }
  ];
  assert.equal(heightAt(profile, 0.5), 1.6);
  const door = sliceStations(profile, -0.4, 0.4);
  assert.equal(door.length, 3);
  assert.equal(door[1].at, 0);
  assert.equal(door[0].top, heightAt(profile, -0.4));
});

test('a taller rise keeps a walkable stair inside the room', () => {
  const rise = loftJoistTop(5) - 0.275;
  const run = loftStairRun(rise, 3.14);
  const treads = loftStairTreads(rise);
  const angle = Math.atan2(rise, run) * (180 / Math.PI);

  assert.ok(angle < 62);
  assert.ok(angle > 50);
  assert.ok(run < 3.14);
  assert.ok(treads >= 10);
});

test('each stair type gets a floor opening that fits inside the loft', () => {
  const straight = loftStairOpening('straight', 2.4, 4.5);
  const curved = loftStairOpening('curved', 2.4, 4.5);

  assert.ok(straight.width < 2.4);
  assert.ok(straight.depth < 4.5);
  assert.ok(curved.width > straight.width);
  assert.ok(curved.depth > straight.depth);
  assert.ok(curved.depth < 4.5);

  const compact = loftStairOpening('curved', 1.2, 1.5);
  assert.ok(compact.width < 1.2);
  assert.ok(compact.depth < 1.5);
});

test('a front loft sits on the front wall, and a back loft sits on the back wall', () => {
  const depth = 4.95;
  const wall = 0.18;
  const outer = -depth / 2 + wall;
  const front = loftEndPoint('fram', outer, 0);
  const back = loftEndPoint('bak', outer, 0);
  assert.ok(Math.abs(front.z - (depth / 2 - wall)) < 1e-6);
  assert.ok(Math.abs(front.x) < 1e-6);
  assert.ok(Math.abs(back.z - (-depth / 2 + wall)) < 1e-6);
  assert.ok(Math.abs(back.x) < 1e-6);
});

test('the straight stair lands on the deck and descends into the open room', () => {
  const interiorD = 3.14;
  const rise = 2.5;
  const run = loftStairRun(rise, 3.2);
  const opening = loftStairOpening('straight', 2.3, interiorD);
  const edgeX = -0.4;
  const stairZ = interiorD / 2 - opening.depth / 2;
  const stair = straightLoftStair({
    edgeX,
    openSign: 1,
    stairZ,
    opening,
    run,
    rise
  });

  assert.equal(stair.xTop, edgeX - opening.width);
  assert.ok(stair.xBottom > edgeX);
  assert.equal(stair.z, stairZ);
  assert.ok(stair.yTop - stair.yBottom === rise);
});

test('front and back stair positions mirror along the loft edge', () => {
  const interiorD = 3.14;
  const frontZ = interiorD / 2;
  const opening = loftStairOpening('curved', 2.3, interiorD);
  const frontStairZ = frontZ - opening.depth / 2;
  const backStairZ = -frontStairZ;
  const front = curvedLoftStair({
    edgeX: -0.2,
    openSign: 1,
    stairZ: frontStairZ,
    opening,
    rise: 2.5
  });
  const back = curvedLoftStair({
    edgeX: -0.2,
    openSign: 1,
    stairZ: backStairZ,
    opening,
    rise: 2.5
  });
  const topX = front.centerX + Math.cos(front.topAngle) * front.radius;
  const openingInnerX = -0.2 - opening.width;

  assert.ok(Math.abs(topX - openingInnerX) < 0.15);
  assert.equal(front.centerZ, -back.centerZ);
  assert.ok(front.centerZ + front.radius < frontZ);
  assert.ok(back.centerZ - back.radius > -frontZ);
  assert.ok(front.yTop - front.yBottom === 2.5);
});

test('loft studs in walls are hidden by default and only show when viewing studs', () => {
  // With inner walls visible (default state), wall studs must stay hidden
  assert.equal(loftWallStudsVisible(true, 'insida', false), false);
  assert.equal(loftWallStudsVisible(true, 'insida', true), false);
  assert.equal(loftWallStudsVisible(true, 'utsida', false), false);
  assert.equal(loftWallStudsVisible(true, 'blueprint', false), false);

  // When clicking the view studs control (showInnerWalls = false)
  // Studs show in inside view and loft cutaway view, but not outside or blueprint
  assert.equal(loftWallStudsVisible(false, 'insida', false), true);
  assert.equal(loftWallStudsVisible(false, 'insida', true), true);
  assert.equal(loftWallStudsVisible(false, 'utsida', true), true);
  assert.equal(loftWallStudsVisible(false, 'utsida', false), false);
  assert.equal(loftWallStudsVisible(false, 'blueprint', false), false);
});

test('a loft bedroom maximizes into the deck zone and leaves the stair clear', () => {
  const loft = loftDeckBounds(6, 6.6, 16, 'hoger', false, false);
  const stair = loftStairClearOnDeck({
    loft,
    placement: 'hoger',
    stairPosition: 'middle',
    stairType: 'straight',
    hasStair: true
  });
  assert.ok(stair);
  const north = maximizeLoftBedroom({ x: loft.maxX - 0.5, z: loft.maxZ - 0.5, loft, stair });
  const south = maximizeLoftBedroom({ x: loft.maxX - 0.5, z: loft.minZ + 0.5, loft, stair });
  assert.ok(north.d > 1.2);
  assert.ok(south.d > 1.2);
  assert.ok(north.z + north.d / 2 <= stair.maxZ + 1e-6 || north.z - north.d / 2 >= stair.maxZ - 1e-6);
  assert.ok(south.z - south.d / 2 >= stair.minZ - 1e-6 || south.z + south.d / 2 <= stair.minZ + 1e-6);
  assert.ok(Math.abs(north.w - (loft.maxX - loft.minX)) < 1e-6);
});

test('even window centres keep equal gaps and clear end margins', async () => {
  const { evenWindowCentersAlongRun, rhythmOpeningsAlongRun, rhythmOpeningForPanel } = await import('../src/three-engine/windowFit.ts');
  const centers = evenWindowCentersAlongRun(6, 3, 1.0, 0.3);
  assert.equal(centers.length, 3);
  const gap01 = centers[1] - centers[0];
  const gap12 = centers[2] - centers[1];
  assert.ok(Math.abs(gap01 - gap12) < 1e-9);
  assert.ok(centers[0] - 0.5 >= 0.3 - 1e-9);
  assert.ok(6 - (centers[2] + 0.5) >= 0.3 - 1e-9);

  const along = rhythmOpeningsAlongRun(4, 3, 1.5, 1.0, 0.3);
  assert.equal(along.length, 3);
  const world = along.map((p) => p.along).sort((a, b) => a - b);
  assert.ok(Math.abs((world[1] - world[0]) - (world[2] - world[1])) < 1e-9);
  assert.ok(world[0] - along[0].winW / 2 >= 0.3 - 1e-6);
  assert.ok(6 - (world[2] + along[2].winW / 2) >= 0.3 - 1e-6);

  const drawn = [];
  for (let i = 0; i < 4; i += 1) {
    const mapped = rhythmOpeningForPanel(along, 0, 4, i, 1.5);
    if (mapped?.drawFeature) drawn.push(mapped);
  }
  assert.equal(drawn.length, 3);

  // Seam-crossing mid pane must be visible to both neighbouring panels.
  const { rhythmOpeningsForPanel } = await import('../src/three-engine/windowFit.ts');
  const cuts = [0, 1, 2, 3].map((i) => rhythmOpeningsForPanel(along, 0, 4, i, 1.5));
  assert.ok(cuts.some((list) => list.length > 0 && list.some((o) => !o.drawFeature)));
});

test('walled loft bedrooms block the open-edge rail along their frontage', () => {
  const loft = loftDeckBounds(6, 6.6, 16, 'hoger', false, false);
  const room = {
    x: (loft.minX + loft.maxX) / 2,
    z: loft.maxZ - 1,
    w: loft.maxX - loft.minX,
    d: 2,
    wallsVisible: true
  };
  const blocked = loftRailBlockedSpans([room], loft, 'hoger');
  assert.equal(blocked.length, 1);
  assert.ok(blocked[0].max - blocked[0].min > 1.5);
  const kept = subtractRailSpans(loft.minZ, loft.maxZ, blocked);
  assert.ok(kept.every((seg) => seg.max - seg.min > 0.05));
  assert.ok(kept.every((seg) => seg.max <= room.z - room.d / 2 + 1e-6 || seg.min >= room.z + room.d / 2 - 1e-6));
});
