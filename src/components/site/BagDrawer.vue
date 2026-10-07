<template>
  <Teleport to="body">
    <div v-if="bag.panel" class="fixed inset-0 z-50">
      <button type="button" class="absolute inset-0 bg-graphite/40" :aria-label="t('site.close')" @click="bag.closePanel()" />
      <aside
        class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory text-graphite shadow-[-16px_0_40px_-24px_rgba(23,61,53,0.45)]"
        role="dialog"
        aria-modal="true"
        :aria-label="t('site.bag')"
      >
        <div class="flex items-center justify-between border-b border-pine/10 px-5 py-4">
          <h2 class="font-display text-2xl font-extrabold tracking-[-0.03em] text-pine">{{ t('site.bag') }}</h2>
          <button
            ref="closeButton"
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            :aria-label="t('site.close')"
            @click="bag.closePanel()"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <p v-if="!rows.length" class="text-sm text-pine/70">{{ t('site.emptyBag') }}</p>
          <ul v-else class="space-y-4">
            <li v-for="row in rows" :key="row.key" class="flex gap-3 border-b border-pine/10 pb-4">
              <img :src="row.item.image" alt="" class="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div class="min-w-0 flex-1">
                <p class="font-display text-lg font-extrabold tracking-[-0.03em] text-pine">{{ t(row.item.nameKey) }}</p>
                <p class="text-xs text-pine/70">{{ t('site.size') }}: {{ sizeLabel(row.size) }}</p>
                <p class="mt-1 text-sm font-semibold tabular-nums">{{ money(row.qty * row.item.priceSek) }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <button type="button" class="grid h-8 w-8 place-items-center rounded-full border border-pine/20 text-pine hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" :aria-label="t('site.decrease')" @click="bag.setQty(row.key, row.qty - 1)">−</button>
                  <span class="w-6 text-center text-sm font-semibold tabular-nums">{{ row.qty }}</span>
                  <button type="button" class="grid h-8 w-8 place-items-center rounded-full border border-pine/20 text-pine hover:border-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" :aria-label="t('site.increase')" :disabled="row.qty >= 19" @click="bag.setQty(row.key, row.qty + 1)">+</button>
                </div>
              </div>
              <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-pine/70 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine" :aria-label="t('site.remove')" @click="bag.remove(row.key)">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <div class="border-t border-pine/10 px-5 py-4">
          <div v-if="rows.length" class="mb-3 flex items-center justify-between font-semibold">
            <span>{{ t('site.subtotal') }}</span>
            <span class="tabular-nums">{{ money(total) }}</span>
          </div>
          <p v-if="rows.length" class="mb-3 text-xs leading-relaxed text-pine/70">{{ t('site.checkoutNote') }}</p>
          <ActionControl type="button" appearance="outline" class="w-full" @click="bag.closePanel()">
            {{ t('site.continueShop') }}
          </ActionControl>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useLabels } from '../../i18n';
import ActionControl from './ActionControl.vue';
import { MERCH } from '../../site/merch';
import { useBagStore } from '../../store/useBagStore';

const { t, money } = useLabels();
const bag = useBagStore();
const closeButton = ref<HTMLButtonElement | null>(null);

function sizeLabel(size: string) {
  return size === 'one' ? t('site.oneSize') : size;
}

const rows = computed(() => Object.entries(bag.lines).flatMap(([key, qty]) => {
  const [id, size] = key.split('::');
  const item = MERCH.find((entry) => entry.id === id);
  return item && qty ? [{ key, item, size, qty }] : [];
}));

const total = computed(() => rows.value.reduce((sum, row) => sum + row.qty * row.item.priceSek, 0));

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') bag.closePanel();
}

watch(() => bag.panel, async (open) => {
  document.body.classList.toggle('overflow-hidden', open);
  if (!open) return;
  window.addEventListener('keydown', onKey);
  await nextTick();
  closeButton.value?.focus();
}, { immediate: true });

watch(() => bag.panel, (open) => {
  if (!open) window.removeEventListener('keydown', onKey);
});

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden');
  window.removeEventListener('keydown', onKey);
});
</script>
