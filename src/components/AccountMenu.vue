<template>
  <div class="relative">
    <button
      ref="buttonEl"
      type="button"
      id="btn-account"
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

      <div class="mb-3 flex gap-1 rounded-lg bg-slate-100 p-0.5" role="tablist" :aria-label="t('account.settings')">
        <button
          id="account-tab-account"
          type="button"
          role="tab"
          class="flex-1 rounded-md px-2 py-1 font-semibold"
          :class="panel === 'account' ? 'bg-white text-slate-900' : 'text-slate-600'"
          :aria-selected="panel === 'account'"
          @click="panel = 'account'"
        >
          {{ user ? t('account.accountTab') : t('account.login') }}
        </button>
        <button
          id="account-tab-settings"
          type="button"
          role="tab"
          class="flex-1 rounded-md px-2 py-1 font-semibold"
          :class="panel === 'settings' ? 'bg-white text-slate-900' : 'text-slate-600'"
          :aria-selected="panel === 'settings'"
          @click="panel = 'settings'"
        >
          {{ t('account.settings') }}
        </button>
      </div>

      <div v-if="panel === 'settings'" class="space-y-2">
        <p class="text-[11px] leading-relaxed text-slate-500">{{ t('account.settingsBody') }}</p>
        <div
          v-for="item in displayItems"
          :key="item.key"
          class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-2.5 py-2"
        >
          <span class="min-w-0">
            <span class="block font-semibold text-slate-900">{{ t(item.label) }}</span>
            <span class="block text-[11px] leading-snug text-slate-500">{{ t(item.hint) }}</span>
          </span>
          <button
            type="button"
            role="switch"
            :id="`display-${item.key}`"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            :class="displayOn(item.key) ? 'bg-slate-900' : 'bg-slate-300'"
            :aria-checked="displayOn(item.key)"
            :aria-label="t(item.label)"
            @click="config.setDisplay(item.key, !displayOn(item.key))"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
              :class="displayOn(item.key) ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <p v-if="panel === 'account' && user?.role === 'admin'" class="mb-2 inline-flex rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
        {{ t('account.admin') }}
      </p>
      <p v-if="panel === 'account' && notice" class="mb-2 text-[11px] text-emerald-800">{{ notice }}</p>
      <p v-if="panel === 'account' && error" class="mb-2 text-[11px] text-red-800">{{ error }}</p>

      <template v-if="panel === 'account' && !user">
        <GithubSignIn id="btn-github-account" compact class="mb-3" @click="github">
          {{ t('account.github') }}
        </GithubSignIn>
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

      <template v-else-if="panel === 'account' && user">
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
import GithubSignIn from './account/GithubSignIn.vue';
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
const panel = ref<'account' | 'settings'>('account');
const displayItems = [
  { key: 'dimensions', label: 'account.showMeasurements', hint: 'account.showMeasurementsHint' },
  { key: 'notes', label: 'account.showNotes', hint: 'account.showNotesHint' },
  { key: 'sun', label: 'account.showSun', hint: 'account.showSunHint' },
  { key: 'mood', label: 'account.showMood', hint: 'account.showMoodHint' }
] as const;

function displayOn(key: (typeof displayItems)[number]['key']) {
  if (key === 'dimensions') return config.showDimensions;
  if (key === 'notes') return config.showNotes;
  if (key === 'sun') return config.showSun;
  return config.showMood;
}
const buttonEl = ref<HTMLButtonElement | null>(null);
const panelStyle = ref({ top: '64px', left: '12px' });

function placePanel(anchor?: HTMLElement | null) {
  const rect = (anchor ?? buttonEl.value)?.getBoundingClientRect();
  if (!rect || rect.width === 0) return;
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${Math.max(12, Math.min(rect.right, window.innerWidth - 12) - 320)}px`
  };
}

function toggle() {
  open.value = !open.value;
  if (open.value) placePanel();
}

function openAt(anchor?: HTMLElement | null) {
  panel.value = 'account';
  open.value = true;
  nextTick(() => placePanel(anchor));
}

function openLogin() {
  panel.value = 'account';
  open.value = true;
  nextTick(() => placePanel());
}

defineExpose({ openLogin, openAt });
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
