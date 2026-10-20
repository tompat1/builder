/** What stays visible the next time the house opens. Stored on this device. */

const KEY = 'builder.display';
const VERSION = 2;

export interface DisplayPrefs {
  dimensions: boolean;
  notes: boolean;
  sun: boolean;
  mood: boolean;
  v?: number;
}

export const DISPLAY_DEFAULTS: DisplayPrefs = {
  dimensions: false,
  notes: false,
  sun: false,
  mood: true,
  v: VERSION
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
    const isV2 = raw.v === VERSION;
    return {
      dimensions: raw.dimensions === true,
      notes: raw.notes === true,
      sun: raw.sun === true,
      mood: isV2 ? raw.mood === true : true,
      v: VERSION
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
    mood: prefs.mood === true,
    v: VERSION
  }));
}

export const DEFAULT_PANEL_WIDTH = 410;
export const MIN_PANEL_WIDTH = 380;
export const MAX_PANEL_WIDTH = 960;

export function clampPanelWidth(width: number, viewportWidth = 1280): number {
  if (!Number.isFinite(width)) return DEFAULT_PANEL_WIDTH;
  const maxAllowed = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, viewportWidth - 120));
  return Math.round(Math.max(MIN_PANEL_WIDTH, Math.min(maxAllowed, width)));
}

export function loadPanelWidth(viewportWidth = 1280): number {
  const store = readStore();
  if (!store) return DEFAULT_PANEL_WIDTH;
  try {
    const raw = store.getItem('builder:panel-width');
    if (!raw) return DEFAULT_PANEL_WIDTH;
    const parsed = Number.parseInt(raw, 10);
    return clampPanelWidth(parsed, viewportWidth);
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
}

export function savePanelWidth(width: number) {
  const store = readStore();
  if (!store) return;
  try {
    store.setItem('builder:panel-width', String(Math.round(width)));
  } catch {
    // Ignore
  }
}
