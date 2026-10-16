<template>
  <div
    class="boot-splash"
    :class="{ 'boot-splash--leaving': leaving }"
    role="status"
    aria-live="polite"
    :aria-busy="!leaving"
    @pointerdown="handleUserInteraction"
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

          <!-- Outdoor morning sky revealed as the door opens -->
          <linearGradient id="boot-door-sky" x1="0" y1="54" x2="0" y2="291" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#559be2" />
            <stop offset="0.30" stop-color="#fedaa0" />
            <stop offset="0.65" stop-color="#ff9938" />
            <stop offset="1" stop-color="#6e2503" />
          </linearGradient>

          <!-- Radiant morning sun glow from upper right -->
          <radialGradient id="boot-sun-glow" cx="88%" cy="22%" r="85%">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
            <stop offset="0.18" stop-color="#fff2cc" stop-opacity="0.9" />
            <stop offset="0.45" stop-color="#ffbe58" stop-opacity="0.65" />
            <stop offset="0.75" stop-color="#ff8926" stop-opacity="0.25" />
            <stop offset="1" stop-color="#ff7012" stop-opacity="0" />
          </radialGradient>

          <!-- Volumetric sunbeams streaming into doorway -->
          <linearGradient id="boot-sunray" x1="117" y1="54" x2="35" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="0.38" stop-color="#ffdf88" stop-opacity="0.5" />
            <stop offset="1" stop-color="#ff9e3b" stop-opacity="0" />
          </linearGradient>

          <!-- Golden light spill onto the threshold / floor in front of the door -->
          <linearGradient id="boot-sun-floor-spill" x1="70" y1="264" x2="80" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffb347" stop-opacity="0.75" />
            <stop offset="0.45" stop-color="#ffa030" stop-opacity="0.35" />
            <stop offset="1" stop-color="#ff8a18" stop-opacity="0" />
          </linearGradient>

          <filter id="boot-sun-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>

          <filter id="boot-door-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur :stdDeviation="1.5 + 3.5 * door.swing" />
          </filter>
        </defs>

        <!-- Golden sunlight spilling forward onto the floor in front of the doorway -->
        <g :opacity="door.swing * 0.55">
          <path
            d="M24 291 L117 237 L175 295 L-15 375 Z"
            fill="url(#boot-sun-floor-spill)"
            filter="url(#boot-sun-blur)"
          />
        </g>

        <!-- Interior & outdoor sky, revealed as the door opens -->
        <g clip-path="url(#boot-door-opening)" :opacity="door.reveal">
          <!-- Sky and horizon -->
          <path :d="rig.interior.aperture" fill="url(#boot-door-sky)" />

          <!-- Golden radiant sunburst in upper right sky -->
          <path :d="rig.interior.aperture" fill="url(#boot-sun-glow)" :opacity="door.swing * 0.95" />

          <!-- Diagonal sunbeams streaming into doorway -->
          <polygon
            points="85,54 117,54 75,250 35,250"
            fill="url(#boot-sunray)"
            :opacity="door.swing * 0.45"
          />
          <polygon
            points="100,54 117,70 95,237 60,240"
            fill="url(#boot-sunray)"
            :opacity="door.swing * 0.35"
          />

          <!-- Flying birds across the open morning sky -->
          <g
            v-for="(b, idx) in birds"
            :key="`bird-${idx}`"
            :transform="`translate(${b.x}, ${b.y}) rotate(${b.rot}) scale(${b.scale})`"
          >
            <path :d="b.path" fill="#241208" opacity="0.88" />
          </g>

          <!-- Exposed timber ceiling rafters & beams -->
          <g class="boot-studio__timber">
            <!-- Projecting cross-timber beam sticking slightly out from roof corner -->
            <path
              d="M92 48 L124 33 L124 43 L92 58 Z"
              fill="#d49557"
              stroke="#8c5825"
              stroke-width="0.5"
            />
            <path
              d="M124 33 L130 36 L130 46 L124 43 Z"
              fill="#b67a3f"
              stroke="#8c5825"
              stroke-width="0.5"
            />
            <!-- Top rafter along ceiling slope -->
            <path
              d="M24 104 L117 50 L117 58 L24 112 Z"
              fill="#df9d5b"
            />
            <path
              d="M24 112 L117 58 L117 64 L24 118 Z"
              fill="#ab6b2c"
            />
            <!-- Wall timber posts -->
            <path
              d="M26 114 L33 110 L33 245 L26 249 Z"
              fill="#c68547"
              opacity="0.85"
            />
            <path
              d="M109 68 L116 64 L116 200 L109 204 Z"
              fill="#b27135"
              opacity="0.85"
            />
          </g>

          <!-- Stylized Scandinavian Architect & Builder Couple -->
          <g class="boot-studio__couple">
            <!-- WOMAN (Architect, Left) -->
            <g id="architect-woman">
              <!-- Body / Terracotta work sweater -->
              <path
                d="M36 215 L38 168 Q41 155 52 153 Q63 155 66 168 L68 215 Z"
                fill="#d26938"
              />
              <!-- Sweater knit V-collar -->
              <path
                d="M47 153 L52 165 L57 153 Z"
                fill="#ba5325"
              />
              <!-- Neck -->
              <rect x="49" y="145" width="6" height="10" rx="2" fill="#fcd7ba" />

              <!-- Head & face -->
              <ellipse cx="52" cy="138" rx="8" ry="9" fill="#fcd7ba" />

              <!-- Hair framing face -->
              <path
                d="M43 140 C42 126 62 126 61 140 C61 146 59 152 59 154 C56 150 56 142 56 140 C48 140 48 150 45 154 C45 152 43 146 43 140 Z"
                fill="#61361c"
              />

              <!-- White/ivory architect safety helmet with subtle brim -->
              <path
                d="M42 134 C42 121 62 121 62 134 Z"
                fill="#ffffff"
              />
              <path
                d="M40 134 C40 132 64 132 64 134 C64 135 40 135 40 134 Z"
                fill="#e2e8f0"
              />
              <rect x="50.5" y="122" width="3" height="11" rx="1.5" fill="#e2e8f0" />

              <!-- Eyes: smiling curved arcs -->
              <path d="M47 136 Q49 133.5 51 136" stroke="#4a2810" stroke-width="0.8" fill="none" stroke-linecap="round" />
              <path d="M53 136 Q55 133.5 57 136" stroke="#4a2810" stroke-width="0.8" fill="none" stroke-linecap="round" />

              <!-- Rosy cheeks -->
              <circle cx="47" cy="139" r="1.5" fill="#f87171" opacity="0.45" />
              <circle cx="57" cy="139" r="1.5" fill="#f87171" opacity="0.45" />

              <!-- Happy smiling mouth -->
              <path d="M48.5 141.5 Q52 145.5 55.5 141.5" stroke="#991b1b" stroke-width="0.9" fill="none" stroke-linecap="round" />
            </g>

            <!-- MAN (Builder, Right) -->
            <g id="builder-man">
              <!-- Body / Cream shirt under pine vest -->
              <path
                d="M62 215 L64 162 Q68 148 81 146 Q94 148 98 162 L100 215 Z"
                fill="#e8e4db"
              />
              <!-- Signature Builder Pine Green vest -->
              <path
                d="M65 166 L72 150 Q81 147 90 150 L97 166 L98 215 L88 215 L85 168 L77 168 L74 215 L64 215 Z"
                fill="#173D35"
              />
              <!-- Carpenter pencil in vest pocket -->
              <line x1="88" y1="168" x2="89" y2="158" stroke="#eab308" stroke-width="1.2" stroke-linecap="round" />
              <line x1="89" y1="158" x2="89.5" y2="156" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round" />

              <!-- Neck -->
              <rect x="77.5" y="139" width="7" height="10" rx="2" fill="#fbd5b5" />

              <!-- Head -->
              <ellipse cx="81" cy="131" rx="8.5" ry="9.5" fill="#fbd5b5" />

              <!-- Groomed beard / jawline -->
              <path
                d="M74 132 C74 142 88 142 88 132 C88 135 86 142 81 142 C76 142 74 135 74 132 Z"
                fill="#422a1d"
              />

              <!-- Hair / Cap -->
              <path
                d="M72 129 C72 117 90 117 90 129 C87 122 75 122 72 129 Z"
                fill="#311e14"
              />

              <!-- Smiling eyes -->
              <path d="M76 128 Q78.5 125.5 81 128" stroke="#311e14" stroke-width="0.9" fill="none" stroke-linecap="round" />
              <path d="M82.5 128 Q85 125.5 87.5 128" stroke="#311e14" stroke-width="0.9" fill="none" stroke-linecap="round" />

              <!-- Broad happy smile with white teeth -->
              <path d="M77 134 Q81.5 139 86 134 Z" fill="#ffffff" stroke="#311e14" stroke-width="0.6" stroke-linejoin="round" />
            </g>
          </g>

          <!-- Architect workbench, blueprint, folding ruler & hammer in foreground -->
          <g class="boot-studio__workbench">
            <!-- Tabletop in isometric cross-laminated timber -->
            <polygon
              points="24,228 117,180 117,192 24,240"
              fill="#dfa669"
            />
            <polygon
              points="24,240 117,192 117,201 24,249"
              fill="#9e672f"
            />

            <!-- Unfolded architectural blueprint on workbench -->
            <polygon
              points="34,226 98,193 105,202 41,235"
              fill="#1d4e7c"
              stroke="#60a5fa"
              stroke-width="0.5"
            />
            <!-- Blueprint grid & house wireframe elevation lines -->
            <g stroke="#93c5fd" stroke-width="0.4" opacity="0.85" fill="none">
              <!-- House elevation outline on blueprint -->
              <path d="M52 216 L68 208 L68 219 L52 227 Z" />
              <path d="M52 216 L60 207 L68 208" />
              <path d="M57 224 L63 221" />
              <line x1="74" y1="205" x2="90" y2="197" />
              <line x1="74" y1="210" x2="86" y2="204" />
            </g>
            <!-- Rolled blueprint scroll on desk corner -->
            <ellipse cx="103" cy="199" rx="3.5" ry="2" fill="#2563eb" />
            <path d="M92 194 L103 199 L100 202 L89 197 Z" fill="#3b82f6" />

            <!-- Swedish wooden folding ruler (Tumstock) zigzagging on the blueprint -->
            <g stroke="#f59e0b" stroke-width="1.8" stroke-linecap="square" fill="none">
              <path d="M46 230 L66 219 L56 212 L78 201" />
            </g>
            <!-- Brass joints on folding ruler -->
            <circle cx="66" cy="219" r="0.9" fill="#78350f" />
            <circle cx="56" cy="212" r="0.9" fill="#78350f" />

            <!-- Builder claw hammer resting beside blueprint -->
            <line
              x1="78"
              y1="230"
              x2="97"
              y2="216"
              stroke="#b45309"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <!-- Steel hammer head & claw -->
            <path
              d="M74 233 L80 228 L78 226 L72 231 Z"
              fill="#94a3b8"
              stroke="#475569"
              stroke-width="0.5"
            />
            <path
              d="M72 231 Q70 230 68 232"
              stroke="#64748b"
              stroke-width="1.2"
              fill="none"
              stroke-linecap="round"
            />
          </g>

          <!-- Architectural jamb and floor reveal -->
          <path :d="rig.interior.floor" :fill="rig.interior.floorFill" />
          <path :d="rig.interior.jamb" :fill="rig.interior.jambFill" />

          <!-- Door slab faces behind wall plane -->
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

    <!-- Sound approval prompt: asks user once if approval is missing -->
    <div
      v-if="props.sound && !isAutomated && missingApproval && !leaving"
      class="boot-splash__prompt"
      role="dialog"
      aria-label="Ljudgodkännande"
      @click.stop
      @pointerdown.stop
    >
      <span class="boot-splash__prompt-text">
        🔊 {{ t('consent.soundPrompt') }}
      </span>
      <div class="boot-splash__prompt-actions">
        <button
          type="button"
          id="splash-sound-accept"
          class="boot-splash__prompt-btn boot-splash__prompt-btn--yes"
          @click.stop="approveSound(true)"
        >
          {{ t('consent.soundPromptYes') }}
        </button>
        <button
          type="button"
          id="splash-sound-decline"
          class="boot-splash__prompt-btn boot-splash__prompt-btn--no"
          @click.stop="approveSound(false)"
        >
          {{ t('consent.soundPromptNo') }}
        </button>
      </div>
    </div>

    <!-- Autoplay blocked button: prompt user with one click to unlock and play sound -->
    <button
      v-else-if="props.sound && !isAutomated && autoplayBlocked && !leaving"
      type="button"
      id="splash-sound-unblock"
      class="boot-splash__prompt boot-splash__prompt--unblock"
      @click.stop="unblockAudio"
    >
      <span class="text-sm">🔊</span>
      <span class="boot-splash__prompt-text font-bold">{{ t('consent.clickToPlay') }}</span>
    </button>

    <!-- Sound toggle pill -->
    <button
      v-else-if="props.sound && !isAutomated"
      type="button"
      class="boot-splash__sound-toggle"
      :aria-label="soundActive ? t('consent.soundOff') : t('consent.soundOn')"
      :title="soundActive ? t('consent.soundOffTitle') : t('consent.soundOnTitle')"
      @click.stop="toggleSound"
    >
      <span aria-hidden="true" class="text-xs">{{ soundActive ? '🔊' : '🔈' }}</span>
      <span>{{ soundActive ? t('consent.soundOn') : t('consent.soundToggle') }}</span>
    </button>

    <span class="sr-only">{{ t('feedback.loading') }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Full-screen loading page: the Builder logo with its door swinging open.
 * Displays the centered Builder logo on white, smoothly opens the door in 3D
 * isometric perspective, reveals the interior & shadow, plays authentic door audio,
 * then fades out into the app.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BUILDER_MARK_DOOR, createDoorRig } from '../../splash/doorGeometry';
