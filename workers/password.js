/** Password hashes for account login. Workers and node tests both have WebCrypto. */

const ITERATIONS = 100_000;

function bytesToB64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (iterations !== ITERATIONS) return false;
  let salt;
  let expected;
  try {
    salt = b64ToBytes(parts[2]);
    expected = b64ToBytes(parts[3]);
  } catch {
    return false;
  }
  const actual = await derive(password, salt, iterations);
  return sameBytes(actual, expected);
}

/** Admin GitHub logins, comma-separated. Anyone else is refused. */
export function adminRole(login, adminLogins) {
  const name = String(login ?? '').trim().toLowerCase();
  if (!name) return null;
  const allowed = String(adminLogins ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(name) ? 'admin' : null;
}
