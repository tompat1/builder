<template>
  <div class="space-y-4">
    <!-- Active Category Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900 tracking-tight">
          {{ categoryTitles[store.selectedCategory] }}
        </h3>
        <p class="text-xs text-slate-500">Välj alternativ för att anpassa din byggnad</p>
      </div>
      <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
        {{ currentOptionsCount }} alternativ
      </span>
    </div>

    <!-- Active Wall Slot Assignment Alert -->
    <div
      v-if="['doors', 'windows', 'gates'].includes(store.selectedCategory) && store.selectedSlotId"
      class="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span class="text-xs font-semibold text-emerald-900">
          Aktiv panel i 3D: {{ store.selectedSlotId.toUpperCase() }}
        </span>
      </div>
      <span class="text-[11px] text-emerald-700">Klicka på en produkt för att placera</span>
    </div>

    <!-- Category Content: Size & Material -->
    <template v-if="store.selectedCategory === 'size'">
      <!-- Size Options -->
      <div>
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Byggmått & Area</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            v-for="size in SIZE_OPTIONS"
            :key="size.id"
            type="button"
            :id="`option-${size.id}`"
            @click="store.selectSize(size.id)"
            :class="[
              'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              store.selectedSizeId === size.id
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
            ]"
          >
            <div class="w-full h-16 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-1.5 relative overflow-hidden">
              <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
                <rect x="25" y="10" width="110" height="60" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" />
                <rect x="30" y="15" width="100" height="50" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5" />
                <text x="80" y="44" font-size="11" font-weight="bold" fill="currentColor" text-anchor="middle">
                  {{ size.areaSqMeters }} m²
                </text>
              </svg>
              <span class="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 text-slate-700 shadow-2xs border border-slate-200/60">
                {{ size.badge }}
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-slate-900">{{ size.name }}</p>
                <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                  {{ size.basePrice.toLocaleString('sv-SE') }} kr
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">{{ size.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Material & Fasad Heading -->
      <div class="pt-3 border-t border-slate-200/70">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Fasadmaterial & Kulör</h4>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            Vald: {{ store.currentMaterial.name }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="mat in MATERIAL_OPTIONS"
            :key="mat.id"
            type="button"
            :id="`material-${mat.id}`"
            @click="store.selectMaterial(mat.id)"
            :class="[
              'p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all',
              store.activeMaterial === mat.id
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            ]"
          >
            <!-- Material Color Swatch -->
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
              :style="{ backgroundColor: mat.colorHex }"
            >
              <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
              <svg v-if="store.activeMaterial === mat.id" class="w-4 h-4 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-900 truncate">{{ mat.name }}</span>
                <span class="text-[11px] font-semibold text-slate-500 tabular-nums">
                  {{ mat.priceDelta === 0 ? 'Ingår' : `+${mat.priceDelta.toLocaleString('sv-SE')} kr` }}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 truncate">{{ mat.desc }}</p>
            </div>
          </button>
        </div>
      </div>
    </template>

    <!-- Roof Options -->
    <template v-else-if="store.selectedCategory === 'roof'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="roof in ROOF_OPTIONS"
          :key="roof.id"
          type="button"
          :id="`option-${roof.id}`"
          @click="store.selectRoof(roof.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeRoof === roof.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-2 relative overflow-hidden">
            <svg v-if="roof.id === 'sadeltak'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <path d="M 20 60 L 80 18 L 140 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <line x1="20" y1="60" x2="140" y2="60" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">22° lutning</text>
            </svg>
            <svg v-else-if="roof.id === 'flackt'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <line x1="20" y1="35" x2="140" y2="35" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
              <rect x="25" y="38" width="110" height="24" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.2" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">2° funkis</text>
            </svg>
            <svg v-else class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <line x1="20" y1="24" x2="140" y2="48" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <path d="M 25 26 L 25 60 L 135 60 L 135 48" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">6° pulpettak</text>
            </svg>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900">{{ roof.name }}</p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ roof.priceDelta === 0 ? 'Ingår' : `+${roof.priceDelta.toLocaleString('sv-SE')} kr` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ roof.spec }}</p>
          </div>
        </button>
      </div>
    </template>

    <!-- Loft Options -->
    <template v-else-if="store.selectedCategory === 'loft'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="loft in LOFT_OPTIONS"
          :key="loft.id"
          type="button"
          :id="`option-${loft.id}`"
          @click="store.selectLoft(loft.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeLoft === loft.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="25" y="15" width="110" height="50" stroke="currentColor" stroke-width="1.5" />
              <template v-if="loft.id !== 'none'">
                <rect x="25" y="28" width="55" height="4" fill="currentColor" />
                <line x1="80" y1="28" x2="68" y2="65" stroke="currentColor" stroke-width="1.5" />
                <line x1="77" y1="36" x2="71" y2="38" stroke="currentColor" stroke-width="1" />
                <line x1="75" y1="46" x2="69" y2="48" stroke="currentColor" stroke-width="1" />
              </template>
              <text x="80" y="74" font-size="10" fill="currentColor" text-anchor="middle">
                {{ loft.id === 'none' ? 'Öppet till nock' : 'Loftbjälklag' }}
              </text>
            </svg>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900">{{ loft.name }}</p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ loft.priceDelta === 0 ? 'Ingår' : `+${loft.priceDelta.toLocaleString('sv-SE')} kr` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ loft.spec }}</p>
          </div>
        </button>
      </div>
    </template>

    <!-- Doors Options -->
    <template v-else-if="store.selectedCategory === 'doors'">
      <!-- Door Series Selector -->
      <div class="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <span class="text-xs font-bold text-slate-700">Serie</span>
        <select class="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-900">
          <option>Stabil (Klassiker)</option>
          <option>Modern Funkis</option>
          <option>Allmoge Trä</option>
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="door in DOORS_OPTIONS"
          :key="door.id"
          type="button"
          :id="`option-${door.id}`"
          @click="placeDoor(door.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            isDoorActiveInSelectedSlot(door.id)
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <div class="w-full h-24 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="62" y="8" width="36" height="64" rx="1" stroke="currentColor" stroke-width="2" />
              <circle cx="92" cy="42" r="1.5" fill="currentColor" />
              <template v-if="door.id === 'STEHAG'">
                <rect x="74" y="14" width="12" height="28" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1" />
              </template>
              <template v-else-if="door.id === 'FLENINGE'">
                <rect x="68" y="14" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="80" y="14" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="68" y="26" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="80" y="26" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
              </template>
              <template v-else-if="door.id === 'SVANSHALL'">
                <line x1="80" y1="8" x2="80" y2="72" stroke="currentColor" stroke-width="1.5" />
                <rect x="65" y="12" width="12" height="50" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <rect x="83" y="12" width="12" height="50" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
              </template>
              <template v-else>
                <rect x="66" y="12" width="6" height="52" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="0.8" />
              </template>
            </svg>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900">{{ door.name }}</p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ door.priceDelta === 0 ? 'Ingår' : `+${door.priceDelta.toLocaleString('sv-SE')} kr` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ door.desc }}</p>
          </div>
        </button>
      </div>
    </template>

    <!-- Windows Options -->
    <template v-else-if="store.selectedCategory === 'windows'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="win in WINDOWS_OPTIONS"
          :key="win.id"
          type="button"
          :id="`option-${win.id}`"
          @click="placeWindow(win.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            isWindowActiveInSelectedSlot(win.id)
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="55" y="16" width="50" height="48" rx="1" stroke="currentColor" stroke-width="2" />
              <template v-if="win.id === 'panorama'">
                <rect x="58" y="19" width="44" height="42" fill="currentColor" fill-opacity="0.18" />
              </template>
              <template v-else-if="win.id === 'sprojat'">
                <line x1="80" y1="16" x2="80" y2="64" stroke="currentColor" stroke-width="1.2" />
                <line x1="55" y1="40" x2="105" y2="40" stroke="currentColor" stroke-width="1.2" />
              </template>
              <template v-else-if="win.id === 'frost'">
                <rect x="62" y="24" width="36" height="32" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" />
              </template>
              <template v-else>
                <circle cx="80" cy="40" r="14" stroke="currentColor" stroke-width="1" stroke-dasharray="4 2" />
                <line x1="80" y1="16" x2="80" y2="64" stroke="currentColor" stroke-width="1" />
              </template>
            </svg>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900">{{ win.name }}</p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ win.priceDelta === 0 ? 'Ingår' : `+${win.priceDelta.toLocaleString('sv-SE')} kr` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ win.spec }}</p>
          </div>
        </button>
      </div>
    </template>

    <!-- Gates Options -->
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="gate in GATES_OPTIONS"
          :key="gate.id"
          type="button"
          :id="`option-${gate.id}`"
          @click="placeGate(gate.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeGate === gate.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="45" y="14" width="70" height="52" rx="1" stroke="currentColor" stroke-width="2" />
              <template v-if="gate.id.includes('overhead')">
                <line x1="45" y1="27" x2="115" y2="27" stroke="currentColor" stroke-width="1" />
                <line x1="45" y1="40" x2="115" y2="40" stroke="currentColor" stroke-width="1" />
                <line x1="45" y1="53" x2="115" y2="53" stroke="currentColor" stroke-width="1" />
              </template>
              <template v-else-if="gate.id === 'wood-slag'">
                <line x1="80" y1="14" x2="80" y2="66" stroke="currentColor" stroke-width="1.5" />
                <line x1="56" y1="20" x2="72" y2="60" stroke="currentColor" stroke-width="1" />
                <line x1="104" y1="20" x2="88" y2="60" stroke="currentColor" stroke-width="1" />
              </template>
              <template v-else>
                <line x1="60" y1="14" x2="60" y2="66" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 2" />
                <line x1="80" y1="14" x2="80" y2="66" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 2" />
                <line x1="100" y1="14" x2="100" y2="66" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 2" />
              </template>
            </svg>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900">{{ gate.name }}</p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ gate.priceDelta === 0 ? 'Ingår' : `+${gate.priceDelta.toLocaleString('sv-SE')} kr` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ gate.spec }}</p>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  useConfigStore,
  MATERIAL_OPTIONS,
  SIZE_OPTIONS,
  ROOF_OPTIONS,
  LOFT_OPTIONS,
  DOORS_OPTIONS,
  WINDOWS_OPTIONS,
  GATES_OPTIONS
} from '../store/useConfigStore';

