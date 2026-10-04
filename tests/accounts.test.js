import test from 'node:test';
import assert from 'node:assert/strict';
import { adminRole, hashPassword, verifyPassword } from '../workers/password.js';
import { openState, signState } from '../workers/state.js';

test('only the listed GitHub login is admin', () => {
  assert.equal(adminRole('tompat1', 'tompat1'), 'admin');
  assert.equal(adminRole('Tompat1', 'tompat1'), 'admin');
  assert.equal(adminRole('someone-else', 'tompat1'), null);
  assert.equal(adminRole('', 'tompat1'), null);
});

test('a password hash verifies only the same password', async () => {
  const stored = await hashPassword('correct horse battery');
  assert.equal(await verifyPassword('correct horse battery', stored), true);
  assert.equal(await verifyPassword('wrong horse battery', stored), false);
  assert.equal(await verifyPassword('correct horse battery', 'pbkdf2$nope'), false);
});

test('oauth state expires and rejects a tampered payload', async () => {
  const secret = 'test-session-secret';
  const token = await signState({ origin: 'http://localhost:5173', exp: Date.now() + 60_000 }, secret);
  const opened = await openState(token, secret);
  assert.equal(opened.origin, 'http://localhost:5173');
  assert.equal(await openState(token, 'other-secret'), null);
  const expired = await signState({ origin: 'http://localhost:5173', exp: Date.now() - 1000 }, secret);
  assert.equal(await openState(expired, secret), null);
});
