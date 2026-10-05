<template>
  <div id="custom-paint" class="mt-2 rounded-xl border border-slate-200 bg-white p-3">
    <div
      class="sv-field relative h-36 cursor-crosshair touch-none rounded-lg"
      :style="{ backgroundColor: `hsl(${Math.round(hsv.h)} 100% 50%)` }"
      role="slider"
      tabindex="0"
      :aria-label="t('paint.palette')"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="Math.round(hsv.s * 100)"
      @pointerdown="onField"
      @keydown="onFieldKey"
    >
      <span class="sv-white"></span>
      <span class="sv-black"></span>
      <span
        class="sv-thumb"
        :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }"
      ></span>
    </div>

    <label class="mt-3 block">
      <span class="mb-1 block text-[11px] font-semibold text-slate-600">{{ t('paint.hue') }}</span>
      <input
        class="hue-range"
        type="range"
        min="0"
        max="360"
        :value="Math.round(hsv.h)"
        :aria-label="t('paint.hue')"
        @input="onHue"
        @change="preview"
      />
    </label>

    <div class="mt-3 grid grid-cols-5 gap-1" role="tablist" :aria-label="t('paint.add')">
      <button
        v-for="item in systems"
        :key="item"
        type="button"
        role="tab"
        class="min-h-11 rounded-lg text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        :class="system === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
        :aria-selected="system === item"
        @click="system = item"
      >
        {{ item === 'rgb' ? 'RGB' : item === 'cmyk' ? 'CMYK' : item === 'hex' ? 'HEX' : item === 'ral' ? 'RAL' : 'Pantone' }}
      </button>
    </div>

    <div class="mt-3" role="tabpanel">
      <div v-if="system === 'rgb'" class="grid grid-cols-3 gap-2">
        <label v-for="channel in rgbFields" :key="channel.key" class="block">
          <span class="mb-1 block text-[11px] font-semibold text-slate-600">{{ channel.label }}</span>
          <input
            class="field"
            type="number"
            min="0"
            max="255"
            :aria-label="channel.label"
            :value="rgb[channel.key]"
            @change="onRgb(channel.key, $event)"
          />
        </label>
      </div>

      <div v-else-if="system === 'cmyk'" class="grid grid-cols-4 gap-2">
        <label v-for="channel in cmykFields" :key="channel.key" class="block">
          <span class="mb-1 block text-[11px] font-semibold text-slate-600">{{ channel.label }}</span>
          <input
            class="field"
            type="number"
            min="0"
            max="100"
            :aria-label="channel.label"
            :value="cmyk[channel.key]"
            @change="onCmyk(channel.key, $event)"
          />
        </label>
      </div>

      <label v-else-if="system === 'hex'" class="block">
        <span class="mb-1 block text-[11px] font-semibold text-slate-600">HEX</span>
        <input
          id="paint-hex"
          class="field font-mono uppercase"
          type="text"
          maxlength="7"
          spellcheck="false"
          :aria-label="t('paint.hexHint')"
          :value="hex.toUpperCase()"
          @change="onHex"
        />
      </label>

      <label v-else-if="system === 'ral'" class="block">
        <span class="mb-1 block text-[11px] font-semibold text-slate-600">RAL</span>
        <input
          id="paint-ral"
          class="field"
          type="text"
          inputmode="numeric"
          list="ral-classic"
          maxlength="8"
          :aria-label="t('paint.ralHint')"
          :value="ralText"
          @change="onRal"
        />
        <datalist id="ral-classic">
          <option v-for="chip in RAL_CLASSIC" :key="chip.code" :value="chip.code">{{ chip.name }}</option>
        </datalist>
      </label>

      <label v-else class="block">
        <span class="mb-1 block text-[11px] font-semibold text-slate-600">Pantone</span>
        <input
          id="paint-pantone"
          class="field"
          type="text"
          maxlength="24"
          spellcheck="false"
          placeholder="19-4052 TCX"
          :aria-label="t('paint.pantoneHint')"
          :value="pantone"
          @change="onPantone"
        />
      </label>

      <p v-if="ralError" class="mt-2 text-[11px] font-semibold text-red-700" role="alert">{{ t('paint.ralMiss') }}</p>
      <p v-else-if="system === 'ral'" class="mt-2 text-[11px] text-slate-600">{{ t('paint.ralHint') }}</p>
      <p v-else-if="system === 'pantone'" class="mt-2 text-[11px] text-slate-600">{{ t('paint.pantoneHint') }}</p>
      <p v-else-if="system === 'hex'" class="mt-2 text-[11px] text-slate-600">{{ t('paint.hexHint') }}</p>
      <p v-else class="mt-2 text-[11px] text-slate-600">{{ system === 'cmyk' ? t('paint.percent') : t('paint.channel') }}</p>
      <p class="mt-1 text-[11px] text-slate-600">{{ t('paint.screen') }}</p>
    </div>

    <button
      id="btn-closest-ral"
      type="button"
      class="mt-3 flex w-full items-center gap-3 rounded-lg text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
      :aria-label="t('paint.pickRal', { code: closest.code })"
      @click="pickClosest"
    >
      <span
        class="h-9 w-9 shrink-0 rounded-md border border-slate-300"
        :style="{ backgroundColor: closest.hex }"
      ></span>
      <span class="min-w-0 text-xs font-semibold text-slate-900">
        {{ closest.distance < 1 ? `RAL ${closest.code}` : t('paint.closest', { code: closest.code }) }}
        <span class="mt-0.5 block text-[11px] font-normal text-slate-600">{{ closest.name }}</span>
      </span>
    </button>

    <button
      id="btn-save-paint"
      type="button"
      class="mt-3 min-h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      :disabled="!dirty"
      @click="save"
    >
      {{ t('paint.save') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import {
  RAL_CLASSIC,
  cmykToRgb,
  hexToRgb,
  hsvToRgb,
  lookupRal,
  nearestRal,
  normalizeHex,
  rgbToCmyk,
  rgbToHex,
  rgbToHsv,
  type PaintSystem
} from '../color/paint';

const store = useConfigStore();
const { t } = useLabels();
const emit = defineEmits<{ saved: [] }>();
const systems: PaintSystem[] = ['rgb', 'pantone', 'cmyk', 'hex', 'ral'];
const system = ref<PaintSystem>(store.customPaint?.system ?? 'hex');
const pantone = ref(store.customPaint?.pantone ?? '');
const ralText = ref(store.customPaint?.ral ?? '');
const ralError = ref(false);
const hsv = ref(rgbToHsv(hexToRgb(store.customPaint?.hex ?? store.currentMaterial.colorHex)));

const rgbFields = [
  { key: 'r' as const, label: 'R' },
  { key: 'g' as const, label: 'G' },
  { key: 'b' as const, label: 'B' }
];
const cmykFields = [
  { key: 'c' as const, label: 'C' },
  { key: 'm' as const, label: 'M' },
  { key: 'y' as const, label: 'Y' },
  { key: 'k' as const, label: 'K' }
];

const hex = computed(() => rgbToHex(hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v)));
const rgb = computed(() => hexToRgb(hex.value));
const cmyk = computed(() => rgbToCmyk(rgb.value));
const closest = computed(() => {
  const typed = system.value === 'ral' ? lookupRal(ralText.value) : null;
  if (typed) return { ...typed, distance: 0 };
  return nearestRal(hex.value);
});
const dirty = computed(() => {
  const saved = store.customPaint;
  if (!saved) return true;
  return saved.hex !== hex.value
    || saved.system !== system.value
    || saved.pantone !== pantone.value.trim()
    || saved.ral !== closest.value.code;
});

watch(() => store.customPaint, (paint) => {
  store.setPaintPreview(null);
  if (!paint) return;
  hsv.value = rgbToHsv(hexToRgb(paint.hex));
  pantone.value = paint.pantone;
  ralText.value = paint.ral;
  system.value = paint.system;
});

onUnmounted(() => store.setPaintPreview(null));

watch(() => store.activeMaterial, () => {
  if (store.customPaint) return;
  hsv.value = rgbToHsv(hexToRgb(store.currentMaterial.colorHex));
  ralText.value = '';
  pantone.value = '';
  ralError.value = false;
});

function preview() {
  if (system.value !== 'ral') ralError.value = false;
  store.setPaintPreview(hex.value);
}

function pickClosest() {
  const chip = closest.value;
  hsv.value = rgbToHsv(hexToRgb(chip.hex));
  ralText.value = chip.code;
  ralError.value = false;
  preview();
}

function save() {
  store.setCustomPaint({
    hex: hex.value,
    system: system.value,
    pantone: pantone.value.trim(),
    ral: closest.value.code
  });
  emit('saved');
}

function onField(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement;
  const move = (pointer: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    hsv.value = {
      h: hsv.value.h,
      s: Math.min(1, Math.max(0, (pointer.clientX - rect.left) / rect.width)),
      v: 1 - Math.min(1, Math.max(0, (pointer.clientY - rect.top) / rect.height))
    };
    ralText.value = '';
  };
  move(event);
  el.setPointerCapture(event.pointerId);
  const finish = () => {
    el.removeEventListener('pointermove', move);
    preview();
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', finish, { once: true });
  el.addEventListener('pointercancel', finish, { once: true });
}

function onFieldKey(event: KeyboardEvent) {
  const step = event.shiftKey ? 0.1 : 0.02;
  if (event.key === 'ArrowLeft') hsv.value.s = Math.max(0, hsv.value.s - step);
  else if (event.key === 'ArrowRight') hsv.value.s = Math.min(1, hsv.value.s + step);
  else if (event.key === 'ArrowUp') hsv.value.v = Math.min(1, hsv.value.v + step);
  else if (event.key === 'ArrowDown') hsv.value.v = Math.max(0, hsv.value.v - step);
  else return;
  event.preventDefault();
  ralText.value = '';
  preview();
}

function onHue(event: Event) {
  hsv.value = { ...hsv.value, h: Number((event.target as HTMLInputElement).value) };
  ralText.value = '';
}

function readNumber(event: Event, max: number) {
  const value = Number((event.target as HTMLInputElement).value);
  return Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));
}

