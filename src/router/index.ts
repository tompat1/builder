import { createRouter, createWebHistory } from 'vue-router';
import { acceptGithubReturn } from '../services/account';
import HomesView from '../views/HomesView.vue';
import LandingView from '../views/LandingView.vue';
import MerchView from '../views/MerchView.vue';
import LoginView from '../views/LoginView.vue';
import BuilderView from '../views/BuilderView.vue';
import MoodView from '../views/MoodView.vue';

acceptGithubReturn();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: LandingView },
    { path: '/homes', name: 'homes', component: HomesView },
    { path: '/merch', name: 'merch', component: MerchView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/build', name: 'build', component: BuilderView },
    { path: '/mood', name: 'mood', component: MoodView }
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  }
});

export default router;
