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

const SPINNER_THRESHOLD_MS = 380;

function clearProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function startBarAnimation() {
  clearProgressAnimation();
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

/**
 * Start an asynchronous action.
 * Returns a completion function that must be called when the action finishes.
 */
export function startFeedback(label = 'Laddar...'): () => void {
  activeCount.value++;
  statusMessage.value = label;

  if (activeCount.value === 1) {
    startBarAnimation();

    if (spinnerTimer) clearTimeout(spinnerTimer);
    if (typeof window !== 'undefined') {
      spinnerTimer = setTimeout(() => {
        if (activeCount.value > 0) {
          isSpinnerVisible.value = true;
        }
      }, SPINNER_THRESHOLD_MS);
    }
  }

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    activeCount.value = Math.max(0, activeCount.value - 1);

    if (activeCount.value === 0) {
      if (spinnerTimer) {
        clearTimeout(spinnerTimer);
        spinnerTimer = null;
      }
      isSpinnerVisible.value = false;
      completeBarAnimation();
      statusMessage.value = '';
    }
  };
}

/**
 * Quick pulse on immediate/instant user actions.
 * Animates the top status bar across for a brief moment.
 */
export function pulseFeedback(label?: string, tone: 'success' | 'info' = 'success') {
  startBarAnimation();
  if (label) {
    showToast(label, tone);
  }
  setTimeout(() => {
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
