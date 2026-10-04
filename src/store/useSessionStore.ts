import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AccountUser } from '../services/account';

export const useSessionStore = defineStore('session', () => {
  const user = ref<AccountUser | null>(null);

  function setUser(next: AccountUser | null) {
    user.value = next;
  }

  return { user, setUser };
});
