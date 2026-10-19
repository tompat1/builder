<template>
  <Transition name="menu-flow" mode="out-in">
  <div :key="store.selectedCategory" class="space-y-4">
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
            <Cms :k="store.selectedSizeId === 'size-paabyggnad' ? 'category.timberSize' : 'category.customSize'" />
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
              :min="planLimit('width', 'min')"
              :max="planLimit('width', 'max')"
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
              :min="planLimit('depth', 'min')"
              :max="planLimit('depth', 'max')"
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
              :min="planLimit('height', 'min')"
              :max="planLimit('height', 'max')"
              step="0.1"
              :value="centimetres(store.dimensions.height)"
              @change="commitMeasure('height', $event)"
            />
          </label>
        </div>
        <p class="text-[11px] text-slate-500 mt-1.5"><Cms k="category.heightHint" /></p>
        <p v-if="store.selectedSizeId === 'size-paabyggnad'" class="text-[11px] text-slate-600 mt-1.5 leading-snug">
          <Cms k="category.paabyggnadHint" />
        </p>

        <div v-if="store.selectedSizeId === 'size-paabyggnad'" class="mt-4">
          <div class="flex items-center justify-between gap-3 mb-1.5">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Cms k="category.concreteSize" />
            </h4>
            <span class="text-xs font-extrabold tabular-nums text-slate-700">
              {{ concreteArea.toFixed(1) }} m²
            </span>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2">
            <label class="block min-w-0">
              <span class="block text-[11px] font-semibold text-slate-600 mb-1">
                <Cms k="category.width" />
                <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
              </span>
              <input
                type="number"
                id="measure-concrete-width"
                class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                :min="concreteLimit('width', 'min')"
                :max="concreteLimit('width', 'max')"
                step="0.1"
                :value="centimetres(store.concreteWidth)"
                @change="commitConcrete('width', $event)"
              />
            </label>
            <button
              type="button"
              id="btn-swap-concrete"
              class="mb-px flex h-[30px] w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
              :aria-label="t('category.swapMeasures')"
              :title="t('category.swapMeasures')"
              @click="store.swapConcretePlan()"
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
                id="measure-concrete-depth"
                class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                :min="concreteLimit('depth', 'min')"
                :max="concreteLimit('depth', 'max')"
                step="0.1"
                :value="centimetres(store.concreteDepth)"
                @change="commitConcrete('depth', $event)"
              />
            </label>
            <label class="block min-w-0">
              <span class="block text-[11px] font-semibold text-slate-600 mb-1">
                <Cms k="category.height" />
                <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
              </span>
              <input
                type="number"
                id="measure-concrete-height"
                class="w-full text-xs font-semibold tabular-nums bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                :min="concreteLimit('height', 'min')"
                :max="concreteLimit('height', 'max')"
                step="0.1"
                :value="centimetres(store.concreteHeight)"
                @change="commitConcrete('height', $event)"
              />
            </label>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Cms k="category.concreteWalls" />
            </h4>
            <button
              type="button"
              id="btn-add-concrete-wall"
              class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="store.concreteWalls.length >= 8"
              @click="store.addConcreteWall()"
            >
              <Cms k="category.addConcreteWall" />
            </button>
          </div>
          <div v-if="store.concreteWalls.length === 0" class="mt-1.5 text-[11px] leading-snug text-slate-500">
            <Cms k="category.concreteWallsHint" />
          </div>
          <div
            v-for="wall in store.concreteWalls"
            :key="wall.id"
            class="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto] items-end gap-2"
          >
            <div class="min-w-0">
              <span class="mb-1 block text-[11px] font-semibold text-slate-600">
                <Cms k="category.concreteWallRun" />
              </span>
              <div class="flex rounded-lg border border-slate-300 bg-white p-0.5">
                <button
                  type="button"
                  class="min-h-7 flex-1 rounded-md px-1.5 text-[11px] font-bold focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  :class="wall.axis === 'x' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'"
                  :aria-pressed="wall.axis === 'x'"
                  @click="store.setConcreteWall(wall.id, { axis: 'x' })"
                >
                  <Cms k="category.concreteWallAcross" />
                </button>
                <button
                  type="button"
                  class="min-h-7 flex-1 rounded-md px-1.5 text-[11px] font-bold focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  :class="wall.axis === 'z' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'"
                  :aria-pressed="wall.axis === 'z'"
                  @click="store.setConcreteWall(wall.id, { axis: 'z' })"
                >
                  <Cms k="category.concreteWallAlong" />
                </button>
              </div>
            </div>
            <label class="block min-w-0">
              <span class="mb-1 block text-[11px] font-semibold text-slate-600">
                <Cms k="category.concreteWallPlace" />
                <span class="font-medium text-slate-400"> ({{ t('category.unitCm') }})</span>
              </span>
              <input
                type="number"
                class="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                :min="concreteWallLimit(wall.axis, 'min')"
                :max="concreteWallLimit(wall.axis, 'max')"
                step="1"
                :value="centimetres(wall.offsetMm)"
                @change="commitConcreteWall(wall.id, $event)"
              />
            </label>
            <button
              type="button"
              class="mb-px flex h-[30px] w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
              :aria-label="t('category.removeConcreteWall')"
              @click="store.removeConcreteWall(wall.id)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <!-- Betongväggar Kulör -->
          <div class="mt-4 pt-3.5 border-t border-slate-200/80">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Cms k="category.concreteColor" />
                </h4>
                <p class="text-[11px] text-slate-500">
                  <Cms k="category.concreteColorHint" />
                </p>
              </div>
              <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                {{ currentConcreteColorName }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="opt in CONCRETE_COLOR_OPTIONS"
                :key="opt.id"
                type="button"
                :id="`concrete-color-${opt.id}`"
                @click="store.selectConcreteColor(opt.colorHex)"
                :class="[
                  'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                  store.concreteColor.toLowerCase() === opt.colorHex.toLowerCase()
                    ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                ]"
              >
                <div
                  class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
                  :style="{ backgroundColor: opt.colorHex }"
                >
                  <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                  <svg v-if="store.concreteColor.toLowerCase() === opt.colorHex.toLowerCase()" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <span class="block text-xs font-bold text-slate-900 truncate"><Cms :k="opt.label" /></span>
                </div>
              </button>
            </div>

            <!-- Custom Concrete Color Input & Swatches -->
            <div class="mt-2.5 flex flex-wrap items-center gap-2">
              <div
                v-for="color in customConcreteColors"
                :key="color"
                class="relative inline-flex items-center"
              >
                <button
                  type="button"
                  :id="store.concreteColor.toLowerCase() === color.toLowerCase() ? 'concrete-color-custom' : `concrete-color-custom-${color.replace('#', '')}`"
                  @click="store.selectConcreteColor(color)"
                  class="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  :class="store.concreteColor.toLowerCase() === color.toLowerCase()
                    ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
                >
                  <label
                    class="relative w-5 h-5 rounded border border-slate-300 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
                    :style="{ backgroundColor: color }"
                    title="Adjust color"
                  >
                    <input
                      type="color"
                      class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      :value="color"
                      @input="store.updateConcreteColor(color, ($event.target as HTMLInputElement).value)"
                      @click.stop
                    />
                    <svg v-if="store.concreteColor.toLowerCase() === color.toLowerCase()" class="w-3 h-3 drop-shadow-sm" :class="readableInk(color) === '#ffffff' ? 'text-white' : 'text-slate-900'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </label>
                  <span><Cms k="category.concreteCustom" /></span>
                  <span class="text-[10px] font-mono text-slate-500">
                    {{ color.toUpperCase() }}
                  </span>
                  <span
                    v-if="customConcreteColors.length > 1"
                    role="button"
                    tabindex="0"
                    :aria-label="t('tools.remove') || 'Remove'"
                    class="ml-0.5 -mr-1 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    @click.stop="store.removeConcreteColor(color)"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </span>
                </button>
              </div>

              <!-- Add new custom concrete color button -->
              <label
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 bg-white hover:border-slate-400 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <input
                  type="color"
                  class="sr-only"
                  value="#b7b3ac"
                  @change="store.addConcreteColor(($event.target as HTMLInputElement).value)"
                />
                <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span><Cms k="category.concreteCustom" /></span>
              </label>
            </div>
          </div>
        </div>
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
            class="group relative p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
            <div class="min-w-0 flex-1">
              <span class="block text-xs font-bold text-slate-900 truncate">{{ paintTitle(paint) }}</span>
              <p class="text-[10px] text-slate-600 truncate">{{ paint.hex.toUpperCase() }}</p>
            </div>
            <span
              v-if="store.savedPaints.length > 1"
              role="button"
              tabindex="0"
              class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              :aria-label="t('tools.remove') || 'Remove'"
              @click.stop="store.removeSavedPaint(paint.id)"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </span>
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
            @click="openAddPaint"
          >
            <div
              class="w-8 h-8 rounded-lg shrink-0 border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-700"
              :style="store.paintPreview ? { backgroundColor: store.paintPreview, color: previewInk } : undefined"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div class="min-w-0">
              <span class="block text-xs font-bold text-slate-900 truncate">
                + {{ store.savedPaints.length > 0 ? t('paint.addMore') : t('paint.add') }}
              </span>
              <p class="text-[10px] text-slate-600 truncate">{{ store.paintPreview ? store.paintPreview.toUpperCase() : t('paint.pick') }}</p>
            </div>
          </button>
        </div>
        <CustomPaint v-if="paintOpen" @saved="paintOpen = false" />

        <!-- Betongväggar Kulör i Kulör-fliken (Påbyggnad) -->
        <div v-if="store.selectedSizeId === 'size-paabyggnad'" class="mt-5 pt-4 border-t border-slate-200/80">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Cms k="category.concreteColor" />
              </h4>
              <p class="text-[11px] text-slate-500">
                <Cms k="category.concreteColorHint" />
              </p>
            </div>
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {{ currentConcreteColorName }}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="opt in CONCRETE_COLOR_OPTIONS"
              :key="`tab-${opt.id}`"
              type="button"
              :id="`tab-concrete-color-${opt.id}`"
              @click="store.selectConcreteColor(opt.colorHex)"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.concreteColor.toLowerCase() === opt.colorHex.toLowerCase()
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
                :style="{ backgroundColor: opt.colorHex }"
              >
                <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                <svg v-if="store.concreteColor.toLowerCase() === opt.colorHex.toLowerCase()" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms :k="opt.label" /></span>
              </div>
            </button>
          </div>

          <!-- Custom Concrete Color Input & Swatches -->
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <div
              v-for="color in customConcreteColors"
              :key="`tab-${color}`"
              class="relative inline-flex items-center"
            >
              <button
                type="button"
                :id="store.concreteColor.toLowerCase() === color.toLowerCase() ? 'tab-concrete-color-custom' : `tab-concrete-color-custom-${color.replace('#', '')}`"
                @click="store.selectConcreteColor(color)"
                class="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                :class="store.concreteColor.toLowerCase() === color.toLowerCase()
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
              >
                <label
                  class="relative w-5 h-5 rounded border border-slate-300 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
                  :style="{ backgroundColor: color }"
                  title="Adjust color"
                >
                  <input
                    type="color"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :value="color"
                    @input="store.updateConcreteColor(color, ($event.target as HTMLInputElement).value)"
                    @click.stop
                  />
                  <svg v-if="store.concreteColor.toLowerCase() === color.toLowerCase()" class="w-3 h-3 drop-shadow-sm" :class="readableInk(color) === '#ffffff' ? 'text-white' : 'text-slate-900'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </label>
                <span><Cms k="category.concreteCustom" /></span>
                <span class="text-[10px] font-mono text-slate-500">
                  {{ color.toUpperCase() }}
                </span>
                <span
                  v-if="customConcreteColors.length > 1"
                  role="button"
                  tabindex="0"
                  :aria-label="t('tools.remove') || 'Remove'"
                  class="ml-0.5 -mr-1 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  @click.stop="store.removeConcreteColor(color)"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              </button>
            </div>

            <!-- Add new custom concrete color button -->
            <label
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 bg-white hover:border-slate-400 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <input
                type="color"
                class="sr-only"
                value="#b7b3ac"
                @change="store.addConcreteColor(($event.target as HTMLInputElement).value)"
              />
              <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span><Cms k="category.concreteCustom" /></span>
            </label>
          </div>
        </div>
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

        <!-- Knutbrädor (Corner Boards) -->
        <div class="mt-4 pt-3.5 border-t border-slate-200/80">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Cms k="category.cornerBoards" />
              </h4>
              <p class="text-[11px] text-slate-500">
                <Cms k="category.cornerBoardsHint" />
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="store.cornerBoards"
                class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60"
              >
                {{ currentCornerColorName }}
              </span>
              <button
                type="button"
                id="toggle-corner-boards"
                role="switch"
                :aria-checked="store.cornerBoards"
                :aria-label="t('category.toggleCornerBoards')"
                @click="store.toggleCornerBoards()"
                :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2',
                  store.cornerBoards ? 'bg-emerald-800' : 'bg-slate-200'
                ]"
              >
                <span class="sr-only"><Cms k="category.toggleCornerBoards" /></span>
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    store.cornerBoards ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
            </div>
          </div>

          <template v-if="store.cornerBoards">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <!-- Samma som fasad -->
            <button
              type="button"
              id="corner-color-same"
              @click="store.selectCornerColor('same')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'same'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden"
                :style="{ backgroundColor: currentFacadeColorHex }"
              >
                <div class="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                <svg v-if="store.cornerColor === 'same'" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerSame" /></span>
              </div>
            </button>

            <!-- Vit -->
            <button
              type="button"
              id="corner-color-white"
              @click="store.selectCornerColor('white')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'white'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden bg-[#f8fafc]"
              >
                <svg v-if="store.cornerColor === 'white'" class="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerWhite" /></span>
              </div>
            </button>

            <!-- Falu röd -->
            <button
              type="button"
              id="corner-color-falurod"
              @click="store.selectCornerColor('falurod')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'falurod'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden bg-[#8b2522]"
              >
                <svg v-if="store.cornerColor === 'falurod'" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerFalurod" /></span>
              </div>
            </button>

            <!-- Grå -->
            <button
              type="button"
              id="corner-color-grey"
              @click="store.selectCornerColor('grey')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'grey'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden bg-[#64748b]"
              >
                <svg v-if="store.cornerColor === 'grey'" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerGrey" /></span>
              </div>
            </button>

            <!-- Svart -->
            <button
              type="button"
              id="corner-color-black"
              @click="store.selectCornerColor('black')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'black'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden bg-[#1e293b]"
              >
                <svg v-if="store.cornerColor === 'black'" class="w-3.5 h-3.5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerBlack" /></span>
              </div>
            </button>

            <!-- Trä -->
            <button
              type="button"
              id="corner-color-wood"
              @click="store.selectCornerColor('wood')"
              :class="[
                'p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                store.cornerColor === 'wood'
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div
                class="w-7 h-7 rounded-lg shrink-0 border border-slate-300 shadow-xs flex items-center justify-center relative overflow-hidden bg-[#e8d8be]"
              >
                <svg v-if="store.cornerColor === 'wood'" class="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold text-slate-900 truncate"><Cms k="category.cornerWood" /></span>
              </div>
            </button>
          </div>

          <!-- Custom Corner Board Color Input & Swatches -->
          <div class="mt-2.5 flex flex-wrap items-center gap-2">
            <!-- Saved custom corner colors -->
            <div
              v-for="color in customCornerColors"
              :key="color"
              class="relative inline-flex items-center"
            >
              <button
                type="button"
                :id="store.cornerColor === color ? 'corner-color-custom' : `corner-color-custom-${color.replace('#', '')}`"
                @click="store.selectCornerColor(color)"
                class="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                :class="store.cornerColor === color
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50 shadow-sm text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'"
              >
                <label
                  class="relative w-5 h-5 rounded border border-slate-300 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden"
                  :style="{ backgroundColor: color }"
                  title="Adjust color"
                >
                  <input
                    type="color"
                    class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    :value="color"
                    @input="store.updateCornerColor(color, ($event.target as HTMLInputElement).value)"
                    @click.stop
                  />
                  <svg v-if="store.cornerColor === color" class="w-3 h-3 drop-shadow-sm" :class="readableInk(color) === '#ffffff' ? 'text-white' : 'text-slate-900'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </label>
                <span><Cms k="category.cornerCustom" /></span>
                <span class="text-[10px] font-mono text-slate-500">
                  {{ color.toUpperCase() }}
                </span>
                <span
                  v-if="customCornerColors.length > 1"
                  role="button"
                  tabindex="0"
                  :aria-label="t('tools.remove') || 'Remove'"
                  class="ml-0.5 -mr-1 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  @click.stop="store.removeCornerColor(color)"
                >
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              </button>
            </div>

            <!-- + Add new custom corner color -->
            <label
              :id="customCornerColors.length === 0 ? 'corner-color-custom' : 'btn-add-corner-color'"
              class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-slate-900"
              :title="t('category.cornerAddColor')"
            >
              <input
                type="color"
                class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value="#df9b9b"
                @input="onAddCornerColor(($event.target as HTMLInputElement).value)"
              />
              <svg class="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span class="font-bold text-slate-800">
                <Cms :k="customCornerColors.length === 0 ? 'category.cornerCustom' : 'category.cornerAddColor'" />
              </span>
            </label>
          </div>
        </template>
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
        <p class="text-xs font-bold text-slate-900 mb-2"><Cms k="category.roofEdge" /></p>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" :aria-label="t('category.roofEdge')">
          <button
            type="button"
            id="option-roof-overhang"
            role="radio"
            :aria-checked="!store.flushRoof"
            @click="store.setFlushRoof(false)"
            :class="[
              'text-left p-2.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              !store.flushRoof
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            ]"
          >
            <span class="mb-2 flex h-8 items-center justify-center text-slate-700">
              <svg class="h-8 w-full" viewBox="0 0 120 32" fill="none" aria-hidden="true">
                <path d="M8 14 H112" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                <path d="M28 14 V28 H92 V14" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </span>
            <span class="block text-xs font-bold text-slate-900"><Cms k="category.roofOverhang" /></span>
            <span class="block text-[10px] text-slate-500 mt-0.5"><Cms k="category.roofOverhangBody" /></span>
          </button>
          <button
            type="button"
            id="option-roof-flush"
            role="radio"
            :aria-checked="store.flushRoof"
            @click="store.setFlushRoof(true)"
            :class="[
              'text-left p-2.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
              store.flushRoof
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/70'
                : 'border-slate-200/90 bg-white hover:border-slate-300'
            ]"
          >
            <span class="mb-2 flex h-8 items-center justify-center text-slate-700">
              <svg class="h-8 w-full" viewBox="0 0 120 32" fill="none" aria-hidden="true">
                <path d="M28 14 H92" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                <path d="M28 14 V28 H92 V14" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </span>
            <span class="block text-xs font-bold text-slate-900"><Cms k="category.roofFlush" /></span>
            <span class="block text-[10px] text-slate-500 mt-0.5"><Cms k="category.roofFlushBody" /></span>
          </button>
        </div>
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

            <!-- 2. Placering (vänster, höger, fram, bak) -->
            <div v-if="store.loftCount === 'ett'">
              <h5 class="text-xs font-bold text-slate-800 mb-2"><Cms k="category.placement" /></h5>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="place in loftPlaces"
                  :key="place.id"
                  type="button"
                  :id="`loft-place-${place.id}`"
                  @click="store.setLoftPlacement(place.id)"
                  :class="[
                    'py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                    store.loftPlacement === place.id
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  ]"
                >
                  <svg v-if="store.loftPlacement === place.id" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Cms :k="place.label" />
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

              <div v-if="store.hasLoftStair" class="mt-3">
                <h6 class="text-[11px] font-bold text-slate-800"><Cms k="category.stairPosition" /></h6>
                <p class="mt-0.5 text-[10px] leading-snug text-slate-500"><Cms k="category.stairPositionBody" /></p>
                <div class="mt-2 grid grid-cols-2 gap-2" role="group" :aria-label="t('category.stairPosition')">
                  <button
                    v-for="position in loftStairPositions"
                    :key="position.id"
                    type="button"
                    :id="`loft-stair-position-${position.id}`"
                    @click="store.setLoftStairPosition(position.id)"
                    :aria-pressed="store.loftStairPosition === position.id"
                    :class="[
                      'min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700',
                      store.loftStairPosition === position.id
                        ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    ]"
                  >
                    <span class="flex items-center justify-center gap-1.5">
                      <svg v-if="store.loftStairPosition === position.id" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Cms :k="position.label" />
                    </span>
                  </button>
                </div>
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

        <!-- Inner Walls / Drywall Toggle Switch -->
        <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div class="min-w-0 pr-2">
            <h4 class="text-xs font-bold text-slate-800"><Cms k="interior.innerWalls" fallback="Innerväggar (gips)" /></h4>
            <p class="text-[11px] text-slate-500 leading-snug"><Cms k="interior.innerWallsHint" fallback="Visa eller dölj vita gipsväggar" /></p>
          </div>
          <button
            type="button"
            role="switch"
            id="toggle-inner-walls"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            :class="store.showInnerWalls ? 'bg-slate-900' : 'bg-slate-300'"
            :aria-checked="store.showInnerWalls"
            :aria-label="store.showInnerWalls ? t('interior.hideInnerWalls') : t('interior.showInnerWalls')"
            @click="store.toggleInnerWalls()"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
              :class="store.showInnerWalls ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Interior Sub-tabs -->
        <div class="flex border-b border-slate-200 gap-4 mb-2">
          <button
            type="button"
            @click="interiorTab = 'layout'"
            :class="interiorTabClass('layout')"
          >
            <Cms k="interior.layout" fallback="Planlösning" />
          </button>
          <button
            type="button"
            :disabled="!floorPlanOpen"
            :aria-disabled="!floorPlanOpen"
            :title="floorPlanOpen ? undefined : t('interior.planLocked')"
            @click="openInteriorTab('plumbing')"
            :class="interiorTabClass('plumbing', !floorPlanOpen)"
          >
            <Cms k="interior.plumbing" fallback="Våtrum & VVS" />
          </button>
          <button
            type="button"
            :disabled="!floorPlanOpen"
            :aria-disabled="!floorPlanOpen"
            :title="floorPlanOpen ? undefined : t('interior.planLocked')"
            @click="openInteriorTab('electrical')"
            :class="interiorTabClass('electrical', !floorPlanOpen)"
          >
            <Cms k="interior.electrical" fallback="El & Ljus" />
          </button>
        </div>

        <div v-if="interiorTab === 'layout'" class="space-y-2">
          <button
            type="button"
            class="h-11 w-full rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed"
            :class="Object.keys(store.placedRooms).length === 0
              ? 'bg-slate-100 text-slate-400'
              : store.floorPlanDone
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'"
            :disabled="Object.keys(store.placedRooms).length === 0"
            :aria-pressed="store.floorPlanDone"
            @click="store.setFloorPlanDone(!store.floorPlanDone)"
          >
            <Cms k="interior.planDone" fallback="Planlösningen är klar" />
          </button>
          <p v-if="!floorPlanOpen" class="text-[11px] leading-relaxed text-slate-500">
            <Cms k="interior.planDoneHint" fallback="Placera rummen, markera sedan planlösningen som klar." />
          </p>
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
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider"><Cms k="interior.placedRooms" fallback="Placerade Rum" /></h4>
              <p class="mb-2 mt-1 text-[11px] leading-relaxed text-slate-500"><Cms k="interior.placedRoomsHint" fallback="Dra rummet i vyn. Ändra storlek här." /></p>
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
                    <input type="range" min="1.0" max="6.0" step="0.1" v-model.number="room.w" class="w-full accent-slate-900" @change="store.commitRooms()" />
                  </label>
                  <label class="flex-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <Cms k="interior.depth" fallback="Djup:" />
                    <input type="range" min="1.0" max="6.0" step="0.1" v-model.number="room.d" class="w-full accent-slate-900" @change="store.commitRooms()" />
                  </label>
                </div>
                <button
                  type="button"
                  role="switch"
                  class="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  :aria-checked="room.wallsVisible"
                  :aria-label="room.wallsVisible ? t('interior.hideRoomWalls') : t('interior.showRoomWalls')"
                  @click="store.toggleRoomWalls(String(id))"
                >
                  <Cms k="interior.roomWalls" fallback="Väggar" />
                  <span
                    class="relative h-5 w-9 rounded-full transition-colors"
                    :class="room.wallsVisible ? 'bg-slate-900' : 'bg-slate-300'"
                    aria-hidden="true"
                  >
                    <span
                      class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                      :class="room.wallsVisible ? 'translate-x-[18px]' : 'translate-x-0.5'"
                    ></span>
                  </span>
                </button>
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
              <rect v-if="win.id !== 'overlight' && win.id !== 'narrow-tall' && win.id !== 'panorama-portrait'" x="55" y="16" width="50" height="48" rx="1" stroke="currentColor" stroke-width="2" />
              <template v-if="win.id === 'narrow-tall'">
                <rect x="68" y="8" width="24" height="64" rx="1" stroke="currentColor" stroke-width="2" />
                <rect x="71" y="11" width="18" height="58" fill="currentColor" fill-opacity="0.18" />
              </template>
              <template v-else-if="win.id === 'panorama'">
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
              <template v-else-if="win.id === 'overlight'">
                <rect x="28" y="30" width="104" height="22" rx="1" stroke="currentColor" stroke-width="2" />
                <rect x="32" y="34" width="96" height="14" fill="currentColor" fill-opacity="0.18" />
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

      </div>

      <section class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-slate-800"><Cms k="category.terrace" /></p>
          <button
            v-if="store.terraces.length < terraceSides.length"
            type="button"
            id="btn-add-terrace"
            class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            @click="store.addTerrace()"
          >
            <Cms k="category.terraceAdd" />
          </button>
        </div>
        <p v-if="!store.terraces.length" class="text-[11px] text-slate-500"><Cms k="category.terraceEmpty" /></p>
        <article
          v-for="deck in store.terraces"
          :key="deck.side"
          :id="`terrace-card-${deck.side}`"
          class="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-slate-900">
              <Cms :k="`category.${deck.side}`" />
              <span class="ml-1.5 tabular-nums text-slate-500">{{ delta(terracePrice(deck)) }}</span>
            </p>
            <button
              type="button"
              :id="`terrace-remove-${deck.side}`"
              class="text-[11px] font-bold text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              @click="store.removeTerrace(deck.side)"
            >
              <Cms k="category.terraceRemove" />
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="side in terraceSides"
              :key="side"
              type="button"
              :id="`terrace-${deck.side}-side-${side}`"
              :disabled="side !== deck.side && store.terraces.some((item) => item.side === side)"
              :aria-pressed="deck.side === side"
              :class="terraceChoiceClass(deck.side === side)"
              @click="store.setTerraceSide(deck.side, side)"
            >
              <Cms :k="`category.${side}`" />
            </button>
          </div>
          <div>
            <p class="mb-1 text-[11px] font-bold text-slate-700"><Cms k="category.terraceDepth" /></p>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="depth in terraceDepths"
                :key="depth"
                type="button"
                :id="`terrace-${deck.side}-depth-${Math.round(depth * 10)}`"
                :aria-pressed="deck.depth === depth"
                :class="terraceChoiceClass(deck.depth === depth)"
                @click="store.setTerraceDepth(deck.side, depth)"
              >
                {{ depthLabel(depth) }}
              </button>
            </div>
          </div>
          <div>
            <p class="mb-1 text-[11px] font-bold text-slate-700"><Cms k="category.terraceSpan" /></p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                :id="`terrace-${deck.side}-span-door`"
                :aria-pressed="deck.span === 'door'"
                :class="terraceChoiceClass(deck.span === 'door')"
                @click="store.setTerraceSpan(deck.side, 'door')"
              >
                <Cms k="category.terraceSpanDoor" />
              </button>
              <button
                type="button"
                :id="`terrace-${deck.side}-span-full`"
                :aria-pressed="deck.span === 'full'"
                :class="terraceChoiceClass(deck.span === 'full')"
                @click="store.setTerraceSpan(deck.side, 'full')"
              >
                <Cms k="category.terraceSpanFull" />
              </button>
            </div>
          </div>
          <button
            type="button"
            :id="`terrace-${deck.side}-roof`"
            :aria-pressed="deck.roof"
            :class="[terraceChoiceClass(deck.roof), 'w-full']"
            @click="store.setTerraceRoof(deck.side, !deck.roof)"
          >
            <Cms k="category.terraceRoof" />
          </button>
          <div>
            <p class="mb-1 text-[11px] font-bold text-slate-700">
              <Cms k="category.terraceBuilding" />
            </p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                :id="`terrace-${deck.side}-building-none`"
                :aria-pressed="!deck.building || deck.building === 'none'"
                :class="terraceChoiceClass(!deck.building || deck.building === 'none')"
                @click="store.setTerraceBuilding(deck.side, 'none')"
              >
                <Cms k="category.terraceBuildingNone" />
              </button>
              <button
                type="button"
                :id="`terrace-${deck.side}-building-sauna`"
                :aria-pressed="deck.building === 'sauna'"
                :class="terraceChoiceClass(deck.building === 'sauna')"
                @click="store.setTerraceBuilding(deck.side, 'sauna')"
              >
                <span class="block font-bold"><Cms k="category.terraceBuildingSauna" /></span>
                <span class="block text-[10px] font-normal opacity-75">{{ delta(SAUNA_BUILDING_PRICE) }}</span>
              </button>
              <button
                type="button"
                :id="`terrace-${deck.side}-building-shed`"
                :aria-pressed="deck.building === 'shed'"
                :class="terraceChoiceClass(deck.building === 'shed')"
                @click="store.setTerraceBuilding(deck.side, 'shed')"
              >
                <span class="block font-bold"><Cms k="category.terraceBuildingShed" /></span>
                <span class="block text-[10px] font-normal opacity-75">{{ delta(SHED_BUILDING_PRICE) }}</span>
              </button>
            </div>
            <div v-if="deck.building && deck.building !== 'none'" class="mt-2 pt-2 border-t border-slate-100">
              <p class="mb-1 text-[11px] font-bold text-slate-700">
                <Cms k="category.terraceBuildingPlacement" />
              </p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  :id="`terrace-${deck.side}-building-place-left`"
                  :aria-pressed="deck.buildingPlacement === 'left'"
                  :class="terraceChoiceClass(deck.buildingPlacement === 'left')"
                  @click="store.setTerraceBuildingPlacement(deck.side, 'left')"
                >
                  <Cms k="category.terracePlacementLeft" />
                </button>
                <button
                  type="button"
                  :id="`terrace-${deck.side}-building-place-right`"
                  :aria-pressed="!deck.buildingPlacement || deck.buildingPlacement === 'right'"
                  :class="terraceChoiceClass(!deck.buildingPlacement || deck.buildingPlacement === 'right')"
                  @click="store.setTerraceBuildingPlacement(deck.side, 'right')"
                >
                  <Cms k="category.terracePlacementRight" />
                </button>
              </div>
              <div v-if="deck.building === 'sauna'" class="mt-2">
                <p class="mb-1 text-[11px] font-bold text-slate-700">
                  <Cms k="category.terraceBuildingRoof" />
                </p>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="roof in terraceBuildingRoofs"
                    :key="roof"
                    type="button"
                    :id="`terrace-${deck.side}-building-roof-${roof}`"
                    :aria-pressed="(deck.buildingRoof ?? 'pulpet') === roof"
                    :class="terraceChoiceClass((deck.buildingRoof ?? 'pulpet') === roof)"
                    @click="store.setTerraceBuildingRoof(deck.side, roof)"
                  >
                    <Cms :k="terraceRoofKey(roof)" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
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

  </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
  type LoftPlacement,
  type LoftStairPosition,
  DOORS_OPTIONS,
  WINDOWS_OPTIONS,
  GATES_OPTIONS,
  OUTSIDE_PRICES
} from '../store/useConfigStore';
import {
  TERRACE_DEPTHS,
  TERRACE_SIDES,
  terracePrice,
  SAUNA_BUILDING_PRICE,
  SHED_BUILDING_PRICE,
  TERRACE_BUILDING_ROOFS,
  type TerraceDepth,
  type TerraceBuilding,
  type TerraceBuildingPlacement,
  type TerraceBuildingRoof
} from '../outside/terrace';
import { useLabels } from '../i18n';
import CustomPaint from './CustomPaint.vue';
import { paintTitle, readableInk } from '../color/paint';
import { searchAction, searchRequest } from '../search/run';