import { doorAngleAt, LATCH_START_MS, OPEN_ANGLE, SWING_END_MS } from '../../splash/doorMotion';
import {
  getSoundConsent,
  setSoundConsent,
  isSoundApproved,
  isSoundApprovalMissing,
  getCookieConsent,
  type SoundConsent
} from '../../services/consent';
import { playDoorSound, stopDoorSound, preloadDoorAudio } from '../../services/sound';
import { useSessionStore } from '../../store/useSessionStore';

const props = withDefaults(
  defineProps<{
    ready: boolean;
    animate?: boolean;
    sound?: boolean;
  }>(),
  {
    animate: true,
    sound: true,
  }
);

const emit = defineEmits<{ done: [] }>();
const { t } = useI18n();
const sessionStore = useSessionStore();

const FADE_MS = 450;
const rig = createDoorRig(BUILDER_MARK_DOOR);
const angle = ref(0);
const elapsed = ref(0);
const leaving = ref(false);
const soundActive = ref(false);
const missingApproval = ref(isSoundApprovalMissing());
const autoplayBlocked = ref(false);

const isAutomated = typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

const effectiveAnimate = computed(() => props.animate && !isAutomated && !prefersReduced);
const minVisibleMs = computed(() => {
  if (!effectiveAnimate.value) return 0;
  if (missingApproval.value || autoplayBlocked.value) {
    return 6000;
  }
  return SWING_END_MS + 150;
});

