<template>
  <div
    id="builder-walkthrough-overlay"
    class="pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex flex-col md:inset-x-auto md:left-6 md:right-auto md:bottom-6 md:w-[580px] max-w-full font-sans transition-all duration-300"
    role="region"
    :aria-label="isConcrete
      ? (locale === 'sv' ? 'Byggmästarguide för påbyggnad på betonghus' : 'Builder Guide for Addition on Concrete House')
      : (locale === 'sv' ? 'Byggmästarguide för trästomme' : 'Builder Timber Framing Guide')"
  >
    <!-- Main Floating Glassmorphic Container -->
    <div
      class="flex flex-col overflow-hidden rounded-2xl border border-amber-500/25 bg-slate-900/90 text-white shadow-2xl backdrop-blur-xl transition-all duration-300"
    >
      <!-- Top Status Header -->
      <header class="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.03]">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <!-- Hammer / framing icon -->
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
              <path d="M17.64 15 22 10.64" />
              <path d="m20.91 3.26-6.5 6.5" />
              <path d="m19.26 2.36 2.38 2.38a1.69 1.69 0 0 1 0 2.38L20 8.75l-4.75-4.75 1.63-1.64a1.69 1.69 0 0 1 2.38 0Z" />
            </svg>
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                {{ guideBadge }}
              </span>
              <span class="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {{ locale === 'sv' ? `Steg ${activeStep} av ${totalSteps}` : `Step ${activeStep} of ${totalSteps}` }}
              </span>
            </div>
            <h2 class="truncate text-sm font-bold text-white">
              {{ locale === 'sv' ? guideTitleSv : guideTitleEn }}
            </h2>
          </div>
        </div>

        <!-- Quick actions: Camera re-focus, Auto-tour, Minimize & Close -->
        <div class="flex items-center gap-1 shrink-0">
          <!-- Re-center Camera -->
          <button
            type="button"
            id="btn-walkthrough-recenter"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            :title="locale === 'sv' ? 'Fokusera kamera på detta steg' : 'Focus camera on this step'"
            :aria-label="locale === 'sv' ? 'Fokusera kamera på detta steg' : 'Focus camera on this step'"
            @click="focusCamera"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            </svg>
          </button>

          <!-- Auto-tour Toggle -->
          <button
            type="button"
            id="btn-walkthrough-autotour"
            class="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors"
            :class="isAutoPlaying ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
            :title="locale === 'sv' ? (isAutoPlaying ? 'Pausa automatisk guidning' : 'Starta automatisk guidning') : (isAutoPlaying ? 'Pause auto-tour' : 'Start auto-tour')"
            @click="toggleAutoTour"
          >
            <svg v-if="isAutoPlaying" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span class="hidden sm:inline">{{ isAutoPlaying ? (locale === 'sv' ? 'Pausa' : 'Pause') : 'Auto' }}</span>
          </button>

          <!-- Collapse / Expand Details -->
          <button
            type="button"
            id="btn-walkthrough-collapse"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            :title="isExpanded ? (locale === 'sv' ? 'Minimera detaljer' : 'Collapse details') : (locale === 'sv' ? 'Visa detaljer' : 'Expand details')"
            @click="isExpanded = !isExpanded"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="{ 'rotate-180': !isExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          <!-- Close / Exit Walkthrough -->
          <button
            type="button"
            id="btn-walkthrough-exit"
            class="flex h-8 items-center gap-1 rounded-lg bg-white/10 px-2 text-xs font-semibold text-slate-200 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-transparent transition-all"
            :title="locale === 'sv' ? 'Avsluta stomguide och visa färdigt hus' : 'Exit framing guide and restore full house'"
            @click="exitGuide"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span class="hidden sm:inline">{{ locale === 'sv' ? 'Avsluta' : 'Exit' }}</span>
          </button>
        </div>
      </header>

      <!-- Mode: frame vs layers -->
      <div class="flex gap-1 px-4 py-2 bg-slate-950/50 border-b border-white/5">
        <button
          type="button"
          id="btn-walkthrough-mode-frame"
          class="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
          :class="isLayersMode ? 'text-amber-100/70 hover:bg-white/5' : 'bg-amber-500 text-slate-950'"
          @click="setMode('frame')"
        >{{ locale === 'sv' ? 'Stomme (montering)' : 'Frame (assembly)' }}</button>
        <button
          type="button"
          id="btn-walkthrough-mode-layers"
          class="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
          :class="isLayersMode ? 'bg-sky-400 text-slate-950' : 'text-amber-100/70 hover:bg-white/5'"
          @click="setMode('layers')"
        >{{ locale === 'sv' ? 'Lager (utifrån→in)' : 'Layers (outside→in)' }}</button>
      </div>

      <!-- Step Stepper Pills -->
      <nav
        class="flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-950/40 border-b border-white/5 scrollbar-none"
        :aria-label="locale === 'sv' ? 'Byggsteg' : 'Construction Steps'"
      >
        <button
          v-for="s in stepperItems"
          :key="s.step"
          type="button"
          :id="`btn-step-${s.step}`"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-200"
          :class="[
            s.step === activeStep
              ? (isLayersMode ? 'bg-sky-400 text-slate-950 font-extrabold shadow-sm ring-1 ring-sky-300' : 'bg-amber-500 text-slate-950 font-extrabold shadow-sm ring-1 ring-amber-400')
              : s.step < activeStep
                ? (isLayersMode ? 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 border border-sky-400/30' : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30')
                : 'text-amber-100/50 hover:bg-white/5 hover:text-amber-50'
          ]"
          :aria-current="s.step === activeStep ? 'step' : undefined"
          @click="selectStep(s.step)"
        >
          <span
            v-if="s.step < activeStep"
            class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-slate-950"
            aria-hidden="true"
          >
            <svg class="h-2.5 w-2.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span v-else class="text-[11px] font-bold">{{ s.step }}</span>
          <span class="text-[11px]">{{ s.label }}</span>
        </button>
      </nav>

      <!-- Expandable Body Content -->
      <div v-show="isExpanded" class="flex flex-col gap-3.5 p-4 max-h-[58vh] overflow-y-auto">
        <!-- Subtitle and Description -->
        <p class="text-xs text-amber-50/85 leading-relaxed font-medium">
          {{ locale === 'sv' ? guide.subtitleSv : guide.subtitleEn }}
        </p>

        <!-- Technical Specifications Grid -->
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div
            v-for="(spec, i) in guide.specs"
            :key="i"
            class="flex flex-col rounded-xl border border-amber-500/20 bg-amber-950/40 p-2.5"
          >
            <span class="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
              {{ locale === 'sv' ? spec.labelSv : spec.labelEn }}
            </span>
            <span class="mt-0.5 text-xs font-bold text-amber-50 tracking-tight">
              {{ locale === 'sv' ? spec.valueSv : spec.valueEn }}
            </span>
          </div>
        </div>

        <!-- Step-by-step assembly -->
        <div class="rounded-xl border border-sky-400/30 bg-sky-950/50 p-3">
          <div class="flex items-center gap-1.5 font-bold text-sky-200 uppercase tracking-wide text-[10px] mb-2">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span>{{ locale === 'sv' ? 'Montering steg för steg' : 'Step-by-step assembly' }}</span>
          </div>
          <ol class="flex flex-col gap-1.5 list-none m-0 p-0">
            <li
              v-for="(line, idx) in (locale === 'sv' ? guide.assemblySv : guide.assemblyEn)"
              :key="'asm-' + idx"
              class="flex gap-2 text-xs leading-relaxed text-sky-50"
            >
              <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-400/30 text-[10px] font-bold text-sky-100">{{ idx + 1 }}</span>
              <span>{{ line.replace(/^\d+\.\s*/, '') }}</span>
            </li>
          </ol>
        </div>

        <!-- Tools -->
        <div v-if="guide.toolsSv.length" class="rounded-xl border border-amber-500/20 bg-amber-950/35 p-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-200 block mb-2">
            {{ locale === 'sv' ? 'Verktyg & material' : 'Tools & materials' }}
          </span>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(tool, idx) in (locale === 'sv' ? guide.toolsSv : guide.toolsEn)"
              :key="'tool-' + idx"
              class="rounded-lg border border-amber-400/25 bg-amber-900/40 px-2 py-1 text-[11px] font-medium text-amber-50"
            >{{ tool }}</span>
          </div>
        </div>

        <!-- Pro-Tips Box ("Byggmästarens råd") -->
        <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-50">
          <div class="flex items-center gap-1.5 font-bold text-amber-300 uppercase tracking-wide text-[10px] mb-1">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            <span>{{ locale === 'sv' ? 'Byggmästarens råd' : "Master Carpenter's Advice" }}</span>
          </div>
          <p>{{ locale === 'sv' ? guide.tipsSv : guide.tipsEn }}</p>
        </div>

        <!-- Pitfalls -->
        <div v-if="guide.pitfallsSv.length" class="rounded-xl border border-rose-400/30 bg-rose-950/45 p-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-rose-200 block mb-2">
            {{ locale === 'sv' ? 'Undvik dessa fel (lastväg)' : 'Avoid these mistakes (load path)' }}
          </span>
          <ul class="flex flex-col gap-1 m-0 p-0 list-none">
            <li
              v-for="(item, idx) in (locale === 'sv' ? guide.pitfallsSv : guide.pitfallsEn)"
              :key="'pit-' + idx"
              class="flex gap-2 text-xs text-rose-50"
            >
              <span class="text-rose-300 font-bold" aria-hidden="true">!</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- Interactive Checklist -->
        <div class="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-200 block mb-2">
            {{ locale === 'sv' ? 'Arbetsmoment & Kontrollpunkter' : 'Assembly & Inspection Checklist' }}
          </span>
          <div class="flex flex-col gap-1.5">
            <label
              v-for="(item, idx) in (locale === 'sv' ? guide.checklistSv : guide.checklistEn)"
              :key="idx"
              class="flex items-start gap-2.5 text-xs text-amber-50/90 cursor-pointer select-none hover:text-white"
            >
              <input
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-amber-400/30 bg-amber-900/40 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
                :checked="isItemChecked(activeStep, idx)"
                @change="toggleItemCheck(activeStep, idx)"
              />
              <span :class="{ 'line-through text-amber-200/50': isItemChecked(activeStep, idx) }">
                {{ item }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer Navigation Controls -->
      <footer class="flex items-center justify-between border-t border-white/10 bg-slate-950/60 px-4 py-2.5">
        <button
          type="button"
          id="btn-walkthrough-prev"
          class="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          :disabled="activeStep <= 1"
          @click="prevStep"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>{{ locale === 'sv' ? 'Föregående' : 'Previous' }}</span>
        </button>

        <span class="text-[11px] text-slate-400 font-medium hidden sm:inline">
          {{ locale === 'sv' ? 'Använd piltangenterna [← / →]' : 'Use arrow keys [← / →]' }}
        </span>

        <button
          v-if="activeStep < totalSteps"
          type="button"
          id="btn-walkthrough-next"
          class="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          @click="nextStep"
        >
          <span>{{ locale === 'sv' ? 'Nästa byggsteg' : 'Next Step' }}</span>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          v-else
          type="button"
          id="btn-walkthrough-finish"
          class="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          @click="exitGuide"
        >
          <span>{{ locale === 'sv' ? 'Slutför & Visa hus' : 'Complete & View House' }}</span>
          <svg class="h-4 w-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import { useConfigStore } from '../store/useConfigStore';
import { useLabels } from '../i18n';
import { FRAMING_STEPS_TOTAL, getFramingStep, getFramingSteps, type FramingStepDefinition } from '../construction/framingWalkthrough';
import { ASSEMBLY_LAYERS, ASSEMBLY_LAYERS_TOTAL, getAssemblyLayer, type AssemblyLayerDefinition } from '../construction/assemblyLayers';

const store = useConfigStore();
const { locale } = useLabels();

const isExpanded = ref(true);
const isAutoPlaying = ref(false);
let autoTourTimer: ReturnType<typeof setInterval> | null = null;

const checkedItems = reactive(new Set<string>());

function isItemChecked(step: number, idx: number): boolean {
  return checkedItems.has(`${store.walkthroughMode}:${step}:${idx}`);
}

function toggleItemCheck(step: number, idx: number) {
  const key = `${store.walkthroughMode}:${step}:${idx}`;
  if (checkedItems.has(key)) checkedItems.delete(key);
  else checkedItems.add(key);
}

const isConcrete = computed(() => store.selectedSizeId === 'size-paabyggnad');
const isLayersMode = computed(() => store.walkthroughMode === 'layers');

const frameSteps = computed(() => getFramingSteps(isConcrete.value));

const totalSteps = computed(() =>
  isLayersMode.value ? ASSEMBLY_LAYERS_TOTAL : (frameSteps.value.length || FRAMING_STEPS_TOTAL)
);
const activeStep = computed(() =>
  isLayersMode.value ? store.assemblyLayerStep : store.framingStep
);

const currentFrameStep = computed<FramingStepDefinition>(() =>
  getFramingStep(store.framingStep, isConcrete.value)
);
const currentLayer = computed<AssemblyLayerDefinition>(() =>
  getAssemblyLayer(store.assemblyLayerStep)
);

const guideBadge = computed(() => {
  if (isLayersMode.value) {
    return locale.value === 'sv' ? 'Byggmästarguide · Lager utifrån→in' : 'Builder Guide · Layers outside→in';
  }
  if (isConcrete.value) {
    return locale.value === 'sv' ? 'Byggmästarguide · Påbyggnad på betonghus' : 'Builder Guide · Concrete Addition Frame';
  }
  return locale.value === 'sv' ? 'Byggmästarguide · Trästomme' : 'Builder Guide · Timber Frame';
});

const guideTitleSv = computed(() =>
  isLayersMode.value ? currentLayer.value.titleSv : currentFrameStep.value.titleSv
);
const guideTitleEn = computed(() =>
  isLayersMode.value ? currentLayer.value.titleEn : currentFrameStep.value.titleEn
);

/** Unified card model for template (frame + layers). */
const guide = computed(() => {
  if (isLayersMode.value) {
    const L = currentLayer.value;
    return {
      subtitleSv: L.subtitleSv,
      subtitleEn: L.subtitleEn,
      specs: L.specs,
      assemblySv: L.assemblySv,
      assemblyEn: L.assemblyEn,
      toolsSv: [] as string[],
      toolsEn: [] as string[],
      tipsSv: L.tipsSv,
      tipsEn: L.tipsEn,
      pitfallsSv: [] as string[],
      pitfallsEn: [] as string[],
      checklistSv: L.assemblySv.map((line) => line.replace(/^\d+\.\s*/, '')),
      checklistEn: L.assemblyEn.map((line) => line.replace(/^\d+\.\s*/, ''))
    };
  }
  const S = currentFrameStep.value;
  return {
    subtitleSv: S.subtitleSv,
    subtitleEn: S.subtitleEn,
    specs: S.specs,
    assemblySv: S.assemblySv,
    assemblyEn: S.assemblyEn,
    toolsSv: S.toolsSv,
    toolsEn: S.toolsEn,
    tipsSv: S.proTipsSv,
    tipsEn: S.proTipsEn,
    pitfallsSv: S.pitfallsSv,
    pitfallsEn: S.pitfallsEn,
    checklistSv: S.checklistSv,
    checklistEn: S.checklistEn
  };
});

const stepperItems = computed(() => {
  if (isLayersMode.value) {
    return ASSEMBLY_LAYERS.map((L) => ({
      step: L.step,
      label: locale.value === 'sv' ? L.shortSv : L.shortEn
    }));
  }
  return frameSteps.value.map((s) => ({
    step: s.step,
    label: stepShortLabel(s)
  }));
});

function stepShortLabel(s: FramingStepDefinition): string {
  if (isConcrete.value) {
    if (locale.value === 'sv') {
      switch (s.step) {
        case 1: return 'Syll & Murkrön';
        case 2: return 'Hörn & Anslutning';
        case 3: return 'Reglar & Hög Front';
        case 4: return 'Balkar & Betongstöd';
        case 5: return 'Stort Loft (500 cm)';
        case 6: return 'Pulpettak 500 cm';
        case 7: return 'Slutkontroll';
        default: return `Steg ${s.step}`;
      }
    }
    switch (s.step) {
      case 1: return 'Crown & Slab Sills';
      case 2: return 'Corners & Ties';
      case 3: return 'Studs & High Front';
      case 4: return 'Beams & Concrete';
      case 5: return 'Big Loft (500 cm)';
      case 6: return 'Rafters & Pitch';
      case 7: return 'Final Audit';
      default: return `Step ${s.step}`;
    }
  }
  if (locale.value === 'sv') {
    switch (s.step) {
      case 1: return 'Syll';
      case 2: return 'Hörn';
      case 3: return 'Reglar cc 600';
      case 4: return 'Avväxling';
      case 5: return 'Hammarband';
      case 6: return 'Takstolar';
      case 7: return 'Färdig stomme';
      default: return `Steg ${s.step}`;
    }
  }
  switch (s.step) {
    case 1: return 'Sill Plate';
    case 2: return 'Corners';
    case 3: return 'Studs cc 600';
    case 4: return 'Headers';
    case 5: return 'Top Plates';
    case 6: return 'Trusses';
    case 7: return 'Full Frame';
    default: return `Step ${s.step}`;
  }
}

function setMode(mode: 'frame' | 'layers') {
  stopAutoTour();
  store.setWalkthroughMode(mode);
}

function selectStep(step: number) {
  if (isLayersMode.value) store.setAssemblyLayerStep(step);
  else store.setFramingStep(step);
}

function nextStep() {
  store.nextFramingStep();
}

function prevStep() {
  store.prevFramingStep();
}

function focusCamera() {
  const scene = (window as any).__houseScene;
  if (!scene) return;
  if (isLayersMode.value && typeof scene.frameAssemblyLayer === 'function') {
    scene.frameAssemblyLayer(store.assemblyLayerStep);
  } else if (typeof scene.frameFramingStep === 'function') {
    scene.frameFramingStep(store.framingStep);
  }
}

function toggleAutoTour() {
  if (isAutoPlaying.value) stopAutoTour();
  else startAutoTour();
}

function startAutoTour() {
  isAutoPlaying.value = true;
  if (autoTourTimer) clearInterval(autoTourTimer);
  autoTourTimer = setInterval(() => {
    if (activeStep.value < totalSteps.value) store.nextFramingStep();
    else if (isLayersMode.value) store.setAssemblyLayerStep(1);
    else store.setFramingStep(1);
  }, 6500);
}

function stopAutoTour() {
  isAutoPlaying.value = false;
  if (autoTourTimer) {
    clearInterval(autoTourTimer);
    autoTourTimer = null;
  }
}

function exitGuide() {
  stopAutoTour();
  store.stopFramingWalkthrough();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextStep();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevStep();
  } else if (e.key === 'Escape') {
    exitGuide();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  stopAutoTour();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
