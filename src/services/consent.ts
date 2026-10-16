/**
 * Privacy, Cookie & Sound consent service for Builder.
 *
 * Keeps approvals in localStorage and syncs with registered user profiles.
 * If consent is missing, the application prompts the user once.
 */

export type SoundConsent = 'granted' | 'denied';
export type CookieConsent = 'all' | 'essential';

export interface ConsentState {
  sound: SoundConsent | null;
  cookies: CookieConsent | null;
  timestamp: string | null;
}

const SOUND_STORAGE_KEY = 'builder.sound.consent';
const COOKIES_STORAGE_KEY = 'builder.cookies.consent';
const CONSENT_TIMESTAMP_KEY = 'builder.consent.timestamp';
const USER_CONSENT_PREFIX = 'builder.user.consent.';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Get the current sound consent from localStorage ('granted' | 'denied' | null). */
export function getSoundConsent(): SoundConsent | null {
  if (!isBrowser()) return null;
  const val = localStorage.getItem(SOUND_STORAGE_KEY);
  if (val === 'granted' || val === 'denied') return val;
  return null;
}

/** Set sound consent in localStorage and notify listeners. */
export function setSoundConsent(consent: SoundConsent): void {
  if (!isBrowser()) return;
  localStorage.setItem(SOUND_STORAGE_KEY, consent);
  localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
  notifyConsentChanged();
}

/** Get the current cookie consent from localStorage ('all' | 'essential' | null). */
export function getCookieConsent(): CookieConsent | null {
  if (!isBrowser()) return null;
  const val = localStorage.getItem(COOKIES_STORAGE_KEY);
  if (val === 'all' || val === 'essential') return val;
  return null;
}

/** Set cookie consent in localStorage and notify listeners. */
export function setCookieConsent(consent: CookieConsent): void {
  if (!isBrowser()) return;
  localStorage.setItem(COOKIES_STORAGE_KEY, consent);
  localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
  notifyConsentChanged();
}

/** Save both sound and cookie consent together. */
export function saveConsent(options: { sound: SoundConsent; cookies: CookieConsent; userId?: string }): void {
  if (!isBrowser()) return;
  setSoundConsent(options.sound);
  setCookieConsent(options.cookies);
  if (options.userId) {
    saveUserConsent(options.userId, options.sound, options.cookies);
  }
}

/** Returns true if sound approval is missing (never answered or cleared). */
export function isSoundApprovalMissing(): boolean {
  return getSoundConsent() === null;
}

/** Returns true if cookie approval is missing (never answered or cleared). */
export function isCookieApprovalMissing(): boolean {
  return getCookieConsent() === null;
}

/** Returns true only if sound was explicitly granted. */
export function isSoundApproved(): boolean {
  return getSoundConsent() === 'granted';
}

/** Save consent tied to a registered user ID. */
export function saveUserConsent(userId: string, sound: SoundConsent, cookies: CookieConsent): void {
  if (!isBrowser() || !userId) return;
  const record: ConsentState = {
    sound,
    cookies,
    timestamp: new Date().toISOString()
  };
  try {
    localStorage.setItem(`${USER_CONSENT_PREFIX}${userId}`, JSON.stringify(record));
  } catch {
    /* Ignore storage quotas */
  }
}

/** Load consent tied to a registered user ID. */
export function loadUserConsent(userId: string): ConsentState | null {
  if (!isBrowser() || !userId) return null;
  try {
    const raw = localStorage.getItem(`${USER_CONSENT_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

/**
 * Sync consent between local state and registered user information.
 * If user has saved preferences, restore them to localStorage.
 * If user just gave consent, attach it to their user profile.
 */
export function syncUserWithLocalConsent(user: { id: string; soundConsent?: SoundConsent; cookieConsent?: CookieConsent }): void {
  if (!user || !user.id) return;
  const userStored = loadUserConsent(user.id);

  if (userStored) {
    user.soundConsent = userStored.sound ?? undefined;
    user.cookieConsent = userStored.cookies ?? undefined;

    // If local storage is missing approval on this device, restore from user profile
    if (getSoundConsent() === null && userStored.sound) {
      setSoundConsent(userStored.sound);
    }
    if (getCookieConsent() === null && userStored.cookies) {
      setCookieConsent(userStored.cookies);
    }
  } else {
    // Save current local consent to the registered user profile
    const currentSound = getSoundConsent();
    const currentCookies = getCookieConsent();
    if (currentSound && currentCookies) {
      saveUserConsent(user.id, currentSound, currentCookies);
      user.soundConsent = currentSound;
      user.cookieConsent = currentCookies;
    }
  }
}

/** Dispatch custom window event when consent changes so UI reacts instantly. */
function notifyConsentChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('builder:consent-updated', {
      detail: {
        sound: getSoundConsent(),
        cookies: getCookieConsent()
      }
    })
  );
}

/** Reset all consent (used for testing or resetting preferences). */
export function clearConsent(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SOUND_STORAGE_KEY);
  localStorage.removeItem(COOKIES_STORAGE_KEY);
  localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
  notifyConsentChanged();
}