const door = computed(() => rig.frame(angle.value));
// Hairline edge only once the door has moved, so the first frame is identical to the logo.
const edgeStroke = computed(() => `rgba(90,60,30,${(door.value.reveal * 0.35).toFixed(3)})`);

interface BirdState {
  x: number;
  y: number;
  rot: number;
  scale: number;
  path: string;
}

function birdPath(flap: number): string {
  const tipY = -1 - 3.5 * flap;
  const midY = -0.5 - 1.8 * flap;
  return `M -6 ${tipY.toFixed(1)} Q -2 ${midY.toFixed(1)} 0 0 Q 2 ${midY.toFixed(1)} 6 ${tipY.toFixed(1)} Q 2 ${(-midY * 0.3).toFixed(1)} 0 0.5 Q -2 ${(-midY * 0.3).toFixed(1)} -6 ${tipY.toFixed(1)} Z`;
}

const birds = computed<BirdState[]>(() => {
  const ms = elapsed.value;
  if (ms < 650) return [];

  const list: BirdState[] = [];

  // Bird 1: Lead swallow soaring across the open sunrise
  const t1 = Math.min(1, Math.max(0, (ms - 700) / 1750));
  if (t1 > 0 && t1 < 1) {
    const x = 12 + 104 * t1;
    const y = 148 - 64 * t1 - 12 * Math.sin(t1 * Math.PI);
    const dx = 104;
    const dy = -64 - 12 * Math.PI * Math.cos(t1 * Math.PI);
    const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
    const flap = Math.sin(ms / 105);
    list.push({ x, y, rot, scale: 1.05, path: birdPath(flap) });
  }

  // Bird 2: Companion follower
  const t2 = Math.min(1, Math.max(0, (ms - 950) / 1700));
  if (t2 > 0 && t2 < 1) {
    const x = 22 + 86 * t2;
    const y = 128 - 62 * t2 - 8 * Math.sin(t2 * Math.PI);
    const dx = 86;
    const dy = -62 - 8 * Math.PI * Math.cos(t2 * Math.PI);
    const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
    const flap = Math.sin(ms / 120 + 1.2);
    list.push({ x, y, rot, scale: 0.78, path: birdPath(flap) });
  }

  // Bird 3: Distant high soarer
  const t3 = Math.min(1, Math.max(0, (ms - 1200) / 1650));
  if (t3 > 0 && t3 < 1) {
    const x = 40 + 55 * t3;
    const y = 96 - 38 * t3 - 6 * Math.sin(t3 * Math.PI);
    const dx = 55;
    const dy = -38 - 6 * Math.PI * Math.cos(t3 * Math.PI);
    const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
    const flap = Math.sin(ms / 140 + 2.5);
    list.push({ x, y, rot, scale: 0.52, path: birdPath(flap) });
  }

  return list;
});

