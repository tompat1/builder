<template>
  <router-link :to="to" class="inline-flex items-center gap-2.5 text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">
    <BrandMark class="h-8 w-auto shrink-0" :class="markClass" />
    <span class="font-display text-[1.65rem] font-extrabold leading-none tracking-[-0.03em]"><Cms k="brand.name" fallback="Builder" /></span>
  </router-link>
</template>

<script setup lang="ts">
import BrandMark from './BrandMark.vue';
import Cms from '../Cms.vue';

withDefaults(defineProps<{ to?: string; markClass?: string }>(), { to: '/', markClass: '' });
</script>
