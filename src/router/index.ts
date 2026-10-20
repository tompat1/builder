import { createRouter, createWebHistory } from 'vue-router';
import { acceptGithubReturn } from '../services/account';
import { acceptTrelloReturn } from '../services/trello';
import HomesView from '../views/HomesView.vue';
import LandingView from '../views/LandingView.vue';
import MerchView from '../views/MerchView.vue';
import LoginView from '../views/LoginView.vue';
import BuilderView from '../views/BuilderView.vue';
import MoodView from '../views/MoodView.vue';
import ExpensesView from '../views/ExpensesView.vue';

import { i18n } from '../i18n';
import { startFeedback } from '../services/feedback';

acceptGithubReturn();
acceptTrelloReturn();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: LandingView },
    { path: '/homes', name: 'homes', component: HomesView },
    { path: '/merch', name: 'merch', component: MerchView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/build', name: 'build', component: BuilderView },
    { path: '/mood', name: 'mood', component: MoodView },
    { path: '/expenses', name: 'expenses', component: ExpensesView }
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  }
});

let navFinish: (() => void) | null = null;

router.beforeEach((to) => {
  if (navFinish) navFinish();
  navFinish = startFeedback(String(i18n.global.t('feedback.view')));

  if (to.path === '/build') {
    const isInvited = typeof localStorage !== 'undefined'
      && Boolean(localStorage.getItem('builder.mood.participant') || localStorage.getItem('mood_participant'))
      && !localStorage.getItem('account_token');
    if (isInvited) {
      return { path: '/mood' };
    }
  }
});

router.afterEach(() => {
  if (navFinish) {
    navFinish();
    navFinish = null;
  }
});

export default router;