const store = useConfigStore();
const loftPlaces: { id: LoftPlacement; label: string }[] = [
  { id: 'vanster', label: 'category.left' },
  { id: 'hoger', label: 'category.right' },
  { id: 'fram', label: 'category.front' },
  { id: 'bak', label: 'category.back' }
];
const loftStairPositions = computed<{ id: LoftStairPosition; label: string }[]>(() => {
  if (store.loftCount === 'tva' || store.loftPlacement === 'vanster' || store.loftPlacement === 'hoger') {
    return [
      { id: 'front', label: 'category.front' },
      { id: 'back', label: 'category.back' }
    ];
  }
  if (store.loftPlacement === 'fram') {
    return [
      { id: 'back', label: 'category.left' },
      { id: 'front', label: 'category.right' }
    ];
  }
  return [
    { id: 'front', label: 'category.left' },
    { id: 'back', label: 'category.right' }
  ];
});
const { t, catalog, money, delta, locale } = useLabels();
const sizeTab = ref<'kulor' | 'panel'>('kulor');

function applySearchNavigation() {
  const action = searchAction.value;
  if (!action || action.path !== '/build') return;
  if (action.sizeTab) sizeTab.value = action.sizeTab;
  if (action.focus === 'custom-paint') paintOpen.value = true;
}