function onRgb(key: 'r' | 'g' | 'b', event: Event) {
  const next = { ...rgb.value, [key]: readNumber(event, 255) };
  hsv.value = rgbToHsv(next);
  ralText.value = '';
  preview();
}

function onCmyk(key: 'c' | 'm' | 'y' | 'k', event: Event) {
  const next = { ...cmyk.value, [key]: readNumber(event, 100) };
  hsv.value = rgbToHsv(cmykToRgb(next.c, next.m, next.y, next.k));
  ralText.value = '';
  preview();
}

function onHex(event: Event) {
  const next = normalizeHex((event.target as HTMLInputElement).value);
  if (!next) return;
  hsv.value = rgbToHsv(hexToRgb(next));
  ralText.value = '';
  preview();
}

function onRal(event: Event) {
  const typed = (event.target as HTMLInputElement).value;
  ralText.value = typed;
  const chip = lookupRal(typed);
  ralError.value = typed.replace(/\D/g, '').length >= 4 && !chip;
  if (!chip) return;
  hsv.value = rgbToHsv(hexToRgb(chip.hex));
  ralText.value = chip.code;
  preview();
}

function onPantone(event: Event) {
  pantone.value = (event.target as HTMLInputElement).value;
  preview();
}
</script>

<style scoped>
.sv-white {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, transparent);
}

.sv-black {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, transparent);
}

.sv-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 999px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.45);
  transform: translate(-50%, -50%);
}

.hue-range {
  width: 100%;
  height: 14px;
  appearance: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
  outline: none;
}

.hue-range::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  appearance: none;
  border: 2px solid #0f172a;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.35);
}

.hue-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid #0f172a;
  border-radius: 999px;
  background: #fff;
}

.field {
  width: 100%;
  min-height: 2.75rem;
  padding: 0 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #fff;
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.field:focus {
  outline: none;
  box-shadow: 0 0 0 2px #0f172a;
}
</style>
