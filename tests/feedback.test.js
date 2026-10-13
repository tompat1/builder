import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiFeedbackKey,
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

test('a pulse does not finish a wait that is still running', async () => {
  const { isActive, isBarVisible, statusMessage } = useFeedback();
  const done = startFeedback('Sparar hus...');
  pulseFeedback('Klart');
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(isActive.value, true);
  assert.equal(isBarVisible.value, true);
  assert.equal(statusMessage.value, 'Sparar hus...');
  done();
  assert.equal(isActive.value, false);
});

test('an api label follows the request', () => {
  assert.equal(apiFeedbackKey('/api/houses/active', 'GET'), 'feedback.loadHouse');
  assert.equal(apiFeedbackKey('/api/houses/active', 'PUT'), 'feedback.saveHouse');
  assert.equal(apiFeedbackKey('/api/mood/draft', 'PUT'), 'feedback.syncMood');
  assert.equal(apiFeedbackKey('/api/auth/login', 'POST'), 'feedback.account');
});

test('autosave badge triggers once per session for 3D and moodboard', async () => {
  const {
    useAutosaveBadge,
    triggerSessionAutosaveBadge,
    hasSeenAutosaveBadge,
    resetAutosaveBadgeForTesting
  } = await import('../src/services/feedback.ts');

  resetAutosaveBadgeForTesting();
  const { isAutosaveBadgeVisible, autosaveBadgeStatus } = useAutosaveBadge();

  assert.equal(hasSeenAutosaveBadge('3d'), false);
  assert.equal(hasSeenAutosaveBadge('moodboard'), false);
  assert.equal(isAutosaveBadgeVisible.value, false);

  // First trigger for 3D
  triggerSessionAutosaveBadge('3d');
  assert.equal(hasSeenAutosaveBadge('3d'), true);
  assert.equal(isAutosaveBadgeVisible.value, true);
  assert.equal(autosaveBadgeStatus.value, 'saving');

  // Second trigger for 3D in same session is ignored
  triggerSessionAutosaveBadge('3d');
  assert.equal(hasSeenAutosaveBadge('3d'), true);

  // Reset badge visibility to test moodboard independent trigger
  resetAutosaveBadgeForTesting();
  assert.equal(hasSeenAutosaveBadge('moodboard'), false);
  assert.equal(isAutosaveBadgeVisible.value, false);

  // First trigger for moodboard
  triggerSessionAutosaveBadge('moodboard');
  assert.equal(hasSeenAutosaveBadge('moodboard'), true);
  assert.equal(isAutosaveBadgeVisible.value, true);
  assert.equal(autosaveBadgeStatus.value, 'saving');

  // Second trigger for moodboard in same session is ignored
  triggerSessionAutosaveBadge('moodboard');
  assert.equal(hasSeenAutosaveBadge('moodboard'), true);

  resetAutosaveBadgeForTesting();
});
