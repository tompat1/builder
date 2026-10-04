<template>
  <span class="cms-img" :class="{ 'cms-on': editing }">
    <span class="cms-img-frame">
      <slot />
      <img v-if="url" :src="url" alt="" class="cms-img-photo" />
    </span>
    <label v-if="editing" class="cms-pen" @click.stop @mousedown.stop>
      <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" @change="pick" />
    </label>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { i18n } from '../i18n';
import { useContentStore } from '../store/useContentStore';
import { useSessionStore } from '../store/useSessionStore';

const props = defineProps<{ k: string }>();
const content = useContentStore();
const session = useSessionStore();
const editing = computed(() => content.editing && session.user?.role === 'admin');
const storageKey = computed(() => `${i18n.global.locale.value}:${props.k}`);
const url = computed(() => content.image(storageKey.value));

function pick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 400_000) return;
  const reader = new FileReader();
  reader.onload = () => {
    const value = typeof reader.result === 'string' ? reader.result : '';
    if (value) content.stage(storageKey.value, { kind: 'image', value });
  };
  reader.readAsDataURL(file);
}
</script>
