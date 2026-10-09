<template>
  <button
    v-if="isAdmin"
    type="button"
    id="btn-admin-ai"
    class="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
    :aria-expanded="open"
    aria-controls="admin-ai-panel"
    :aria-label="t('aiAdmin.title')"
    @click="open = true"
  >
    <svg class="h-3.5 w-3.5 text-[#FF5A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
    <span>{{ t('aiAdmin.open') }}</span>
  </button>

  <Teleport to="body">
    <Transition name="ai-admin">
      <div v-if="open" class="fixed inset-0 z-[60]">
        <button type="button" class="absolute inset-0 bg-[#222925]/40" :aria-label="t('aiAdmin.close')" @click="close" />
        <aside
          id="admin-ai-panel"
          class="ai-admin-sheet absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white text-slate-900 shadow-[-20px_0_48px_-28px_rgba(34,41,37,0.55)]"
          role="dialog"
          aria-modal="true"
          :aria-label="t('aiAdmin.title')"
        >
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-xl font-extrabold tracking-[-0.03em] text-[#0E3524]">{{ t('aiAdmin.title') }}</h2>
              <p class="mt-1 max-w-[36ch] text-sm leading-relaxed text-slate-600">{{ t('aiAdmin.body') }}</p>
            </div>
            <button
              ref="closeButton"
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
              :aria-label="t('aiAdmin.close')"
              @click="close"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div class="ai-admin-scroll flex-1 overflow-y-auto px-5 py-5">
            <p v-if="notice" class="mb-3 text-sm text-emerald-800" role="status">{{ notice }}</p>
            <p v-if="error" class="mb-3 text-sm text-red-800" role="alert">{{ error }}</p>

            <form class="space-y-2" @submit.prevent="addResource">
              <h3 class="text-sm font-bold text-slate-900">{{ t('account.resources') }}</h3>
              <label class="block text-xs font-semibold text-slate-600" for="admin-resource-title">{{ t('account.resourceTitle') }}</label>
              <input id="admin-resource-title" v-model="resourceTitle" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" />
              <label class="block text-xs font-semibold text-slate-600" for="admin-resource-body">{{ t('account.resourceBody') }}</label>
              <textarea id="admin-resource-body" v-model="resourceBody" rows="4" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"></textarea>
              <label class="block text-xs font-semibold text-slate-600" for="admin-resource-keywords">{{ t('account.resourceKeywords') }}</label>
              <input id="admin-resource-keywords" v-model="resourceKeywords" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" />
              <label class="block text-xs font-semibold text-slate-600" for="admin-resource-link">{{ t('account.resourceLink') }}</label>
              <input id="admin-resource-link" v-model="resourceLink" type="url" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" />
              <button type="submit" class="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00] disabled:opacity-50" :disabled="resourceBusy">
                {{ t('account.resourceAdd') }}
              </button>
              <ul v-if="resources.items.length" class="space-y-1 border-t border-slate-200 pt-3">
                <li v-for="item in resources.items" :key="item.id" class="flex items-center justify-between gap-3 text-sm">
                  <span class="truncate text-slate-800">{{ item.title }}</span>
                  <button type="button" class="shrink-0 font-semibold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" @click="removeResource(item.id)">
                    {{ t('account.resourceRemove') }}
                  </button>
                </li>
              </ul>
            </form>

            <form class="mt-8 space-y-2" @submit.prevent="addSource">
              <h3 class="text-sm font-bold text-slate-900">{{ t('account.references') }}</h3>
              <label class="sr-only" for="admin-reference-url">{{ t('account.references') }}</label>
              <input id="admin-reference-url" v-model="referenceUrl" type="url" placeholder="https://" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" />
              <button type="submit" class="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00] disabled:opacity-50" :disabled="referenceBusy">
                {{ t('account.referenceAdd') }}
              </button>
              <ul v-if="sources.items.length" class="space-y-1 border-t border-slate-200 pt-3">
                <li v-for="site in sources.items" :key="site" class="flex items-center justify-between gap-3 text-sm">
                  <a :href="site" target="_blank" rel="noopener noreferrer" class="truncate font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-slate-950">{{ site }}</a>
                  <button type="button" class="shrink-0 font-semibold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]" @click="removeSource(site)">
                    {{ t('account.resourceRemove') }}
                  </button>
                </li>
              </ul>
            </form>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useResourceStore } from '../store/useResourceStore';
import { useSourceStore } from '../store/useSourceStore';
import { useLabels } from '../i18n';

const session = useSessionStore();
const resources = useResourceStore();
const sources = useSourceStore();
const { t } = useLabels();

const isAdmin = computed(() => session.user?.role === 'admin');
const open = ref(false);
const closeButton = ref<HTMLButtonElement | null>(null);
const opener = ref<HTMLElement | null>(null);

const resourceTitle = ref('');
const resourceBody = ref('');
const resourceKeywords = ref('');
const resourceLink = ref('');
const resourceBusy = ref(false);
const referenceUrl = ref('');
const referenceBusy = ref(false);
const notice = ref('');
const error = ref('');

const messages: Record<string, string> = {
  bad_resource: 'account.badResource',
  bad_link: 'account.badLink'
};

function showError(code: string) {
  notice.value = '';
  const key = messages[code];
  error.value = key ? t(key) : code;
}

function close() {
  open.value = false;
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

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}

watch(open, async (shown) => {
  document.body.classList.toggle('overflow-hidden', shown);
  if (!shown) {
    window.removeEventListener('keydown', onKey);
    opener.value?.focus();
    return;
  }
  opener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  window.addEventListener('keydown', onKey);
  await nextTick();
  closeButton.value?.focus();
});

watch(isAdmin, (admin) => {
  if (!admin) close();
});

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden');
  window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
.ai-admin-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.ai-admin-enter-active,
.ai-admin-leave-active {
  transition: opacity 200ms ease;
}

.ai-admin-enter-active .ai-admin-sheet,
.ai-admin-leave-active .ai-admin-sheet {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ai-admin-enter-from,
.ai-admin-leave-to {
  opacity: 0;
}

.ai-admin-enter-from .ai-admin-sheet,
.ai-admin-leave-to .ai-admin-sheet {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .ai-admin-enter-active,
  .ai-admin-leave-active,
  .ai-admin-enter-active .ai-admin-sheet,
  .ai-admin-leave-active .ai-admin-sheet {
    transition: none;
  }
}
</style>
