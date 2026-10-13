import test from 'node:test';
import assert from 'node:assert/strict';
import {
  errorFeedback,
  pulseFeedback,
  showToast,
  startFeedback,
  trackFeedback,
  useFeedback
} from '../src/services/feedback.ts';

test('feedback service tracks active asynchronous actions and progress bar', () => {
  const { isActive, isBarVisible, barProgress, statusMessage } = useFeedback();

  assert.equal(isActive.value, false);
  assert.equal(isBarVisible.value, false);

  const done1 = startFeedback('Sparar hus...');
  assert.equal(isActive.value, true);
  assert.equal(isBarVisible.value, true);
  assert.equal(statusMessage.value, 'Sparar hus...');
  assert.ok(barProgress.value > 0);

  // Nested concurrent operation
  const done2 = startFeedback('Synkar bild...');
  assert.equal(isActive.value, true);

  done1();
  assert.equal(isActive.value, true);

  done2();
  assert.equal(isActive.value, false);
  assert.equal(statusMessage.value, '');
});

test('trackFeedback wraps a promise and resets status upon completion', async () => {
  const { isActive } = useFeedback();
  assert.equal(isActive.value, false);

  const result = await trackFeedback(
    async () => {
      assert.equal(isActive.value, true);
      return 'saved';
    },
    'Bearbetar...'
  );

  assert.equal(result, 'saved');
  assert.equal(isActive.value, false);
});

test('toast notifications update activeToast payload', () => {
  const { activeToast, dismissToast } = useFeedback();

  showToast('Hus sparat!', 'success');
  assert.ok(activeToast.value);
  assert.equal(activeToast.value.message, 'Hus sparat!');
  assert.equal(activeToast.value.tone, 'success');

  errorFeedback('Ett fel uppstod');
  assert.equal(activeToast.value.message, 'Ett fel uppstod');
  assert.equal(activeToast.value.tone, 'error');

  dismissToast();
  assert.equal(activeToast.value, null);
});

test('pulseFeedback activates the progress bar', () => {
  const { isBarVisible } = useFeedback();
  pulseFeedback('Snabb åtgärd');
  assert.equal(isBarVisible.value, true);
});
