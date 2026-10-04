<template>
  <svg class="w-full h-16 text-slate-700" viewBox="0 0 160 64" fill="none" aria-hidden="true">
    <template v-if="figure === 'height'">
      <path d="M28 14 H132 V52 H28 Z" stroke="currentColor" stroke-width="1.4" />
      <path d="M28 14 H132" stroke="currentColor" stroke-width="2.4" />
      <text x="80" y="36" font-size="11" fill="currentColor" text-anchor="middle">5 000 mm</text>
    </template>

    <template v-else-if="figure === 'pitch'">
      <path d="M24 46 L136 22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path d="M28 22 V50 H128 V24" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" />
      <text x="80" y="60" font-size="11" fill="currentColor" text-anchor="middle">12°</text>
    </template>

    <template v-else-if="figure === 'belt'">
      <path d="M22 10 H138 V54 H22 Z" stroke="currentColor" stroke-width="1.2" />
      <rect x="26" y="26" width="108" height="8" fill="currentColor" />
      <text x="80" y="48" font-size="10" fill="currentColor" text-anchor="middle">2,70 m</text>
    </template>

    <template v-else-if="figure === 'cladding'">
      <path d="M36 12 V52 M48 12 V52 M60 12 V52 M72 12 V52" stroke="currentColor" stroke-width="1.6" />
      <path d="M96 18 H136 M96 28 H136 M96 38 H136 M96 48 H136" stroke="currentColor" stroke-width="1.6" />
    </template>

    <template v-else-if="figure === 'covering'">
      <path d="M24 18 H136 M32 28 H128 M24 38 H136 M32 48 H128" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </template>

    <template v-else-if="figure === 'layers'">
      <rect x="36" y="16" width="16" height="32" stroke="currentColor" stroke-width="1.4" />
      <rect x="58" y="16" width="10" height="32" stroke="currentColor" stroke-width="1.2" />
      <rect x="74" y="16" width="14" height="32" stroke="currentColor" stroke-width="1.4" />
      <text x="80" y="60" font-size="10" fill="currentColor" text-anchor="middle">25 mm</text>
    </template>

    <template v-else-if="figure === 'section'">
      <rect x="18" y="10" width="14" height="36" stroke="currentColor" stroke-width="1.2" />
      <rect x="34" y="10" width="5" height="36" stroke="currentColor" stroke-width="1.2" />
      <rect x="41" y="10" width="40" height="36" stroke="currentColor" stroke-width="1.2" />
      <path d="M49 10 V46 M61 10 V46 M73 10 V46" stroke="currentColor" stroke-width="0.8" />
      <rect x="83" y="10" width="5" height="36" stroke="currentColor" stroke-width="1.2" />
      <rect x="90" y="10" width="8" height="36" stroke="currentColor" stroke-width="1.2" />
      <rect x="100" y="10" width="16" height="36" stroke="currentColor" stroke-width="1.4" />
      <text x="25" y="58" font-size="8" fill="currentColor" text-anchor="middle">OSB</text>
      <text x="61" y="58" font-size="8" fill="currentColor" text-anchor="middle">145</text>
      <text x="108" y="58" font-size="8" fill="currentColor" text-anchor="middle">22×145</text>
    </template>

    <template v-else-if="figure === 'packs'">
      <path d="M22 28 L52 16 L82 28 V50 H22 Z" stroke="currentColor" stroke-width="1.3" />
      <path d="M96 34 H138 V50 H96 Z" stroke="currentColor" stroke-width="1.3" />
      <path d="M96 34 L117 22 L138 34" stroke="currentColor" stroke-width="1.3" />
      <text x="52" y="60" font-size="8" fill="currentColor" text-anchor="middle">skal</text>
      <text x="117" y="60" font-size="8" fill="currentColor" text-anchor="middle">nyckel</text>
    </template>

    <template v-else-if="figure === 'board'">
      <rect x="48" y="14" width="28" height="34" stroke="currentColor" stroke-width="1.4" />
      <rect x="84" y="14" width="28" height="34" stroke="currentColor" stroke-width="1.4" />
      <text x="62" y="58" font-size="8" fill="currentColor" text-anchor="middle">OSB</text>
      <text x="98" y="58" font-size="8" fill="currentColor" text-anchor="middle">gips</text>
    </template>

    <template v-else-if="figure === 'pier'">
      <path d="M24 46 H136" stroke="currentColor" stroke-width="1.4" />
      <rect x="48" y="22" width="10" height="24" stroke="currentColor" stroke-width="1.4" />
      <rect x="102" y="22" width="10" height="24" stroke="currentColor" stroke-width="1.4" />
      <text x="80" y="18" font-size="10" fill="currentColor" text-anchor="middle">500 mm</text>
    </template>

    <template v-else-if="figure === 'door'">
      <path d="M58 12 H102 V54 H58 Z" stroke="currentColor" stroke-width="1.6" />
      <path d="M66 20 H94 V46 H66 Z" stroke="currentColor" stroke-width="1.2" />
      <circle cx="88" cy="34" r="1.4" fill="currentColor" />
    </template>

    <template v-else-if="figure === 'note'">
      <rect x="48" y="10" width="64" height="44" rx="2" stroke="currentColor" stroke-width="1.4" />
      <path d="M60 24 H100 M60 32 H100 M60 40 H88" stroke="currentColor" stroke-width="1.2" />
    </template>

    <template v-else>
      <rect x="28" y="16" width="46" height="32" stroke="currentColor" stroke-width="1.4" />
      <rect x="86" y="12" width="46" height="36" stroke="currentColor" stroke-width="1.4" />
      <text x="51" y="35" font-size="9" fill="currentColor" text-anchor="middle">30 m²</text>
      <text x="109" y="33" font-size="9" fill="currentColor" text-anchor="middle">4,0 m</text>
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { KnowledgeFigure } from '../knowledge/hub';

defineProps<{
  figure: KnowledgeFigure;
}>();
</script>
