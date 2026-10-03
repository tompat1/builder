<template>
  <div
    v-if="isOpen"
    class="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="export-modal-title"
  >
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
      <!-- Close button -->
      <button
        type="button"
        @click="$emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Stäng dialog"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2 id="export-modal-title" class="text-base font-bold text-slate-900 mb-1">
        Exportera Byggsatshandlingar
      </h2>
      <p class="text-xs text-slate-500 mb-5">
        Ladda ner ritningar, 3D-renderingar och specifikationer för din konfiguration.
      </p>

      <div class="space-y-2.5">
        <!-- 2D Blueprint Export -->
        <button
          type="button"
          @click="downloadBlueprint"
          class="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50/70 transition-all text-left group"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                2D Planritning (SVG)
              </p>
              <p class="text-[11px] text-slate-500">Måttskiss med yttermått och sektionsdata</p>
            </div>
          </div>
          <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">Ladda ner</span>
        </button>

        <!-- High-res Render Image -->
        <button
          type="button"
          @click="downloadImage"
          class="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50/70 transition-all text-left group"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200/60">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Högupplöst 3D-rendering (PNG)
              </p>
              <p class="text-[11px] text-slate-500">Ögonblicksbild från nuvarande kameravinkel</p>
            </div>
          </div>
          <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">Spara</span>
        </button>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          id="btn-close-modal"
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[36px]"
        >
          Klar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store/useConfigStore';
import { exportBlueprintSvg, exportRenderedImage } from '../services/exportService';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useConfigStore();

async function downloadBlueprint() {
  const svgContent = await exportBlueprintSvg(store.dimensions);
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planritning-${store.currentSize.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadImage() {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    exportRenderedImage(canvas, 'modular-hus-3d.png');
  }
}
</script>
