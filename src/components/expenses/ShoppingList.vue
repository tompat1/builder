<template>
  <div class="space-y-6">
    <!-- 1. Budget & Progress Summary Dashboard -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total Planned Budget -->
      <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
            {{ isEn ? 'Estimated Budget (PLN)' : 'Planerad Budget (PLN)' }}
          </span>
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800 font-bold text-sm">
            🛒
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#173D35] tracking-tight">
            {{ formatPLN(summary.totalPlannedPln) }}
          </h2>
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
          <span>≈ {{ formatSEK(summary.totalPlannedSek) }}</span>
          <span class="text-[10px] text-stone-400 font-normal">({{ rateInfo.ratePlnToSek }} kr/zł)</span>
        </div>
        <p class="mt-0.5 text-xs text-stone-500">
          {{ isEn ? `${summary.totalCount} items planned across all categories` : `${summary.totalCount} st artiklar totalt i inköpslistan` }}
        </p>
      </div>

      <!-- Remaining To Buy -->
      <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
            {{ isEn ? 'Remaining to Buy' : 'Kvar att köpa' }}
          </span>
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-bold text-sm">
            {{ summary.toBuyCount }}
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <h3 class="text-2xl sm:text-3xl font-extrabold text-[#173D35] tracking-tight">
            {{ formatPLN(summary.remainingToBuyPln) }}
          </h3>
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
          <span>≈ {{ formatSEK(summary.remainingToBuySek) }}</span>
          <span class="text-[10px] text-stone-400 font-normal">({{ summary.toBuyCount }} {{ isEn ? 'items left' : 'kvar' }})</span>
        </div>
        <p class="mt-0.5 text-xs text-stone-500">
          {{ isEn ? 'Upcoming purchases for garden, tools, interior' : 'Kommande inköp till trädgård, verktyg och inredning' }}
        </p>
      </div>

      <!-- Already Purchased / Finished -->
      <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
            {{ isEn ? 'Purchased & Acquired' : 'Redan Inköpt' }}
          </span>
          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
            ✓ {{ summary.purchasedCount }}
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <h3 class="text-2xl sm:text-3xl font-extrabold text-[#173D35] tracking-tight">
            {{ formatPLN(summary.totalPurchasedPln) }}
          </h3>
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span>≈ {{ formatSEK(summary.totalPurchasedSek) }}</span>
          <span class="text-[10px] text-stone-400 font-normal">({{ purchasePercent }}%)</span>
        </div>
        <div class="mt-2 w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${purchasePercent}%` }"
          ></div>
        </div>
      </div>
    </section>

    <!-- 2. Category Distribution Bar -->
    <section v-if="summary.categories.length > 0" class="rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500">
          {{ isEn ? 'Shopping Budget by Category' : 'Budgetfördelning per kategori' }}
        </h4>
        <span class="text-xs font-semibold text-stone-400">
          {{ summary.categories.length }} {{ isEn ? 'categories' : 'kategorier' }}
        </span>
      </div>

      <!-- Visual Multi-segment Progress Bar -->
      <div class="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex mb-4">
        <div
          v-for="cat in summary.categories"
          :key="cat.category"
          class="h-full transition-all duration-300"
          :style="{
            width: `${summary.totalPlannedPln > 0 ? (cat.totalPlannedPln / summary.totalPlannedPln) * 100 : 0}%`,
            backgroundColor: cat.color
          }"
          :title="`${isEn ? cat.labelEn : cat.labelSv}: ${formatPLN(cat.totalPlannedPln)} (≈ ${formatSEK(cat.totalPlannedSek)})`"
        ></div>
      </div>

      <!-- Category Badges / Breakdown Pills -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in summary.categories"
          :key="cat.category"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs border transition hover:opacity-90 active:scale-95 text-left"
          :class="selectedCategoryFilter === cat.category ? 'ring-2 ring-[#173D35]' : ''"
          :style="{ backgroundColor: getShoppingCategoryMeta(cat.category).badgeBg, borderColor: getShoppingCategoryMeta(cat.category).badgeBorder }"
          @click="selectedCategoryFilter = selectedCategoryFilter === cat.category ? 'all' : cat.category"
        >
          <span class="text-sm">{{ getShoppingCategoryMeta(cat.category).icon }}</span>
          <span class="font-semibold text-stone-800">{{ isEn ? cat.labelEn : cat.labelSv }}</span>
          <span class="font-bold text-[#173D35]">{{ formatPLN(cat.totalPlannedPln) }}</span>
          <span class="text-[11px] font-medium text-stone-500">({{ cat.toBuyCount }} {{ isEn ? 'left' : 'kvar' }})</span>
        </button>
      </div>
    </section>

    <!-- 3. Toolbar: Search, Status Filter, Sort, Add Item, Curated Seed -->
    <section class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="isEn ? 'Search items, power tools, garden, kitchen...' : 'Sök artiklar, elverktyg, trädgård, kök, möbler...'"
          class="w-full rounded-xl border border-[#d7d1c4] bg-white pl-10 pr-8 py-2 text-sm text-[#222925] transition focus:border-[#173D35] focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Controls: Status Toggle & Actions -->
      <div class="flex flex-wrap items-center gap-2 self-end sm:self-auto">
        <!-- Status Filter -->
        <div class="inline-flex rounded-xl border border-[#d7d1c4] bg-white p-0.5 shadow-sm">
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg transition"
            :class="statusFilter === 'all' ? 'bg-[#173D35] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'"
            @click="statusFilter = 'all'"
          >
            {{ isEn ? 'All' : 'Alla' }} ({{ items.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg transition"
            :class="statusFilter === 'tobuy' ? 'bg-[#173D35] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'"
            @click="statusFilter = 'tobuy'"
          >
            {{ isEn ? 'To Buy' : 'Att köpa' }} ({{ summary.toBuyCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg transition"
            :class="statusFilter === 'purchased' ? 'bg-[#173D35] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'"
            @click="statusFilter = 'purchased'"
          >
            {{ isEn ? 'Purchased' : 'Inköpt' }} ({{ summary.purchasedCount }})
          </button>
        </div>

        <!-- Sort dropdown -->
        <select
          v-model="sortOrder"
          class="rounded-xl border border-[#d7d1c4] bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm focus:border-[#173D35] focus:outline-none"
        >
          <option value="priority_desc">{{ isEn ? 'Priority (High first)' : 'Prioritet (Högst först)' }}</option>
          <option value="price_desc">{{ isEn ? 'Highest price' : 'Högst pris' }}</option>
          <option value="price_asc">{{ isEn ? 'Lowest price' : 'Lägst pris' }}</option>
          <option value="category">{{ isEn ? 'Category' : 'Kategori' }}</option>
          <option value="newest">{{ isEn ? 'Newest first' : 'Nyast först' }}</option>
        </select>

        <!-- Polish Stores in Gdańsk & Gdynia Directory button -->
        <button
          type="button"
          id="btn-open-tricity-stores"
          class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#173D35] shadow-sm transition hover:bg-emerald-100/70 active:scale-95"
          :title="isEn ? 'Browse Polish stores in Gdańsk & Gdynia area' : 'Polska varuhus i Gdańsk & Gdynia'"
          @click="showStoresModal = true"
        >
          <span>🇵🇱</span>
          <span class="hidden md:inline">{{ isEn ? 'Gdańsk & Gdynia Stores' : 'Gdańsk / Gdynia butiker' }}</span>
        </button>

        <!-- Curated suggestions button -->
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-500/20 active:scale-95"
          :title="isEn ? 'Load curated house building & garden suggestions' : 'Läs in förslag för trädgård, verktyg och inredning'"
          @click="loadCuratedSuggestions"
        >
          <span>💡</span>
          <span class="hidden md:inline">{{ isEn ? 'Add Suggestions' : 'Läs in förslag' }}</span>
        </button>

        <!-- Export tools -->
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          :title="isEn ? 'Copy shopping list text' : 'Kopiera inköpslistan'"
          @click="copyShoppingSummary"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span class="hidden sm:inline">{{ isEn ? 'Copy' : 'Kopiera' }}</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          :title="isEn ? 'Download CSV file' : 'Ladda ner CSV-fil'"
          @click="downloadCsvFile"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span class="hidden sm:inline">CSV</span>
        </button>

        <!-- New Item Button -->
        <button
          type="button"
          id="btn-add-shopping-item"
          class="inline-flex items-center gap-1.5 rounded-xl bg-[#173D35] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#173D35]/20 transition hover:bg-[#0f2b25] active:scale-95"
          @click="openNewItemModal"
        >
          <span class="text-base leading-none font-bold">+</span>
          <span>{{ isEn ? 'New Item' : 'Ny artikel' }}</span>
        </button>
      </div>
    </section>

    <!-- 4. Category Filter Chips -->
    <section class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        class="rounded-full px-3 py-1 text-xs font-semibold transition"
        :class="selectedCategoryFilter === 'all'
          ? 'bg-[#173D35] text-white shadow-sm'
          : 'bg-white border border-[#d7d1c4] text-stone-700 hover:bg-stone-50'"
        @click="selectedCategoryFilter = 'all'"
      >
        {{ isEn ? 'All Categories' : 'Alla kategorier' }} ({{ items.length }})
      </button>

      <button
        v-for="cat in SHOPPING_CATEGORIES"
        :key="cat.id"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
        :class="selectedCategoryFilter === cat.id
          ? 'bg-[#173D35] text-white shadow-sm'
          : 'bg-white border border-[#d7d1c4] text-stone-700 hover:bg-stone-50'"
        @click="selectedCategoryFilter = cat.id"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ isEn ? cat.labelEn : cat.labelSv }}</span>
        <span class="text-[10px] opacity-75">
          ({{ categoryCounts[cat.id] || 0 }})
        </span>
      </button>
    </section>

    <!-- 5. Shopping Items List -->
    <section class="space-y-2.5">
      <!-- Empty state -->
      <div
        v-if="filteredItems.length === 0"
        class="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-[#d7d1c4] bg-white/60"
      >
        <div class="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-3xl mb-3">
          🛒
        </div>
        <h3 class="text-base font-bold text-[#173D35]">
          {{ isEn ? 'No shopping items found' : 'Inga artiklar hittades' }}
        </h3>
        <p class="mt-1 text-xs text-stone-500 max-w-sm">
          {{ searchQuery || selectedCategoryFilter !== 'all' || statusFilter !== 'all'
            ? (isEn ? 'Try adjusting your search query or filters.' : 'Prova att ändra sökorden eller filtret.')
            : (isEn ? 'Add items you plan to buy for the garden, power tools, kitchen or furniture, or click below to load our curated builder starter list.' : 'Lägg till vad ni behöver köpa för trädgården, verktyg, köket eller möbler, eller läs in vår förslagslista.') }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl bg-[#173D35] px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#0f2b25]"
            @click="openNewItemModal"
          >
            {{ isEn ? '+ Add First Item' : '+ Lägg till första artikeln' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-amber-600/30 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100"
            @click="loadCuratedSuggestions"
          >
            💡 {{ isEn ? 'Load Curated Suggestions' : 'Läs in förslag för bygget' }}
          </button>
        </div>
      </div>

      <!-- Item Rows -->
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
        :class="item.isPurchased
          ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80'
          : 'border-[#d7d1c4] hover:border-[#173D35]/40'"
      >
        <!-- Left: Checkbox, Icon, Title, Details -->
        <div class="flex items-start sm:items-center gap-3">
          <!-- Interactive Purchased Checkbox -->
          <button
            type="button"
            class="mt-0.5 sm:mt-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition active:scale-90"
            :class="item.isPurchased
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-stone-300 bg-white hover:border-[#173D35] text-transparent'"
            :title="item.isPurchased ? (isEn ? 'Mark as not purchased' : 'Markera som ej inköpt') : (isEn ? 'Mark as purchased' : 'Markera som inköpt')"
            @click="handleTogglePurchased(item.id)"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <!-- Category Icon Avatar -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg border"
            :style="{
              backgroundColor: getShoppingCategoryMeta(item.category).badgeBg,
              borderColor: getShoppingCategoryMeta(item.category).badgeBorder
            }"
          >
            {{ getShoppingCategoryMeta(item.category).icon }}
          </div>

          <!-- Main Info -->
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h4
                class="text-sm font-bold text-[#173D35] tracking-tight"
                :class="{ 'line-through text-stone-500': item.isPurchased }"
              >
                {{ item.title }}
              </h4>

              <!-- Quantity Pill -->
              <span class="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                {{ item.quantity }} {{ item.unit || 'pcs' }}
              </span>

              <!-- Category Badge -->
              <span
                class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border"
                :style="{
                  backgroundColor: getShoppingCategoryMeta(item.category).badgeBg,
                  borderColor: getShoppingCategoryMeta(item.category).badgeBorder,
                  color: getShoppingCategoryMeta(item.category).color
                }"
              >
                {{ isEn ? getShoppingCategoryMeta(item.category).labelEn : getShoppingCategoryMeta(item.category).labelSv }}
              </span>

              <!-- Priority Badge -->
              <span
                class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                :class="item.priority === 'high'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : item.priority === 'medium'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-stone-100 text-stone-600 border border-stone-200'"
              >
                <span>{{ item.priority === 'high' ? '🔴 ' + (isEn ? 'High' : 'Hög') : item.priority === 'medium' ? '🟡 ' + (isEn ? 'Medium' : 'Medel') : '🟢 ' + (isEn ? 'Low' : 'Låg') }}</span>
              </span>

              <!-- Status Tag -->
              <span
                v-if="item.isPurchased"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
              >
                <span>✓</span>
                <span>{{ isEn ? 'Purchased' : 'Inköpt' }}</span>
              </span>
            </div>

            <!-- Notes & Store link -->
            <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span v-if="item.storeOrUrl" class="inline-flex items-center gap-1 text-stone-600 font-medium">
                <span>🏬</span>
                <span v-if="isHttpUrl(item.storeOrUrl)">
                  <a :href="item.storeOrUrl" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                    {{ extractDomain(item.storeOrUrl) }} ↗
                  </a>
                </span>
                <span v-else>{{ item.storeOrUrl }}</span>
              </span>

              <span v-if="item.notes" class="text-stone-600 italic">
                "{{ item.notes }}"
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Pricing & Actions -->
        <div class="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
          <!-- Price Display -->
          <div class="text-right">
            <div class="text-base sm:text-lg font-black text-[#173D35] tracking-tight">
              {{ formatPLN(item.isPurchased && item.purchasedPricePln !== undefined ? item.purchasedPricePln * item.quantity : item.estimatedPricePln * item.quantity) }}
            </div>
            <div class="text-xs font-semibold text-amber-800">
              ≈ {{ formatSEK(convertPlnToSek((item.isPurchased && item.purchasedPricePln !== undefined ? item.purchasedPricePln : item.estimatedPricePln) * item.quantity, rateInfo.ratePlnToSek)) }}
            </div>
            <div v-if="item.quantity > 1" class="text-[10px] text-stone-400">
              ({{ formatPLN(item.estimatedPricePln) }} / {{ item.unit || 'st' }})
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1">
            <!-- "Log as Expense" Button: Connects Shopping List to Expenses! -->
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold shadow-sm transition active:scale-95"
              :class="item.loggedExpenseId
                ? 'bg-stone-100 text-stone-500 border border-stone-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'"
              :title="item.loggedExpenseId ? (isEn ? 'Already logged into Expenses' : 'Redan bokförd under Utlägg') : (isEn ? 'Log directly into Expenses' : 'Bokför direkt som utlägg i PLN')"
              @click="handleLogAsExpense(item)"
            >
              <span>💸</span>
              <span class="hidden md:inline">{{ item.loggedExpenseId ? (isEn ? 'Logged' : 'Bokfört') : (isEn ? 'Log Expense' : 'Till utlägg') }}</span>
            </button>

            <!-- Edit Item -->
            <button
              type="button"
              class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition"
              :title="isEn ? 'Edit item' : 'Redigera artikel'"
              @click="openEditModal(item)"
            >
              ✎
            </button>

            <!-- Delete Item -->
            <button
              type="button"
              class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
              :title="isEn ? 'Delete item' : 'Ta bort artikel'"
              @click="handleDeleteItem(item.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal: Add / Edit Shopping Item -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="relative w-full max-w-lg rounded-3xl border border-[#d7d1c4] bg-white p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-stone-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛒</span>
            <h3 class="text-base sm:text-lg font-bold text-[#173D35]">
              {{ editingItemId ? (isEn ? 'Edit Shopping Item' : 'Redigera artikel') : (isEn ? 'New Shopping Item' : 'Ny artikel till inköpslistan') }}
            </h3>
          </div>
          <button
            type="button"
            class="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
            @click="showModal = false"
          >
            ✕
          </button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="saveItem">
          <!-- Title / Item Name -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Item Name *' : 'Artikel / Vad ska köpas *' }}
            </label>
            <input
              v-model="formTitle"
              type="text"
              required
              :placeholder="isEn ? 'e.g. Plunge saw with guide rail, Garden hose reel...' : 't.ex. Sänksåg med styrskena, Robotgräsklippare, Induktionshäll...'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-sm text-[#222925] font-medium focus:border-[#173D35] focus:outline-none"
            />
          </div>

          <!-- Category Selection -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Category *' : 'Kategori *' }}
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="cat in SHOPPING_CATEGORIES"
                :key="cat.id"
                type="button"
                class="flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold text-left transition"
                :class="formCategory === cat.id
                  ? 'border-[#173D35] bg-[#173D35]/10 text-[#173D35] ring-1 ring-[#173D35]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'"
                @click="formCategory = cat.id"
              >
                <span class="text-base">{{ cat.icon }}</span>
                <span class="truncate">{{ isEn ? cat.labelEn : cat.labelSv }}</span>
              </button>
            </div>
          </div>

          <!-- Price & Currency Dual Inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Price in PLN -->
            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Estimated Price (PLN) *' : 'Estimerat pris (PLN / zł) *' }}
              </label>
              <div class="relative">
                <input
                  v-model="formPricePln"
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0"
                  class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] pl-3.5 pr-12 py-2 text-sm font-bold text-[#173D35] focus:border-[#173D35] focus:outline-none"
                  @input="onPlnInput"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  zł
                </span>
              </div>
            </div>

            <!-- Price in SEK (with 2-way conversion) -->
            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Equivalent in SEK' : 'Motsvarande i SEK (kr)' }}
              </label>
              <div class="relative">
                <input
                  v-model="formPriceSek"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] pl-3.5 pr-12 py-2 text-sm font-bold text-amber-800 focus:border-[#173D35] focus:outline-none"
                  @input="onSekInput"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  kr
                </span>
              </div>
            </div>
          </div>

          <!-- Quantity, Unit, Priority -->
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Quantity' : 'Antal' }}
              </label>
              <input
                v-model="formQuantity"
                type="number"
                min="1"
                step="1"
                required
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-sm text-[#222925] font-semibold focus:border-[#173D35] focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Unit' : 'Enhet' }}
              </label>
              <select
                v-model="formUnit"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3 py-2 text-sm text-[#222925] font-semibold focus:border-[#173D35] focus:outline-none"
              >
                <option value="pcs">pcs (pieces)</option>
                <option value="set">set</option>
                <option value="m">m (meters)</option>
                <option value="m²">m²</option>
                <option value="pack">pack</option>
                <option value="roll">roll</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Priority' : 'Prioritet' }}
              </label>
              <select
                v-model="formPriority"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3 py-2 text-sm text-[#222925] font-semibold focus:border-[#173D35] focus:outline-none"
              >
                <option value="high">🔴 {{ isEn ? 'High' : 'Hög' }}</option>
                <option value="medium">🟡 {{ isEn ? 'Medium' : 'Medel' }}</option>
                <option value="low">🟢 {{ isEn ? 'Low' : 'Låg' }}</option>
              </select>
            </div>
          </div>

          <!-- Store / URL with focus on Polish stores in Gdańsk & Gdynia -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Polish Store in Gdańsk / Gdynia or Link' : 'Polskt varuhus i Gdańsk / Gdynia eller länk' }}
              </label>
              <button
                type="button"
                class="text-[11px] font-bold text-[#173D35] hover:underline"
                @click="showStoresModal = true"
              >
                {{ isEn ? 'Browse all stores ↗' : 'Visa alla butiker ↗' }}
              </button>
            </div>
            <input
              v-model="formStore"
              type="text"
              :placeholder="isEn ? 'e.g. Castorama Gdańsk Oliwa, Leroy Merlin Karczemki, OBI Matarnia, Bricoman...' : 't.ex. Castorama Gdańsk Oliwa, Leroy Merlin Karczemki, OBI, IKEA...'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-sm text-[#222925] focus:border-[#173D35] focus:outline-none"
            />
            <!-- Quick Polish Store Chips -->
            <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {{ isEn ? 'Tricity stores:' : 'Snabbval:' }}
              </span>
              <button
                v-for="store in POLISH_TRICITY_STORES.slice(0, 6)"
                :key="store.id"
                type="button"
                class="rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:bg-[#173D35]/10 hover:border-[#173D35] transition"
                @click="formStore = store.name"
              >
                {{ store.name }}
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Notes / Specifications' : 'Anteckningar / Modell' }}
            </label>
            <textarea
              v-model="formNotes"
              rows="2"
              :placeholder="isEn ? 'Dimensions, specific model numbers, color, etc.' : 'Mått, modellnummer, färg eller specifika krav...'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-xs text-[#222925] focus:border-[#173D35] focus:outline-none resize-none"
            ></textarea>
          </div>

          <!-- Already Purchased Toggle -->
          <div class="flex items-center gap-3 pt-2 border-t border-stone-100">
            <input
              id="checkbox-is-purchased"
              v-model="formIsPurchased"
              type="checkbox"
              class="h-4 w-4 rounded border-stone-300 text-[#173D35] focus:ring-[#173D35]"
            />
            <label for="checkbox-is-purchased" class="text-xs font-bold text-stone-700 cursor-pointer">
              {{ isEn ? 'Mark as already purchased / acquired' : 'Markera som redan inköpt / fixad' }}
            </label>
          </div>

          <!-- Form Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
              @click="showModal = false"
            >
              {{ isEn ? 'Cancel' : 'Avbryt' }}
            </button>
            <button
              type="submit"
              class="rounded-xl bg-[#173D35] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#0f2b25]"
            >
              {{ editingItemId ? (isEn ? 'Save Changes' : 'Spara ändringar') : (isEn ? 'Add Item' : 'Lägg till artikel') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Polish Stores Directory (Gdańsk & Gdynia Area) -->
    <div
      v-if="showStoresModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showStoresModal = false"
    >
      <div class="relative w-full max-w-2xl rounded-3xl border border-[#d7d1c4] bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🏬</span>
            <div>
              <h3 class="text-lg font-bold text-[#173D35] flex items-center gap-2">
                <span>{{ isEn ? 'Polish Stores (Gdańsk & Gdynia Area)' : 'Polska varuhus (Gdańsk & Gdynia)' }}</span>
                <span class="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">Trójmiasto</span>
              </h3>
              <p class="text-xs text-stone-500">
                {{ isEn ? 'Home improvement, power tools, timber, garden & kitchen retailers in Gdańsk & Gdynia' : 'Byggvaruhus, elverktyg, virke, trädgård och kök i Gdańsk och Gdynia' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
            @click="showStoresModal = false"
          >
            ✕
          </button>
        </div>

        <!-- Action Banner: Re-seed full English catalogue from Gdańsk stores -->
        <div class="my-4 rounded-2xl border border-emerald-600/20 bg-emerald-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-[#173D35]">
              {{ isEn ? 'Re-seed List with English Gdańsk / Gdynia Catalogue' : 'Läs in engelska Gdańsk/Gdynia-katalogen' }}
            </h4>
            <p class="text-[11px] text-stone-600 mt-0.5">
              {{ isEn ? 'Instantly reset and fill your shopping list with 20 curated English items priced in PLN from Gdańsk stores.' : 'Återställ och fyll inköpslistan med 20 utvalda artiklar på engelska med PLN-priser från Gdańsk-butiker.' }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-xl bg-[#173D35] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#0f2b25] transition active:scale-95"
            @click="resetToTricityCatalog"
          >
            {{ isEn ? 'Reset to Gdańsk Seeds' : 'Återställ till Gdańsk-urval' }}
          </button>
        </div>

        <!-- Store Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div
            v-for="store in POLISH_TRICITY_STORES"
            :key="store.id"
            class="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-3.5 flex flex-col justify-between hover:border-[#173D35]/40 transition hover:shadow-sm"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#173D35]">{{ store.name }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
                  {{ store.city }} · {{ store.location }}
                </span>
              </div>
              <p class="text-[11px] text-stone-500 mt-1">
                📍 {{ store.address }}
              </p>
              <p class="text-[11px] text-stone-600 font-medium mt-1.5">
                {{ store.specialty }}
              </p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between">
              <a
                :href="store.searchUrl('budowa')"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-bold text-[#173D35] hover:underline"
              >
                <span>{{ isEn ? 'Search Online Store' : 'Sök i butiken' }}</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                class="rounded-lg bg-white border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 transition"
                @click="fillStoreAndOpenNewItem(store.name)"
              >
                + {{ isEn ? 'Add Item' : 'Lägg till' }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex justify-end">
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
            @click="showStoresModal = false"
          >
            {{ isEn ? 'Close' : 'Stäng' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  type ShoppingItem,
  type ShoppingCategory,
  type ShoppingPriority,
  type ShoppingSummary,
  SHOPPING_CATEGORIES,
  POLISH_TRICITY_STORES,
  getShoppingCategoryMeta,
  loadShoppingList,
  resetShoppingListToSeeds,
  addShoppingItem,
  updateShoppingItem,
  toggleShoppingItemPurchased,
  deleteShoppingItem,
  seedCuratedItemsToShoppingList,
  calculateShoppingSummary,
  generateShoppingSummaryText,
  generateShoppingCsv
} from '../../services/shoppingSave';
import {
  formatPLN,
  formatSEK,
  convertPlnToSek,
  convertSekToPln,
  getStoredCurrencyRate,
  type CurrencyRateInfo,
  type ExpenseCategory
} from '../../services/expenseSave';
import { useLabels } from '../../i18n';

const props = withDefaults(
  defineProps<{
    houseKey: string;
  }>(),
  {
    houseKey: ''
  }
);

const emit = defineEmits<{
  (e: 'log-expense', payload: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    notes?: string;
    shoppingId: string;
  }): void;
  (e: 'toast', message: string): void;
}>();

const { locale } = useLabels();
const isEn = computed(() => locale.value === 'en');

const items = ref<ShoppingItem[]>([]);
const rateInfo = ref<CurrencyRateInfo>(getStoredCurrencyRate());

// Filter & Sort state
const searchQuery = ref('');
const selectedCategoryFilter = ref<string>('all');
const statusFilter = ref<'all' | 'tobuy' | 'purchased'>('all');
const sortOrder = ref<'priority_desc' | 'price_desc' | 'price_asc' | 'category' | 'newest'>('priority_desc');

// Modal state
const showModal = ref(false);
const showStoresModal = ref(false);
const editingItemId = ref<string | null>(null);
const formTitle = ref('');
const formCategory = ref<ShoppingCategory>('power_tools');
const formPricePln = ref<number | string>('');
const formPriceSek = ref<number | string>('');
const formQuantity = ref<number>(1);
const formUnit = ref<string>('pcs');
const formPriority = ref<ShoppingPriority>('high');
const formStore = ref('');
const formNotes = ref('');
const formIsPurchased = ref(false);

function refresh() {
  const state = loadShoppingList(props.houseKey);
  items.value = state.items;
  rateInfo.value = getStoredCurrencyRate();
}

onMounted(() => {
  refresh();
});

watch(() => props.houseKey, () => {
  refresh();
});

const summary = computed<ShoppingSummary>(() => {
  return calculateShoppingSummary(items.value, rateInfo.value.ratePlnToSek);
});

const purchasePercent = computed(() => {
  if (items.value.length === 0) return 0;
  return Math.round((summary.value.purchasedCount / items.value.length) * 100);
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const item of items.value) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
});

const filteredItems = computed(() => {
  let list = items.value.slice();

  // 1. Status Filter
  if (statusFilter.value === 'tobuy') {
    list = list.filter((i) => !i.isPurchased);
  } else if (statusFilter.value === 'purchased') {
    list = list.filter((i) => i.isPurchased);
  }

  // 2. Category Filter
  if (selectedCategoryFilter.value !== 'all') {
    list = list.filter((i) => i.category === selectedCategoryFilter.value);
  }

  // 3. Search Query
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q)) ||
      (i.storeOrUrl && i.storeOrUrl.toLowerCase().includes(q))
    );
  }

  // 4. Sort
  list.sort((a, b) => {
    if (sortOrder.value === 'priority_desc') {
      const pMap: Record<ShoppingPriority, number> = { high: 3, medium: 2, low: 1 };
      if (pMap[a.priority] !== pMap[b.priority]) {
        return pMap[b.priority] - pMap[a.priority];
      }
      return b.estimatedPricePln - a.estimatedPricePln;
    }
    if (sortOrder.value === 'price_desc') {
      return (b.estimatedPricePln * (b.quantity || 1)) - (a.estimatedPricePln * (a.quantity || 1));
    }
    if (sortOrder.value === 'price_asc') {
      return (a.estimatedPricePln * (a.quantity || 1)) - (b.estimatedPricePln * (b.quantity || 1));
    }
    if (sortOrder.value === 'category') {
      return a.category.localeCompare(b.category);
    }
    if (sortOrder.value === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return list;
});

function isHttpUrl(str: string): boolean {
  return /^https?:\/\//i.test(str.trim());
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function onPlnInput() {
  const pln = Number(formPricePln.value) || 0;
  formPriceSek.value = convertPlnToSek(pln, rateInfo.value.ratePlnToSek);
}

function onSekInput() {
  const sek = Number(formPriceSek.value) || 0;
  formPricePln.value = convertSekToPln(sek, rateInfo.value.ratePlnToSek);
}

function handleTogglePurchased(id: string) {
  toggleShoppingItemPurchased(id, props.houseKey);
  refresh();
}

function handleDeleteItem(id: string) {
  deleteShoppingItem(id, props.houseKey);
  refresh();
  emit('toast', isEn.value ? 'Item removed from shopping list' : 'Artikel borttagen från inköpslistan');
}

function loadCuratedSuggestions() {
  seedCuratedItemsToShoppingList(props.houseKey);
  refresh();
  emit('toast', isEn.value ? 'Loaded suggestions from Polish stores in Gdańsk & Gdynia' : 'Laddade in förslag från butiker i Gdańsk & Gdynia');
}

function fillStoreAndOpenNewItem(storeName: string) {
  showStoresModal.value = false;
  openNewItemModal();
  formStore.value = storeName;
}

function resetToTricityCatalog() {
  resetShoppingListToSeeds(props.houseKey);
  refresh();
  showStoresModal.value = false;
  emit('toast', isEn.value ? 'Shopping list updated to English Gdańsk & Gdynia store catalogue' : 'Inköpslistan uppdaterad till Gdańsk/Gdynia-katalogen');
}

function openNewItemModal() {
  editingItemId.value = null;
  formTitle.value = '';
  formCategory.value = 'power_tools';
  formPricePln.value = '';
  formPriceSek.value = '';
  formQuantity.value = 1;
  formUnit.value = 'pcs';
  formPriority.value = 'high';
  formStore.value = '';
  formNotes.value = '';
  formIsPurchased.value = false;
  showModal.value = true;
}

function openEditModal(item: ShoppingItem) {
  editingItemId.value = item.id;
  formTitle.value = item.title;
  formCategory.value = item.category;
  formPricePln.value = item.estimatedPricePln;
  formPriceSek.value = convertPlnToSek(item.estimatedPricePln, rateInfo.value.ratePlnToSek);
  formQuantity.value = item.quantity || 1;
  formUnit.value = item.unit || 'pcs';
  formPriority.value = item.priority || 'medium';
  formStore.value = item.storeOrUrl || '';
  formNotes.value = item.notes || '';
  formIsPurchased.value = item.isPurchased;
  showModal.value = true;
}

function saveItem() {
  const title = formTitle.value.trim();
  if (!title) return;

  const pricePln = Math.max(0, Math.round(Number(formPricePln.value) || 0));
  const qty = Math.max(1, Math.round(Number(formQuantity.value) || 1));

  if (editingItemId.value) {
    updateShoppingItem(editingItemId.value, {
      title,
      category: formCategory.value,
      estimatedPricePln: pricePln,
      quantity: qty,
      unit: formUnit.value,
      priority: formPriority.value,
      storeOrUrl: formStore.value.trim(),
      notes: formNotes.value.trim(),
      isPurchased: formIsPurchased.value
    }, props.houseKey);
    emit('toast', isEn.value ? 'Item updated' : 'Artikeln sparad');
  } else {
    addShoppingItem({
      title,
      category: formCategory.value,
      estimatedPricePln: pricePln,
      quantity: qty,
      unit: formUnit.value,
      priority: formPriority.value,
      storeOrUrl: formStore.value.trim(),
      notes: formNotes.value.trim(),
      isPurchased: formIsPurchased.value
    }, props.houseKey);
    emit('toast', isEn.value ? 'New item added to shopping list' : 'Ny artikel tillagd i inköpslistan');
  }

  showModal.value = false;
  refresh();
}

function handleLogAsExpense(item: ShoppingItem) {
  const meta = getShoppingCategoryMeta(item.category);
  const totalCost = (item.isPurchased && item.purchasedPricePln !== undefined ? item.purchasedPricePln : item.estimatedPricePln) * (item.quantity || 1);

  // If not yet marked as purchased, mark it now
  if (!item.isPurchased) {
    toggleShoppingItemPurchased(item.id, props.houseKey);
    refresh();
  }

  emit('log-expense', {
    title: item.title,
    amount: totalCost,
    category: meta.defaultExpenseCategory,
    notes: `${item.quantity > 1 ? `${item.quantity} ${item.unit || 'st'}, ` : ''}${item.storeOrUrl ? `Butik: ${item.storeOrUrl}. ` : ''}${item.notes || ''}`.trim(),
    shoppingId: item.id
  });
}

function copyShoppingSummary() {
  const text = generateShoppingSummaryText(items.value, isEn.value ? 'House Project Shopping List' : 'Inköpslista Byggprojekt');
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    emit('toast', isEn.value ? 'Shopping list copied to clipboard!' : 'Inköpslistan kopierad till urklipp!');
  }
}

function downloadCsvFile() {
  const csv = generateShoppingCsv(items.value);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inkopslista_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  emit('toast', isEn.value ? 'Downloaded CSV file' : 'Laddade ner CSV-fil');
}

defineExpose({
  openNewItemModal,
  refresh
});
</script>
