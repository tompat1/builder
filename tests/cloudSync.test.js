import test from 'node:test';
import assert from 'node:assert/strict';
import {
  useCloudSync,
  checkCloudflareHealth,
  markSyncStarted,
  markSyncCompleted,
  resetCloudSyncForTesting
} from '../src/services/cloudSync.ts';

test('cloudSync service tracks sync state, latency and online status', async () => {
  resetCloudSyncForTesting();
  const { status, isOnline, isCloudflareReady, lastSyncedAt } = useCloudSync();

  assert.equal(isOnline.value, true);
  assert.equal(isCloudflareReady.value, true);
  assert.equal(status.value, 'online');
  assert.ok(lastSyncedAt.value instanceof Date);

  // Sync started transition
  markSyncStarted();
  assert.equal(status.value, 'syncing');

  // Sync completed transition
  const previousSyncTime = lastSyncedAt.value?.getTime() ?? 0;
  markSyncCompleted(true);
  assert.equal(status.value, 'online');
  assert.ok((lastSyncedAt.value?.getTime() ?? 0) >= previousSyncTime);

  // Sync failed transition
  markSyncCompleted(false);
  assert.equal(status.value, 'error');

  resetCloudSyncForTesting();
});

test('checkCloudflareHealth processes successful worker response', async () => {
  resetCloudSyncForTesting();
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ status: 'ok', ai: true, accounts: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const success = await checkCloudflareHealth();
    assert.equal(success, true);

    const { isOnline, isCloudflareReady, status, latencyMs, aiReady, dbReady } = useCloudSync();
    assert.equal(isOnline.value, true);
    assert.equal(isCloudflareReady.value, true);
    assert.equal(status.value, 'online');
    assert.ok(typeof latencyMs.value === 'number' && latencyMs.value >= 1);
    assert.equal(aiReady.value, true);
    assert.equal(dbReady.value, true);
  } finally {
    globalThis.fetch = originalFetch;
    resetCloudSyncForTesting();
  }
});

test('checkCloudflareHealth handles server error responses', async () => {
  resetCloudSyncForTesting();
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error: 'Internal Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const success = await checkCloudflareHealth();
    assert.equal(success, false);

    const { isCloudflareReady, status, errorMessage } = useCloudSync();
    assert.equal(isCloudflareReady.value, false);
    assert.equal(status.value, 'error');
    assert.equal(errorMessage.value, 'Cloudflare HTTP 500');
  } finally {
    globalThis.fetch = originalFetch;
    resetCloudSyncForTesting();
  }
});
