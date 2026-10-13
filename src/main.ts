import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import { useContentStore } from './store/useContentStore';
import { useResourceStore } from './store/useResourceStore';
import { useSourceStore } from './store/useSourceStore';
import { useSessionStore } from './store/useSessionStore';
import { apiFeedbackKey, startFeedback } from './services/feedback';
import './style.css';

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    if (urlStr.includes('/api/')) {
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const finish = startFeedback(String(i18n.global.t(apiFeedbackKey(urlStr, method))), { spinner: false });
      try {
        return await originalFetch.apply(this, [input, init]);
      } finally {
        finish();
      }
    }
    return originalFetch.apply(this, [input, init]);
  };
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
useContentStore().load();
useResourceStore().load();
useSourceStore().load();
applyLocale(readStoredLocale());
void useSessionStore().ensureAccountState();
app.mount('#app');
