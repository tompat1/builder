import { computed, ref } from 'vue';

export interface ToastPayload {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

const activeCount = ref(0);
const barProgress = ref(0);
const isBarVisible = ref(false);
const isSpinnerVisible = ref(false);
const statusMessage = ref('');
const activeToast = ref<ToastPayload | null>(null);

let barTimer: ReturnType<typeof setTimeout> | null = null;
let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let nextToastId = 1;
let pulseTimer: ReturnType<typeof setTimeout> | null = null;

const SPINNER_THRESHOLD_MS = 380;

type FeedbackJob = { label: string; spinner: boolean };
const jobs: FeedbackJob[] = [];

function clearProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function startBarAnimation() {
  clearProgressAnimation();
  if (barTimer) {
    clearTimeout(barTimer);
    barTimer = null;
  }
  isBarVisible.value = true;
  barProgress.value = 15;

  if (typeof window !== 'undefined') {
    progressInterval = setInterval(() => {
      if (barProgress.value < 85) {
        // Asymptotically approach 85%
        const remaining = 85 - barProgress.value;
        barProgress.value += Math.max(0.5, remaining * 0.1);
      }
    }, 100);
  }
}

function completeBarAnimation() {
  clearProgressAnimation();
  barProgress.value = 100;
  if (barTimer) clearTimeout(barTimer);
  if (typeof window !== 'undefined') {
    barTimer = setTimeout(() => {
      isBarVisible.value = false;
      barProgress.value = 0;
    }, 280);
  } else {
    isBarVisible.value = false;
    barProgress.value = 0;
  }
}

function armSpinner() {
  if (spinnerTimer || isSpinnerVisible.value || typeof window === 'undefined') return;
  if (!jobs.some((job) => job.spinner)) return;
  spinnerTimer = setTimeout(() => {
    spinnerTimer = null;
    if (jobs.some((job) => job.spinner)) isSpinnerVisible.value = true;
  }, SPINNER_THRESHOLD_MS);
}

function syncJobs() {
  activeCount.value = jobs.length;
  statusMessage.value = jobs.length ? jobs[jobs.length - 1].label : '';
  if (!jobs.some((job) => job.spinner)) {
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
      spinnerTimer = null;
    }
    isSpinnerVisible.value = false;
  }
  if (!jobs.length) completeBarAnimation();
}

/**
 * Start an asynchronous action.
 * Returns a completion function that must be called when the action finishes.
 * Background work, such as an autosave, passes `{ spinner: false }` so a slow request does not cover the page.
 */
export function startFeedback(label = 'Laddar...', options?: { spinner?: boolean }): () => void {
  const job: FeedbackJob = { label, spinner: options?.spinner !== false };
  jobs.push(job);
  activeCount.value = jobs.length;
  statusMessage.value = label;
  if (jobs.length === 1) startBarAnimation();
  if (job.spinner) armSpinner();

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    const index = jobs.indexOf(job);
    if (index >= 0) jobs.splice(index, 1);
    syncJobs();
  };
}

/** Label key for a worker request. Reading a house is not the same as saving one. */
export function apiFeedbackKey(url: string, method: string) {
  const writing = method !== 'GET' && method !== 'HEAD';
  if (url.includes('/api/houses')) return writing ? 'feedback.saveHouse' : 'feedback.loadHouse';
  if (url.includes('/api/mood')) return 'feedback.syncMood';
  if (url.includes('/api/render')) return 'feedback.render';
  if (url.includes('/api/ask')) return 'feedback.ask';
  if (url.includes('/api/sources')) return 'feedback.sources';
  if (url.includes('/api/content')) return 'feedback.content';
  if (url.includes('/api/account') || url.includes('/api/auth')) return 'feedback.account';
  return 'feedback.sync';
}

/**
 * Quick pulse on immediate/instant user actions.
 * Animates the top status bar across for a brief moment.
 */
export function pulseFeedback(label?: string, tone: 'success' | 'info' = 'success') {
  if (label) showToast(label, tone);
  if (jobs.length > 0) return;
  startBarAnimation();
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    pulseTimer = null;
    if (jobs.length > 0) return;
    completeBarAnimation();
  }, 200);
}

/**
 * Wrap a promise or async action with visual status and feedback.
 */
