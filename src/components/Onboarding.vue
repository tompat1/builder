<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[80]"
    @keydown="onKey"
  >
    <div class="onboard-shade" :style="shade.top"></div>
    <div class="onboard-shade" :style="shade.left"></div>
    <div class="onboard-shade" :style="shade.right"></div>
    <div class="onboard-shade" :style="shade.bottom"></div>
    <div
      v-if="hole"
      class="pointer-events-none fixed rounded-2xl outline outline-2 outline-offset-[3px] outline-[#FF5A00]"
      :style="hole"
    ></div>

    <div
      ref="calloutEl"
      id="builder-onboarding"
      class="fixed z-[81] rounded-2xl bg-[#F5F3EC] p-4 text-[#222925] shadow-[0_16px_36px_rgba(23,61,53,0.2)]"
      role="dialog"
      aria-modal="false"
      :aria-label="progressLabel"
      :style="calloutStyle"
    >
      <h2 class="text-base font-extrabold tracking-tight text-[#173D35]">{{ t(step.title) }}</h2>
      <p class="mt-1.5 text-sm leading-relaxed text-[#173D35]">{{ t(step.body) }}</p>

      <div class="mt-4 flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-1.5" role="group" :aria-label="progressLabel">
          <button
            v-for="(item, index) in steps"
            :key="item.title"
            type="button"
            class="h-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
            :class="index === stepIndex ? 'w-5 bg-[#FF5A00]' : 'w-2 bg-[#173D35]/25 hover:bg-[#173D35]/50'"
            :aria-label="t(item.title)"
            :aria-current="index === stepIndex ? 'step' : undefined"
            @click="go(index)"
          ></button>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-xl px-2 py-1.5 text-sm font-semibold text-[#173D35] hover:bg-[#173D35]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
            @click="finish"
          >
            {{ t('onboard.skip') }}
          </button>
          <button
            v-if="stepIndex > 0"
            type="button"
            class="rounded-xl px-2 py-1.5 text-sm font-semibold text-[#173D35] hover:bg-[#173D35]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
            @click="back"
          >
            {{ t('onboard.back') }}
          </button>
          <button
            id="btn-onboard-next"
            type="button"
            class="rounded-xl bg-[#173D35] px-3 py-1.5 text-sm font-semibold text-[#F5F3EC] hover:bg-[#222925] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A00]"
            @click="next"
          >
            {{ stepIndex === steps.length - 1 ? t('onboard.done') : t('onboard.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useLabels } from '../i18n';

const KEY = 'builder.onboarding';
const { t } = useLabels();

const steps = [
  { title: 'onboard.houseTitle', body: 'onboard.houseBody', target: '#house-stage', projects: false, tray: 'none' },
  { title: 'onboard.partsTitle', body: 'onboard.partsBody', target: '#config-panel', projects: false, tray: 'none' },
  { title: 'onboard.toolsTitle', body: 'onboard.toolsBody', target: '#tool-dock', projects: false, tray: 'dock' },
  { title: 'onboard.sunTitle', body: 'onboard.sunBody', target: '#sun-timebox', projects: false, tray: 'sun' },
  { title: 'onboard.viewTitle', body: 'onboard.viewBody', target: '#view-tools', projects: false, tray: 'view' },
  { title: 'onboard.rulerTitle', body: 'onboard.rulerBody', target: '#ruler-tools', projects: false, tray: 'ruler' },
  { title: 'onboard.notesTitle', body: 'onboard.notesBody', target: '#note-tools', projects: false, tray: 'notes' },
  { title: 'onboard.moodTitle', body: 'onboard.moodBody', target: '#mood-board', projects: false, tray: 'mood' },
  { title: 'onboard.aiTitle', body: 'onboard.aiBody', target: '#ai-concierge-panel', projects: false, tray: 'ai' },
  { title: 'onboard.projectTitle', body: 'onboard.projectBody', target: 'projects', projects: false, tray: 'none' },
  { title: 'onboard.boardTitle', body: 'onboard.boardBody', target: '#house-save-panel', projects: true, tray: 'none' }
] as const;

const open = ref(false);
const ready = ref(false);
const stepIndex = ref(0);
const calloutEl = ref<HTMLElement | null>(null);
const calloutStyle = ref<Record<string, string>>({ left: '16px', top: '16px', width: '20rem' });
const hole = ref<Record<string, string> | null>(null);
const shade = ref({
  top: { top: '0px', left: '0px', width: '100%', height: '100%' },
  left: { top: '0px', left: '0px', width: '0px', height: '0px' },
  right: { top: '0px', left: '0px', width: '0px', height: '0px' },
  bottom: { top: '0px', left: '0px', width: '0px', height: '0px' }
});

const step = computed(() => steps[stepIndex.value]);
const visible = computed(() => open.value && ready.value);
const progressLabel = computed(() => t('onboard.progress', {
  current: stepIndex.value + 1,
  total: steps.length
}));

let cookieTimer = 0;
let measureTimer = 0;

function seen() {
  return localStorage.getItem(KEY) === 'seen';
}

function cookieOpen() {
  return !!document.getElementById('builder-cookie-consent');
}

function waitForCookie() {
  if (!cookieOpen()) {
    ready.value = true;
    return;
  }
  cookieTimer = window.setTimeout(waitForCookie, 400);
}

function box(id: string) {
  const el = document.getElementById(id.replace(/^#/, ''));
  if (!el) return null;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return rect;
}

function headerBottom() {
  let bottom = 0;
  for (const header of document.querySelectorAll('header')) {
    const rect = header.getBoundingClientRect();
    if (rect.width > 2 && rect.height > 2) bottom = Math.max(bottom, rect.bottom);
  }
  return bottom;
}

function targetRect() {
  if (step.value.target === '#house-stage') {
    const stage = box('house-stage');
    if (!stage) return null;
    const top = Math.max(stage.top, headerBottom() + 8);
    let bottom = stage.bottom;
    const panel = box('config-panel');
    const tools = box('btn-toggle-tools');
    if (panel && panel.top > window.innerHeight * 0.4) bottom = Math.min(bottom, panel.top - 8);
    if (tools && tools.top > window.innerHeight * 0.45) bottom = Math.min(bottom, tools.top - 8);
    return new DOMRect(stage.left, top, stage.width, Math.max(120, bottom - top));
  }
  if (step.value.target === 'projects') {
    return box('btn-save-project') || box('btn-save-project-mobile');
  }
  if (step.value.target === '#config-panel') {
    return box('config-sheet-options') || box('config-panel');
  }
  return box(step.value.target);
}

function setProjects(show: boolean) {
  window.dispatchEvent(new CustomEvent('builder:onboarding-projects', { detail: { open: show } }));
}

function setSheet(show: boolean) {
  window.dispatchEvent(new CustomEvent('builder:onboarding-sheet', { detail: { open: show } }));
}

function setTray(tray: string) {
  window.dispatchEvent(new CustomEvent('builder:onboarding-tools', { detail: { tray } }));
}

function syncStep() {
  setProjects(step.value.projects);
  setSheet(step.value.target === '#config-panel');
  setTray(step.value.tray);
}

function measure() {
  const rect = targetRect();
  const width = Math.min(320, window.innerWidth - 32);
  const height = calloutEl.value?.offsetHeight || 168;
  if (!rect) {
    hole.value = null;
    shade.value = {
      top: { top: '0px', left: '0px', width: '100%', height: '100%' },
      left: { top: '0px', left: '0px', width: '0px', height: '0px' },
      right: { top: '0px', left: '0px', width: '0px', height: '0px' },
      bottom: { top: '0px', left: '0px', width: '0px', height: '0px' }
    };
    calloutStyle.value = {
      width: `${width}px`,
      left: `${Math.max(16, (window.innerWidth - width) / 2)}px`,
      top: `${Math.max(16, window.innerHeight - height - 24)}px`
    };
    return;
  }

  const pad = 8;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const right = Math.min(window.innerWidth, rect.right + pad);
  const bottom = Math.min(window.innerHeight, rect.bottom + pad);
  hole.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${Math.max(0, right - left)}px`,
    height: `${Math.max(0, bottom - top)}px`
  };
  shade.value = {
    top: { top: '0px', left: '0px', width: '100%', height: `${top}px` },
    left: { top: `${top}px`, left: '0px', width: `${left}px`, height: `${bottom - top}px` },
    right: { top: `${top}px`, left: `${right}px`, width: `${Math.max(0, window.innerWidth - right)}px`, height: `${bottom - top}px` },
    bottom: { top: `${bottom}px`, left: '0px', width: '100%', height: `${Math.max(0, window.innerHeight - bottom)}px` }
  };

  let x = rect.left;
  let y = rect.bottom + 12;
  if (step.value.target === '#house-stage') {
    x = rect.left + (rect.width - width) / 2;
    y = rect.bottom - height - 24;
  } else if (step.value.target === '#config-panel' && rect.left > width + 24) {
    x = rect.left - width - 16;
    y = rect.top;
  } else if (step.value.target === '#config-panel') {
    x = rect.left + (rect.width - width) / 2;
    y = Math.max(headerBottom() + 8, rect.top - height - 12);
  } else if (step.value.target === 'projects') {
    x = rect.right - width;
    y = rect.bottom + 12;
  } else if (step.value.target === '#mood-board') {
    x = rect.left + (rect.width - width) / 2;
    y = rect.bottom - height - 24;
  } else if (step.value.target === '#ai-concierge-panel' && window.innerWidth - rect.right > width + 28) {
    x = rect.right + 16;
    y = rect.top;
  } else if (step.value.target === '#ai-concierge-panel') {
    x = rect.left + (rect.width - width) / 2;
    y = rect.bottom - height - 24;
  } else if (rect.left > width + 28) {
    x = rect.left - width - 16;
    y = rect.top;
  } else if (window.innerWidth - rect.right > width + 28) {
    x = rect.right + 16;
    y = rect.top;
  } else if (rect.top > height + 24) {
    x = rect.left;
    y = rect.top - height - 12;
  }
  calloutStyle.value = {
    width: `${width}px`,
    left: `${Math.min(Math.max(16, x), window.innerWidth - width - 16)}px`,
    top: `${Math.min(Math.max(16, y), window.innerHeight - height - 16)}px`
  };
}

async function focusNext() {
  await nextTick();
  document.getElementById('btn-onboard-next')?.focus();
}

function go(index: number) {
  stepIndex.value = index;
}

function next() {
  if (stepIndex.value >= steps.length - 1) {
    finish();
    return;
  }
  stepIndex.value += 1;
}

function back() {
  if (stepIndex.value > 0) stepIndex.value -= 1;
}

function finish() {
  open.value = false;
  localStorage.setItem(KEY, 'seen');
  setProjects(false);
  setSheet(false);
  setTray('none');
}

function replay() {
  stepIndex.value = 0;
  open.value = true;
  ready.value = !cookieOpen();
  if (!ready.value) waitForCookie();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    finish();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    next();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    back();
  }
}

function onResize() {
  if (visible.value) measure();
}

watch(stepIndex, async () => {
  if (!visible.value) return;
  syncStep();
  await nextTick();
  window.clearTimeout(measureTimer);
  measureTimer = window.setTimeout(() => {
    measure();
    void focusNext();
    measureTimer = window.setTimeout(measure, 340);
  }, 80);
});

watch(visible, async (showing) => {
  if (!showing) return;
  syncStep();
  await nextTick();
  measure();
  measureTimer = window.setTimeout(() => {
    measure();
    void focusNext();
    measureTimer = window.setTimeout(measure, 340);
  }, 80);
});

onMounted(() => {
  window.addEventListener('builder:replay-onboarding', replay);
  window.addEventListener('resize', onResize);
  if (!seen()) {
    open.value = true;
    waitForCookie();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('builder:replay-onboarding', replay);
  window.removeEventListener('resize', onResize);
  window.clearTimeout(cookieTimer);
  window.clearTimeout(measureTimer);
  setProjects(false);
  setSheet(false);
  setTray('none');
});
</script>

<style scoped>
.onboard-shade {
  position: fixed;
  background: rgba(23, 61, 53, 0.46);
}
</style>
