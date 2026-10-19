/** What stays visible the next time the house opens. Stored on this device. */

const KEY = 'builder.display';

export interface DisplayPrefs {
  dimensions: boolean;
  notes: boolean;
  sun: boolean;
  mood: boolean;
}

export const DISPLAY_DEFAULTS: DisplayPrefs = {
  dimensions: false,
  notes: false,
  sun: false,
  mood: false
};

function readStore(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadDisplayPrefs(): DisplayPrefs {
  const store = readStore();
  if (!store) return { ...DISPLAY_DEFAULTS };
  try {
    const raw = JSON.parse(store.getItem(KEY) || '') as Partial<DisplayPrefs> | null;
    if (!raw || typeof raw !== 'object') return { ...DISPLAY_DEFAULTS };
    return {
      dimensions: raw.dimensions === true,
      notes: raw.notes === true,
      sun: raw.sun === true,
      mood: raw.mood === true
    };
  } catch {
    return { ...DISPLAY_DEFAULTS };
  }
}

export function saveDisplayPrefs(prefs: DisplayPrefs) {
  const store = readStore();
  if (!store) return;
  store.setItem(KEY, JSON.stringify({
    dimensions: prefs.dimensions === true,
    notes: prefs.notes === true,
    sun: prefs.sun === true,
    mood: prefs.mood === true
  }));
}
