<template>
  <ActionControl
    v-bind="$attrs"
    :prominent="prominent"
    :direction="direction"
    :appearance="appearance"
    :tone="tone"
    :disabled="disabled || busy"
    @click="enterBuilder"
  >
    <Cms :k="labelKey" />
  </ActionControl>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../../store/useSessionStore';
import Cms from '../Cms.vue';
import ActionControl from './ActionControl.vue';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  prominent?: boolean;
  direction?: 'forward' | 'external' | 'down' | 'expand' | 'back';
  appearance?: 'solid' | 'outline' | 'text';
  tone?: 'orange' | 'graphite';
  disabled?: boolean;
}>(), {
  prominent: false,
  direction: 'forward',
  appearance: 'solid',
  tone: 'orange',
  disabled: false
});

const emit = defineEmits<{
  (event: 'click'): void;
}>();

const router = useRouter();
const session = useSessionStore();
const busy = ref(false);
const labelKey = computed(() => session.hasSavedHouse ? 'site.continueBuilding' : 'site.start');

async function enterBuilder() {
  if (busy.value) return;
  emit('click');
  busy.value = true;
  try {
    await session.ensureAccountState(true);
    if (session.user) {
      await router.push('/build');
      return;
    }
    await router.push({ path: '/login', query: { redirect: '/build' } });
  } finally {
    busy.value = false;
  }
}
</script>
