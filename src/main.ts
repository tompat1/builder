import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import { useContentStore } from './store/useContentStore';
import { useResourceStore } from './store/useResourceStore';
import { useSourceStore } from './store/useSourceStore';
import { useSessionStore } from './store/useSessionStore';
import { startFeedback } from './services/feedback';
import './style.css';

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    if (urlStr.includes('/api/')) {
      let label = 'Synkroniserar...';
      if (urlStr.includes('/api/houses')) label = 'Sparar hus...';
      else if (urlStr.includes('/api/mood')) label = 'Synkroniserar moodboard...';
      else if (urlStr.includes('/api/render')) label = 'Skapar 3D-ritning...';
      else if (urlStr.includes('/api/ask')) label = 'Söker svar...';
      else if (urlStr.includes('/api/sources')) label = 'Hämtar källor...';
      else if (urlStr.includes('/api/content')) label = 'Hämtar innehåll...';
      else if (urlStr.includes('/api/account')) label = 'Kontrollerar konto...';

      const finish = startFeedback(label);
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