watch(searchRequest, applySearchNavigation);
onMounted(applySearchNavigation);
const doorTab = ref<'single' | 'double' | 'sliding'>('single');
const interiorTab = ref<'layout' | 'plumbing' | 'electrical'>('layout');
const floorPlanOpen = computed(() => store.floorPlanDone && Object.keys(store.placedRooms).length > 0);

function interiorTabClass(id: 'layout' | 'plumbing' | 'electrical', locked = false) {
  if (locked) {
    return 'text-xs font-bold pb-2 border-b-2 border-transparent text-slate-300 cursor-not-allowed';
  }
  return interiorTab.value === id
    ? 'text-xs font-bold pb-2 border-b-2 border-emerald-800 text-slate-900'
    : 'text-xs font-bold pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-600';
}

function openInteriorTab(id: 'plumbing' | 'electrical') {
  if (!floorPlanOpen.value) return;
  interiorTab.value = id;
}

watch(floorPlanOpen, (open) => {
  if (!open && interiorTab.value !== 'layout') interiorTab.value = 'layout';
});
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

const terraceSides = TERRACE_SIDES;
const terraceBuildingRoofs = TERRACE_BUILDING_ROOFS;

function terraceRoofKey(roof: TerraceBuildingRoof) {
  if (roof === 'low') return 'category.terraceRoofLow';
  if (roof === 'gable') return 'category.terraceRoofGable';
  return 'category.terraceRoofPulpet';
}
const terraceDepths = TERRACE_DEPTHS;

