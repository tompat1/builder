<template>
  <component :is="tag" v-bind="bindings" :class="rootClass">
    <template v-if="prominent">
      <span class="flex min-w-0 flex-1 items-center px-4 py-3 text-left">
        <slot />
      </span>
      <span
        class="grid w-11 shrink-0 place-items-center self-stretch"
        :class="tone === 'graphite' ? 'bg-[#FF5A00] text-graphite' : 'border-l border-graphite/25'"
      >
        <ArrowMark :direction="direction" />
      </span>
    </template>
    <template v-else>
      <ArrowMark v-if="direction === 'back'" :direction="direction" />
      <span :class="appearance === 'text' ? 'underline decoration-current/40 underline-offset-[3px] group-hover:decoration-current' : ''">
        <slot />
      </span>
      <ArrowMark v-if="direction !== 'back'" :direction="direction" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import ArrowMark from './ArrowMark.vue';

const props = withDefaults(defineProps<{
  to?: string;
  href?: string;
  type?: 'button' | 'submit';
  prominent?: boolean;
  direction?: 'forward' | 'external' | 'down' | 'expand' | 'back';
  appearance?: 'solid' | 'outline' | 'text';
  tone?: 'orange' | 'graphite';
  disabled?: boolean;
}>(), {
  type: 'button',
  direction: 'forward',
  appearance: 'solid',
  tone: 'orange',
  disabled: false
});

const tag = computed(() => {
  if (props.to) return RouterLink;
  if (props.href) return 'a';
  return 'button';
});

const blank = computed(() => props.direction === 'external' && Boolean(props.href));

const bindings = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) {
    return {
      href: props.href,
      target: blank.value ? '_blank' : undefined,
      rel: blank.value ? 'noopener noreferrer' : undefined
    };
  }
  return { type: props.type, disabled: props.disabled };
});

const rootClass = computed(() => {
  const focus = 'group inline-flex items-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:opacity-60';
  if (props.appearance === 'text') return `${focus} gap-2`;
  if (props.prominent && props.tone === 'graphite') return `${focus} overflow-hidden rounded-[6px] bg-graphite text-ivory`;
  if (props.prominent) return `${focus} overflow-hidden rounded-[6px] bg-[#FF5A00] text-graphite`;
  if (props.appearance === 'outline') return `${focus} justify-center gap-2 rounded-[6px] border border-graphite bg-white px-4 py-3 text-graphite`;
  return `${focus} gap-2 rounded-[6px] bg-[#FF5A00] px-4 py-3 text-graphite`;
});
</script>
