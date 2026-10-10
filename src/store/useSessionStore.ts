import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { accountMe, saveSession, sessionToken, type AccountUser } from '../services/account';
import { listHouses } from '../services/houseSave';

export const useSessionStore = defineStore('session', () => {
  const user = ref<AccountUser | null>(null);
  const resolved = ref(false);
  const savedHouseCount = ref(0);
  const hasSavedHouse = computed(() => Boolean(user.value && savedHouseCount.value > 0));
  let resolving: Promise<void> | null = null;

  function setUser(next: AccountUser | null) {
    user.value = next;
    if (!next) savedHouseCount.value = 0;
  }

  function setSavedHouseCount(count: number) {
    savedHouseCount.value = Math.max(0, Math.floor(count));
  }

  async function refreshSavedHouseStatus() {
    if (!user.value) {
      setSavedHouseCount(0);
      return;
    }
    try {
      setSavedHouseCount((await listHouses()).length);
    } catch {
      setSavedHouseCount(0);
    }
  }

  async function ensureAccountState(force = false) {
    if (resolving) return resolving;
    if (resolved.value && !force) return;
    resolving = (async () => {
      if (!sessionToken()) {
        setUser(null);
        resolved.value = true;
        return;
      }
      try {
        const next = await accountMe();
        setUser(next);
        if (next) await refreshSavedHouseStatus();
        else saveSession('');
      } catch {
        setUser(null);
      } finally {
        resolved.value = true;
      }
    })().finally(() => {
      resolving = null;
    });
    return resolving;
  }

  function finishAuthentication(next: AccountUser) {
    setUser(next);
    resolved.value = true;
  }

  function clearAccount() {
    setUser(null);
    resolved.value = true;
  }

  return {
    user,
    resolved,
    savedHouseCount,
    hasSavedHouse,
    setUser,
    setSavedHouseCount,
    refreshSavedHouseStatus,
    ensureAccountState,
    finishAuthentication,
    clearAccount
  };
});