function terraceChoiceClass(active: boolean) {
  return [
    'py-1.5 rounded-lg border text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-40',
    active
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
  ];
}

function depthLabel(depth: TerraceDepth) {
  const text = depth.toFixed(1);
  return `${locale.value === 'sv' ? text.replace('.', ',') : text} m`;
}

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

const currentFacadeColorHex = computed(() => {
  if (store.paintPreview) return store.paintPreview;
  if (store.customPaint?.hex) return store.customPaint.hex;
  const mat = MATERIAL_OPTIONS.find((m) => m.id === store.activeMaterial);
  return mat ? mat.colorHex : '#e8d8be';
});

const currentCornerColorName = computed(() => {
  if (store.cornerColor === 'same') return t('category.cornerSame');
  if (store.cornerColor === 'white') return t('category.cornerWhite');
  if (store.cornerColor === 'falurod') return t('category.cornerFalurod');
  if (store.cornerColor === 'grey') return t('category.cornerGrey');
  if (store.cornerColor === 'black') return t('category.cornerBlack');
  if (store.cornerColor === 'wood') return t('category.cornerWood');
  if (store.cornerColor.startsWith('#')) return store.cornerColor.toUpperCase();
  return store.cornerColor;
});

const customCornerColors = computed(() => {
  const list: string[] = [];
  if (store.cornerColor.startsWith('#')) {
    list.push(store.cornerColor.toLowerCase());
  }
  for (const c of store.savedCornerColors) {
    const norm = c.toLowerCase();
    if (!list.includes(norm)) {
      list.push(norm);
    }
  }
  return list;
});