export async function trackFeedback<T>(
  action: Promise<T> | (() => Promise<T>),
  label?: string
): Promise<T> {
  const finish = startFeedback(label);
  try {
    const promise = typeof action === 'function' ? action() : action;
    return await promise;
  } finally {
    finish();
  }
}

/**
 * Display a floating feedback toast pill at the top of the viewport.
 */
export function showToast(message: string, tone: 'success' | 'error' | 'info' = 'info') {
  if (toastTimer) clearTimeout(toastTimer);
  activeToast.value = {
    id: nextToastId++,
    message,
    tone
  };
  if (typeof window !== 'undefined') {
    toastTimer = setTimeout(() => {
      activeToast.value = null;
    }, 2400);
  }
}

export function successFeedback(message: string) {
  pulseFeedback();
  showToast(message, 'success');
}

export function errorFeedback(message: string) {
  showToast(message, 'error');
}

export function useFeedback() {
  return {
    isActive: computed(() => activeCount.value > 0),
    isBarVisible: computed(() => isBarVisible.value),
    barProgress: computed(() => Math.min(100, Math.max(0, barProgress.value))),
    isSpinnerVisible: computed(() => isSpinnerVisible.value),
    statusMessage: computed(() => statusMessage.value),
    activeToast: computed(() => activeToast.value),
    start: startFeedback,
    pulse: pulseFeedback,
    track: trackFeedback,
    success: successFeedback,
    error: errorFeedback,
    dismissToast: () => {
      activeToast.value = null;
    }
  };
}

export const feedback = {
  start: startFeedback,
  pulse: pulseFeedback,
  track: trackFeedback,
  success: successFeedback,
  error: errorFeedback,
  toast: showToast
};

export type AutosaveTarget = '3d' | 'moodboard';

const isAutosaveBadgeVisible = ref(false);
const autosaveBadgeStatus = ref<'saving' | 'saved'>('saving');
let badgeTimer: ReturnType<typeof setTimeout> | null = null;

const STORAGE_KEYS: Record<AutosaveTarget, string> = {
  '3d': 'builder_autosave_seen_3d',
  moodboard: 'builder_autosave_seen_moodboard'
};

const inMemorySeen = new Set<string>();

export function hasSeenAutosaveBadge(target: AutosaveTarget): boolean {
  const key = STORAGE_KEYS[target];
  if (inMemorySeen.has(key)) return true;
  try {
    if (typeof sessionStorage !== 'undefined') {
      return Boolean(sessionStorage.getItem(key));
    }
  } catch {
    // sessionStorage not available or security error
  }
  return false;
}

export function triggerSessionAutosaveBadge(target: AutosaveTarget): void {
  if (hasSeenAutosaveBadge(target)) return;

  const key = STORAGE_KEYS[target];
  inMemorySeen.add(key);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, '1');
    }
  } catch {
    // ignore
  }

  if (badgeTimer) {
    clearTimeout(badgeTimer);
    badgeTimer = null;
  }

  autosaveBadgeStatus.value = 'saving';
  isAutosaveBadgeVisible.value = true;

  if (typeof setTimeout !== 'undefined') {
    badgeTimer = setTimeout(() => {
      autosaveBadgeStatus.value = 'saved';
      badgeTimer = setTimeout(() => {
        isAutosaveBadgeVisible.value = false;
        badgeTimer = null;
      }, 1200);
    }, 2000);
  } else {
    autosaveBadgeStatus.value = 'saved';
    isAutosaveBadgeVisible.value = false;
  }
}

export function useAutosaveBadge() {
  return {
    isAutosaveBadgeVisible: computed(() => isAutosaveBadgeVisible.value),
    autosaveBadgeStatus: computed(() => autosaveBadgeStatus.value),
    triggerSessionAutosaveBadge,
    hasSeenAutosaveBadge
  };
}

export function resetAutosaveBadgeForTesting(): void {
  inMemorySeen.clear();
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS['3d']);
      sessionStorage.removeItem(STORAGE_KEYS.moodboard);
    }
  } catch {
    // ignore
  }
  if (badgeTimer) {
    clearTimeout(badgeTimer);
    badgeTimer = null;
  }
  isAutosaveBadgeVisible.value = false;
  autosaveBadgeStatus.value = 'saving';
}
