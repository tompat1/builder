import test from 'node:test';
import assert from 'node:assert/strict';
import { eaveLiftMm, gablePitchDegrees, isGableRoof } from '../src/store/roof.ts';

test('the extra-height gable is 14 degrees and lifts the eaves', () => {
  assert.equal(gablePitchDegrees('sadeltak'), 22);
  assert.equal(gablePitchDegrees('sadeltak14'), 14);
  assert.equal(eaveLiftMm('sadeltak'), 0);
  assert.equal(eaveLiftMm('sadeltak14'), 400);
  assert.equal(eaveLiftMm('pulpettak'), 0);
  assert.equal(isGableRoof('sadeltak14'), true);
  assert.equal(isGableRoof('flackt'), false);
});