function onAddCornerColor(value: string) {
  if (!value) return;
  store.addCornerColor(value);
}

const CONCRETE_COLOR_OPTIONS = [
  { id: 'natural', label: 'category.concreteNatural', colorHex: '#b7b3ac' },
  { id: 'white', label: 'category.concreteWhite', colorHex: '#f4f1ea' },
  { id: 'grey', label: 'category.concreteGrey', colorHex: '#94a3b8' },
  { id: 'graphite', label: 'category.concreteGraphite', colorHex: '#334155' },
  { id: 'sand', label: 'category.concreteSand', colorHex: '#d6cebf' },
  { id: 'terracotta', label: 'category.concreteTerracotta', colorHex: '#9a4936' },
  { id: 'black', label: 'category.concreteBlack', colorHex: '#1f2428' }
];

const currentConcreteColorName = computed(() => {
  const match = CONCRETE_COLOR_OPTIONS.find((c) => c.colorHex.toLowerCase() === store.concreteColor.toLowerCase());
  if (match) return t(match.label);
  return store.concreteColor.toUpperCase();
});

const customConcreteColors = computed(() => {
  const list: string[] = [];
  if (store.concreteColor.startsWith('#')) {
    list.push(store.concreteColor.toLowerCase());
  }
  for (const c of store.savedConcreteColors) {
    const norm = c.toLowerCase();
    if (!list.includes(norm)) {
      list.push(norm);
    }
  }
  return list;
});

