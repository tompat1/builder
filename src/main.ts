import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import { useContentStore } from './store/useContentStore';
import { useResourceStore } from './store/useResourceStore';
import { useSourceStore } from './store/useSourceStore';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
useContentStore().load();
useResourceStore().load();
useSourceStore().load();
applyLocale(readStoredLocale());
app.mount('#app');
