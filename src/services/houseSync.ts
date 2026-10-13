/** Which copy of a house opens after sign-in. Kept separate so tests can load it without the account client. */

export interface ActiveHouseData {
  activeId?: string;
  name?: string;
  locale?: string;
  config: unknown;
}

/**
 * A browser that already synced, then edited, keeps that newer copy.
 * Every other sign-in opens the account house, so the next device matches the first.
 * The local copy is used only when the account has no house yet.
 */
export function chooseWorkingHouse(input: {
  hasAccountHouse: boolean;
  localAt: string;
  syncedAt: string;
}): 'account' | 'local' {
  if (!input.hasAccountHouse) return 'local';
  if (input.syncedAt && input.localAt > input.syncedAt) return 'local';
  return 'account';
}

/** The saved design, including an older row that stored the house fields directly. */
export function accountHouseConfig(active: ActiveHouseData | null): unknown | null {
  if (!active || typeof active !== 'object') return null;
  if (active.config && typeof active.config === 'object') return active.config;
  const legacy = active as ActiveHouseData & { buildingWidth?: unknown };
  if (typeof legacy.buildingWidth === 'number') return active;
  return null;
}
