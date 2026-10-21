<template>
  <div class="relative flex flex-col h-full w-full bg-[#F5F3EC] text-[#222925] selection:bg-[#173D35] selection:text-white overflow-hidden">
    <!-- Top Header Bar -->
    <header class="shrink-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#d7d1c4]/80 bg-[#FAF8F5]/95 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173D35] text-white shadow-md shadow-[#173D35]/20">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-bold text-[#173D35] tracking-tight">
              {{ activeTab === 'expenses'
                ? (isEn ? 'Expense Tracker' : 'Kostnadsuppföljning')
                : (isEn ? 'Shopping List' : 'Inköpslista') }}
            </h1>
            <span class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-amber-800 border border-amber-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {{ isEn ? 'Invite-only' : 'Endast inbjudan' }}
            </span>
          </div>
          <p class="text-xs text-stone-500">
            {{ activeTab === 'expenses'
              ? (isEn ? 'Project building costs in Polish Złoty (PLN) with live Revolut SEK comparison' : 'Projektets byggkostnader i Polska Złoty (zł) med Revolut-kurs mot SEK')
              : (isEn ? 'Planned purchases for garden, power tools, kitchen & furniture' : 'Planerade inköp för trädgård, elverktyg, kök & möbler') }}
          </p>
        </div>
      </div>

      <!-- Header actions -->
      <div class="flex items-center gap-2">
        <!-- Switch to Mood Board -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          :title="isEn ? 'Open Mood Board' : 'Öppna moodboarden'"
          @click="openMoodBoard"
        >
          <span>🎨</span>
          <span class="hidden sm:inline">{{ isEn ? 'Mood Board' : 'Moodboard' }}</span>
        </button>

        <!-- Invite collaborators button -->
        <button
          type="button"
          id="btn-open-expense-invite"
          class="inline-flex items-center gap-1.5 rounded-xl border border-[#173D35]/30 bg-[#173D35]/10 px-3 py-1.5 text-xs font-semibold text-[#173D35] shadow-sm transition hover:bg-[#173D35]/15 active:scale-95"
          @click="showInviteModal = true"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>{{ isEn ? 'Invite' : 'Bjud in' }}</span>
        </button>

        <!-- Primary Action Button: New Expense or New Shopping Item -->
        <button
          v-if="activeTab === 'expenses'"
          type="button"
          id="btn-add-expense"
          class="inline-flex items-center gap-1.5 rounded-xl bg-[#173D35] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#173D35]/20 transition hover:bg-[#0f2b25] active:scale-95"
          @click="openNewExpenseModal"
        >
          <span class="text-base leading-none font-bold">+</span>
          <span>{{ isEn ? 'New Expense' : 'Nytt utlägg' }}</span>
        </button>
        <button
          v-else
          type="button"
          id="btn-add-shopping-item-header"
          class="inline-flex items-center gap-1.5 rounded-xl bg-[#173D35] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#173D35]/20 transition hover:bg-[#0f2b25] active:scale-95"
          @click="shoppingListRef?.openNewItemModal()"
        >
          <span class="text-base leading-none font-bold">+</span>
          <span>{{ isEn ? 'New Item' : 'Ny artikel' }}</span>
        </button>

        <!-- Close / Return if standalone or embedded -->
        <button
          v-if="standalone"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
          :title="isEn ? 'Back to house' : 'Tillbaka till huset'"
          @click="closeTracker"
        >
          ✕
        </button>
      </div>
    </header>

    <!-- Main Scroll Container -->
    <div class="relative flex-1 min-h-0 w-full overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
      <main class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-28">
      <!-- Top Co-existing Tabs: Expenses vs. Shopping List -->
      <nav class="flex items-center justify-between flex-wrap gap-3 pb-1" aria-label="Expenses and Shopping Tabs">
        <div class="inline-flex p-1 bg-[#eae6dc] rounded-2xl border border-[#d7d1c4] shadow-inner" role="tablist">
          <button
            type="button"
            id="tab-btn-expenses"
            role="tab"
            :aria-selected="activeTab === 'expenses'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200"
            :class="activeTab === 'expenses'
              ? 'bg-white text-[#173D35] shadow-md shadow-stone-400/20'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'"
            @click="switchTab('expenses')"
          >
            <span class="text-base">🧾</span>
            <span>{{ isEn ? 'Logged Expenses' : 'Utlägg & Kvitton' }}</span>
            <span
              class="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
              :class="activeTab === 'expenses' ? 'bg-[#173D35]/10 text-[#173D35]' : 'bg-stone-300/80 text-stone-700'"
            >
              {{ expenses.length }}
            </span>
          </button>

          <button
            type="button"
            id="tab-btn-shopping"
            role="tab"
            :aria-selected="activeTab === 'shopping'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200"
            :class="activeTab === 'shopping'
              ? 'bg-white text-[#173D35] shadow-md shadow-stone-400/20'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'"
            @click="switchTab('shopping')"
          >
            <span class="text-base">🛒</span>
            <span>{{ isEn ? 'Shopping List' : 'Inköpslista' }}</span>
            <span
              class="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
              :class="activeTab === 'shopping' ? 'bg-amber-500/20 text-amber-900' : 'bg-stone-300/80 text-stone-700'"
            >
              {{ shoppingSummary.toBuyCount }} {{ isEn ? 'to buy' : 'kvar' }}
            </span>
          </button>
        </div>

        <!-- Quick info badge -->
        <div class="hidden sm:flex items-center gap-2 text-xs text-stone-500">
          <span class="inline-block w-2 h-2 rounded-full" :class="activeTab === 'expenses' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
          <span>{{ activeTab === 'expenses'
            ? (isEn ? 'Recorded receipts & payments in PLN / SEK' : 'Bokförda kvitton och utlägg i PLN / SEK')
            : (isEn ? 'Planned purchases: Garden, Power tools, Kitchen, Furniture' : 'Planerade inköp: Trädgård, elverktyg, kök & möbler') }}</span>
        </div>
      </nav>

      <!-- 0. Live Revolut Currency Checker & SEK Comparison Bar -->
      <section class="rounded-2xl border border-[#d7d1c4] bg-[#FAF8F5] p-4 sm:p-5 shadow-sm transition hover:shadow-md">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Rate Header & Status -->
          <div class="flex items-center gap-3.5">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#173D35]/10 text-xl border border-[#173D35]/20">
              🇵🇱
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {{ isEn ? 'Main Currency: Polish Złoty (PLN / zł)' : 'Huvudvaluta: Polska złoty (PLN / zł)' }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                  :class="currencyRate.isCustom
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="currencyRate.isCustom ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'"></span>
                  {{ currencyRate.isCustom ? (isEn ? 'Custom Rate' : 'Egen kurs') : 'Revolut Kurs' }}
                </span>
              </div>

              <!-- Main Exchange Rate Display -->
              <div class="flex flex-wrap items-baseline gap-2 mt-0.5">
                <h3 class="text-xl sm:text-2xl font-black text-[#173D35] tracking-tight">
                  1 PLN (zł) = {{ currencyRate.ratePlnToSek.toFixed(2) }} SEK (kr)
                </h3>
                <span class="text-xs font-semibold text-stone-500">
                  (1 SEK ≈ {{ currencyRate.rateSekToPln.toFixed(2) }} zł)
                </span>
              </div>

              <p class="text-[11px] text-stone-500 mt-0.5">
                {{ currencyRate.sourceLabel }} · {{ isEn ? 'Updated' : 'Uppdaterad' }} {{ formatRateTime(currencyRate.lastUpdated) }}
              </p>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Toggle Converter -->
            <button
              type="button"
              id="btn-toggle-currency-converter"
              class="inline-flex items-center gap-1.5 rounded-xl border border-[#173D35]/30 bg-white px-3.5 py-2 text-xs font-bold text-[#173D35] shadow-sm transition hover:bg-[#173D35]/10 active:scale-95"
              @click="showCalculator = !showCalculator"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>{{ showCalculator ? (isEn ? 'Hide Converter' : 'Dölj omräknare') : (isEn ? 'PLN ⇄ SEK Converter' : 'Omräknare PLN ⇄ SEK') }}</span>
            </button>

            <!-- Refresh Live Rate -->
            <button
              type="button"
              id="btn-refresh-exchange-rate"
              class="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
              :disabled="isFetchingRate"
              :title="isEn ? 'Fetch live Revolut market rate' : 'Hämta senaste Revolut-marknadskurs'"
              @click="handleFetchRate"
            >
              <svg class="h-3.5 w-3.5 text-stone-500" :class="{ 'animate-spin': isFetchingRate }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="hidden sm:inline">{{ isEn ? 'Live Rate' : 'Hämta kurs' }}</span>
            </button>

            <!-- Adjust Custom Rate -->
            <button
              type="button"
              id="btn-adjust-exchange-rate"
              class="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50 active:scale-95"
              :title="isEn ? 'Adjust exchange rate' : 'Justera växelkurs'"
              @click="openRateModal"
            >
              <span>⚙️</span>
              <span class="hidden sm:inline">{{ isEn ? 'Adjust' : 'Justera' }}</span>
            </button>
          </div>
        </div>

        <!-- Interactive Two-Way Currency Converter Widget -->
        <div v-if="showCalculator" class="mt-4 pt-4 border-t border-stone-200">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <!-- PLN Input -->
            <div class="md:col-span-2 space-y-1">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Polish Złoty (PLN / zł)' : 'Polska Złoty (PLN / zł)' }}
              </label>
              <div class="relative">
                <input
                  v-model="checkerPln"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full rounded-xl border border-[#d7d1c4] bg-white pl-3.5 pr-12 py-2 text-sm font-bold text-[#173D35] focus:border-[#173D35] focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                  placeholder="0 zł"
                  @input="onCheckerPlnChange"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  zł
                </span>
              </div>
            </div>

            <!-- Conversion direction indicator -->
            <div class="hidden md:flex justify-center items-center pb-2 text-stone-400 font-bold text-base">
              ⇄
            </div>

            <!-- SEK Input -->
            <div class="md:col-span-2 space-y-1">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Swedish Kronor (SEK / kr)' : 'Svenska Kronor (SEK / kr)' }}
              </label>
              <div class="relative">
                <input
                  v-model="checkerSek"
                  type="number"
                  min="0"
                  step="any"
                  class="w-full rounded-xl border border-[#d7d1c4] bg-white pl-3.5 pr-12 py-2 text-sm font-bold text-[#173D35] focus:border-[#173D35] focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                  placeholder="0 kr"
                  @input="onCheckerSekChange"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  kr
                </span>
              </div>
            </div>
          </div>

          <!-- Quick presets & helper note -->
          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="text-stone-400 font-medium mr-1">{{ isEn ? 'Quick presets:' : 'Snabbjämförelse:' }}</span>
              <button
                v-for="preset in [50, 100, 500, 1000, 5000]"
                :key="preset"
                type="button"
                class="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-700 transition active:scale-95"
                @click="selectPresetPln(preset)"
              >
                {{ preset }} zł = {{ convertPlnToSek(preset, currencyRate.ratePlnToSek) }} kr
              </button>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-bold text-[#173D35] hover:underline"
              @click="useCheckerAmountInNewExpense"
            >
              <span>+</span>
              <span>{{ isEn ? 'Create expense with this amount' : 'Skapa utlägg med detta belopp' }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Tab 1: Logged Expenses View -->
      <template v-if="activeTab === 'expenses'">
        <!-- 1. Automatic Summary Dashboard in PLN with SEK Comparison -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Spent Card -->
        <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
              {{ isEn ? 'Total Spending (PLN)' : 'Totala Utlägg (PLN)' }}
            </span>
            <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
              {{ summary.totalCount }}
            </span>
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#173D35] tracking-tight">
              {{ formatPLN(summary.totalAmount) }}
            </h2>
          </div>
          <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <span>≈ {{ formatSEK(summary.totalAmountSek) }}</span>
            <span class="text-[10px] text-stone-400 font-normal">({{ currencyRate.ratePlnToSek }} kr/zł)</span>
          </div>
          <p class="mt-0.5 text-xs text-stone-500">
            {{ isEn ? `Across ${summary.totalCount} logged expenses` : `Fördelt på ${summary.totalCount} registrerade utlägg` }}
          </p>
        </div>

        <!-- Average Expense Card -->
        <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
            {{ isEn ? 'Average Expense (PLN)' : 'Genomsnittligt Utlägg (PLN)' }}
          </span>
          <div class="mt-2 flex items-baseline gap-2">
            <h3 class="text-2xl sm:text-3xl font-extrabold text-[#173D35] tracking-tight">
              {{ formatPLN(summary.averageAmount) }}
            </h3>
          </div>
          <div class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <span>≈ {{ formatSEK(summary.averageAmountSek) }}</span>
            <span class="text-[10px] text-stone-400 font-normal">({{ isEn ? 'Revolut rate' : 'Revolut-kurs' }})</span>
          </div>
          <p class="mt-0.5 text-xs text-stone-500">
            {{ isEn ? 'Per transaction / receipt' : 'Per transaktion / inköp' }}
          </p>
        </div>

        <!-- Manual Selection Summary Toggle Card -->
        <div class="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
                {{ isEn ? 'Manual Summary' : 'Manuell Delsummering' }}
              </span>
              <button
                type="button"
                class="text-xs font-bold px-2 py-0.5 rounded-lg transition"
                :class="manualSelectionMode ? 'bg-[#173D35] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
                @click="manualSelectionMode = !manualSelectionMode"
              >
                {{ manualSelectionMode ? (isEn ? 'Active' : 'Aktiv') : (isEn ? 'Select' : 'Välj utlägg') }}
              </button>
            </div>
            <p class="mt-1 text-xs text-stone-600">
              {{ manualSelectionMode
                ? (isEn ? `${selectedIds.size} expenses selected` : `${selectedIds.size} st utlägg markerade`)
                : (isEn ? 'Pick specific expenses to summarize manually' : 'Välj poster för manuell delsummering i PLN & SEK') }}
            </p>
          </div>
          <div v-if="manualSelectionMode" class="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
            <div>
              <span class="text-sm font-bold text-amber-700">
                {{ formatPLN(selectedSubtotal) }}
              </span>
              <span class="text-xs text-stone-500 ml-1.5 font-medium">
                (≈ {{ formatSEK(convertPlnToSek(selectedSubtotal, currencyRate.ratePlnToSek)) }})
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="text-[11px] font-semibold text-[#173D35] hover:underline"
                @click="selectAllFiltered"
              >
                {{ isEn ? 'All' : 'Alla' }}
              </button>
              <span class="text-stone-300">·</span>
              <button
                type="button"
                class="text-[11px] font-semibold text-stone-500 hover:underline"
                @click="clearSelection"
              >
                {{ isEn ? 'Clear' : 'Rensa' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Category Breakdown Bar -->
      <section v-if="summary.categories.length > 0" class="rounded-2xl border border-[#d7d1c4] bg-white p-5 shadow-sm">
        <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          {{ isEn ? 'Cost Distribution by Category (PLN / SEK)' : 'Kostnadsfördelning per kategori (PLN / SEK)' }}
        </h4>

        <!-- Visual Multi-segment Progress Bar -->
        <div class="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex mb-4">
          <div
            v-for="cat in summary.categories"
            :key="cat.category"
            class="h-full transition-all duration-300"
            :style="{ width: `${cat.percentage}%`, backgroundColor: cat.color }"
            :title="`${isEn ? cat.labelEn : cat.labelSv}: ${formatPLN(cat.total)} (≈ ${formatSEK(cat.totalSek)}) (${cat.percentage}%)`"
          ></div>
        </div>

        <!-- Category Pills -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="cat in summary.categories"
            :key="cat.category"
            class="inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs border"
            :style="{ backgroundColor: getCategoryMeta(cat.category).badgeBg, borderColor: getCategoryMeta(cat.category).badgeBorder }"
          >
            <span class="text-sm">{{ getCategoryMeta(cat.category).icon }}</span>
            <span class="font-semibold text-stone-800">{{ isEn ? cat.labelEn : cat.labelSv }}</span>
            <span class="font-bold text-[#173D35]">{{ formatPLN(cat.total) }}</span>
            <span class="text-[11px] font-medium text-stone-500">(≈ {{ formatSEK(cat.totalSek) }} · {{ cat.percentage }}%)</span>
          </div>
        </div>
      </section>

      <!-- 2. Controls Toolbar: Search, Filter, Sort -->
      <section class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="isEn ? 'Search title, vendor, notes, buyer...' : 'Sök utlägg, butik, kvitto, köpare...'"
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

        <!-- Sort dropdown & actions -->
        <div class="flex items-center gap-2 self-end sm:self-auto">
          <!-- Sort -->
          <select
            v-model="sortOrder"
            class="rounded-xl border border-[#d7d1c4] bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm focus:border-[#173D35] focus:outline-none"
          >
            <option value="date_desc">{{ isEn ? 'Newest first' : 'Nyast först' }}</option>
            <option value="date_asc">{{ isEn ? 'Oldest first' : 'Äldst först' }}</option>
            <option value="amount_desc">{{ isEn ? 'Highest amount' : 'Högst belopp' }}</option>
            <option value="amount_asc">{{ isEn ? 'Lowest amount' : 'Lägst belopp' }}</option>
          </select>

          <!-- Export buttons -->
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
            :title="isEn ? 'Copy summary text' : 'Kopiera sammanställning'"
            @click="copySummary"
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
        </div>
      </section>

      <!-- Category Filter Chips -->
      <section class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition"
          :class="selectedCategoryFilter === 'all'
            ? 'bg-[#173D35] text-white shadow-sm'
            : 'bg-white border border-[#d7d1c4] text-stone-700 hover:bg-stone-50'"
          @click="selectedCategoryFilter = 'all'"
        >
          {{ isEn ? 'All Categories' : 'Alla kategorier' }} ({{ expenses.length }})
        </button>

        <button
          v-for="cat in EXPENSE_CATEGORIES"
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

      <!-- 3. Expenses List in PLN with SEK Comparison -->
      <section class="space-y-2.5">
        <!-- Empty state -->
        <div
          v-if="filteredExpenses.length === 0"
          class="flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-3xl border-2 border-dashed border-[#d7d1c4] bg-white/70 shadow-xs backdrop-blur-xs"
        >
          <div class="h-16 w-16 rounded-2xl bg-[#173D35]/10 flex items-center justify-center text-3xl mb-4 shadow-xs">
            🧾
          </div>
          <h3 class="text-lg sm:text-xl font-extrabold text-[#173D35]">
            {{ isEn ? 'No expenses found' : 'Inga utlägg hittades' }}
          </h3>
          <p class="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
            {{ searchQuery || selectedCategoryFilter !== 'all'
              ? (isEn ? 'Try adjusting your search query or category filters, or record an expense below.' : 'Prova att ändra sökorden eller kategoriurvalet, eller lägg till ett utlägg nedan.')
              : (isEn ? 'Record your first receipt, material purchase, tool, or contractor invoice.' : 'Bokför ditt första inköp, kvitto, verktyg eller hantverksfaktura.') }}
          </p>

          <button
            type="button"
            id="btn-add-first-expense"
            class="mt-6 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#173D35] px-8 py-3.5 sm:px-10 sm:py-4 text-base sm:text-lg font-extrabold text-white shadow-lg hover:shadow-xl hover:bg-[#0f2b25] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35] focus-visible:ring-offset-2"
            @click="openNewExpenseModal"
          >
            <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>{{ expenses.length === 0 ? (isEn ? 'Add First Expense' : 'Lägg till första utlägget') : (isEn ? 'Add Expense' : 'Lägg till utlägg') }}</span>
          </button>

          <button
            v-if="searchQuery || selectedCategoryFilter !== 'all'"
            type="button"
            class="mt-3 text-xs font-semibold text-stone-500 hover:text-[#173D35] underline underline-offset-2 transition-colors cursor-pointer"
            @click="searchQuery = ''; selectedCategoryFilter = 'all'"
          >
            {{ isEn ? 'Reset filters' : 'Återställ filter' }}
          </button>
        </div>

        <!-- Expense Rows -->
        <div
          v-for="item in filteredExpenses"
          :key="item.id"
          class="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#d7d1c4] bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[#173D35]/40"
          :class="{ 'ring-2 ring-[#173D35]/30 bg-amber-50/20': selectedIds.has(item.id) }"
        >
          <div class="flex items-start sm:items-center gap-3">
            <!-- Checkbox for manual selection mode -->
            <input
              v-if="manualSelectionMode"
              type="checkbox"
              :checked="selectedIds.has(item.id)"
              class="h-4 w-4 mt-1 sm:mt-0 rounded text-[#173D35] focus:ring-[#173D35] border-stone-300 cursor-pointer"
              @change="toggleSelect(item.id)"
            />

            <!-- Category Icon badge -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg border"
              :style="{ backgroundColor: getCategoryMeta(item.category).badgeBg, borderColor: getCategoryMeta(item.category).badgeBorder }"
              :title="isEn ? getCategoryMeta(item.category).labelEn : getCategoryMeta(item.category).labelSv"
            >
              {{ getCategoryMeta(item.category).icon }}
            </div>

            <!-- Title, timestamp, notes -->
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-sm font-bold text-[#222925] tracking-tight">
                  {{ item.title }}
                </h4>
                <span
                  class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold border"
                  :style="{ backgroundColor: getCategoryMeta(item.category).badgeBg, borderColor: getCategoryMeta(item.category).badgeBorder, color: getCategoryMeta(item.category).color }"
                >
                  {{ isEn ? getCategoryMeta(item.category).labelEn : getCategoryMeta(item.category).labelSv }}
                </span>
                <!-- Receipt indicator button -->
                <button
                  v-if="item.receipt?.dataUrl"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700 transition"
                  :title="isEn ? 'View attached receipt' : 'Visa bifogat kvitto'"
                  @click="viewReceipt(item)"
                >
                  <span>📎</span>
                  <span>{{ isEn ? 'Receipt' : 'Kvitto' }}</span>
                </button>
              </div>

              <!-- Meta info: Auto-timestamp, notes, purchaser -->
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                <span class="inline-flex items-center gap-1" :title="`Registrerad: ${item.createdAt}`">
                  <svg class="h-3 w-3 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{{ formatExpenseDate(item.createdAt, isEn ? 'en' : 'sv') }}</span>
                </span>

                <span v-if="item.notes" class="text-stone-600 font-medium truncate max-w-xs">
                  · {{ item.notes }}
                </span>

                <span v-if="item.paidBy?.name" class="inline-flex items-center gap-1 font-medium text-stone-500">
                  <span>·</span>
                  <span>{{ isEn ? 'added by' : 'tillagd av' }}</span>
                  <span class="text-stone-700 font-medium">{{ item.paidBy.name }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Amount and Action buttons -->
          <div class="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
            <div class="text-right">
              <span class="text-base sm:text-lg font-bold text-[#173D35] tabular-nums block">
                {{ formatPLN(item.amount) }}
              </span>
              <span class="text-[11px] font-semibold text-amber-800 tabular-nums block">
                ≈ {{ formatSEK(convertPlnToSek(item.amount, currencyRate.ratePlnToSek)) }}
                <span v-if="item.currency === 'SEK' && item.originalAmount" class="text-stone-400 font-normal">
                  · {{ isEn ? 'Paid' : 'Betalt' }} {{ formatSEK(item.originalAmount) }}
                </span>
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button
                type="button"
                class="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                :title="isEn ? 'Edit expense' : 'Redigera utlägg'"
                @click="openEditExpenseModal(item)"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              <button
                type="button"
                class="rounded-lg p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                :title="isEn ? 'Delete expense' : 'Ta bort utlägg'"
                @click="confirmDelete(item)"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Tab 2: Shopping List View -->
    <template v-else-if="activeTab === 'shopping'">
      <ShoppingList
        ref="shoppingListRef"
        :house-key="activeHouseKey"
        @log-expense="handleShoppingLogExpense"
        @toast="showToast"
      />
    </template>
      </main>
    </div>

  <!-- Sticky Manual Summary Drawer at Bottom (when items selected) -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <aside
      v-if="activeTab === 'expenses' && manualSelectionMode && selectedIds.size > 0"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-800 bg-[#173D35] px-6 py-3.5 text-white shadow-2xl w-[92%] max-w-2xl"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 font-bold text-xs">
            {{ selectedIds.size }}
          </div>
          <div>
            <p class="text-xs text-stone-300">
              {{ isEn ? 'Selected Subtotal' : 'Delsumma för markerade' }}
            </p>
            <div class="flex items-baseline gap-2">
              <p class="text-lg font-bold text-white tracking-tight">
                {{ formatPLN(selectedSubtotal) }}
              </p>
              <p class="text-xs font-semibold text-amber-300">
                ≈ {{ formatSEK(convertPlnToSek(selectedSubtotal, currencyRate.ratePlnToSek)) }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
            @click="copySelectedSummary"
          >
            {{ isEn ? 'Copy' : 'Kopiera' }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-white text-[#173D35] hover:bg-stone-100 px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow"
            @click="clearSelection"
          >
            {{ isEn ? 'Clear' : 'Rensa' }}
          </button>
        </div>
      </aside>
    </transition>

    <!-- Modal: Add / Edit Expense with PLN as Primary and SEK Helper -->
    <div
      v-if="showExpenseModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="showExpenseModal = false"
    >
      <div class="relative w-full max-w-lg rounded-3xl border border-[#d7d1c4] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 class="text-lg font-bold text-[#173D35]">
              {{ editingExpenseId ? (isEn ? 'Edit Expense' : 'Redigera utlägg') : (isEn ? 'Add New Expense' : 'Nytt utlägg') }}
            </h3>
            <p class="text-xs text-stone-500">
              {{ isEn ? 'Main currency is Polish Złoty (PLN / zł)' : 'Huvudvaluta är Polska Złoty (zł / PLN)' }}
            </p>
          </div>
          <button
            type="button"
            class="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
            @click="showExpenseModal = false"
          >
            ✕
          </button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="saveExpenseForm">
          <!-- Title -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Description / Title' : 'Beskrivning / Vad köptes?' }} <span class="text-rose-600">*</span>
            </label>
            <input
              v-model="formTitle"
              type="text"
              required
              maxlength="80"
              :placeholder="isEn ? 'E.g. Timber 45x145 C24' : 'T.ex. Reglar 45×145 C24'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2.5 text-sm text-[#222925] focus:border-[#173D35] focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
            />
          </div>

          <!-- Amount in Polish Złoty (PLN / zł) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Amount (PLN / zł)' : 'Belopp i Polska Złoty (zł / PLN)' }} <span class="text-rose-600">*</span>
              </label>
              <button
                type="button"
                class="text-[11px] font-semibold text-[#173D35] hover:underline"
                @click="showSekInputHelper = !showSekInputHelper"
              >
                {{ showSekInputHelper ? (isEn ? 'Hide SEK calculator' : 'Dölj SEK-omräknare') : (isEn ? 'Paid in SEK? Click here' : 'Betalade du i SEK? Klicka här') }}
              </button>
            </div>
            <div class="relative">
              <input
                v-model="formAmount"
                type="number"
                min="0"
                step="any"
                required
                :placeholder="isEn ? '0 zł' : '0 zł'"
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] pl-3.5 pr-14 py-2.5 text-base font-bold text-[#173D35] focus:border-[#173D35] focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                @input="formCurrency = 'PLN'"
              />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                zł (PLN)
              </span>
            </div>

            <!-- Live SEK comparison underneath amount input -->
            <div class="flex items-center justify-between text-xs px-1 pt-0.5">
              <span class="text-stone-600 font-medium">
                {{ isEn ? 'Equivalent in SEK:' : 'Motsvarar i SEK:' }}
                <strong class="text-amber-800 ml-1">
                  ≈ {{ formatSEK(convertPlnToSek(Number(formAmount) || 0, currencyRate.ratePlnToSek)) }}
                </strong>
              </span>
              <span class="text-[11px] text-stone-400">
                1 zł = {{ currencyRate.ratePlnToSek }} kr
              </span>
            </div>

            <!-- Expandable SEK Helper Box -->
            <div v-if="showSekInputHelper" class="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-stone-700">
                  {{ isEn ? 'Calculate from SEK receipt amount:' : 'Räkna om från kvitto/betalning i SEK:' }}
                </span>
                <span class="text-[10px] text-stone-500 font-medium">
                  Revolut-kurs: ÷ {{ currencyRate.ratePlnToSek }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <input
                    v-model="formSekHelperAmount"
                    type="number"
                    min="0"
                    step="any"
                    :placeholder="isEn ? 'Amount in SEK' : 'Belopp i SEK (kr)'"
                    class="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#173D35]"
                  />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">kr</span>
                </div>
                <button
                  type="button"
                  class="rounded-lg bg-[#173D35] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f2b25]"
                  @click="applySekHelperToPln"
                >
                  {{ isEn ? 'Apply to PLN' : 'Infoga i zł' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Category' : 'Kategori' }}
            </label>
            <select
              v-model="formCategory"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2.5 text-sm font-medium text-[#222925] focus:border-[#173D35] focus:outline-none"
            >
              <option v-for="cat in EXPENSE_CATEGORIES" :key="cat.id" :value="cat.id">
                {{ cat.icon }} {{ isEn ? cat.labelEn : cat.labelSv }}
              </option>
            </select>
          </div>

          <!-- Date (Auto-timestamp note) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {{ isEn ? 'Date' : 'Datum' }}
              </label>
              <span class="text-[11px] text-stone-400">
                {{ isEn ? 'Automatic timestamp is logged' : 'Automatisk tidsstämpel sparas' }}
              </span>
            </div>
            <input
              v-model="formDate"
              type="date"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-sm text-[#222925] focus:border-[#173D35] focus:outline-none"
            />
          </div>

          <!-- Vendor / Notes -->
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Store / Vendor / Memo (Optional)' : 'Butik / Leverantör / Anteckning (Valfritt)' }}
            </label>
            <input
              v-model="formNotes"
              type="text"
              maxlength="120"
              :placeholder="isEn ? 'E.g. Castorama, Leroy Merlin, invoice #1042' : 'T.ex. Castorama, Leroy Merlin, Bauhaus, faktura 1042'"
              class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2 text-sm text-[#222925] focus:border-[#173D35] focus:outline-none"
            />
          </div>

          <!-- Receipt upload area -->
          <div class="space-y-1.5 pt-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? 'Attach Receipt (Optional)' : 'Bifoga kvitto / foto (Valfritt)' }}
            </label>

            <!-- If receipt already uploaded -->
            <div v-if="formReceipt?.dataUrl" class="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
              <div class="flex items-center gap-3">
                <img
                  v-if="formReceipt.type.startsWith('image/')"
                  :src="formReceipt.dataUrl"
                  alt="Receipt thumbnail"
                  class="h-12 w-12 rounded-lg object-cover border border-stone-200 shadow-sm"
                />
                <div v-else class="h-12 w-12 rounded-lg bg-stone-200 flex items-center justify-center text-lg">
                  📄
                </div>
                <div>
                  <p class="text-xs font-bold text-stone-800 truncate max-w-[200px]">
                    {{ formReceipt.name }}
                  </p>
                  <p class="text-[11px] text-stone-500">
                    {{ isEn ? 'Receipt attached' : 'Kvitto bifogat' }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                @click="formReceipt = undefined"
              >
                {{ isEn ? 'Remove' : 'Ta bort' }}
              </button>
            </div>

            <!-- Upload drop zone -->
            <label
              v-else
              class="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/60 hover:bg-stone-50 cursor-pointer transition text-center"
            >
              <svg class="h-6 w-6 text-stone-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-xs font-semibold text-[#173D35]">
                {{ isEn ? 'Upload or take a photo of receipt' : 'Ladda upp eller fota kvitto' }}
              </span>
              <span class="text-[10px] text-stone-400 mt-0.5">
                PNG, JPG, WEBP, PDF ({{ isEn ? 'compressed automatically' : 'komprimeras automatiskt' }})
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                class="hidden"
                @change="handleReceiptFile"
              />
            </label>
          </div>

          <!-- Submit and cancel -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
              @click="showExpenseModal = false"
            >
              {{ isEn ? 'Cancel' : 'Avbryt' }}
            </button>
            <button
              type="submit"
              class="rounded-xl bg-[#173D35] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#173D35]/20 transition hover:bg-[#0f2b25]"
            >
              {{ editingExpenseId ? (isEn ? 'Save Changes' : 'Spara ändringar') : (isEn ? 'Add Expense' : 'Lägg till utlägg') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Adjust Exchange Rate -->
    <div
      v-if="showRateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showRateModal = false"
    >
      <div class="relative w-full max-w-sm rounded-3xl border border-[#d7d1c4] bg-white p-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 class="text-base font-bold text-[#173D35] flex items-center gap-2">
            <span>⚙️</span>
            <span>{{ isEn ? 'Adjust Exchange Rate' : 'Justera växelkurs' }}</span>
          </h3>
          <button
            type="button"
            class="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
            @click="showRateModal = false"
          >
            ✕
          </button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="saveCustomRate">
          <p class="text-xs text-stone-600">
            {{ isEn
              ? 'Enter the exchange rate from your Revolut receipt or transaction (SEK per 1 PLN).'
              : 'Ange växelkursen från ditt Revolut-kvitto eller transaktion (SEK per 1 PLN).' }}
          </p>

          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-stone-600">
              {{ isEn ? '1 PLN equals (SEK):' : '1 PLN motsvarar (SEK):' }}
            </label>
            <div class="relative">
              <input
                v-model="customRateInput"
                type="number"
                step="0.0001"
                min="0.1"
                max="20"
                required
                class="w-full rounded-xl border border-[#d7d1c4] bg-[#FDFBF7] px-3.5 py-2.5 text-base font-bold text-[#173D35] focus:border-[#173D35] focus:outline-none"
              />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                kr/zł
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <button
              type="button"
              class="text-xs font-semibold text-stone-500 hover:underline"
              @click="handleResetRate"
            >
              {{ isEn ? 'Reset to default' : 'Återställ standard' }}
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                @click="showRateModal = false"
              >
                {{ isEn ? 'Cancel' : 'Avbryt' }}
              </button>
              <button
                type="submit"
                class="rounded-xl bg-[#173D35] px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[#0f2b25]"
              >
                {{ isEn ? 'Save Rate' : 'Spara kurs' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Receipt Lightbox Viewer -->
    <div
      v-if="activeReceiptModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click.self="activeReceiptModal = null"
    >
      <div class="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
        <button
          type="button"
          class="absolute -top-10 right-0 text-white hover:text-stone-300 text-sm font-bold flex items-center gap-1"
          @click="activeReceiptModal = null"
        >
          <span>✕</span>
          <span>{{ isEn ? 'Close' : 'Stäng' }}</span>
        </button>

        <img
          :src="activeReceiptModal.dataUrl"
          :alt="activeReceiptModal.name"
          class="rounded-2xl max-h-[80vh] w-auto object-contain shadow-2xl border border-white/20"
        />

        <div class="mt-3 flex items-center justify-between w-full text-white text-xs px-2">
          <span class="truncate max-w-xs font-medium">{{ activeReceiptModal.name }}</span>
          <a
            :href="activeReceiptModal.dataUrl"
            :download="activeReceiptModal.name || 'kvitto.jpg'"
            class="underline font-bold text-amber-300 hover:text-amber-200"
          >
            {{ isEn ? 'Download Receipt' : 'Ladda ner kvitto' }}
          </a>
        </div>
      </div>
    </div>

    <!-- Modal: Invite Collaborators (Same design as MoodBoard) -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showInviteModal = false"
    >
      <div class="relative w-full max-w-md rounded-3xl border border-[#d7d1c4] bg-white p-6 sm:p-8 shadow-2xl text-center">
        <button
          type="button"
          class="absolute right-4 top-4 text-stone-400 hover:text-stone-700 text-lg font-bold"
          @click="showInviteModal = false"
        >
          ✕
        </button>

        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173D35]/10 text-2xl mb-3">
          🤝
        </div>

        <h3 class="text-xl font-bold text-[#173D35] tracking-tight">
          {{ isEn ? 'Invite to Expense Tracker' : 'Bjud in till kostnadsuppföljning' }}
        </h3>
        <p class="mt-1.5 text-xs text-stone-600">
          {{ isEn
            ? 'Invited participants get access to both the Expense Tracker and the Mood Board.'
            : 'Inbjudna deltagare får behörighet till både kostnadsuppföljningen och moodboarden.' }}
        </p>

        <!-- QR Code -->
        <div class="my-5 flex justify-center">
          <div
            class="rounded-2xl border border-stone-200 bg-white p-3 shadow-inner"
            v-html="qrSvg"
          ></div>
        </div>

        <!-- Share Link & Copy Button -->
        <div class="space-y-2">
          <input
            type="text"
            readonly
            :value="shareUrl"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 font-mono select-all text-center"
          />

          <button
            type="button"
            class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#0f2b25] active:scale-95"
            @click="copyInviteLink"
          >
            <span>{{ copiedInvite ? '✓ ' + (isEn ? 'Copied!' : 'Kopierad!') : (isEn ? 'Copy Invitation Link' : 'Kopiera inbjudningslänk') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl"
      >
        <span>✓</span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ShoppingList from './ShoppingList.vue';
import {
  loadShoppingList,
  calculateShoppingSummary,
  updateShoppingItem,
  type ShoppingState
} from '../../services/shoppingSave';
import {
  type ExpenseItem,
  type ExpenseCategory,
  type ExpenseReceipt,
  type CurrencyRateInfo,
  EXPENSE_CATEGORIES,
  getCategoryMeta,
  loadExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  calculateExpenseSummary,
  formatPLN,
  formatSEK,
  formatExpenseDate,
  compressReceiptFile,
  generateSummaryText,
  generateCsv,
  expenseHouseKey,
  getStoredCurrencyRate,
  fetchLiveExchangeRate,
  setCustomExchangeRate,
  resetToDefaultExchangeRate,
  convertPlnToSek,
  convertSekToPln
} from '../../services/expenseSave';
import { getStoredParticipant } from '../../services/moodSave';
import { generateQrSvg } from '../../mood/qr';
import { useLabels } from '../../i18n';
import { useSessionStore } from '../../store/useSessionStore';

const props = withDefaults(
  defineProps<{
    houseKey?: string;
    standalone?: boolean;
  }>(),
  {
    houseKey: '',
    standalone: false
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const { locale } = useLabels();
const isEn = computed(() => locale.value === 'en');

const activeHouseKey = computed(() => props.houseKey || expenseHouseKey());

const activeTab = ref<'expenses' | 'shopping'>(
  route.query?.tab === 'shopping' ? 'shopping' : 'expenses'
);
const shoppingListRef = ref<InstanceType<typeof ShoppingList> | null>(null);
const shoppingState = ref<ShoppingState>(loadShoppingList(activeHouseKey.value));

const shoppingSummary = computed(() => {
  return calculateShoppingSummary(shoppingState.value.items, currencyRate.value.ratePlnToSek);
});

function switchTab(tab: 'expenses' | 'shopping') {
  activeTab.value = tab;
  shoppingState.value = loadShoppingList(activeHouseKey.value);
  try {
    const query = { ...route.query, tab };
    router.replace({ query }).catch(() => {});
  } catch {
    // ignore
  }
}

let pendingShoppingId: string | null = null;

function handleShoppingLogExpense(payload: {
  title: string;
  amount: number;
  category: ExpenseCategory;
  notes?: string;
  shoppingId: string;
}) {
  pendingShoppingId = payload.shoppingId;
  activeTab.value = 'expenses';
  editingExpenseId.value = null;
  formTitle.value = payload.title;
  formAmount.value = payload.amount;
  formCategory.value = payload.category;
  formDate.value = new Date().toISOString().slice(0, 10);
  formNotes.value = payload.notes || '';
  formReceipt.value = undefined;
  formCurrency.value = 'PLN';
  formOriginalAmount.value = undefined;
  showSekInputHelper.value = false;
  formSekHelperAmount.value = '';
  showExpenseModal.value = true;
  showToast(isEn.value ? 'Pre-filled expense from shopping list' : 'Skapar utlägg från artikeln i inköpslistan');
}

const expenses = ref<ExpenseItem[]>([]);
const inviteToken = ref('');

// Currency rate & comparison state
const currencyRate = ref<CurrencyRateInfo>(getStoredCurrencyRate());
const isFetchingRate = ref(false);
const showCalculator = ref(true);
const checkerPln = ref<number | string>(100);
const checkerSek = ref<number | string>(Math.round(100 * currencyRate.value.ratePlnToSek));
const showRateModal = ref(false);
const customRateInput = ref<number>(currencyRate.value.ratePlnToSek);

// Add / Edit modal SEK conversion helper
const showSekInputHelper = ref(false);
const formSekHelperAmount = ref<number | string>('');
const formCurrency = ref<'PLN' | 'SEK'>('PLN');
const formOriginalAmount = ref<number | undefined>(undefined);

const searchQuery = ref('');
const selectedCategoryFilter = ref<string>('all');
const sortOrder = ref<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

// Manual Selection Mode
const manualSelectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());

// Modals
const showExpenseModal = ref(false);
const editingExpenseId = ref<string | null>(null);
const formTitle = ref('');
const formAmount = ref<number | string>('');
const formCategory = ref<ExpenseCategory>('materials');
const formDate = ref(new Date().toISOString().slice(0, 10));
const formNotes = ref('');
const formReceipt = ref<ExpenseReceipt | undefined>(undefined);

const activeReceiptModal = ref<ExpenseReceipt | null>(null);
const showInviteModal = ref(false);
const qrSvg = ref('');
const copiedInvite = ref(false);
const toastMessage = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}

function formatRateTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleTimeString(isEn.value ? 'en-GB' : 'sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDate;
  }
}

function refresh() {
  const state = loadExpenses(activeHouseKey.value);
  expenses.value = state.expenses;
  inviteToken.value = state.inviteToken || '';
  shoppingState.value = loadShoppingList(activeHouseKey.value);
}

onMounted(() => {
  refresh();
  generateQr();
  onCheckerPlnChange();

  // Non-blocking background attempt to refresh latest Revolut interbank rate
  void fetchLiveExchangeRate()
    .then((updated) => {
      currencyRate.value = updated;
      customRateInput.value = updated.ratePlnToSek;
      onCheckerPlnChange();
    })
    .catch(() => {
      // Keep saved rate
    });
});

watch(activeHouseKey, () => {
  refresh();
  generateQr();
});

const summary = computed(() => {
  return calculateExpenseSummary(expenses.value, selectedIds.value, currencyRate.value.ratePlnToSek);
});

const selectedSubtotal = computed(() => {
  let sum = 0;
  for (const item of expenses.value) {
    if (selectedIds.value.has(item.id)) {
      sum += item.amount || 0;
    }
  }
  return sum;
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const item of expenses.value) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
});

const filteredExpenses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const cat = selectedCategoryFilter.value;

  const result = expenses.value.filter((item) => {
    if (cat !== 'all' && item.category !== cat) return false;
    if (!query) return true;
    const matchTitle = item.title.toLowerCase().includes(query);
    const matchNotes = (item.notes || '').toLowerCase().includes(query);
    const matchPaidBy = (item.paidBy?.name || '').toLowerCase().includes(query);
    const matchCategory = getCategoryMeta(item.category).labelSv.toLowerCase().includes(query)
      || getCategoryMeta(item.category).labelEn.toLowerCase().includes(query);
    const matchAmount = String(item.amount).includes(query);
    const matchSek = String(convertPlnToSek(item.amount, currencyRate.value.ratePlnToSek)).includes(query);
    return matchTitle || matchNotes || matchPaidBy || matchCategory || matchAmount || matchSek;
  });

  return result.sort((a, b) => {
    if (sortOrder.value === 'date_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOrder.value === 'date_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortOrder.value === 'amount_desc') {
      return b.amount - a.amount;
    }
    if (sortOrder.value === 'amount_asc') {
      return a.amount - b.amount;
    }
    return 0;
  });
});

// Currency checker / converter methods
function onCheckerPlnChange() {
  const pln = Number(checkerPln.value);
  if (isNaN(pln) || checkerPln.value === '') {
    checkerSek.value = '';
    return;
  }
  checkerSek.value = convertPlnToSek(pln, currencyRate.value.ratePlnToSek);
}

function onCheckerSekChange() {
  const sek = Number(checkerSek.value);
  if (isNaN(sek) || checkerSek.value === '') {
    checkerPln.value = '';
    return;
  }
  checkerPln.value = convertSekToPln(sek, currencyRate.value.ratePlnToSek);
}

function selectPresetPln(amount: number) {
  checkerPln.value = amount;
  checkerSek.value = convertPlnToSek(amount, currencyRate.value.ratePlnToSek);
}

function useCheckerAmountInNewExpense() {
  openNewExpenseModal();
  const pln = Number(checkerPln.value);
  if (pln > 0) {
    formAmount.value = pln;
  }
}

async function handleFetchRate() {
  isFetchingRate.value = true;
  try {
    const updated = await fetchLiveExchangeRate();
    currencyRate.value = updated;
    customRateInput.value = updated.ratePlnToSek;
    onCheckerPlnChange();
    showToast(isEn.value ? `Revolut rate updated: 1 PLN = ${updated.ratePlnToSek} SEK` : `Revolut-kurs uppdaterad: 1 PLN = ${updated.ratePlnToSek} SEK`);
  } catch {
    showToast(isEn.value ? 'Using saved Revolut exchange rate' : 'Använder sparad Revolut-växelkurs');
  } finally {
    isFetchingRate.value = false;
  }
}

function openRateModal() {
  customRateInput.value = currencyRate.value.ratePlnToSek;
  showRateModal.value = true;
}

function saveCustomRate() {
  const rate = Number(customRateInput.value);
  if (rate > 0) {
    const updated = setCustomExchangeRate(rate);
    currencyRate.value = updated;
    onCheckerPlnChange();
    showRateModal.value = false;
    showToast(isEn.value ? `Exchange rate set to 1 PLN = ${rate} SEK` : `Växelkurs sparad: 1 PLN = ${rate} SEK`);
  }
}

function handleResetRate() {
  const reset = resetToDefaultExchangeRate();
  currencyRate.value = reset;
  customRateInput.value = reset.ratePlnToSek;
  onCheckerPlnChange();
  showRateModal.value = false;
  showToast(isEn.value ? 'Reset to default Revolut rate' : 'Återställt till standard Revolut-kurs');
}

function applySekHelperToPln() {
  const sek = Number(formSekHelperAmount.value);
  if (sek > 0) {
    const pln = convertSekToPln(sek, currencyRate.value.ratePlnToSek);
    formAmount.value = pln;
    formCurrency.value = 'SEK';
    formOriginalAmount.value = sek;
    showToast(isEn.value ? `${sek} SEK converted to ${pln} zł` : `${sek} kr omräknat till ${pln} zł`);
  }
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function selectAllFiltered() {
  const next = new Set(selectedIds.value);
  for (const item of filteredExpenses.value) {
    next.add(item.id);
  }
  selectedIds.value = next;
}

function clearSelection() {
  selectedIds.value = new Set();
}

function openNewExpenseModal() {
  editingExpenseId.value = null;
  formTitle.value = '';
  formAmount.value = '';
  formCategory.value = selectedCategoryFilter.value !== 'all' ? (selectedCategoryFilter.value as ExpenseCategory) : 'materials';
  formDate.value = new Date().toISOString().slice(0, 10);
  formNotes.value = '';
  formReceipt.value = undefined;
  formCurrency.value = 'PLN';
  formOriginalAmount.value = undefined;
  showSekInputHelper.value = false;
  formSekHelperAmount.value = '';
  showExpenseModal.value = true;
}

function openEditExpenseModal(item: ExpenseItem) {
  editingExpenseId.value = item.id;
  formTitle.value = item.title;
  formAmount.value = item.amount;
  formCategory.value = item.category;
  formDate.value = item.date || item.createdAt.slice(0, 10);
  formNotes.value = item.notes || '';
  formReceipt.value = item.receipt;
  formCurrency.value = item.currency || 'PLN';
  formOriginalAmount.value = item.originalAmount;
  showSekInputHelper.value = false;
  formSekHelperAmount.value = item.originalAmount ? String(item.originalAmount) : '';
  showExpenseModal.value = true;
}

async function handleReceiptFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const compressed = await compressReceiptFile(file);
    formReceipt.value = compressed;
  } catch {
    // ignore
  }
}

function saveExpenseForm() {
  if (!formTitle.value.trim() || !formAmount.value) return;

  const currentParticipant = getStoredParticipant();
  const author = {
    name: sessionStore.user?.name || currentParticipant?.name || 'Byggare',
    avatar: sessionStore.user?.avatarUrl || currentParticipant?.avatar || '👤',
    email: sessionStore.user?.email || currentParticipant?.email
  };

  const amountVal = Number(formAmount.value) || 0;

  if (editingExpenseId.value) {
    updateExpense(
      editingExpenseId.value,
      {
        title: formTitle.value.trim(),
        amount: amountVal,
        category: formCategory.value,
        date: formDate.value,
        notes: formNotes.value.trim() || undefined,
        receipt: formReceipt.value,
        currency: formCurrency.value,
        originalAmount: formOriginalAmount.value,
        exchangeRate: currencyRate.value.ratePlnToSek
      },
      activeHouseKey.value
    );
    showToast(isEn.value ? 'Expense updated' : 'Utlägg uppdaterat');
  } else {
    const created = addExpense(
      {
        title: formTitle.value.trim(),
        amount: amountVal,
        category: formCategory.value,
        date: formDate.value,
        paidBy: author,
        notes: formNotes.value.trim() || undefined,
        receipt: formReceipt.value,
        currency: formCurrency.value,
        originalAmount: formOriginalAmount.value,
        exchangeRate: currencyRate.value.ratePlnToSek
      },
      activeHouseKey.value
    );
    if (pendingShoppingId) {
      updateShoppingItem(pendingShoppingId, { loggedExpenseId: created.id }, activeHouseKey.value);
      pendingShoppingId = null;
      shoppingState.value = loadShoppingList(activeHouseKey.value);
    }
    showToast(isEn.value ? 'Expense added with timestamp' : 'Utlägg sparat med tidsstämpel');
  }

  showExpenseModal.value = false;
  refresh();
}

function confirmDelete(item: ExpenseItem) {
  const sekEquiv = convertPlnToSek(item.amount, currencyRate.value.ratePlnToSek);
  const confirmMsg = isEn.value
    ? `Delete "${item.title}" (${formatPLN(item.amount)} / ≈ ${formatSEK(sekEquiv)})?`
    : `Vill du ta bort "${item.title}" (${formatPLN(item.amount)} / ≈ ${formatSEK(sekEquiv)})?`;
  if (confirm(confirmMsg)) {
    deleteExpense(item.id, activeHouseKey.value);
    showToast(isEn.value ? 'Expense deleted' : 'Utlägg borttaget');
    refresh();
  }
}

function viewReceipt(item: ExpenseItem) {
  if (item.receipt) {
    activeReceiptModal.value = item.receipt;
  }
}

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  const base = window.location.origin;
  return `${base}/expenses?board=${encodeURIComponent(activeHouseKey.value)}&invite=${encodeURIComponent(inviteToken.value)}`;
});

async function generateQr() {
  if (!shareUrl.value) return;
  try {
    qrSvg.value = await generateQrSvg(shareUrl.value, { width: 180, margin: 1 });
  } catch {
    // ignore
  }
}

function copyInviteLink() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl.value);
    copiedInvite.value = true;
    showToast(isEn.value ? 'Invite link copied to clipboard!' : 'Inbjudningslänk kopierad till urklipp!');
    setTimeout(() => {
      copiedInvite.value = false;
    }, 2500);
  }
}

function copySummary() {
  const text = generateSummaryText(
    filteredExpenses.value,
    isEn.value ? 'Project Expense Summary' : 'Projektets kostnadssammanställning'
  );
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    showToast(isEn.value ? 'Summary copied to clipboard!' : 'Sammanställning kopierad till urklipp!');
  }
}

function copySelectedSummary() {
  const selected = expenses.value.filter((item) => selectedIds.value.has(item.id));
  const text = generateSummaryText(
    selected,
    isEn.value ? 'Manual Expense Selection Summary' : 'Manuell delsummering av utlägg'
  );
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    showToast(isEn.value ? 'Selected summary copied!' : 'Delsummering kopierad till urklipp!');
  }
}

function downloadCsvFile() {
  const csv = generateCsv(filteredExpenses.value);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kostnader_${activeHouseKey.value}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(isEn.value ? 'CSV downloaded' : 'CSV-fil nedladdad');
}

function openMoodBoard() {
  void router.push({
    path: '/mood',
    query: { board: activeHouseKey.value }
  });
}

function closeTracker() {
  emit('close');
  void router.push('/build');
}
</script>