function openAddPaint() {
  if (paintOpen.value) {
    paintOpen.value = false;
  } else {
    paintOpen.value = true;
    store.setPaintPreview(null);
  }
}

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

const concreteArea = computed(() => Math.round((store.concreteWidth * store.concreteDepth) / 1e5) / 10);

function planLimit(axis: 'width' | 'depth' | 'height', edge: 'min' | 'max') {
  if (store.selectedSizeId !== 'size-paabyggnad') return BUILDING_LIMITS[axis][edge] / 10;
  if (axis === 'height') return edge === 'min' ? 450 : 500;
  if (edge === 'min') return BUILDING_LIMITS[axis].min / 10;
  const otherMm = axis === 'width' ? store.dimensions.depth : store.dimensions.width;
  const capCm = (35 * 1_000_000) / otherMm / 10;
  return Math.min(BUILDING_LIMITS[axis].max / 10, capCm);
}

function concreteLimit(axis: 'width' | 'depth' | 'height', edge: 'min' | 'max') {
  if (axis === 'height') return edge === 'min' ? 200 : 400;
  return BUILDING_LIMITS[axis][edge] / 10;
}

function concreteWallLimit(axis: 'x' | 'z', edge: 'min' | 'max') {
  const span = axis === 'x' ? store.concreteDepth : store.concreteWidth;
  const max = Math.max(0, span / 2 - 400) / 10;
  return edge === 'min' ? -max : max;
}

