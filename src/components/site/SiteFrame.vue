<template>
  <div class="flex min-h-svh flex-col bg-ivory font-sans text-graphite">
    <SiteHeader />
    <div class="flex flex-1 flex-col">
      <slot />
    </div>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import SiteFooter from './SiteFooter.vue';
import SiteHeader from './SiteHeader.vue';
</script>