let raf = 0;
let fadeTimer = 0;
let startedAt = 0;
let soundStarted = false;

async function approveSound(granted: boolean) {
  const consent: SoundConsent = granted ? 'granted' : 'denied';
  setSoundConsent(consent);
  if (sessionStore.user) {
    sessionStore.updateUserConsent(consent, getCookieConsent() || 'essential');
  }
  missingApproval.value = false;
  autoplayBlocked.value = false;
  if (granted) {
    soundActive.value = true;
    const res = await playDoorSound(0);
    if (!res.started && res.blockedByAutoplay) {
      autoplayBlocked.value = true;
      soundActive.value = false;
    }
  } else {
    stopDoorSound();
    soundActive.value = false;
  }
}

async function unblockAudio() {
  autoplayBlocked.value = false;
  soundActive.value = true;
  const res = await playDoorSound(Math.max(0, (elapsed.value - LATCH_START_MS) / 1000));
  if (res.started) {
    soundActive.value = true;
  } else {
    soundActive.value = false;
  }
}

function handleUserInteraction() {
  // If sound was blocked on initial load, a user tap anywhere starts playback in sync
  if (!props.sound || isAutomated || soundActive.value || leaving.value) return;
  if (isSoundApproved() || autoplayBlocked.value) {
    unblockAudio();
  }
}

