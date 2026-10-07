import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import { accountMe, sessionToken } from './services/account';
import { useContentStore } from './store/useContentStore';
import { useResourceStore } from './store/useResourceStore';
import { useSourceStore } from './store/useSourceStore';
import { useSessionStore } from './store/useSessionStore';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
useContentStore().load();
useResourceStore().load();
useSourceStore().load();
applyLocale(readStoredLocale());
if (sessionToken()) {
  void accountMe().then((user) => {
    if (user) useSessionStore().setUser(user);
  });
}
app.mount('#app');
