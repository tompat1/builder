import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import { useContentStore } from './store/useContentStore';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
useContentStore().load();
applyLocale(readStoredLocale());
app.mount('#app');
