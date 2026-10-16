<template>
  <div
    class="boot-splash"
    :class="{ 'boot-splash--leaving': leaving }"
    role="status"
    aria-live="polite"
    :aria-busy="!leaving"
  >
    <div class="boot-splash__logo">
      <img
        class="boot-splash__img"
        src="/brand/builder-logo.svg"
        alt="Builder"
        draggable="false"
      />
      <svg class="boot-splash__door" viewBox="0 0 1030 408" aria-hidden="true">
        <defs>
          <clipPath id="boot-door-opening"><path :d="rig.interior.aperture" /></clipPath>
          <clipPath id="boot-door-wall"><path :d="rig.interior.wallClip" clip-rule="evenodd" /></clipPath>
          <linearGradient id="boot-door-room" x1="0" y1="54" x2="0" y2="291" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#4a1a03" />
            <stop offset="1" stop-color="#7c3006" />
          </linearGradient>
          <linearGradient id="boot-door-daylight" x1="117" y1="150" x2="24" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ff8a3a" stop-opacity=".55" />
            <stop offset="1" stop-color="#ff8a3a" stop-opacity="0" />
          </linearGradient>
          <filter id="boot-door-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur :stdDeviation="1.5 + 3.5 * door.swing" />
          </filter>
        </defs>

        <!-- Interior, revealed only once the door moves (frame 0 == the static logo). -->
        <g clip-path="url(#boot-door-opening)" :opacity="door.reveal">
          <path :d="rig.interior.aperture" fill="url(#boot-door-room)" />
          <path :d="rig.interior.aperture" fill="url(#boot-door-daylight)" :opacity="door.swing" />
          <path :d="rig.interior.floor" :fill="rig.interior.floorFill" />
          <path :d="rig.interior.jamb" :fill="rig.interior.jambFill" />
          <path
            v-for="(face, i) in door.behind"
            :key="`b${i}`"
            :d="face.d"
            :fill="face.fill"
            :stroke="edgeStroke"
            stroke-width="0.75"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <!-- Soft cast shadow of the door on the orange wall. -->
        <g clip-path="url(#boot-door-wall)">
          <path :d="door.shadow" fill="#3a1200" :opacity="0.3 * door.swing" filter="url(#boot-door-soft)" />
        </g>

        <!-- Door faces in front of the wall plane -->
        <path
          v-for="(face, i) in door.front"
          :key="`f${i}`"
          :d="face.d"
          :fill="face.fill"
          :stroke="edgeStroke"
          stroke-width="0.75"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    </div>
    <span class="sr-only">{{ t('feedback.loading') }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Full-screen loading page: the Builder logo with its door swinging open.
 * Displays the centered Builder logo on white, smoothly opens the door in 3D
 * isometric perspective, reveals the interior & shadow, then fades out into the app.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BUILDER_MARK_DOOR, createDoorRig } from '../../splash/doorGeometry';
import { doorAngleAt, LATCH_START_MS, OPEN_ANGLE, SWING_END_MS } from '../../splash/doorMotion';

const props = withDefaults(
  defineProps<{
    ready: boolean;
    animate?: boolean;
    sound?: boolean;
  }>(),
  {
    animate: true,
    sound: false,
  }
);

const emit = defineEmits<{ done: [] }>();
const { t } = useI18n();

const FADE_MS = 450;
const rig = createDoorRig(BUILDER_MARK_DOOR);
const angle = ref(0);
const elapsed = ref(0);
const leaving = ref(false);

const isAutomated = typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

const effectiveAnimate = computed(() => props.animate && !isAutomated && !prefersReduced);
const minVisibleMs = computed(() => (effectiveAnimate.value ? SWING_END_MS + 150 : 0));

const door = computed(() => rig.frame(angle.value));
// Hairline edge only once the door has moved, so the first frame is identical to the logo.
const edgeStroke = computed(() => `rgba(90,60,30,${(door.value.reveal * 0.35).toFixed(3)})`);

let raf = 0;
let fadeTimer = 0;
let startedAt = 0;
let soundPlayed = false;

function playSound() {
  if (!props.sound || soundPlayed) return;
  soundPlayed = true;
  try {
    const audio = new Audio('/brand/door-sound.m4a');
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    /* Audio autoplay restrictions or offline */
  }
}

function tick(now: number) {
  elapsed.value = now - startedAt;
  if (effectiveAnimate.value) {
    angle.value = doorAngleAt(elapsed.value);
    if (elapsed.value >= LATCH_START_MS) playSound();
  } else {
    angle.value = OPEN_ANGLE;
  }
  if (elapsed.value < minVisibleMs.value) {
    raf = requestAnimationFrame(tick);
  }
}

watch(
  () => props.ready && elapsed.value >= minVisibleMs.value,
  (canLeave) => {
    if (!canLeave || leaving.value) return;
    if (isAutomated) {
      emit('done');
      return;
    }
    leaving.value = true;
    fadeTimer = window.setTimeout(() => emit('done'), FADE_MS);
  },
  { immediate: true }
);

onMounted(() => {
  if (isAutomated) {
    emit('done');
    return;
  }
  startedAt = performance.now();
  if (!effectiveAnimate.value) {
    angle.value = OPEN_ANGLE;
    elapsed.value = 1;
  }
  raf = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.clearTimeout(fadeTimer);
});
</script>
