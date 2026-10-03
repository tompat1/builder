import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { applyLocale, i18n, readStoredLocale } from './i18n';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
applyLocale(readStoredLocale());
app.mount('#app');
