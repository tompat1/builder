<template>
  <SiteFrame>
    <div class="grid md:min-h-[calc(100svh-8.5rem)] md:grid-cols-2">
      <div class="relative min-h-72 md:min-h-full">
        <CmsImage k="login.heroImage" class="absolute inset-0 h-full w-full block">
          <img src="/brand/login.webp" :alt="t('site.heroAlt')" class="h-full w-full object-cover object-center" />
        </CmsImage>
      </div>
      <div class="flex items-center px-4 py-12 md:px-12 lg:px-16">
        <form class="w-full max-w-md" @submit.prevent="submit">
          <h1 class="font-display text-5xl font-extrabold tracking-[-0.04em] text-pine"><Cms k="site.welcome" /></h1>
          <p class="mt-3 text-pine/75"><Cms :k="mode === 'login' ? 'site.loginLead' : 'site.create'" /></p>
          <p v-if="error" class="mt-4 rounded-xl bg-clay/15 px-3 py-2 text-sm text-graphite" role="status">{{ error }}</p>

          <label class="mt-8 block text-sm font-semibold text-pine" for="site-login"><Cms k="account.loginName" /></label>
          <div class="relative mt-1.5">
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pine/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" />
            </svg>
            <input id="site-login" v-model="login" autocomplete="username" class="w-full rounded-xl border border-pine/15 bg-white py-3 pl-11 pr-3 text-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" />
          </div>

          <label v-if="mode === 'register'" class="mt-4 block text-sm font-semibold text-pine" for="site-name"><Cms k="account.displayName" /></label>
          <input v-if="mode === 'register'" id="site-name" v-model="displayName" autocomplete="name" class="mt-1.5 w-full rounded-xl border border-pine/15 bg-white px-3 py-3 text-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" />

          <label class="mt-4 block text-sm font-semibold text-pine" for="site-password"><Cms k="site.password" /></label>
          <div class="relative mt-1.5">
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pine/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V8a4 4 0 0 1 8 0v2" />
            </svg>
            <input
              id="site-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              class="w-full rounded-xl border border-pine/15 bg-white py-3 pl-11 pr-12 text-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-pine/70 hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? t('site.hidePassword') : t('site.showPassword')"
              @click="showPassword = !showPassword"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                <circle cx="12" cy="12" r="2.4" />
                <path v-if="showPassword" d="M4 20 20 4" />
              </svg>
            </button>
          </div>

          <ActionControl type="submit" prominent class="mt-6 w-full" :disabled="busy">
            <Cms :k="mode === 'login' ? 'site.login' : 'site.create'" />
          </ActionControl>
          <p class="mt-5 text-center text-sm text-pine/80">
            <button type="button" class="font-semibold text-pine underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" @click="toggleMode">
              <Cms :k="mode === 'login' ? 'site.newHere' : 'site.login'" />
            </button>
          </p>
          <p class="my-4 text-center text-xs uppercase tracking-[0.14em] text-pine/50"><Cms k="site.or" /></p>
          <ActionControl type="button" appearance="outline" direction="external" class="w-full" @click="github">
            <Cms k="site.github" />
          </ActionControl>
        </form>
      </div>
    </div>
  </SiteFrame>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ActionControl from '../components/site/ActionControl.vue';
import SiteFrame from '../components/site/SiteFrame.vue';
import Cms from '../components/Cms.vue';
import CmsImage from '../components/CmsImage.vue';
import { useLabels } from '../i18n';
import { beginGithubLogin, loginWithPassword, registerAccount } from '../services/account';
import { useSessionStore } from '../store/useSessionStore';

const { t } = useLabels();
const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const mode = ref<'login' | 'register'>('login');
const login = ref('');
const password = ref('');
const displayName = ref('');
const error = ref('');
const busy = ref(false);
const showPassword = ref(false);

const messages: Record<string, string> = {
  github: 'account.githubMissing',
  origin: 'account.origin',
  bad_login: 'account.badLogin',
  bad_name: 'account.badName',
  taken: 'account.taken',
  sign_in: 'account.signIn',
  short_password: 'account.tooShort'
};

function showError(code: string) {
  error.value = t(messages[code] ?? 'account.denied');
}

const authError = route.query.auth_error;
if (typeof authError === 'string' && authError) {
  showError(authError);
  void router.replace({ path: '/login', query: {} });
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  error.value = '';
}

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const user = mode.value === 'login'
      ? await loginWithPassword(login.value, password.value)
      : await registerAccount(login.value, password.value, displayName.value || login.value);
    session.finishAuthentication(user);
    await session.refreshSavedHouseStatus();
    const redirect = typeof route.query.redirect === 'string' && /^\/(?!\/)/.test(route.query.redirect)
      ? route.query.redirect
      : '/build';
    await router.push(redirect);
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'bad_login');
  } finally {
    busy.value = false;
  }
}

async function github() {
  error.value = '';
  try {
    await beginGithubLogin();
  } catch (caught) {
    showError(caught instanceof Error ? caught.message : 'github');
  }
}
</script>
