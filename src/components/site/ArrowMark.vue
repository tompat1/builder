<template>
  <span class="builder-arrow inline-flex" :data-dir="direction" aria-hidden="true">
    <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="direction === 'back'">
        <path d="M13.5 8H3M7 3.5 2.5 8 7 12.5" />
      </template>
      <template v-else-if="direction === 'external'">
        <path d="M4.5 11.5 12 4M7 4h5v5" />
      </template>
      <template v-else-if="direction === 'down'">
        <path d="M8 2.5v8.5M4 7.5 8 11.5 12 7.5M3.5 13.5h9" />
      </template>
      <template v-else-if="direction === 'expand'">
        <path d="M3.5 6 8 10.5 12.5 6" />
      </template>
      <template v-else>
        <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  direction?: 'forward' | 'external' | 'down' | 'expand' | 'back';
}>(), {
  direction: 'forward'
});
</script>

<style>
.builder-arrow {
  transition: transform 200ms ease-out;
}

.group:hover .builder-arrow[data-dir='forward'],
.group:focus-visible .builder-arrow[data-dir='forward'] {
  transform: translateX(3px);
}

.group:hover .builder-arrow[data-dir='back'],
.group:focus-visible .builder-arrow[data-dir='back'] {
  transform: translateX(-3px);
}

.group:hover .builder-arrow[data-dir='down'],
.group:focus-visible .builder-arrow[data-dir='down'],
.group:hover .builder-arrow[data-dir='expand'],
.group:focus-visible .builder-arrow[data-dir='expand'] {
  transform: translateY(3px);
}

.group:hover .builder-arrow[data-dir='external'],
.group:focus-visible .builder-arrow[data-dir='external'] {
  transform: translate(3px, -3px);
}

@media (prefers-reduced-motion: reduce) {
  .builder-arrow {
    transition: none;
  }

  .group:hover .builder-arrow,
  .group:focus-visible .builder-arrow {
    transform: none;
  }
}
</style>