async function toggleSound() {
  if (soundActive.value) {
    stopDoorSound();
    soundActive.value = false;
    setSoundConsent('denied');
    if (sessionStore.user) {
      sessionStore.updateUserConsent('denied', getCookieConsent() || 'essential');
    }
  } else {
    setSoundConsent('granted');
    if (sessionStore.user) {
      sessionStore.updateUserConsent('granted', getCookieConsent() || 'essential');
    }
    missingApproval.value = false;
    autoplayBlocked.value = false;
    soundActive.value = true;
    const res = await playDoorSound(Math.max(0, (elapsed.value - LATCH_START_MS) / 1000));
    if (!res.started) {
      soundActive.value = false;
      if (res.blockedByAutoplay) autoplayBlocked.value = true;
    }
  }
}

function tick(now: number) {
  elapsed.value = now - startedAt;
  if (effectiveAnimate.value) {
    angle.value = doorAngleAt(elapsed.value);
    if (elapsed.value >= LATCH_START_MS && isSoundApproved() && !soundStarted) {
      soundStarted = true;
      playDoorSound(0).then((res) => {
        if (res.started) {
          soundActive.value = true;
        } else if (res.blockedByAutoplay) {
          autoplayBlocked.value = true;
          soundActive.value = false;
        }
      });
    }
  } else {
    angle.value = OPEN_ANGLE;
  }
  if (elapsed.value < minVisibleMs.value) {
    raf = requestAnimationFrame(tick);
  }
}

function onConsentUpdated() {
  missingApproval.value = isSoundApprovalMissing();
  if (!isSoundApproved() && soundActive.value) {
    stopDoorSound();
    soundActive.value = false;
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
  preloadDoorAudio();
  if (typeof window !== 'undefined') {
    window.addEventListener('builder:consent-updated', onConsentUpdated);
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
  if (typeof window !== 'undefined') {
    window.removeEventListener('builder:consent-updated', onConsentUpdated);
  }
  stopDoorSound();
});
</script>
