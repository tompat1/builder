<template>
  <div class="relative">
    <button
      ref="buttonEl"
      type="button"
      class="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
      :aria-expanded="open"
      :aria-label="user ? user.name : t('account.login')"
      @click="toggle"
    >
      <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" class="h-6 w-6 rounded-full object-cover" />
      <span v-else class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
        {{ initial }}
      </span>
      <span class="hidden sm:inline">{{ user ? user.login : t('account.login') }}</span>
    </button>

    <Teleport to="body">
    <div
      v-if="open"
      class="fixed z-50 max-h-[min(32rem,70vh)] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl"
      :style="panelStyle"
    >
      <div class="mb-2 flex items-center justify-between">
        <p class="font-bold text-slate-900">{{ user ? user.name : t('account.login') }}</p>
        <button type="button" class="text-slate-400 hover:text-slate-700" :aria-label="t('account.close')" @click="open = false">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </div>

      <p v-if="user?.role === 'admin'" class="mb-2 inline-flex rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
        {{ t('account.admin') }}
      </p>
      <p v-if="notice" class="mb-2 text-[11px] text-emerald-800">{{ notice }}</p>
      <p v-if="error" class="mb-2 text-[11px] text-red-800">{{ error }}</p>

      <template v-if="!user">
        <button
          type="button"
          class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          @click="github"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.7.11 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
          </svg>
          {{ t('account.github') }}
        </button>
        <div class="mb-2 flex gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            type="button"
            class="flex-1 rounded-md px-2 py-1 font-semibold"
            :class="mode === 'login' ? 'bg-white text-slate-900' : 'text-slate-600'"
            @click="chooseMode('login')"
          >
            {{ t('account.login') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-md px-2 py-1 font-semibold"
            :class="mode === 'register' ? 'bg-white text-slate-900' : 'text-slate-600'"
            @click="chooseMode('register')"
          >
            {{ t('account.register') }}
          </button>
        </div>
        <form v-if="mode === 'login'" class="space-y-1.5" @submit.prevent="passwordLogin">
          <label class="block font-semibold text-slate-600" for="account-login">{{ t('account.loginName') }}</label>
          <input id="account-login" v-model="login" autocomplete="username" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="account-password">{{ t('account.password') }}</label>
          <input id="account-password" v-model="password" type="password" autocomplete="current-password" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <button type="submit" class="w-full rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50">
            {{ t('account.passwordLogin') }}
          </button>
        </form>
        <form v-else class="space-y-1.5" @submit.prevent="onRegister">
          <label class="block font-semibold text-slate-600" for="account-register-name">{{ t('account.displayName') }}</label>
          <input id="account-register-name" v-model="displayName" autocomplete="name" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="account-register-login">{{ t('account.loginName') }}</label>
          <input id="account-register-login" v-model="login" autocomplete="username" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="account-register-password">{{ t('account.password') }}</label>
          <input id="account-register-password" v-model="password" type="password" autocomplete="new-password" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <button id="account-register-submit" type="submit" class="w-full rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800">
            {{ t('account.register') }}
          </button>
        </form>
      </template>

      <template v-else>
        <label class="mb-2 flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
          <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" class="h-10 w-10 rounded-full object-cover" />
          <span v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{{ initial }}</span>
          <span>{{ t('account.avatar') }}</span>
          <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" @change="onAvatar" />
        </label>
        <form class="space-y-1.5" @submit.prevent="onPassword">
          <label v-if="user.hasPassword" class="block font-semibold text-slate-600" for="account-current">{{ t('account.currentPassword') }}</label>
          <input v-if="user.hasPassword" id="account-current" v-model="current" type="password" autocomplete="current-password" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="account-new">{{ t('account.newPassword') }}</label>
          <input id="account-new" v-model="nextPassword" type="password" autocomplete="new-password" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <button type="submit" class="w-full rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50">
            {{ t('account.savePassword') }}
          </button>
        </form>
        <form
          v-if="user.role === 'admin'"
          class="mt-3 space-y-1.5 border-t border-slate-200 pt-3"
          @submit.prevent="addResource"
        >
          <p class="font-bold text-slate-900">{{ t('account.resources') }}</p>
          <label class="block font-semibold text-slate-600" for="resource-title">{{ t('account.resourceTitle') }}</label>
          <input id="resource-title" v-model="resourceTitle" :maxlength="RESOURCE_TITLE_LIMIT" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="resource-body">{{ t('account.resourceBody') }}</label>
          <textarea id="resource-body" v-model="resourceBody" :maxlength="RESOURCE_BODY_LIMIT" rows="3" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900"></textarea>
          <p class="text-right text-xs tabular-nums text-slate-500">{{ resourceBody.length.toLocaleString() }} / {{ RESOURCE_BODY_LIMIT.toLocaleString() }}</p>
          <label class="block font-semibold text-slate-600" for="resource-keywords">{{ t('account.resourceKeywords') }}</label>
          <input id="resource-keywords" v-model="resourceKeywords" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <label class="block font-semibold text-slate-600" for="resource-link">{{ t('account.resourceLink') }}</label>
          <input id="resource-link" v-model="resourceLink" type="url" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <button type="submit" class="w-full rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50" :disabled="resourceBusy">
            {{ t('account.resourceAdd') }}
          </button>
          <ul v-if="resources.items.length" class="space-y-1 pt-1">
            <li v-for="item in resources.items" :key="item.id" class="flex items-center justify-between gap-2">
              <span class="truncate text-slate-800">{{ item.title }}</span>
              <button type="button" class="shrink-0 font-semibold text-slate-500 hover:text-slate-900" @click="removeResource(item.id)">
                {{ t('account.resourceRemove') }}
              </button>
            </li>
          </ul>
        </form>
        <form
          v-if="user.role === 'admin'"
          class="mt-3 space-y-1.5 border-t border-slate-200 pt-3"
          @submit.prevent="addSource"
        >
          <p class="font-bold text-slate-900">{{ t('account.references') }}</p>
          <label class="sr-only" for="reference-url">{{ t('account.references') }}</label>
          <input id="reference-url" v-model="referenceUrl" type="url" placeholder="https://" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900" />
          <button type="submit" class="w-full rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50" :disabled="referenceBusy">
            {{ t('account.referenceAdd') }}
          </button>
          <ul v-if="sources.items.length" class="space-y-1 pt-1">
            <li v-for="site in sources.items" :key="site" class="flex items-center justify-between gap-2">
              <a :href="site" target="_blank" rel="noopener noreferrer" class="truncate font-semibold text-slate-800 underline underline-offset-2">{{ site }}</a>
              <button type="button" class="shrink-0 font-semibold text-slate-500 hover:text-slate-900" @click="removeSource(site)">
                {{ t('account.resourceRemove') }}
              </button>
            </li>
          </ul>
        </form>
        <button type="button" class="mt-2 w-full rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50" @click="signOut">
          {{ t('account.logout') }}
        </button>
      </template>
    </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useLabels } from '../i18n';
import { useConfigStore } from '../store/useConfigStore';
import { RESOURCE_BODY_LIMIT, RESOURCE_TITLE_LIMIT, useResourceStore } from '../store/useResourceStore';
import { useSessionStore } from '../store/useSessionStore';
import { useSourceStore } from '../store/useSourceStore';
import {
  accountMe,
  beginGithubLogin,
  loginWithPassword,
  logoutAccount,
  registerAccount,
  saveAvatar,
  savePassword,
  takeSessionFromHash,
  type AccountUser
} from '../services/account';
import { keepHouseForLogin } from '../services/houseSave';

const { t } = useLabels();
const config = useConfigStore();
const session = useSessionStore();
const resources = useResourceStore();
const sources = useSourceStore();
const open = ref(false);
const buttonEl = ref<HTMLButtonElement | null>(null);
const panelStyle = ref({ top: '64px', left: '12px' });

function placePanel() {
  const rect = buttonEl.value?.getBoundingClientRect();
  if (!rect) return;
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.max(12, rect.right - 320)}px`
  };
}

function toggle() {
  open.value = !open.value;
  if (open.value) placePanel();
}

function openLogin() {
  open.value = true;
  placePanel();
}

defineExpose({ openLogin });
const user = ref<AccountUser | null>(null);
watch(user, (value) => session.setUser(value), { immediate: true });
const mode = ref<'login' | 'register'>('login');
const login = ref('');
const displayName = ref('');
const password = ref('');
const current = ref('');
const nextPassword = ref('');
const error = ref('');
const notice = ref('');
const resourceTitle = ref('');
const resourceBody = ref('');
const resourceKeywords = ref('');
const resourceLink = ref('');
const resourceBusy = ref(false);
const referenceUrl = ref('');
const referenceBusy = ref(false);

const initial = computed(() => (user.value?.login || 'B').slice(0, 1).toUpperCase());

const messages: Record<string, string> = {
  github: 'account.githubMissing',
  origin: 'account.origin',
  bad_login: 'account.badLogin',
  bad_name: 'account.badName',
  taken: 'account.taken',
  sign_in: 'account.signIn',
  short_password: 'account.tooShort',
  bad_current: 'account.badCurrent',
  bad_image: 'account.badImage',
  big_image: 'account.bigImage',
  storage: 'account.storage',
  denied: 'account.denied',
  bad_resource: 'account.badResource',
  bad_link: 'account.badLink',
  title_too_long: 'account.titleTooLong',
  answer_too_long: 'account.answerTooLong',
  state: 'account.denied',
  code: 'account.denied'
};

function showError(code: string) {
  notice.value = '';
  const key = messages[code];
  error.value = key ? t(key) : code;
}

onMounted(async () => {
  const landed = takeSessionFromHash();
  if (landed.error) {
    open.value = true;
    showError(landed.error);
  }
  if (!landed.token) return;
  try {
    user.value = await accountMe();
    if (landed.token && user.value) {
      open.value = true;
      await nextTick();
      const rect = buttonEl.value?.getBoundingClientRect();
      if (rect) panelStyle.value = { top: `${rect.bottom + 8}px`, left: `${Math.max(12, rect.right - 320)}px` };
    }
  } catch {
    user.value = null;
  }
});

async function github() {
  error.value = '';
  keepHouseForLogin(config.exportHouse(), config.canUndo || houseAlreadyKept());
  try {
    await beginGithubLogin();
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'github');
  }
}

function houseAlreadyKept() {
  return Boolean(localStorage.getItem('builder.house'));
}

function chooseMode(next: 'login' | 'register') {
  mode.value = next;
  error.value = '';
  notice.value = '';
}

async function onRegister() {
  error.value = '';
  notice.value = '';
  try {
    user.value = await registerAccount(login.value, password.value, displayName.value);
    password.value = '';
    displayName.value = '';
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_name');
  }
}

async function passwordLogin() {
  error.value = '';
  notice.value = '';
  try {
    user.value = await loginWithPassword(login.value, password.value);
    password.value = '';
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_login');
  }
}

async function onPassword() {
  error.value = '';
  notice.value = '';
  try {
    await savePassword(nextPassword.value, current.value);
    nextPassword.value = '';
    current.value = '';
    if (user.value) user.value = { ...user.value, hasPassword: true };
    notice.value = t('account.saved');
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'short_password');
  }
}

async function onAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  error.value = '';
  notice.value = '';
  try {
    user.value = await saveAvatar(file);
    notice.value = t('account.saved');
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_image');
  }
}

async function addResource() {
  error.value = '';
  notice.value = '';
  resourceBusy.value = true;
  try {
    await resources.add({
      title: resourceTitle.value,
      body: resourceBody.value,
      keywords: resourceKeywords.value,
      linkHref: resourceLink.value
    });
    resourceTitle.value = '';
    resourceBody.value = '';
    resourceKeywords.value = '';
    resourceLink.value = '';
    notice.value = t('account.resourceSaved');
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_resource');
  } finally {
    resourceBusy.value = false;
  }
}

async function removeResource(id: string) {
  error.value = '';
  try {
    await resources.remove(id);
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_resource');
  }
}

async function addSource() {
  error.value = '';
  notice.value = '';
  referenceBusy.value = true;
  try {
    await sources.add(referenceUrl.value);
    referenceUrl.value = '';
    notice.value = t('account.referenceSaved');
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_link');
  } finally {
    referenceBusy.value = false;
  }
}

async function removeSource(url: string) {
  error.value = '';
  try {
    await sources.remove(url);
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_link');
  }
}

async function signOut() {
  await logoutAccount();
  user.value = null;
  notice.value = '';
  error.value = '';
}
</script>
