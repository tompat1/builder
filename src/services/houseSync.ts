/** Which copy of a house opens after sign-in. Kept separate so tests can load it without the account client. */

export interface ActiveHouseData {
  activeId?: string;
  name?: string;
  locale?: string;
  /** Server time of the last successful account write. */
  updatedAt?: string;
  config: unknown;
}

/**
 * A browser that already synced, then edited, keeps that newer copy.
 * Every other sign-in opens the account house, so the next device matches the first.
 * The local copy is used only when the account has no house yet.
 * If the account is strictly newer than this device's local stamp, the account wins
 * so a phone with stale leftover storage cannot hide the laptop's latest save.
 */
export function chooseWorkingHouse(input: {
  hasAccountHouse: boolean;
  localAt: string;
  syncedAt: string;
  accountUpdatedAt?: string;
}): 'account' | 'local' {
  if (!input.hasAccountHouse) return 'local';
  if (input.accountUpdatedAt && (!input.localAt || input.accountUpdatedAt > input.localAt)) {
    return 'account';
  }
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
