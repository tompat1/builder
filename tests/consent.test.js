import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

globalThis.window = {
  dispatchEvent: () => true
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};

const {
  getSoundConsent,
  setSoundConsent,
  getCookieConsent,
  setCookieConsent,
  saveConsent,
  isSoundApprovalMissing,
  isCookieApprovalMissing,
  isSoundApproved,
  saveUserConsent,
  loadUserConsent,
  syncUserWithLocalConsent,
  clearConsent
} = await import('../src/services/consent.ts');

test('consent service tracks sound approval and asks again when missing', () => {
  clearConsent();

  // 1. Missing approval initially
  assert.equal(getSoundConsent(), null);
  assert.equal(isSoundApprovalMissing(), true, 'should indicate missing approval');
  assert.equal(isSoundApproved(), false, 'sound should not be approved when missing');

  // 2. User approves sound
  setSoundConsent('granted');
  assert.equal(getSoundConsent(), 'granted');
  assert.equal(isSoundApprovalMissing(), false, 'approval is no longer missing');
  assert.equal(isSoundApproved(), true, 'sound is approved');

  // 3. User denies sound
  setSoundConsent('denied');
  assert.equal(getSoundConsent(), 'denied');
  assert.equal(isSoundApprovalMissing(), false, 'approval is decided (denied)');
  assert.equal(isSoundApproved(), false, 'sound is not approved');

  // 4. Missing approval resets -> asks again
  clearConsent();
  assert.equal(isSoundApprovalMissing(), true, 'asks again when approval is missing');
});

test('consent service manages cookies control and combines with sound consent', () => {
  clearConsent();

  assert.equal(getCookieConsent(), null);
  assert.equal(isCookieApprovalMissing(), true);

  setCookieConsent('all');
  assert.equal(getCookieConsent(), 'all');
  assert.equal(isCookieApprovalMissing(), false);

  setCookieConsent('essential');
  assert.equal(getCookieConsent(), 'essential');

  // Save both together
  saveConsent({ sound: 'granted', cookies: 'all' });
  assert.equal(getSoundConsent(), 'granted');
  assert.equal(getCookieConsent(), 'all');
});

test('consent syncs with registered user information', () => {
  clearConsent();

  const user = {
    id: 'user_123',
    login: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    role: 'member',
    hasPassword: true,
    avatarUrl: ''
  };

  // 1. Save consent for registered user
  saveUserConsent(user.id, 'granted', 'all');
  const stored = loadUserConsent(user.id);
  assert.ok(stored);
  assert.equal(stored.sound, 'granted');
  assert.equal(stored.cookies, 'all');

  // 2. Clear local device consent; syncUserWithLocalConsent restores from registered user
  clearConsent();
  assert.equal(isSoundApprovalMissing(), true);
  syncUserWithLocalConsent(user);
  assert.equal(user.soundConsent, 'granted');
  assert.equal(user.cookieConsent, 'all');
  assert.equal(getSoundConsent(), 'granted', 'restored sound consent to localStorage');
  assert.equal(getCookieConsent(), 'all', 'restored cookie consent to localStorage');

  // 3. If local consent is updated, syncUserWithLocalConsent updates user info
  saveConsent({ sound: 'denied', cookies: 'essential' });
  user.soundConsent = undefined;
  user.cookieConsent = undefined;
  mockStorage.delete('builder.user.consent.' + user.id); // clear stored user profile

  syncUserWithLocalConsent(user);
  assert.equal(user.soundConsent, 'denied');
  assert.equal(user.cookieConsent, 'essential');
  const reloaded = loadUserConsent(user.id);
  assert.equal(reloaded?.sound, 'denied');
});
