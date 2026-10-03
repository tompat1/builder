<template>
  <div class="mt-4 pt-3.5 border-t border-slate-200/80">
    <div class="flex items-center justify-between mb-1.5">
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
        <label for="ai-prompt-input" class="text-xs font-bold text-slate-800 tracking-tight">{{ t('ai.title') }}</label>
      </div>
      <span v-if="feedbackMsg" class="text-[11px] text-emerald-600 font-semibold animate-fade-in">
        {{ feedbackMsg }}
      </span>
    </div>

    <!-- Quick suggestion pills -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-none">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.label"
        type="button"
        @click="applySuggestion(suggestion)"
        class="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 whitespace-nowrap transition-colors border border-slate-200/50"
      >
        {{ suggestion.label }}
      </button>
    </div>

    <!-- Natural Language Command Box -->
    <form @submit.prevent="handleCustomPrompt" class="flex gap-1.5">
      <input
        id="ai-prompt-input"
        v-model="customPrompt"
        type="text"
        :placeholder="t('ai.placeholder')"
        class="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
      />
      <button
        type="submit"
        id="btn-ai-generate"
        class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1"
      >
        <span>{{ t('ai.generate') }}</span>
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';

const store = useConfigStore();
const { t } = useLabels();
const customPrompt = ref('');
const feedbackMsg = ref('');

interface Suggestion {
  label: string;
  action: () => void;
}

const suggestions = computed<Suggestion[]>(() => [
  {
    label: t('ai.gableLoft'),
    action: () => {
      store.selectRoof('sadeltak');
      store.selectLoft('sleeping');
      showFeedback(t('ai.gableLoftDone'));
    }
  },
  {
    label: t('ai.doubleDoor'),
    action: () => {
      store.selectDoor('SVANSHALL');
      store.selectCategory('doors');
      showFeedback(t('ai.doubleDoorDone'));
    }
  },
  {
    label: t('ai.max30'),
    action: () => {
      store.selectSize('size-30');
      store.selectCategory('size');
      showFeedback(t('ai.max30Done'));
    }
  }
]);

function showFeedback(text: string) {
  feedbackMsg.value = text;
  setTimeout(() => {
    feedbackMsg.value = '';
  }, 2800);
}

function applySuggestion(s: Suggestion) {
  s.action();
}

function handleCustomPrompt() {
  const query = customPrompt.value.toLowerCase();
  if (!query) return;

  if (query.includes('sadel') || query.includes('sadeltak') || query.includes('gable')) {
    store.selectRoof('sadeltak');
  } else if (query.includes('pulpet') || query.includes('pulpettak') || query.includes('mono')) {
    store.selectRoof('pulpettak');
  } else if (query.includes('flackt') || query.includes('funkis') || query.includes('low roof')) {
    store.selectRoof('flackt');
  }

  if (query.includes('loft') || query.includes('sovloft')) {
    store.selectLoft('sleeping');
  }

  if (query.includes('dubbeldörr') || query.includes('svanshall') || query.includes('par') || query.includes('double')) {
    store.selectDoor('SVANSHALL');
  }

  if (query.includes('30') || query.includes('max')) {
    store.selectSize('size-30');
  } else if (query.includes('25')) {
    store.selectSize('size-25');
  } else if (query.includes('15')) {
    store.selectSize('size-15');
  }

  showFeedback(t('ai.applied'));
  customPrompt.value = '';
}
</script>