const store = useConfigStore();

const categoryTitles: Record<string, string> = {
  size: 'Storlek & Grundmått',
  roof: 'Taktyp & Vinkel',
  loft: 'Loft & Rymd',
  doors: 'Ytterdörrar',
  windows: 'Fönsterpartier',
  gates: 'Portar & Partier'
};

const currentOptionsCount = computed(() => {
  switch (store.selectedCategory) {
    case 'size':
      return SIZE_OPTIONS.length;
    case 'roof':
      return ROOF_OPTIONS.length;
    case 'loft':
      return LOFT_OPTIONS.length;
    case 'doors':
      return DOORS_OPTIONS.length;
    case 'windows':
      return WINDOWS_OPTIONS.length;
    case 'gates':
      return GATES_OPTIONS.length;
    default:
      return 0;
  }
});

function isDoorActiveInSelectedSlot(doorId: string): boolean {
  if (!store.selectedSlotId) return store.activeDoor === doorId;
  const slot = store.wallSlots[store.selectedSlotId];
  return slot?.type === 'door' && slot.itemId === doorId;
}

function isWindowActiveInSelectedSlot(winId: string): boolean {
  if (!store.selectedSlotId) return store.activeWindow === winId;
  const slot = store.wallSlots[store.selectedSlotId];
  return slot?.type === 'window' && slot.itemId === winId;
}

function placeDoor(doorId: string) {
  store.selectDoor(doorId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'door', doorId);
  }
}

function placeWindow(winId: string) {
  store.selectWindow(winId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'window', winId);
  }
}

function placeGate(gateId: string) {
  store.selectGate(gateId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'gate', gateId);
  }
}
</script>