function commitConcreteWall(id: string, event: Event) {
  const raw = Number((event.target as HTMLInputElement).value);
  store.setConcreteWall(id, { offsetMm: Math.round(raw * 10) });
  const wall = store.concreteWalls.find((item) => item.id === id);
  if (wall) (event.target as HTMLInputElement).value = centimetres(wall.offsetMm);
}

function centimetres(millimetres: number) {
  const cm = millimetres / 10;
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
}

function commitMeasure(axis: 'width' | 'depth' | 'height', event: Event) {
  const raw = Number((event.target as HTMLInputElement).value);
  store.setBuildingMeasure(axis, Math.round(raw * 10));
  (event.target as HTMLInputElement).value = centimetres(store.dimensions[axis]);
}

function commitConcrete(axis: 'width' | 'depth' | 'height', event: Event) {
  const raw = Number((event.target as HTMLInputElement).value);
  store.setConcreteMeasure(axis, Math.round(raw * 10));
  const millimetres = axis === 'width'
    ? store.concreteWidth
    : axis === 'depth'
      ? store.concreteDepth
      : store.concreteHeight;
  (event.target as HTMLInputElement).value = centimetres(millimetres);
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

const emit = defineEmits<{
  (e: 'placed'): void;
}>();

function placeDoor(doorId: string) {
  store.selectDoor(doorId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'door', doorId);
    emit('placed');
  }
}

function placeWindow(winId: string) {
  store.selectWindow(winId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'window', winId);
    emit('placed');
  }
}

function placeGate(gateId: string) {
  store.selectGate(gateId);
  if (store.selectedSlotId) {
    store.assignSlotItem(store.selectedSlotId, 'gate', gateId);
    emit('placed');
  }
}
</script>

<style scoped>
.menu-flow-enter-active {
  transition: opacity 280ms ease, transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}
.menu-flow-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
.menu-flow-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.menu-flow-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .menu-flow-enter-active,
  .menu-flow-leave-active {
    transition: none;
  }
}
</style>
