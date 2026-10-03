<template>
  <div class="space-y-3">
    <!-- Active Category Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900 tracking-tight capitalize">
          {{ categoryTitles[store.selectedCategory] }}
        </h3>
        <p class="text-xs text-slate-500">Välj alternativ för att anpassa din byggnad</p>
      </div>
      <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
        {{ currentOptions.length }} alternativ
      </span>
    </div>

    <!-- Options 2-column Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <!-- Size Options -->
      <template v-if="store.selectedCategory === 'size'">
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
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Outline blueprint representation -->
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
            <p class="text-[11px] text-slate-500 mt-1 leading-snug">{{ size.desc }}</p>
          </div>
        </button>
      </template>

      <!-- Roof Options -->
      <template v-else-if="store.selectedCategory === 'roof'">
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
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg v-if="roof.id === 'sadeltak'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Gabled roof -->
              <path d="M 20 60 L 80 18 L 140 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <line x1="20" y1="60" x2="140" y2="60" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">22° lutning</text>
            </svg>
            <svg v-else-if="roof.id === 'flackt'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Flat modern roof -->
              <line x1="20" y1="35" x2="140" y2="35" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
              <rect x="25" y="38" width="110" height="24" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.2" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">2° funkis</text>
            </svg>
            <svg v-else class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Pulpettak -->
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
      </template>

      <!-- Loft Options -->
      <template v-else-if="store.selectedCategory === 'loft'">
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
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- House frame -->
              <rect x="25" y="15" width="110" height="50" stroke="currentColor" stroke-width="1.5" />
              <!-- Loft slab if enabled -->
              <template v-if="loft.id !== 'none'">
                <rect x="25" y="28" width="55" height="4" fill="currentColor" />
                <!-- Ladder -->
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
      </template>

      <!-- Doors Options -->
      <template v-else-if="store.selectedCategory === 'doors'">
        <button
          v-for="door in DOORS_OPTIONS"
          :key="door.id"
          type="button"
          :id="`option-${door.id}`"
          @click="store.selectDoor(door.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeDoor === door.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Door frame -->
              <rect x="62" y="10" width="36" height="60" rx="1" stroke="currentColor" stroke-width="2" />
              <!-- Handle -->
              <circle cx="92" cy="42" r="1.5" fill="currentColor" />
              <!-- Glass inserts -->
              <template v-if="door.id === 'STEHAG'">
                <rect x="74" y="16" width="12" height="26" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1" />
              </template>
              <template v-else-if="door.id === 'FLENINGE'">
                <rect x="68" y="16" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="80" y="16" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="68" y="28" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
                <rect x="80" y="28" width="10" height="10" stroke="currentColor" stroke-width="0.8" />
              </template>
              <template v-else-if="door.id === 'SVANSHALL'">
                <line x1="80" y1="10" x2="80" y2="70" stroke="currentColor" stroke-width="1.5" />
                <rect x="65" y="14" width="12" height="48" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="0.8" />
                <rect x="83" y="14" width="12" height="48" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="0.8" />
              </template>
              <template v-else>
                <rect x="66" y="14" width="6" height="50" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="0.8" />
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
            <p class="text-[11px] text-slate-500 mt-0.5">{{ door.spec }}</p>
          </div>
        </button>
      </template>

      <!-- Windows Options -->
      <template v-else-if="store.selectedCategory === 'windows'">
        <button
          v-for="win in WINDOWS_OPTIONS"
          :key="win.id"
          type="button"
          :id="`option-${win.id}`"
          @click="store.selectWindow(win.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeWindow === win.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <!-- Window frame -->
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
      </template>

      <!-- Gates Options -->
      <template v-else>
        <button
          v-for="gate in GATES_OPTIONS"
          :key="gate.id"
          type="button"
          :id="`option-${gate.id}`"
          @click="store.selectGate(gate.id)"
          :class="[
            'text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
            store.activeGate === gate.id
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
          ]"
        >
          <!-- Schematic Diagram -->
          <div class="w-full h-20 bg-slate-100/80 rounded-lg mb-2.5 flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="45" y="14" width="70" height="52" rx="1" stroke="currentColor" stroke-width="2" />
              <template v-if="gate.id === 'overhead'">
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
                <!-- Standard wall panel lines -->
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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  useConfigStore,
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
  gates: 'Garageportar'
};

const currentOptions = computed(() => {
  switch (store.selectedCategory) {
    case 'size':
      return SIZE_OPTIONS;
    case 'roof':
      return ROOF_OPTIONS;
    case 'loft':
      return LOFT_OPTIONS;
    case 'doors':
      return DOORS_OPTIONS;
    case 'windows':
      return WINDOWS_OPTIONS;
    case 'gates':
      return GATES_OPTIONS;
    default:
      return [];
  }
});
</script>
