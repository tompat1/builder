<template>
  <div class="space-y-4">
    <!-- Active Category Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900 tracking-tight">
          <Cms :k="`category.${store.selectedCategory}Title`" />
        </h3>
        <p class="text-xs text-slate-500"><Cms k="category.hint" /></p>
      </div>
      <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
        {{ t('category.options', { count: currentOptionsCount }) }}
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
          {{ t('category.activeSlot', { id: store.selectedSlotId.toUpperCase() }) }}
        </span>
      </div>
      <span class="text-[11px] text-emerald-700">
        <Cms v-if="selectedSlotOccupied" k="category.replaceHint" />
        <Cms v-else k="category.placeHint" />
      </span>
    </div>

    <!-- Category Content: Size & Material -->
    <template v-if="store.selectedCategory === 'size'">
      <!-- Size Options -->
      <div>
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"><Cms k="category.measures" /></h4>
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
            <CmsImage :k="`picture.size.${size.id}`" class="mb-2 h-16 w-full">
            <div class="w-full h-16 bg-slate-100/80 rounded-lg flex items-center justify-center p-1.5 relative overflow-hidden">
              <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
                <rect x="25" y="10" width="110" height="60" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" />
                <rect x="30" y="15" width="100" height="50" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5" />
                <text x="80" y="44" font-size="11" font-weight="bold" fill="currentColor" text-anchor="middle">
                  {{ size.areaSqMeters }} m²
                </text>
              </svg>
              <span class="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 text-slate-700 shadow-2xs border border-slate-200/60">
                <Cms :k="`catalog.${size.id}.badge`" :fallback="size.badge" />
              </span>
            </div>
            </CmsImage>

            <div>
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-slate-900"><Cms :k="`catalog.${size.id}.name`" :fallback="size.name" /></p>
                <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                  {{ money(size.basePrice) }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-snug"><Cms :k="`catalog.${size.id}.desc`" :fallback="size.desc" /></p>
            </div>
          </button>
        </div>

        <div class="flex items-center justify-between gap-3 mt-3 mb-1.5">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Cms k="category.customSize" />
          </h4>
          <div class="relative shrink-0 flex items-center">
            <input
              type="number"
              class="w-20 rounded-md bg-emerald-50 px-2 py-1 text-sm font-extrabold leading-none tabular-nums text-emerald-900 ring-1 ring-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-right pr-7"
              :value="store.dimensions.areaSqMeters.toFixed(1)"
              step="0.1"
              @change="commitArea($event)"
            />
            <span class="absolute right-2 text-xs font-extrabold text-emerald-900 pointer-events-none">m²</span>
          </div>
        </div>
        <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2">
          <label class="block min-w-0">
            <span class="block text-[11px] font-semibold text-slate-600 mb-1">
              <Cms k="category.width" />
              <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
            </span>
            <input
              type="number"
              id="measure-width"
              class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
              :min="BUILDING_LIMITS.width.min / 10"
              :max="BUILDING_LIMITS.width.max / 10"
              step="0.1"
              :value="centimetres(store.dimensions.width)"
              @change="commitMeasure('width', $event)"
            />
          </label>
          <button
            type="button"
            id="btn-swap-plan"
            class="mb-px flex h-[30px] w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
            :aria-label="t('category.swapMeasures')"
            :title="t('category.swapMeasures')"
            @click="store.swapBuildingPlan()"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 8h13M14 5l3 3-3 3" />
              <path d="M20 16H7M10 13l-3 3 3 3" />
            </svg>
          </button>
          <label class="block min-w-0">
            <span class="block text-[11px] font-semibold text-slate-600 mb-1">
              <Cms k="category.depth" />
              <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
            </span>
            <input
              type="number"
              id="measure-depth"
              class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
              :min="BUILDING_LIMITS.depth.min / 10"
              :max="BUILDING_LIMITS.depth.max / 10"
              step="0.1"
              :value="centimetres(store.dimensions.depth)"
              @change="commitMeasure('depth', $event)"
            />
          </label>
          <label class="block min-w-0">
            <span class="block text-[11px] font-semibold text-slate-600 mb-1">
              <Cms k="category.height" />
              <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
            </span>
            <input
              type="number"
              id="measure-height"
              class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
              :min="BUILDING_LIMITS.height.min / 10"
              :max="BUILDING_LIMITS.height.max / 10"
              step="0.1"
              :value="centimetres(store.dimensions.height)"
              @change="commitMeasure('height', $event)"
            />
          </label>
        </div>
        <p class="text-[11px] text-slate-500 mt-1.5"><Cms k="category.heightHint" /></p>
      </div>

      <div class="pt-3 border-t border-slate-200/70">
        <div class="flex border-b border-slate-200 gap-6" role="tablist">
          <button
            type="button"
            id="size-tab-colour"
            role="tab"
            :aria-selected="sizeTab === 'kulor'"
            @click="sizeTab = 'kulor'"
            :class="sizeTabClass(sizeTab === 'kulor')"
          >
            <Cms k="category.colourTab" />
          </button>
          <button
            type="button"
            id="size-tab-facade"
            role="tab"
            :aria-selected="sizeTab === 'panel'"
            @click="sizeTab = 'panel'"
            :class="sizeTabClass(sizeTab === 'panel')"
          >
            <Cms k="category.facadePanel" />
          </button>
        </div>

        <div v-if="sizeTab === 'kulor'" class="pt-3">
          <div v-if="store.currentMaterial.id !== 'wood'" class="flex justify-end mb-2">
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {{ t('category.selected', { name: catalog(store.currentMaterial.id, 'name', store.currentMaterial.name) }) }}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="mat in colourMaterials"
            :key="mat.id"
            type="button"
            :id="`material-${mat.id}`"
            @click="store.selectMaterial(mat.id)"
            :class="[
              'p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all',
              store.activeMaterial === mat.id && !store.customPaint && !store.paintPreview
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            ]"
          >
            <!-- Material Color Swatch -->
            <CmsImage :k="`picture.material.${mat.id}`" class="h-8 w-8 shrink-0">
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
              :style="{ backgroundColor: mat.colorHex }"
            >
              <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
              <svg v-if="store.activeMaterial === mat.id && !store.customPaint && !store.paintPreview" class="w-4 h-4 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            </CmsImage>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-900 truncate"><Cms :k="`catalog.${mat.id}.name`" :fallback="mat.name" /></span>
                <span class="text-[11px] font-semibold text-slate-500 tabular-nums">
                  {{ delta(mat.priceDelta) }}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 truncate"><Cms :k="`catalog.${mat.id}.desc`" :fallback="mat.desc" /></p>
            </div>
          </button>
          <button
            v-for="paint in store.savedPaints"
            :key="paint.id"
            type="button"
            :id="`saved-paint-${paint.id}`"
            class="p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :class="store.customPaint?.id === paint.id && !store.paintPreview
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'"
            :aria-pressed="store.customPaint?.id === paint.id && !store.paintPreview"
            @click="chooseSaved(paint.id)"
          >
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-slate-300 flex items-center justify-center"
              :style="{ backgroundColor: paint.hex, color: readableInk(paint.hex) }"
            >
              <svg v-if="store.customPaint?.id === paint.id && !store.paintPreview" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="min-w-0">
              <span class="block text-xs font-bold text-slate-900 truncate">{{ paintTitle(paint) }}</span>
              <p class="text-[10px] text-slate-600 truncate">{{ paint.hex.toUpperCase() }}</p>
            </div>
          </button>
          <button
            type="button"
            id="btn-custom-paint"
            class="p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :class="paintOpen || store.paintPreview
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'"
            :aria-expanded="paintOpen"
            aria-controls="custom-paint"
            @click="paintOpen = !paintOpen"
          >
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-slate-300 flex items-center justify-center"
              :style="store.paintPreview ? { backgroundColor: store.paintPreview, color: previewInk } : undefined"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div class="min-w-0">
              <span class="block text-xs font-bold text-slate-900 truncate">{{ t('paint.add') }}</span>
              <p class="text-[10px] text-slate-600 truncate">{{ store.paintPreview ? store.paintPreview.toUpperCase() : t('paint.pick') }}</p>
            </div>
          </button>
        </div>
        <CustomPaint v-if="paintOpen" @saved="paintOpen = false" />
        </div>

        <div v-else class="pt-3 space-y-3">
          <div v-if="store.activeMaterial === 'wood' && !store.customPaint && !store.paintPreview" class="flex justify-end">
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {{ t('category.selected', { name: catalog(woodMaterial.id, 'name', woodMaterial.name) }) }}
            </span>
          </div>
          <button
            type="button"
            id="material-wood"
            class="p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            :class="store.activeMaterial === 'wood' && !store.customPaint && !store.paintPreview
              ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'"
            :aria-pressed="store.activeMaterial === 'wood' && !store.customPaint && !store.paintPreview"
            @click="store.selectMaterial('wood')"
          >
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
              :style="{ backgroundColor: woodMaterial.colorHex }"
            >
              <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
              <svg v-if="store.activeMaterial === 'wood' && !store.customPaint && !store.paintPreview" class="w-4 h-4 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-900 truncate"><Cms k="catalog.wood.name" :fallback="woodMaterial.name" /></span>
                <span class="text-[11px] font-semibold text-slate-500 tabular-nums">{{ delta(woodMaterial.priceDelta) }}</span>
              </div>
              <p class="text-[10px] text-slate-500 truncate"><Cms k="catalog.wood.desc" :fallback="woodMaterial.desc" /></p>
            </div>
          </button>
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider"><Cms k="category.cladding" /></h4>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="orientation in panelOrientations"
              :key="orientation.id"
              type="button"
              :id="`panel-${orientation.id}`"
              @click="store.selectPanelOrientation(orientation.id)"
              :class="[
                'p-2.5 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.panelOrientation === orientation.id
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <CmsImage :k="`picture.panel.${orientation.id}`" class="mb-2 h-16 w-full">
              <div class="h-16 w-full overflow-hidden rounded-lg bg-[#cbb892]">
                <svg class="block h-full w-full" viewBox="0 0 160 64" preserveAspectRatio="none" aria-hidden="true">
                  <template v-if="orientation.id === 'staende'">
                    <rect
                      v-for="i in 8"
                      :key="`board-${i}`"
                      :x="(i - 1) * 20"
                      y="0"
                      width="19"
                      height="64"
                      fill="#e7d6b8"
                    />
                    <rect
                      v-for="i in 7"
                      :key="`cover-${i}`"
                      :x="i * 20 - 4"
                      y="0"
                      width="8"
                      height="64"
                      fill="#dcc9a6"
                    />
                    <rect
                      v-for="i in 7"
                      :key="`light-${i}`"
                      :x="i * 20 - 4"
                      y="0"
                      width="1"
                      height="64"
                      fill="#f4ead8"
                    />
                    <rect
                      v-for="i in 7"
                      :key="`shade-${i}`"
                      :x="i * 20 + 3"
                      y="0"
                      width="1"
                      height="64"
                      fill="#b89a70"
                    />
                  </template>
                  <template v-else>
                    <g v-for="i in 4" :key="`course-${i}`">
                      <rect :y="(i - 1) * 16" width="160" height="16" fill="#e7d6b8" />
                      <rect :y="(i - 1) * 16" width="160" height="1.5" fill="#f4ead8" />
                      <rect :y="(i - 1) * 16 + 13.2" width="160" height="2.8" fill="#c4ae86" />
                    </g>
                  </template>
                </svg>
              </div>
              </CmsImage>
              <span class="block text-xs font-bold text-slate-900"><Cms :k="orientation.label" /></span>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <button
              v-for="size in CLADDING_SIZES"
              :key="size.id"
              type="button"
              :id="`panel-size-${size.id}`"
              @click="store.selectCladdingSize(size.id)"
              :class="[
                'px-2.5 py-2 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.claddingSizeId === size.id
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <span class="block text-xs font-bold text-slate-900 tabular-nums">{{ size.thickness }}×{{ size.width }} mm</span>
              <span v-if="size.id === '22x145'" class="block text-[10px] font-semibold text-slate-500"><Cms k="category.standardBoard" /></span>
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1.5"><Cms k="category.claddingHint" /></p>
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
          <CmsImage :k="`picture.roof.${roof.id}`" class="mb-2 h-20 w-full">
          <div class="w-full h-20 bg-slate-100/80 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
            <svg v-if="roof.id === 'sadeltak'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <path d="M 20 60 L 80 18 L 140 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <line x1="20" y1="60" x2="140" y2="60" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">22° lutning</text>
            </svg>
            <svg v-else-if="roof.id === 'sadeltak14'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <path d="M 24 46 L 24 62 L 136 62 L 136 46" stroke="currentColor" stroke-width="1.4" />
              <path d="M 18 46 L 80 32 L 142 46" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <text x="80" y="74" font-size="10" fill="currentColor" text-anchor="middle">14° lutning</text>
            </svg>
            <svg v-else-if="roof.id === 'flackt'" class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <line x1="20" y1="35" x2="140" y2="35" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
              <rect x="25" y="38" width="110" height="24" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.2" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">2° funkis</text>
            </svg>
            <svg v-else class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <line x1="20" y1="16" x2="140" y2="48" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <path d="M 25 18 L 25 60 L 135 60 L 135 48" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" />
              <text x="80" y="72" font-size="10" fill="currentColor" text-anchor="middle">12° pulpettak</text>
            </svg>
          </div>
          </CmsImage>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900"><Cms :k="`catalog.${roof.id}.name`" :fallback="roof.name" /></p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ delta(roof.priceDelta) }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5"><Cms :k="`catalog.${roof.id}.spec`" :fallback="roof.spec ?? ''" /></p>
          </div>
        </button>
      </div>

      <div class="pt-1">
        <p class="text-xs font-bold text-slate-900 mb-2"><Cms k="category.covering" /></p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="cover in ROOF_COVERINGS"
            :key="cover.id"
            type="button"
            :id="`option-roof-${cover.id}`"
            @click="store.selectRoofCovering(cover.id)"
            :class="[
              'text-left p-2.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              store.roofCovering === cover.id
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            ]"
          >
            <CmsImage :k="`picture.cover.${cover.id}`" class="mb-2 h-8 w-full">
              <span
                class="block h-8 rounded-md border border-slate-200"
                :class="coveringSwatch[cover.id]"
              ></span>
            </CmsImage>
            <span class="block text-xs font-bold text-slate-900"><Cms :k="`category.${cover.id}`" /></span>
            <span class="block text-[10px] text-slate-500 mt-0.5"><Cms :k="`category.${cover.id}Body`" /></span>
            <span class="block text-[11px] font-semibold text-slate-500 tabular-nums mt-1">{{ delta(cover.priceDelta) }}</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Loft Options (Matching Skånska Byggvaror Reference Images 4 & 5) -->
    <template v-else-if="store.selectedCategory === 'loft'">
      <div class="space-y-4">
        <!-- Lägg till Loft Toggle Switch -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <label for="option-sleeping" class="text-sm font-bold text-slate-900 block cursor-pointer">
                <Cms k="category.addLoft" />
              </label>
              <p class="text-xs text-slate-500 leading-relaxed mt-1">
                <Cms k="category.addLoftBody" />
              </p>
            </div>

            <!-- Toggle Switch (matches Image 4 & 5 green pill) -->
            <button
              type="button"
              id="option-sleeping"
              role="switch"
              :aria-checked="store.hasLoft"
              @click="store.toggleHasLoft()"
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2',
                store.hasLoft ? 'bg-emerald-800' : 'bg-slate-200'
              ]"
            >
              <span class="sr-only"><Cms k="category.toggleLoft" /></span>
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                  store.hasLoft ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Expanded Loft Configuration (when active) -->
        <template v-if="store.hasLoft">
          <!-- Sub-tabs: Planlösning | Golv -->
          <div class="flex border-b border-slate-200 gap-6">
            <button
              type="button"
              @click="store.setLoftTab('planlosning')"
              :class="[
                'text-xs font-bold pb-2 transition-all',
                store.loftTab === 'planlosning'
                  ? 'border-b-2 border-emerald-800 text-slate-900 font-extrabold'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'
              ]"
            >
              <Cms k="category.plan" />
            </button>
            <button
              type="button"
              @click="store.setLoftTab('golv')"
              :class="[
                'text-xs font-bold pb-2 transition-all',
                store.loftTab === 'golv'
                  ? 'border-b-2 border-emerald-800 text-slate-900 font-extrabold'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'
              ]"
            >
              <Cms k="category.floor" />
            </button>
          </div>

          <!-- Planlösning Tab Content -->
          <div v-if="store.loftTab === 'planlosning'" class="space-y-4 pt-1">
            <!-- 1. Loft Count (Ett loft / Två loft) -->
            <div>
              <div class="flex gap-2">
                <button
                  type="button"
                  id="loft-count-ett"
                  @click="store.setLoftCount('ett')"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    store.loftCount === 'ett'
                      ? 'border-emerald-800 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  ]"
                >
                  <svg v-if="store.loftCount === 'ett'" class="w-3.5 h-3.5 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Cms k="category.oneLoft" />
                </button>
                <button
                  type="button"
                  id="loft-count-tva"
                  @click="store.setLoftCount('tva')"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    store.loftCount === 'tva'
                      ? 'border-emerald-800 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  ]"
                >
                  <svg v-if="store.loftCount === 'tva'" class="w-3.5 h-3.5 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Cms k="category.twoLofts" />
                </button>
              </div>
            </div>

            <!-- 2. Placering (Vänster / Höger) -->
            <div v-if="store.loftCount === 'ett'">
              <h5 class="text-xs font-bold text-slate-800 mb-2"><Cms k="category.placement" /></h5>
              <div class="flex gap-2">
                <button
                  type="button"
                  id="loft-place-vanster"
                  @click="store.setLoftPlacement('vanster')"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    store.loftPlacement === 'vanster'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  ]"
                >
                  <svg v-if="store.loftPlacement === 'vanster'" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Cms k="category.left" />
                </button>
                <button
                  type="button"
                  id="loft-place-hoger"
                  @click="store.setLoftPlacement('hoger')"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    store.loftPlacement === 'hoger'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  ]"
                >
                  <svg v-if="store.loftPlacement === 'hoger'" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Cms k="category.right" />
                </button>
              </div>
            </div>

            <!-- 3. Storlek (10,95 m², 16,43 m², 21,9 m², 27,38 m²) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h5 class="text-xs font-bold text-slate-800"><Cms k="category.size" /></h5>
                <span class="text-[11px] text-slate-500">
                  {{ t('category.buildingArea', { area: store.dimensions.areaSqMeters }) }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="loftSize in store.availableLoftSizes"
                  :key="loftSize.areaSqMeters"
                  type="button"
                  :id="`loft-size-${loftSize.areaSqMeters.toString().replace('.', '-')}`"
                  @click="store.setLoftSize(loftSize.areaSqMeters)"
                  :class="[
                    'p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all relative',
                    Math.abs(store.selectedLoftSize - loftSize.areaSqMeters) < 0.1
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                  ]"
                >
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-1.5">
                      <svg
                        v-if="Math.abs(store.selectedLoftSize - loftSize.areaSqMeters) < 0.1"
                        class="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span class="text-xs font-bold">{{ loftSize.label }}</span>
                    </div>
                    <span
                      :class="[
                        'text-[10px] font-semibold tabular-nums',
                        Math.abs(store.selectedLoftSize - loftSize.areaSqMeters) < 0.1 ? 'text-emerald-100' : 'text-slate-500'
                      ]"
                    >
                      +{{ loftSize.priceDelta.toLocaleString('sv-SE') }} kr
                    </span>
                  </div>
                  <span
                    :class="[
                      'text-[10px] mt-1 truncate',
                      Math.abs(store.selectedLoftSize - loftSize.areaSqMeters) < 0.1 ? 'text-emerald-100' : 'text-slate-500'
                    ]"
                  >
                    <Cms :k="`loftSize.${loftSize.descId}`" :fallback="loftSize.desc" />
                  </span>
                </button>
              </div>
            </div>

            <!-- 4. Lofttrappa / Stege -->
            <div class="pt-1">
              <h5 class="text-xs font-bold text-slate-800 mb-2"><Cms k="category.stair" /></h5>
              <button
                type="button"
                @click="store.toggleLoftStair()"
                :aria-pressed="store.hasLoftStair"
                class="w-full p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                      store.hasLoftStair
                        ? 'bg-emerald-800 border-emerald-800 text-white'
                        : 'border-slate-300 bg-white'
                    ]"
                  >
                    <svg v-if="store.hasLoftStair" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-900 block"><Cms k="category.stairName" /></span>
                    <span class="text-[11px] text-slate-500"><Cms k="category.stairBody" /></span>
                  </div>
                </div>
                <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  <Cms k="price.included" />
                </span>
              </button>

              <div v-if="store.hasLoftStair" class="mt-2 grid grid-cols-2 gap-2" role="group" :aria-label="t('category.stair')">
                <button
                  type="button"
                  id="loft-stair-straight"
                  @click="store.setLoftStairType('straight')"
                  :aria-pressed="store.loftStairType === 'straight'"
                  :class="[
                    'rounded-lg border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700',
                    store.loftStairType === 'straight'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                  ]"
                >
                  <span class="flex items-center gap-1.5 text-xs font-bold">
                    <svg v-if="store.loftStairType === 'straight'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <Cms k="category.stairStraight" />
                  </span>
                  <span :class="['mt-1 block text-[10px] leading-snug', store.loftStairType === 'straight' ? 'text-emerald-100' : 'text-slate-500']">
                    <Cms k="category.stairStraightBody" />
                  </span>
                </button>
                <button
                  type="button"
                  id="loft-stair-curved"
                  @click="store.setLoftStairType('curved')"
                  :aria-pressed="store.loftStairType === 'curved'"
                  :class="[
                    'rounded-lg border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700',
                    store.loftStairType === 'curved'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                  ]"
                >
                  <span class="flex items-center gap-1.5 text-xs font-bold">
                    <svg v-if="store.loftStairType === 'curved'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <Cms k="category.stairCurved" />
                  </span>
                  <span :class="['mt-1 block text-[10px] leading-snug', store.loftStairType === 'curved' ? 'text-emerald-100' : 'text-slate-500']">
                    <Cms k="category.stairCurvedBody" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Golv Tab Content -->
          <div v-else class="space-y-2.5 pt-1">
            <h5 class="text-xs font-bold text-slate-800"><Cms k="category.floorFinish" /></h5>
            <div class="grid grid-cols-1 gap-2">
              <button
                type="button"
                class="p-2.5 rounded-lg border border-emerald-800 bg-emerald-50/50 text-left flex items-center justify-between"
              >
                <div>
                  <span class="text-xs font-bold text-emerald-950 block"><Cms k="category.floorSpruce" /></span>
                  <span class="text-[11px] text-emerald-800"><Cms k="category.floorSpruceBody" /></span>
                </div>
                <span class="text-xs font-bold text-emerald-900"><Cms k="price.included" /></span>
              </button>
              <button
                type="button"
                class="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left flex items-center justify-between"
              >
                <div>
                  <span class="text-xs font-bold text-slate-900 block"><Cms k="category.floorPine" /></span>
                  <span class="text-[11px] text-slate-500"><Cms k="category.floorPineBody" /></span>
                </div>
                <span class="text-xs font-semibold text-slate-600">{{ delta(1800) }}</span>
              </button>
              <button
                type="button"
                class="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left flex items-center justify-between"
              >
                <div>
                  <span class="text-xs font-bold text-slate-900 block"><Cms k="category.floorBoard" /></span>
                  <span class="text-[11px] text-slate-500"><Cms k="category.floorBoardBody" /></span>
                </div>
                <span class="text-xs font-semibold text-slate-600">{{ delta(900) }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Interior Options -->
    <template v-else-if="store.selectedCategory === 'interior'">
      <div class="space-y-4">
        <!-- Blueprint Active Alert -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p class="text-xs font-semibold text-emerald-900 mb-1"><Cms k="interior.blueprintMode" fallback="Blueprint-läge Aktivt" /></p>
          <p class="text-[11px] text-emerald-800 leading-snug">
            <Cms k="interior.blueprintDesc" fallback="Klicka och dra i vyn för att rita, eller be AI-assistenten generera en planlösning." />
          </p>
        </div>

        <!-- Interior Sub-tabs -->
        <div class="flex border-b border-slate-200 gap-4 mb-2">
          <button
            type="button"
            @click="interiorTab = 'layout'"
            :class="interiorTab === 'layout' ? 'text-xs font-bold pb-2 border-b-2 border-emerald-800 text-slate-900' : 'text-xs font-bold pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600'"
          >
            <Cms k="interior.layout" fallback="Planlösning" />
          </button>
          <button
            type="button"
            @click="interiorTab = 'plumbing'"
            :class="interiorTab === 'plumbing' ? 'text-xs font-bold pb-2 border-b-2 border-emerald-800 text-slate-900' : 'text-xs font-bold pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600'"
          >
            <Cms k="interior.plumbing" fallback="Våtrum & VVS" />
          </button>
          <button
            type="button"
            @click="interiorTab = 'electrical'"
            :class="interiorTab === 'electrical' ? 'text-xs font-bold pb-2 border-b-2 border-emerald-800 text-slate-900' : 'text-xs font-bold pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600'"
          >
            <Cms k="interior.electrical" fallback="El & Ljus" />
          </button>
        </div>

        <!-- Layout Content -->
        <template v-if="interiorTab === 'layout'">
          <div>
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"><Cms k="interior.rooms" fallback="Dra & Släpp Rum" /></h4>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'place_room_bedroom' ? 'default' : 'place_room_bedroom')"
                :class="[
                  'p-2 border rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors',
                  store.interactionMode === 'place_room_bedroom'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                ]"
              >
                <div class="flex flex-col items-center">
                  <span><Cms k="interior.bedroom" fallback="Sovrum" /></span>
                  <span class="text-[10px] font-normal opacity-75">3.0 x 3.0 m</span>
                </div>
              </button>
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'place_room_bathroom' ? 'default' : 'place_room_bathroom')"
                :class="[
                  'p-2 border rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors',
                  store.interactionMode === 'place_room_bathroom'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                ]"
              >
                <div class="flex flex-col items-center">
                  <span><Cms k="interior.bathroom" fallback="Badrum" /></span>
                  <span class="text-[10px] font-normal opacity-75">2.0 x 2.0 m</span>
                </div>
              </button>
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'place_room_kitchen' ? 'default' : 'place_room_kitchen')"
                :class="[
                  'p-2 border rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors',
                  store.interactionMode === 'place_room_kitchen'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                ]"
              >
                <div class="flex flex-col items-center">
                  <span><Cms k="interior.kitchen" fallback="Kök / Pentry" /></span>
                  <span class="text-[10px] font-normal opacity-75">3.0 x 2.0 m</span>
                </div>
              </button>
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'place_room_storage' ? 'default' : 'place_room_storage')"
                :class="[
                  'p-2 border rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors',
                  store.interactionMode === 'place_room_storage'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                ]"
              >
                <div class="flex flex-col items-center">
                  <span><Cms k="interior.storage" fallback="Förråd" /></span>
                  <span class="text-[10px] font-normal opacity-75">1.5 x 1.5 m</span>
                </div>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 mt-2"><Cms k="interior.layoutHint" fallback="Dra in zoner för att automatiskt generera innerväggar runt dem." /></p>

            <div v-if="Object.keys(store.placedRooms).length > 0" class="mt-4 pt-4 border-t border-slate-200">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"><Cms k="interior.placedRooms" fallback="Placerade Rum" /></h4>
              <div
                v-for="(room, id) in store.placedRooms"
                :key="id"
                class="mb-3 space-y-1 rounded-lg px-1.5 py-1"
                :class="store.selectedRoomId === id ? 'bg-slate-50' : ''"
              >
                <div class="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                  <button type="button" class="min-w-0 text-left capitalize" @click="store.selectRoom(String(id))">
                    <Cms v-if="room.type === 'bedroom'" k="interior.bedroom" fallback="Sovrum" />
                    <Cms v-else-if="room.type === 'bathroom'" k="interior.bathroom" fallback="Badrum" />
                    <Cms v-else-if="room.type === 'kitchen'" k="interior.kitchen" fallback="Kök / Pentry" />
                    <Cms v-else k="interior.storage" fallback="Förråd" />
                    {{ id.split('_')[1] }}
                  </button>
                  <span class="flex shrink-0 items-center gap-2">
                    <span class="text-[10px] tabular-nums">{{ room.w.toFixed(1) }} × {{ room.d.toFixed(1) }} m</span>
                    <button
                      type="button"
                      class="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                      @click="store.removePlacedRoom(String(id))"
                    >
                      <Cms k="interior.deleteRoom" fallback="Ta bort" />
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <label class="flex-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <Cms k="interior.width" fallback="Bredd:" />
                    <input type="range" min="1.0" max="6.0" step="0.1" v-model.number="room.w" class="w-full accent-slate-900" />
                  </label>
                  <label class="flex-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <Cms k="interior.depth" fallback="Djup:" />
                    <input type="range" min="1.0" max="6.0" step="0.1" v-model.number="room.d" class="w-full accent-slate-900" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"><Cms k="interior.manual" fallback="Manuella Verktyg" /></h4>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'draw_wall' ? 'default' : 'draw_wall')"
                :class="[
                  'p-2 border rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors',
                  store.interactionMode === 'draw_wall'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                ]"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg>
                <Cms k="interior.drawWall" fallback="Rita Vägg" />
              </button>
              <button type="button" class="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21h16M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17M12 4c5 0 7 2 7 8v9"/><circle cx="10" cy="12" r="1" fill="currentColor"/></svg>
                <Cms k="interior.innerDoor" fallback="Innerdörr" />
              </button>
            </div>
          </div>
        </template>

        <!-- Plumbing Content -->
        <template v-if="interiorTab === 'plumbing'">
          <div>
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"><Cms k="interior.utilityCore" fallback="Placera VVS-Kärna" /></h4>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center mb-3">
              <p class="text-[11px] text-slate-600 mb-2"><Cms k="interior.utilityCoreDesc" fallback="Placera kärnan i huset. Systemet drar automatiskt avlopp och tappvatten dit." /></p>
              <button
                type="button"
                @click="store.setInteractionMode(store.interactionMode === 'place_utility' ? 'default' : 'place_utility')"
                :class="[
                  'w-full p-2 border rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2',
                  store.interactionMode === 'place_utility'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                ]"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                <Cms k="interior.placeCore" fallback="Placera Huvudstam" />
              </button>
            </div>
          </div>
        </template>

        <!-- Electrical Content -->
        <template v-if="interiorTab === 'electrical'">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider"><Cms k="interior.smartElec" fallback="Smart El-layout" /></h4>
              <span class="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">AI</span>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
              <p class="text-[11px] text-blue-800 mb-2">
                <Cms k="interior.smartElecDesc" fallback="Vi kan auto-placera uttag varannan meter och brytare vid dörrar enligt svensk standard." />
              </p>
              <button
                type="button"
                @click="store.triggerGenerateElectrical()"
                class="w-full p-2 border border-blue-600 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Cms k="interior.generateElec" fallback="Generera Standard-El" />
              </button>
            </div>
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2"><Cms k="interior.manual" fallback="Manuella Verktyg" /></h4>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <Cms k="interior.outlet" fallback="Eluttag" />
              </button>
              <button type="button" class="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <Cms k="interior.switch" fallback="Strömbrytare" />
              </button>
              <button type="button" class="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <Cms k="interior.ceilingLamp" fallback="Taklampa" />
              </button>
              <button type="button" class="p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2">
                <Cms k="interior.facadeLighting" fallback="Fasadbelysning" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Doors Options -->
    <template v-else-if="store.selectedCategory === 'doors'">
      <!-- Category Title matching other sections -->
      <div class="flex items-center justify-between mb-1">
        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Ytterdörrar
        </h4>
        <span class="text-xs text-slate-500 font-medium">
          {{ Object.values(store.wallSlots).filter(s => s.type === 'door').length }} monterade
        </span>
      </div>

      <!-- Door Type Tabs (Enkeldörrar / Pardörrar / Skjutdörrar) -->
      <div class="flex border-b border-slate-200 gap-4 mb-2">
        <button
          type="button"
          @click.capture="doorTab = 'single'"
          :class="doorTabClass(doorTab === 'single')"
        >
          <Cms k="category.singleDoors" />
        </button>
        <button
          type="button"
          @click.capture="doorTab = 'double'"
          :class="doorTabClass(doorTab === 'double')"
        >
          <Cms k="category.doubleDoors" />
        </button>
        <button
          type="button"
          @click.capture="doorTab = 'sliding'"
          :class="doorTabClass(doorTab === 'sliding')"
        >
          <Cms k="category.slidingDoors" />
        </button>
      </div>

      <!-- Door Series Selector -->
      <div class="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80 mb-2">
        <span class="text-xs font-bold text-slate-700"><Cms k="category.series" /></span>
        <select class="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-900">
          <option>{{ t('category.seriesStabil') }}</option>
          <option>{{ t('category.seriesModern') }}</option>
          <option>{{ t('category.seriesTraditional') }}</option>
        </select>
      </div>

      <!-- Notice when slot cannot accept a door (matching Image 1) -->
      <div
        v-if="!store.selectedSlotCanAcceptDoor"
        id="door-cannot-place-notice"
        class="py-3 px-4 bg-amber-50 rounded-xl border border-amber-200/90 text-center space-y-1 mb-2 animate-fade-in"
      >
        <p class="text-xs font-bold text-amber-900 leading-snug">
          <Cms k="category.doorBlocked" />
        </p>
        <p class="text-[11px] text-amber-700">
          <Cms k="category.doorBlockedHint" />
        </p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="door in DOORS_OPTIONS.filter(d => (d as any).doorType === doorTab)"
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
          <CmsImage :k="`picture.door.${door.id}`" class="mb-2 h-24 w-full">
          <div class="w-full h-24 bg-slate-100/80 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
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
              <template v-else-if="door.id === 'SKJUTDORR'">
                <rect x="30" y="8" width="100" height="64" rx="1" stroke="currentColor" stroke-width="2" />
                <line x1="80" y1="8" x2="80" y2="72" stroke="currentColor" stroke-width="1.5" />
                <rect x="33" y="12" width="44" height="56" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <rect x="83" y="12" width="44" height="56" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <circle cx="77" cy="42" r="1.5" fill="currentColor" />
              </template>
              <template v-else-if="door.id === 'SKJUTDORR3'">
                <rect x="14" y="8" width="132" height="64" rx="1" stroke="currentColor" stroke-width="2" />
                <line x1="58" y1="8" x2="58" y2="72" stroke="currentColor" stroke-width="1.5" />
                <line x1="102" y1="8" x2="102" y2="72" stroke="currentColor" stroke-width="1.5" />
                <rect x="18" y="12" width="36" height="56" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <rect x="62" y="12" width="36" height="56" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <rect x="106" y="12" width="36" height="56" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="0.8" />
                <circle cx="80" cy="42" r="1.5" fill="currentColor" />
              </template>
              <template v-else>
                <rect x="66" y="12" width="6" height="52" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="0.8" />
              </template>
            </svg>
          </div>
          </CmsImage>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900"><Cms :k="`catalog.${door.id}.name`" :fallback="door.name" /></p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ delta(door.priceDelta) }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5"><Cms :k="`catalog.${door.id}.desc`" :fallback="door.desc" /></p>
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
          <CmsImage :k="`picture.window.${win.id}`" class="mb-2 h-20 w-full">
          <div class="w-full h-20 bg-slate-100/80 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none">
              <rect x="55" y="16" width="50" height="48" rx="1" stroke="currentColor" stroke-width="2" />
              <template v-if="win.id === 'panorama'">
                <rect x="58" y="19" width="44" height="42" fill="currentColor" fill-opacity="0.18" />
              </template>
              <template v-else-if="win.id === 'panorama-portrait'">
                <rect x="46" y="8" width="30" height="64" rx="1" stroke="currentColor" stroke-width="2" />
                <rect x="84" y="8" width="30" height="64" rx="1" stroke="currentColor" stroke-width="2" />
                <rect x="49" y="11" width="24" height="58" fill="currentColor" fill-opacity="0.18" />
                <rect x="87" y="11" width="24" height="58" fill="currentColor" fill-opacity="0.18" />
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
          </CmsImage>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900"><Cms :k="`catalog.${win.id}.name`" :fallback="win.name" /></p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ delta(win.priceDelta) }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5"><Cms :k="`catalog.${win.id}.spec`" :fallback="win.spec ?? ''" /></p>
          </div>
        </button>
      </div>
    </template>

    <!-- Gates Options -->
    <template v-else-if="store.selectedCategory === 'gates'">
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
          <CmsImage :k="`picture.gate.${gate.id === 'none' ? 'gate-none' : gate.id}`" class="mb-2 h-20 w-full">
          <div class="w-full h-20 bg-slate-100/80 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
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
          </CmsImage>

          <div>
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-slate-900"><Cms :k="`catalog.${gate.id === 'none' ? 'gate-none' : gate.id}.name`" :fallback="gate.name" /></p>
              <span class="text-xs font-extrabold text-slate-900 tabular-nums">
                {{ delta(gate.priceDelta) }}
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5"><Cms :k="`catalog.${gate.id === 'none' ? 'gate-none' : gate.id}.spec`" :fallback="gate.spec ?? ''" /></p>
          </div>
        </button>
      </div>
    </template>

    <template v-else-if="store.selectedCategory === 'extras'">
      <p class="text-[11px] text-slate-500"><Cms k="category.outsidePlace" /></p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          id="option-door-canopy"
          @click="store.setDoorCanopy(!store.doorCanopy)"
          :aria-pressed="store.doorCanopy"
          :class="outsideCardClass(store.doorCanopy)"
        >
          <div class="w-full h-24 bg-slate-100/80 rounded-lg flex items-center justify-center mb-2">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M28 34h104" />
              <path d="M36 34 48 22h64l12 12" />
              <path d="M52 34v22" />
              <path d="M108 34v22" />
              <rect x="70" y="40" width="20" height="22" />
            </svg>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-slate-900"><Cms k="category.doorCanopy" /></p>
            <span class="text-xs font-extrabold text-slate-900 tabular-nums whitespace-nowrap">{{ delta(OUTSIDE_PRICES.doorCanopy) }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5"><Cms k="category.doorCanopyBody" /></p>
        </button>

        <button
          type="button"
          id="option-terrace"
          @click="store.setTerrace(!store.terrace)"
          :aria-pressed="store.terrace"
          :class="outsideCardClass(store.terrace)"
        >
          <div class="w-full h-24 bg-slate-100/80 rounded-lg flex items-center justify-center mb-2">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M24 46h112" />
              <path d="M28 52h104" />
              <path d="M32 58h96" />
              <path d="M36 64h88" />
              <rect x="72" y="22" width="16" height="24" />
            </svg>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-slate-900"><Cms k="category.terrace" /></p>
            <span class="text-xs font-extrabold text-slate-900 tabular-nums whitespace-nowrap">{{ delta(OUTSIDE_PRICES.terrace) }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5"><Cms k="category.terraceBody" /></p>
        </button>

        <button
          type="button"
          id="option-terrace-ceiling"
          @click="store.setTerraceCeiling(!store.terraceCeiling)"
          :aria-pressed="store.terraceCeiling"
          :class="outsideCardClass(store.terraceCeiling)"
        >
          <div class="w-full h-24 bg-slate-100/80 rounded-lg flex items-center justify-center mb-2">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 28h116" />
              <path d="M30 28 42 16h76l12 12" />
              <path d="M36 28v30" />
              <path d="M124 28v30" />
              <path d="M30 58h100" />
              <path d="M34 64h92" />
            </svg>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-slate-900"><Cms k="category.terraceCeiling" /></p>
            <span class="shrink-0 text-xs font-extrabold text-slate-900 tabular-nums whitespace-nowrap">{{ delta(OUTSIDE_PRICES.terraceCeiling) }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5"><Cms k="category.terraceCeilingBody" /></p>
        </button>

        <button
          type="button"
          id="option-big-terrace"
          @click="store.setBigTerrace(!store.bigTerrace)"
          :aria-pressed="store.bigTerrace"
          :class="outsideCardClass(store.bigTerrace)"
        >
          <div class="w-full h-24 bg-slate-100/80 rounded-lg flex items-center justify-center mb-2">
            <svg class="w-full h-full text-slate-700" viewBox="0 0 160 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 26h132" />
              <path d="M22 26 32 14h96l10 12" />
              <path d="M28 26v28" />
              <path d="M80 26v28" />
              <path d="M132 26v28" />
              <path d="M20 54h120" />
              <path d="M24 60h112" />
              <path d="M28 66h104" />
            </svg>
          </div>
          <div class="flex items-center justify-between gap-2">
            <p class="min-w-0 text-xs font-bold text-slate-900"><Cms k="category.bigTerrace" /></p>
            <span class="shrink-0 text-xs font-extrabold text-slate-900 tabular-nums whitespace-nowrap">{{ delta(OUTSIDE_PRICES.bigTerrace) }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5"><Cms k="category.bigTerraceBody" /></p>
        </button>
      </div>

      <div v-if="store.bigTerrace" class="space-y-1.5">
        <p class="text-[11px] font-bold text-slate-700"><Cms k="category.terraceSide" /></p>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="side in terraceSides"
            :key="side"
            type="button"
            :id="`terrace-side-${side}`"
            @click="store.setTerraceSide(side)"
            :aria-pressed="store.terraceSide === side"
            :class="[
              'py-1.5 rounded-lg border text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              store.terraceSide === side
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            ]"
          >
            <Cms :k="`category.${side}`" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Cms from './Cms.vue';
import CmsImage from './CmsImage.vue';
import {
  useConfigStore,
  BUILDING_LIMITS,
  CLADDING_SIZES,
  MATERIAL_OPTIONS,
  SIZE_OPTIONS,
  ROOF_OPTIONS,
  ROOF_COVERINGS,
  type RoofCovering,
  LOFT_OPTIONS,
  DOORS_OPTIONS,
  WINDOWS_OPTIONS,
  GATES_OPTIONS,
  OUTSIDE_PRICES
} from '../store/useConfigStore';
import { useLabels } from '../i18n';
import CustomPaint from './CustomPaint.vue';
import { paintTitle, readableInk } from '../color/paint';

const store = useConfigStore();
const { t, catalog, money, delta, locale } = useLabels();
const sizeTab = ref<'kulor' | 'panel'>('kulor');
const doorTab = ref<'single' | 'double' | 'sliding'>('single');
const interiorTab = ref<'layout' | 'plumbing' | 'electrical'>('layout');
const colourMaterials = MATERIAL_OPTIONS.filter((mat) => mat.id !== 'wood');
const woodMaterial = MATERIAL_OPTIONS.find((mat) => mat.id === 'wood') ?? MATERIAL_OPTIONS[0];

function sizeTabClass(active: boolean) {
  return [
    'text-xs font-bold pb-2 border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
    active
      ? 'border-slate-900 text-slate-900'
      : 'border-transparent text-slate-400 hover:text-slate-600'
  ];
}

const terraceSides = ['front', 'right', 'back', 'left'] as const;

function outsideCardClass(active: boolean) {
  return [
    'text-left p-3 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
    active
      ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70 shadow-sm'
      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40'
  ];
}

function doorTabClass(active: boolean) {
  return [
    'text-xs pb-2 border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] px-1 -mx-1',
    active
      ? 'font-bold border-emerald-700 text-slate-900'
      : 'font-semibold border-transparent text-slate-400 hover:text-slate-600'
  ];
}
// Removed customArea computed as we now use an input field directly.
const paintOpen = ref(false);
const previewInk = computed(() => readableInk(store.paintPreview ?? '#ffffff'));

function chooseSaved(id: string) {
  paintOpen.value = false;
  store.selectSavedPaint(id);
}

const coveringSwatch: Record<RoofCovering, string> = {
  felt: 'bg-slate-700',
  metal: 'bg-slate-400',
  shingles: 'bg-[#5c4638]',
  tiles: 'bg-stone-500'
};

const panelOrientations = [
  { id: 'staende' as const, label: 'category.standing' },
  { id: 'liggande' as const, label: 'category.lying' }
];

function centimetres(millimetres: number) {
  const cm = millimetres / 10;
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
}

function commitMeasure(axis: 'width' | 'depth' | 'height', event: Event) {
  const raw = Number((event.target as HTMLInputElement).value);
  store.setBuildingMeasure(axis, Math.round(raw * 10));
  (event.target as HTMLInputElement).value = centimetres(store.dimensions[axis]);
}

function commitArea(event: Event) {
  const target = event.target as HTMLInputElement;
  const targetArea = Number(target.value);
  if (isNaN(targetArea) || targetArea <= 0) {
    target.value = store.dimensions.areaSqMeters.toFixed(1);
    return;
  }

  const currentW = store.dimensions.width;
  const currentD = store.dimensions.depth;
  const ratio = currentW / currentD;

  const newDepth = Math.sqrt((targetArea * 1_000_000) / ratio);
  const newWidth = ratio * newDepth;

  store.setBuildingMeasure('width', Math.round(newWidth));
  store.setBuildingMeasure('depth', Math.round(newDepth));

  target.value = store.dimensions.areaSqMeters.toFixed(1);
}

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
    case 'extras':
      return 4;
    default:
      return 0;
  }
});

const selectedSlotOccupied = computed(() => {
  if (!store.selectedSlotId) return false;
  const slot = store.wallSlots[store.selectedSlotId];
  return !!slot && slot.type !== 'empty';
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
