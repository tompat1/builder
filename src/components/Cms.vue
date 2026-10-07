<template>
  <span class="cms-wrap" :class="{ 'cms-on': editing }" @click="guard" @mousedown="guard">
    <span
      ref="field"
      class="cms-field"
      :class="{ 'cms-block': block }"
      :contenteditable="editing ? 'plaintext-only' : 'false'"
      spellcheck="false"
      @blur="commit"
      @keydown.enter.exact="onEnter"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { i18n } from '../i18n';
import { useContentStore } from '../store/useContentStore';
import { useSessionStore } from '../store/useSessionStore';

const props = defineProps<{
  k: string;
  fallback?: string;
  block?: boolean;
}>();

const content = useContentStore();
const session = useSessionStore();
const field = ref<HTMLElement | null>(null);

const editing = computed(() => content.editing && session.user?.role === 'admin');

const storageKey = computed(() => `${i18n.global.locale.value}:${props.k}`);

const shown = computed(() => {
  const locale = i18n.global.locale.value;
  const base = i18n.global.te(props.k) ? String(i18n.global.t(props.k)) : (props.fallback ?? '');
  return content.text(`${locale}:${props.k}`, base);
});

function paint() {
  const el = field.value;
  if (!el || document.activeElement === el) return;
  if (el.textContent !== shown.value) el.textContent = shown.value;
}

onMounted(paint);
watch(shown, paint);

function guard(event: MouseEvent) {
  if (editing.value) {
    event.stopPropagation();
    if (event.type === 'click') {
      event.preventDefault();
    }
  }
}

function commit() {
  const value = field.value?.textContent ?? '';
  if (value !== shown.value) content.stage(storageKey.value, { kind: 'text', value });
}

function onEnter(event: KeyboardEvent) {
  if (props.block) return;
  event.preventDefault();
  (event.target as HTMLElement).blur();
}
</script>
