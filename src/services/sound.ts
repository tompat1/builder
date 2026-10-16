/**
 * Audio playback service for Builder sound effects.
 *
 * Provides preloaded playback for the architectural door sound,
 * safely handles browser autoplay restrictions, and tracks audio state.
 */

const DOOR_SOUND_URL = '/brand/door-sound.m4a';

let sharedAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

export function getDoorAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(DOOR_SOUND_URL);
    sharedAudio.preload = 'auto';
    sharedAudio.volume = 0.7;
  }
  return sharedAudio;
}

/** Preload the audio file so it is ready instantaneously. */
export function preloadDoorAudio(): void {
  const audio = getDoorAudio();
  if (audio) {
    try {
      audio.load();
    } catch {
      /* Ignore preload error */
    }
  }
}

export interface PlayResult {
  started: boolean;
  blockedByAutoplay: boolean;
  error?: unknown;
}

/**
 * Play the authentic Builder door sound.
 * @param offsetSeconds optional start time in seconds (e.g. 0.18s for latch).
 */
export async function playDoorSound(offsetSeconds = 0): Promise<PlayResult> {
  const audio = getDoorAudio();
  if (!audio) return { started: false, blockedByAutoplay: false };

  try {
    if (offsetSeconds > 0.05) {
      if (audio.readyState >= 1) {
        audio.currentTime = offsetSeconds;
      } else {
        audio.addEventListener(
          'loadedmetadata',
          () => {
            try {
              audio.currentTime = offsetSeconds;
            } catch {
              /* Ignore seek errors on unbuffered streams */
            }
          },
          { once: true }
        );
      }
    } else {
      try {
        if (audio.currentTime > 0) audio.currentTime = 0;
      } catch {
        /* Ignore */
      }
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
    isAudioUnlocked = true;
    return { started: true, blockedByAutoplay: false };
  } catch (err: unknown) {
    const errObj = err as { name?: string; message?: string } | undefined;
    const isAutoplay =
      errObj?.name === 'NotAllowedError' ||
      errObj?.message?.includes("user didn't interact") ||
      errObj?.name === 'SecurityError';
    return { started: false, blockedByAutoplay: Boolean(isAutoplay), error: err };
  }
}

/** Stop playback and reset to the beginning. */
export function stopDoorSound(): void {
  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
    } catch {
      /* Ignore cleanup error */
    }
  }
}

/** Check if audio has been unlocked via user interaction. */
export function hasAudioUnlocked(): boolean {
  return isAudioUnlocked;
}
