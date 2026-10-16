<template>
  <section
    id="mood-board"
    class="mood-board pointer-events-auto absolute inset-0 z-50 flex flex-col bg-[#F5F3EC] text-[#222925]"
    role="region"
    :aria-label="t('mood.tool')"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <header
      class="flex flex-col gap-2 px-3 pb-2 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:pt-4 md:px-8 md:pt-6"
      :class="isMobile ? 'pr-16' : ''"
    >
      <div class="min-w-0 flex-1">
        <div class="group flex items-center gap-2">
          <input
            id="mood-title-input"
            v-model="title"
            type="text"
            maxlength="100"
            class="w-full sm:max-w-[34rem] truncate rounded-xl border border-transparent bg-transparent px-2 py-1 text-xl sm:text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-[#173D35] transition hover:border-[#d7d1c4] focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173D35]/30"
            :placeholder="t('mood.title')"
            :aria-label="t('mood.editTitle')"
            @input="persist"
            @blur="persist"
          />
          <span class="pointer-events-none hidden sm:inline text-xs text-[#173D35]/40 opacity-0 transition group-hover:opacity-100">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
        </div>

        <div v-if="formattedCreated" class="mt-0.5 flex items-center gap-1.5 px-2 text-[11px] sm:text-xs font-medium text-[#5c6b64]">
          <svg class="h-3.5 w-3.5 text-[#173D35]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ t('mood.created') }}: {{ formattedCreated }}</span>
        </div>

        <p class="mt-1 max-w-[62ch] px-2 text-xs sm:text-sm leading-relaxed text-[#3c4a43]">
          <Cms k="mood.lead" />
        </p>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          id="btn-mood-lang"
          class="inline-flex h-11 items-center gap-[3px] rounded-xl border border-[#173D35]/15 bg-white px-3 text-[11px] tracking-[0.05em] shadow-[0_1px_2px_rgba(23,61,53,0.06)] hover:border-[#173D35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173D35]"
          :aria-label="locale === 'sv' ? 'English' : 'Svenska'"
          :title="locale === 'sv' ? 'English' : 'Svenska'"
          @click="applyLocale(locale === 'en' ? 'sv' : 'en', true)"
        >
          <span :class="locale === 'sv' ? 'font-extrabold text-[#173D35]' : 'font-semibold text-[#173D35]/40'">SV</span>
          <span class="font-semibold text-[#173D35]/30" aria-hidden="true">/</span>
          <span :class="locale === 'en' ? 'font-extrabold text-[#173D35]' : 'font-semibold text-[#173D35]/40'">EN</span>
        </button>
        <button
          type="button"
          id="btn-mood-profile"
          class="flex items-center gap-1.5 rounded-xl border border-[#d7d1c4] bg-white/80 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-[#173D35] shadow-xs backdrop-blur-xs transition hover:border-[#173D35] hover:bg-white"
          :title="t('mood.myProfile')"
          @click="openProfileModal"
        >
          <img
            v-if="currentAuthor.avatar"
            :src="currentAuthor.avatar"
            :alt="currentAuthor.name"
            class="h-6 w-6 rounded-full object-cover ring-1 ring-[#173D35]/20"
          />
          <span class="hidden sm:inline max-w-[100px] truncate">{{ currentAuthor.name }}</span>
        </button>

        <button
          type="button"
          id="btn-mood-share"
          class="flex items-center gap-1.5 rounded-xl bg-[#173D35] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#F5F3EC] shadow-sm transition hover:bg-[#0f2b25] active:scale-95"
          @click="openShareModal"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>{{ t('mood.share') }}</span>
        </button>

        <button
          v-if="standalone && !isInvited"
          type="button"
          id="btn-mood-builder"
          class="flex items-center gap-1.5 rounded-xl border border-[#173D35] bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-[#173D35] shadow-sm transition hover:bg-[#173D35] hover:text-white"
          @click="router.push('/build')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="hidden sm:inline">{{ t('mood.backToBuilder') }}</span>
        </button>

        <button
          v-if="!standalone || !isInvited"
          type="button"
          id="btn-mood-close"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#173D35] hover:bg-[#173D35] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :class="isMobile ? 'absolute right-3 top-3 z-30 bg-[#F5F3EC] shadow-[0_10px_22px_-12px_rgba(34,41,37,0.55)]' : ''"
          :style="isMobile ? { top: 'max(0.75rem, env(safe-area-inset-top))', right: 'max(0.75rem, env(safe-area-inset-right))' } : undefined"
          :aria-label="t('mood.close')"
          @click="handleClose"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      </div>
    </header>

    <form class="flex flex-col gap-2 px-3 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 md:px-8" @submit.prevent="submitLink">
      <div class="flex items-center gap-2 flex-1">
        <label class="sr-only" for="mood-link"><Cms k="mood.link" /></label>
        <input
          id="mood-link"
          v-model="link"
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          class="mood-link min-w-0 flex-1 rounded-xl border border-[#d7d1c4] bg-white px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-[#222925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :placeholder="t('mood.placeholder')"
        />
        <button
          type="submit"
          id="btn-mood-add"
          class="h-9 sm:h-11 shrink-0 rounded-xl bg-[#173D35] px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#F5F3EC] hover:bg-[#102e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F3EC]"
        >
          <Cms k="mood.add" />
        </button>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          id="btn-mood-files"
          class="flex-1 sm:flex-initial h-9 sm:h-11 rounded-xl border border-[#173D35] px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#173D35] hover:bg-[#173D35] hover:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35] flex items-center justify-center gap-1.5"
          @click="fileInput?.click()"
        >
          <svg class="h-4 w-4 shrink-0 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <Cms k="mood.files" />
        </button>
        <button
          type="button"
          id="btn-mood-postit"
          class="flex-1 sm:flex-initial flex h-9 sm:h-11 items-center justify-center gap-1.5 rounded-xl border border-[#e4d8a5] bg-[#FEF9C3] px-3 sm:px-3.5 text-xs sm:text-sm font-semibold text-[#854D0E] shadow-sm hover:bg-[#FEF08A] hover:border-[#d6c78e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D0E]"
          @click="addPostIt()"
        >
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>{{ t('mood.postit') }}</span>
        </button>
      </div>
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept="image/*,video/*"
        multiple
        :aria-label="t('mood.files')"
        @change="onFileInput"
      />
    </form>

    <p v-if="notice" class="px-4 pb-2 text-sm text-[#173D35] md:px-8" role="status">{{ t(notice) }}</p>

    <div
      ref="stage"
      class="relative min-h-0 flex-1 overflow-y-auto"
      :class="[
        over ? 'outline outline-2 -outline-offset-[12px] outline-[#173D35]' : '',
        isMobile ? 'touch-pan-y overscroll-y-contain px-3 py-2' : ''
      ]"
      @scroll.passive="updateScrollState"
    >
      <div
        ref="sheet"
        class="w-full"
        :class="isMobile ? 'flex flex-col items-center gap-5 pb-24 max-w-lg mx-auto' : 'relative w-full'"
        :style="isMobile ? {} : sheetStyle"
      >
        <p
          v-if="over"
          class="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-[#173D35] px-4 py-2 text-sm font-semibold text-[#F5F3EC]"
        >
          <Cms k="mood.drop" />
        </p>

        <!-- Empty state -->
        <div
          v-if="pieces.length === 0"
          class="flex flex-col items-center justify-center py-20 px-4 text-center text-[#173D35]/70"
        >
          <span class="text-4xl mb-3">📌</span>
          <h3 class="text-base font-bold text-[#173D35]">{{ t('mood.emptyTitle') }}</h3>
          <p class="mt-1 max-w-xs text-xs text-[#4a5851]">
            {{ t('mood.emptyLead') }}
          </p>
        </div>

        <article
          v-for="piece in displayPieces"
          :id="`mood-${piece.id}`"
          :key="piece.id"
          class="mood-piece select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
          :class="[
            isMobile ? 'relative w-full max-w-[460px] rounded-2xl transition-shadow' : 'absolute',
            piece.kind === 'note'
              ? ['mood-note border p-3.5 pb-4 shadow-[0_8px_20px_-6px_rgba(34,41,37,0.22)] rounded-2xl', noteClasses(piece.color)]
              : 'bg-white p-2 sm:p-2.5 pb-3 shadow-[0_12px_28px_-8px_rgba(34,41,37,0.28)] rounded-2xl',
            (!isMobile && piece.kind !== 'note') ? 'cursor-grab active:cursor-grabbing' : ''
          ]"
          :style="isMobile ? {} : frame(piece)"
          tabindex="0"
          :aria-label="t('mood.move')"
          @pointerdown="isMobile ? undefined : onDown($event, piece, 'move')"
          @pointermove="isMobile ? undefined : onPointer"
          @pointerup="isMobile ? undefined : onUp"
          @pointercancel="isMobile ? undefined : onUp"
          @keydown="onPieceKey($event, piece)"
        >
          <!-- POST-IT NOTE RENDERING -->
          <template v-if="piece.kind === 'note'">
            <div class="pointer-events-none absolute -top-2.5 left-1/2 h-4 w-12 -translate-x-1/2 rounded-xs bg-white/55 shadow-xs backdrop-blur-xs" aria-hidden="true"></div>

            <div class="mb-2 flex items-center justify-between gap-1.5">
              <!-- Reorder buttons on mobile, or drag handle on desktop -->
              <div v-if="isMobile" class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-stone-700 active:bg-black/15 disabled:opacity-25"
                  :disabled="isFirstPiece(piece)"
                  :aria-label="t('mood.moveUp') || 'Flytta upp'"
                  @click.stop="movePieceOrder(piece, -1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-stone-700 active:bg-black/15 disabled:opacity-25"
                  :disabled="isLastPiece(piece)"
                  :aria-label="t('mood.moveDown') || 'Flytta ner'"
                  @click.stop="movePieceOrder(piece, 1)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div
                v-else
                class="flex h-7 items-center justify-center px-2.5 rounded-lg bg-black/8 hover:bg-black/15 text-stone-700 active:bg-black/20 transition-colors cursor-grab active:cursor-grabbing select-none"
                :title="t('mood.move')"
                :aria-label="t('mood.move')"
                @pointerdown.stop="onDown($event, piece, 'move')"
              >
                <svg class="h-3.5 w-6 opacity-60 hover:opacity-90" viewBox="0 0 20 8" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="2" r="1.5" />
                  <circle cx="10" cy="2" r="1.5" />
                  <circle cx="17" cy="2" r="1.5" />
                  <circle cx="3" cy="6" r="1.5" />
                  <circle cx="10" cy="6" r="1.5" />
                  <circle cx="17" cy="6" r="1.5" />
                </svg>
              </div>

              <!-- Color dots -->
              <div class="flex items-center gap-1.5">
                <button
                  v-for="col in NOTE_COLORS"
                  :key="col"
                  type="button"
                  class="h-4 w-4 sm:h-3 sm:w-3 rounded-full border border-black/10 transition-transform hover:scale-125 focus:outline-none"
                  :class="[noteDotClass(col), piece.color === col ? 'ring-2 ring-[#173D35]' : '']"
                  :aria-label="col"
                  @pointerdown.stop
                  @click.stop="piece.color = col; persist()"
                ></button>
              </div>

              <button
                type="button"
                class="flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full text-black/40 hover:bg-black/10 hover:text-black/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#173D35]"
                :aria-label="t('mood.remove')"
                @pointerdown.stop
                @click.stop="remove(piece)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </div>

            <textarea
              class="mood-note-text block w-full resize-none bg-transparent text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#173D35]/30 rounded p-1"
              :value="piece.caption"
              :placeholder="t('mood.notePlaceholder')"
              :rows="isMobile ? 3 : 4"
              maxlength="500"
              spellcheck="true"
              @pointerdown.stop
              @input="onCaption(piece, $event)"
              @change="persist"
            ></textarea>

            <!-- Post-it footer: author badge + Likes & Comments buttons -->
            <div
              class="mt-2.5 flex items-center justify-between gap-2 select-none pt-2 border-t border-black/8"
              :class="isMobile ? '' : 'pr-8'"
            >
              <!-- Author badge -->
              <div
                v-if="piece.author?.avatar"
                class="flex items-center gap-1.5 rounded-full bg-black/6 px-2 py-0.5 select-none"
                :title="piece.author.name ? `Tillagd av ${piece.author.name}` : ''"
              >
                <img
                  :src="piece.author.avatar"
                  :alt="piece.author.name"
                  class="h-4 w-4 rounded-full object-cover ring-1 ring-black/10"
                />
                <span class="max-w-[80px] sm:max-w-[65px] truncate text-[10px] font-bold text-black/70">
                  {{ piece.author.name }}
                </span>
              </div>
              <div v-else></div>

              <!-- Like & Comment Actions -->
              <div class="flex items-center gap-1.5">
                <!-- Like Button -->
                <button
                  type="button"
                  class="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition hover:bg-black/8 active:scale-95"
                  :class="isLikedByMe(piece) ? 'text-rose-600 bg-rose-50' : 'text-black/60 hover:text-black/80'"
                  :title="t('mood.like')"
                  @pointerdown.stop
                  @click.stop="toggleLike(piece)"
                >
                  <svg
                    class="h-3.5 w-3.5 transition-transform duration-150"
                    :class="isLikedByMe(piece) ? 'fill-current scale-110' : 'fill-none stroke-current'"
                    viewBox="0 0 24 24"
                    stroke-width="2.2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>{{ piece.likes || 0 }}</span>
                </button>

                <!-- Comment Button -->
                <button
                  type="button"
                  class="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition hover:bg-black/8 active:scale-95 text-black/60 hover:text-black/80"
                  :title="t('mood.comments')"
                  @pointerdown.stop
                  @click.stop="openComments(piece)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.755 5.977 5.977 0 011.025-3.08A7.838 7.838 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span>{{ piece.comments?.length || 0 }}</span>
                </button>
              </div>
            </div>
          </template>

          <!-- IMAGE / CLIP RENDERING -->
          <template v-else>
            <div
              class="group relative overflow-hidden bg-[#173D35] rounded-xl"
              :class="piece.kind === 'image' && shown(piece) && !broken[piece.id] ? 'cursor-zoom-in' : ''"
              @click="onImageAreaClick(piece)"
            >
              <!-- Move drag handle on desktop with prominent grip dots icon -->
              <div
                v-if="!isMobile"
                class="absolute left-2.5 top-2.5 z-10 flex h-8 w-10 items-center justify-center rounded-lg bg-black/65 text-white shadow-md backdrop-blur-xs transition hover:bg-black/85 hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing select-none"
                :title="t('mood.move')"
                :aria-label="t('mood.move')"
                @pointerdown.stop="onDown($event, piece, 'move')"
              >
                <svg class="h-3.5 w-6 opacity-90" viewBox="0 0 20 8" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="2" r="1.5" />
                  <circle cx="10" cy="2" r="1.5" />
                  <circle cx="17" cy="2" r="1.5" />
                  <circle cx="3" cy="6" r="1.5" />
                  <circle cx="10" cy="6" r="1.5" />
                  <circle cx="17" cy="6" r="1.5" />
                </svg>
              </div>

              <!-- Reorder buttons on mobile -->
              <div v-if="isMobile" class="absolute left-2 top-2 z-10 flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white shadow-md backdrop-blur-xs active:bg-black/80 disabled:opacity-30"
                  :disabled="isFirstPiece(piece)"
                  :aria-label="t('mood.moveUp') || 'Flytta upp'"
                  @click.stop="movePieceOrder(piece, -1)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white shadow-md backdrop-blur-xs active:bg-black/80 disabled:opacity-30"
                  :disabled="isLastPiece(piece)"
                  :aria-label="t('mood.moveDown') || 'Flytta ner'"
                  @click.stop="movePieceOrder(piece, 1)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <a
                v-if="piece.kind === 'link'"
                class="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
                :href="piece.src"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="t('mood.openLink')"
                @pointerdown.stop
                @click.stop
              >
                <img
                  v-if="piece.thumb && !broken[piece.id]"
                  class="block aspect-[1.91/1] w-full object-cover rounded-xl"
                  :src="piece.thumb"
                  :alt="piece.caption || linkHost(piece.src)"
                  draggable="false"
                  @error="markBroken(piece.id)"
                />
                <div v-else class="flex aspect-[1.91/1] w-full items-end bg-[#173D35] px-3 pb-3 rounded-xl">
                  <span class="text-xs font-semibold tracking-wide text-[#F5F3EC]">{{ linkHost(piece.src) }}</span>
                </div>
              </a>
              <iframe
                v-else-if="playing === piece.id && embed(piece)"
                class="aspect-video w-full rounded-xl"
                :src="embed(piece)"
                :title="piece.caption || t('mood.play')"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
              ></iframe>
              <video
                v-else-if="piece.clip === 'file' && shown(piece)"
                class="block w-full rounded-xl"
                :src="shown(piece)"
                controls
                playsinline
                preload="metadata"
              ></video>
              <img
                v-else-if="piece.clip === 'youtube' && !broken[piece.id]"
                class="block w-full aspect-video object-cover rounded-xl"
                :src="youtubePoster(piece.ref)"
                :alt="piece.caption || t('mood.picture')"
                draggable="false"
                @error="markBroken(piece.id)"
              />
              <div v-else-if="piece.clip === 'vimeo'" class="flex aspect-video w-full items-end bg-[#173D35] px-3 pb-3 rounded-xl">
                <span class="text-[11px] font-medium tracking-wide text-[#F5F3EC]">vimeo.com</span>
              </div>
              <img
                v-else-if="piece.kind === 'image' && shown(piece) && !broken[piece.id]"
                class="block w-full transition duration-150 group-hover:scale-[1.02]"
                :class="isMobile ? 'max-h-[65vh] object-contain rounded-xl bg-black/5' : ''"
                :src="shown(piece)"
                :alt="piece.caption || t('mood.picture')"
                draggable="false"
                @error="markBroken(piece.id)"
              />
              <p v-else class="px-3 py-8 text-center text-xs leading-relaxed text-[#F5F3EC]">
                {{ t(piece.src.startsWith('local:') ? 'mood.miss' : 'mood.gone') }}
              </p>

              <!-- Zoom badge indicator for images -->
              <div
                v-if="piece.kind === 'image' && shown(piece) && !broken[piece.id]"
                class="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span>{{ t('mood.openLightbox') }}</span>
              </div>

              <button
                v-if="(piece.clip === 'youtube' || piece.clip === 'vimeo') && playing !== piece.id"
                type="button"
                class="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5F3EC] text-[#173D35] shadow-[0_8px_16px_-6px_rgba(23,61,53,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EC]"
                :aria-label="t('mood.play')"
                @pointerdown.stop
                @click.stop="playing = piece.id"
              >
                <svg class="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" />
                </svg>
              </button>

              <!-- Delete button inside top right corner for safe mobile bounds -->
              <button
                type="button"
                class="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[#F5F3EC] shadow-md backdrop-blur-xs hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                :aria-label="t('mood.remove')"
                @pointerdown.stop
                @click.stop="remove(piece)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </div>

            <a
              v-if="piece.kind === 'link'"
              class="mt-2 block truncate px-2 text-[11px] font-semibold text-[#173D35] underline decoration-[#B7C7AF] underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
              :href="piece.src"
              target="_blank"
              rel="noopener noreferrer"
              @pointerdown.stop
              @click.stop
            >{{ linkHost(piece.src) }}</a>

            <label class="sr-only" :for="`mood-caption-${piece.id}`">{{ t('mood.caption') }}</label>
            <textarea
              :id="`mood-caption-${piece.id}`"
              class="mood-caption mt-2 block w-full resize-none rounded-lg bg-transparent px-2 py-1 text-sm leading-relaxed text-[#222925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
              :value="piece.caption"
              :placeholder="t('mood.captionPlaceholder')"
              :rows="isMobile ? 2 : 2"
              maxlength="500"
              spellcheck="true"
              @pointerdown.stop
              @input="onCaption(piece, $event)"
              @change="persist"
            ></textarea>

            <!-- Image / Clip footer: author badge + Likes & Comments buttons -->
            <div
              class="mt-1 flex items-center justify-between gap-1.5 px-1.5 pb-0.5 select-none"
              :class="isMobile ? '' : 'pr-8'"
            >
              <!-- Author badge -->
              <div
                v-if="piece.author?.avatar"
                class="flex items-center gap-1.5 rounded-full bg-[#173D35]/6 px-2.5 py-1 select-none"
                :title="piece.author.name ? `Tillagd av ${piece.author.name}` : ''"
              >
                <img
                  :src="piece.author.avatar"
                  :alt="piece.author.name"
                  class="h-4 w-4 rounded-full object-cover ring-1 ring-[#173D35]/20"
                />
                <span class="max-w-[90px] sm:max-w-[70px] truncate text-xs sm:text-[10px] font-semibold text-[#173D35]">
                  {{ piece.author.name }}
                </span>
              </div>
              <div v-else></div>

              <!-- Like & Comment Actions -->
              <div class="flex items-center gap-2">
                <!-- Like Button -->
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:bg-black/5 active:scale-95"
                  :class="isLikedByMe(piece) ? 'text-rose-600 bg-rose-50' : 'text-[#173D35]/70 hover:text-[#173D35]'"
                  :title="t('mood.like')"
                  @pointerdown.stop
                  @click.stop="toggleLike(piece)"
                >
                  <svg
                    class="h-4 w-4 transition-transform duration-150"
                    :class="isLikedByMe(piece) ? 'fill-current scale-110' : 'fill-none stroke-current'"
                    viewBox="0 0 24 24"
                    stroke-width="2.2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>{{ piece.likes || 0 }}</span>
                </button>

                <!-- Comment Button -->
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:bg-black/5 active:scale-95 text-[#173D35]/70 hover:text-[#173D35]"
                  :class="piece.comments?.length ? 'bg-[#173D35]/6 text-[#173D35]' : ''"
                  :title="t('mood.comments')"
                  @pointerdown.stop
                  @click.stop="openComments(piece)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.755 5.977 5.977 0 011.025-3.08A7.838 7.838 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span>{{ piece.comments?.length || 0 }}</span>
                </button>
              </div>
            </div>
          </template>

          <button
            v-if="!isMobile"
            type="button"
            class="mood-size absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-[#173D35] text-[#F5F3EC] shadow-sm hover:scale-110 active:scale-95 cursor-nwse-resize transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173D35]"
            :aria-label="t('mood.resize')"
            @pointerdown.stop="onDown($event, piece, 'size')"
            @pointermove.stop="onPointer"
            @pointerup.stop="onUp"
            @pointercancel.stop="onUp"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <line x1="20" y1="14" x2="14" y2="20" />
              <line x1="20" y1="8" x2="8" y2="20" />
            </svg>
          </button>
        </article>

        <!-- Mobile end of moodboard indicator -->
        <div
          v-if="isMobile && pieces.length > 0"
          class="flex items-center justify-center py-4 text-xs font-medium text-[#173D35]/60 select-none"
        >
          <span>✨ {{ t('mood.endOfBoard') || 'Du har nått slutet av moodboarden' }}</span>
        </div>
      </div>
    </div>

    <!-- Floating arrow when more of the board sits below the viewport -->
    <button
      v-if="hasMoreBelow"
      type="button"
      id="btn-mood-scroll-down"
      class="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[#173D35]/90 text-[#F5F3EC] shadow-xl border border-white/20 backdrop-blur-md transition-transform duration-200 ease-out hover:bg-[#173D35] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#173D35] focus:ring-offset-2"
      :aria-label="t('mood.scrollDown')"
      :title="t('mood.scrollDown')"
      @click="scrollDownNext"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>

    <!-- LIGHTBOX MODAL -->
    <Teleport to="body">
      <div
        v-if="lightboxIndex !== null && currentLightboxPiece"
        id="mood-lightbox"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/85 p-3 md:p-6 backdrop-blur-md select-none animate-fadeIn"
        style="background-color: rgba(0, 0, 0, 0.88);"
        tabindex="-1"
        role="dialog"
        :aria-label="t('mood.openLightbox')"
        @click.self="closeLightbox"
      >
        <!-- Top bar -->
        <div class="flex w-full items-center justify-between px-2 md:px-4 z-20" @click.stop>
          <div v-if="imagePieces.length > 1" class="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg border border-slate-700/60 backdrop-blur-md">
            <span>{{ lightboxIndex + 1 }}</span>
            <span class="text-slate-400">/</span>
            <span>{{ imagePieces.length }}</span>
          </div>
          <div v-else></div>

          <button
            type="button"
            id="btn-lightbox-close"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg border border-slate-700/60 transition hover:bg-slate-900 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            :aria-label="t('mood.closeLightbox')"
            @click="closeLightbox"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Center Image Stage with Arrows -->
        <div class="relative flex min-h-0 flex-1 w-full items-center justify-center p-1 md:p-2 overflow-hidden">
          <!-- Previous Button -->
          <button
            v-if="imagePieces.length > 1"
            type="button"
            id="btn-lightbox-prev"
            class="absolute left-2 md:left-6 z-20 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-2xl border border-slate-700/60 backdrop-blur-md transition hover:bg-slate-900 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            :aria-label="t('mood.prevImage')"
            @click.stop="prevImage"
          >
            <svg class="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Current Image -->
          <img
            :src="shown(currentLightboxPiece)"
            :alt="currentLightboxPiece.caption || t('mood.picture')"
            class="max-h-[85vh] max-w-[min(94vw,1440px)] w-auto h-auto object-contain rounded-2xl shadow-2xl transition duration-200 select-none"
            style="min-width: min(100%, 760px); max-height: 84vh; max-width: min(94vw, 1440px); object-fit: contain;"
            @click.stop
          />

          <!-- Next Button -->
          <button
            v-if="imagePieces.length > 1"
            type="button"
            id="btn-lightbox-next"
            class="absolute right-2 md:right-6 z-20 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-2xl border border-slate-700/60 backdrop-blur-md transition hover:bg-slate-900 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            :aria-label="t('mood.nextImage')"
            @click.stop="nextImage"
          >
            <svg class="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Caption & Actions Bottom Bar -->
        <div class="mt-2 flex flex-col items-center gap-2 w-full px-4 z-20" @click.stop>
          <div
            v-if="currentLightboxPiece.caption"
            class="max-w-2xl rounded-2xl bg-slate-900/90 px-6 py-3 text-center text-sm md:text-base leading-relaxed text-white shadow-xl border border-slate-700/60 backdrop-blur-md whitespace-pre-wrap"
          >
            {{ currentLightboxPiece.caption }}
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-white shadow-lg border border-slate-700/60 backdrop-blur-md transition hover:bg-slate-900 active:scale-95"
              :class="isLikedByMe(currentLightboxPiece) ? 'text-rose-400 border-rose-500/40' : ''"
              @click.stop="toggleLike(currentLightboxPiece)"
            >
              <svg
                class="h-4 w-4"
                :class="isLikedByMe(currentLightboxPiece) ? 'fill-current' : 'fill-none stroke-current'"
                viewBox="0 0 24 24"
                stroke-width="2.2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span>{{ currentLightboxPiece.likes || 0 }} {{ t('mood.likes') }}</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-white shadow-lg border border-slate-700/60 backdrop-blur-md transition hover:bg-slate-900 active:scale-95"
              @click.stop="openComments(currentLightboxPiece)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.755 5.977 5.977 0 011.025-3.08A7.838 7.838 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <span>{{ currentLightboxPiece.comments?.length || 0 }} {{ t('mood.comments') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- SHARE MODAL WITH QR CODE -->
    <Teleport to="body">
      <div
        v-if="showShareModal"
        id="mood-share-modal"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        role="dialog"
        :aria-label="t('mood.shareTitle')"
        @click.self="showShareModal = false"
      >
        <div class="relative w-full max-w-md rounded-3xl border border-[#d7d1c4] bg-[#FDFBF7] p-6 shadow-2xl sm:p-8">
          <div class="flex items-center justify-between pb-2">
            <div class="flex items-center gap-2.5">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173D35] text-lg text-white">🔗</span>
              <h3 class="text-xl font-bold text-[#173D35]">{{ t('mood.shareTitle') }}</h3>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200"
              @click="showShareModal = false"
            >
              ✕
            </button>
          </div>

          <p class="mt-1 text-sm text-[#4a5851]">
            {{ t('mood.shareLead') }}
          </p>

          <!-- QR Code Container -->
          <div class="mt-5 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div
              v-if="qrSvg"
              class="h-52 w-52 [&>svg]:h-full [&>svg]:w-full"
              v-html="qrSvg"
            ></div>
            <div v-else class="flex h-52 w-52 items-center justify-center text-stone-400 text-xs">
              Laddar QR-kod...
            </div>
            <p class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#173D35]">
              <span>📱</span>
              <span>{{ t('mood.scanMe') }}</span>
            </p>
          </div>

          <!-- Share Link & Copy Button -->
          <div class="mt-5 space-y-2">
            <div class="flex items-center gap-2">
              <input
                id="mood-share-url-input"
                type="text"
                readonly
                :value="shareUrl"
                class="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-mono text-stone-800 focus:outline-none"
              />
              <button
                type="button"
                id="btn-copy-mood-url"
                class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#173D35] px-4 text-xs font-bold text-white transition hover:bg-[#0f2b25]"
                @click="copyShareUrl"
              >
                <span>{{ copiedNotice ? '✓ ' + t('mood.copied') : t('mood.copyLink') }}</span>
              </button>
            </div>
            <p v-if="copiedNotice" class="text-xs font-medium text-emerald-700">
              ✓ {{ t('mood.copied') }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- PARTICIPANT PROFILE & EMAIL NOTIFICATION MODAL -->
    <Teleport to="body">
      <div
        v-if="showProfileModal"
        id="mood-profile-modal"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        role="dialog"
        :aria-label="t('mood.myProfile')"
        @click.self="showProfileModal = false"
      >
        <div class="relative w-full max-w-md rounded-3xl border border-[#d7d1c4] bg-[#FDFBF7] p-6 shadow-2xl sm:p-8">
          <div class="flex items-center justify-between pb-2">
            <div class="flex items-center gap-2.5">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173D35] text-lg text-white">👤</span>
              <h3 class="text-xl font-bold text-[#173D35]">{{ t('mood.myProfile') }}</h3>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200"
              @click="showProfileModal = false"
            >
              ✕
            </button>
          </div>

          <div class="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 border border-stone-200">
            <img
              v-if="currentAuthor.avatar"
              :src="currentAuthor.avatar"
              :alt="currentAuthor.name"
              class="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#173D35]/20 shadow-md"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-bold text-[#173D35]">{{ currentAuthor.name }}</p>
              <button
                v-if="!sessionStore.user"
                type="button"
                class="mt-1 flex items-center gap-1 text-xs font-semibold text-[#173D35] underline hover:text-[#0f2b25]"
                @click="reopenJoinPage"
              >
                <span>🍳</span>
                <span>{{ t('mood.recookAvatar') }}</span>
              </button>
            </div>
          </div>

          <!-- Email notifications form -->
          <form class="mt-5 space-y-3" @submit.prevent="saveProfileEmail">
            <label for="profile-email" class="block text-xs font-bold uppercase tracking-wider text-[#173D35]">
              {{ t('mood.emailLabel') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                id="profile-email"
                v-model="profileEmail"
                type="email"
                placeholder="din.epost@exempel.se"
                class="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
              />
              <button
                type="submit"
                class="h-10 shrink-0 rounded-xl bg-[#173D35] px-4 text-xs font-bold text-white transition hover:bg-[#0f2b25]"
              >
                Spara
              </button>
            </div>
            <p v-if="profileEmailSavedNotice" class="text-xs font-medium text-emerald-700">
              ✓ {{ t('mood.notificationsOn') || 'Aviseringar sparade!' }}
            </p>
            <p class="text-xs text-stone-500">
              {{ t('mood.emailHint') }}
            </p>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- COMMENTS SLIDE-OVER DRAWER -->
    <Teleport to="body">
      <div
        v-if="activeCommentPiece"
        id="mood-comments-drawer"
        class="fixed inset-0 z-[120] flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn"
        role="dialog"
        :aria-label="t('mood.comments')"
        @click.self="closeComments"
      >
        <div
          class="relative flex h-full w-full max-w-md flex-col bg-[#FDFBF7] shadow-2xl border-l border-[#d7d1c4] animate-slideLeft"
          @click.stop
        >
          <!-- Drawer Header -->
          <div class="flex items-center justify-between border-b border-stone-200 px-6 py-4">
            <div class="flex items-center gap-2.5">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173D35] text-base text-white">💬</span>
              <div>
                <h3 class="text-lg font-bold text-[#173D35]">{{ t('mood.comments') }}</h3>
                <p class="text-xs text-stone-500">
                  {{ activeCommentPiece.comments?.length || 0 }} {{ t('mood.comments').toLowerCase() }}
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-close-comments"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200 transition"
              :aria-label="t('mood.closeComments')"
              @click="closeComments"
            >
              ✕
            </button>
          </div>

          <!-- Piece mini summary card -->
          <div class="mx-6 mt-4 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-xs">
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 flex items-center justify-center">
              <img
                v-if="activeCommentPiece.kind === 'image' && shown(activeCommentPiece)"
                :src="shown(activeCommentPiece)"
                :alt="activeCommentPiece.caption || 'Bild'"
                class="h-full w-full object-cover"
              />
              <img
                v-else-if="activeCommentPiece.clip === 'youtube'"
                :src="youtubePoster(activeCommentPiece.ref)"
                alt="Video"
                class="h-full w-full object-cover"
              />
              <span v-else class="text-2xl">📝</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-[#173D35]">
                {{ activeCommentPiece.caption || (activeCommentPiece.kind === 'note' ? 'Kom-ihåg-lapp' : 'Uppladdad bild') }}
              </p>
              <p v-if="activeCommentPiece.author?.name" class="mt-0.5 text-[11px] text-stone-500">
                {{ activeCommentPiece.author.name }}
              </p>
              <div class="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  class="flex items-center gap-1 text-[11px] font-bold"
                  :class="isLikedByMe(activeCommentPiece) ? 'text-rose-600' : 'text-stone-500 hover:text-stone-800'"
                  @click="toggleLike(activeCommentPiece)"
                >
                  <span>♥</span>
                  <span>{{ activeCommentPiece.likes || 0 }} {{ t('mood.likes').toLowerCase() }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Comments Thread -->
          <div ref="commentThreadRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
            <div
              v-if="!activeCommentPiece.comments || activeCommentPiece.comments.length === 0"
              class="flex h-48 flex-col items-center justify-center text-center text-stone-400"
            >
              <span class="text-3xl mb-2">💭</span>
              <p class="text-xs leading-relaxed max-w-[24ch]">
                {{ t('mood.noComments') }}
              </p>
            </div>

            <article
              v-for="comm in activeCommentPiece.comments"
              :key="comm.id"
              class="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-stone-200/80 shadow-xs"
            >
              <img
                v-if="comm.author?.avatar"
                :src="comm.author.avatar"
                :alt="comm.author.name"
                class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-stone-300"
              />
              <div v-else class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#173D35] text-xs font-bold text-white">
                {{ (comm.author?.name || 'D')[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-xs font-bold text-[#173D35]">{{ comm.author?.name }}</span>
                  <time class="text-[10px] text-stone-400 shrink-0">{{ formatCommentTime(comm.createdAt) }}</time>
                </div>
                <p class="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-700">
                  {{ comm.text }}
                </p>
              </div>
            </article>
          </div>

          <!-- Sticky Input Bar -->
          <form class="border-t border-stone-200 bg-white p-4" @submit.prevent="submitComment">
            <div class="flex items-end gap-2.5">
              <img
                v-if="currentAuthor.avatar"
                :src="currentAuthor.avatar"
                :alt="currentAuthor.name"
                class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-stone-300 mb-1"
              />
              <div class="relative flex-1">
                <textarea
                  v-model="commentInputText"
                  rows="2"
                  maxlength="1000"
                  class="w-full resize-none rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-[#173D35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173D35]"
                  :placeholder="t('mood.writeComment')"
                  @keydown.enter.exact.prevent="submitComment"
                ></textarea>
              </div>
              <button
                type="submit"
                id="btn-send-comment"
                :disabled="!commentInputText.trim()"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173D35] text-white shadow-sm transition hover:bg-[#0f2b25] disabled:opacity-40 disabled:hover:bg-[#173D35] mb-1"
                :title="t('mood.sendComment')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../store/useConfigStore';
import { useSessionStore } from '../store/useSessionStore';
import { applyLocale, useLabels } from '../i18n';
import Cms from './Cms.vue';
import {
  MOOD_LIMIT,
  moodId,
  pieceFrom,
  placeFor,
  linkHost,
  readLink,
  vimeoEmbed,
  youtubeEmbed,
  youtubePoster,
  type MoodAuthor,
  type MoodColor,
  type MoodComment,
  type MoodParticipant,
  type MoodPiece
} from '../mood/board';
import { defaultAccountAvatar } from '../mood/avatar';
import { generateQrSvg } from '../mood/qr';
import { pictureDataUrl } from '../mood/image';
import { showToast, startFeedback, triggerSessionAutosaveBadge } from '../services/feedback';
import {
  clearStoredParticipant,
  deleteClip,
  getClip,
  getStoredParticipant,
  loadMood,
  moodHouseKey,
  putClip,
  registerBoardParticipant,
  saveMood,
  saveStoredParticipant,
  syncMoodWithCloudflare,
  togglePieceLikeCloudflare,
  addPieceCommentCloudflare
} from '../services/moodSave';
import { watchActiveHouseId } from '../services/houseSave';
import { fetchLinkPreview } from '../services/linkPreview';

const props = withDefaults(
  defineProps<{
    standalone?: boolean;
  }>(),
  {
    standalone: false
  }
);

const emit = defineEmits<{
  (e: 'reopen-profile'): void;
}>();

const CLIP_LIMIT = 12 * 1024 * 1024;
const NOTE_COLORS: MoodColor[] = ['yellow', 'sand', 'moss', 'sky', 'rose'];
const SCALE_Y = 7.5;

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const sessionStore = useSessionStore();
const { t, locale } = useLabels();

const pieces = ref<MoodPiece[]>([]);
const participants = ref<MoodParticipant[]>([]);
const title = ref('');
const createdAt = ref('');
const link = ref('');
const notice = ref('');
const over = ref(false);
const playing = ref('');
const broken = ref<Record<string, boolean>>({});
const urls = ref<Record<string, string>>({});
const stage = ref<HTMLElement | null>(null);
const sheet = ref<HTMLElement | null>(null);
const hasMoreBelow = ref(false);
let stageResizeObserver: ResizeObserver | null = null;

function updateScrollState() {
  if (!stage.value) {
    hasMoreBelow.value = false;
    return;
  }
  const { scrollTop, scrollHeight, clientHeight } = stage.value;
  hasMoreBelow.value = scrollHeight - (scrollTop + clientHeight) > 40;
}

function scrollDownNext() {
  if (!stage.value) return;
  const scrollAmount = Math.max(200, Math.round(stage.value.clientHeight * 0.85));
  stage.value.scrollBy({
    top: scrollAmount,
    behavior: 'smooth'
  });
}

const fileInput = ref<HTMLInputElement | null>(null);
const lightboxIndex = ref<number | null>(null);
const activeId = ref('');

const activeCommentPiece = ref<MoodPiece | null>(null);
const commentInputText = ref('');
const commentThreadRef = ref<HTMLElement | null>(null);

const showShareModal = ref(false);
const showProfileModal = ref(false);
const qrSvg = ref('');
const copiedNotice = ref(false);
const profileEmail = ref('');
const profileEmailSavedNotice = ref(false);

let houseKey = (typeof route?.query?.board === 'string' && route.query.board) ? route.query.board : moodHouseKey();
const previewAsked = new Set<string>();
let cloudSettled = false;
let dragDepth = 0;
let stopWatch = () => {};
let justDragged = false;
let dragTimer: ReturnType<typeof setTimeout> | null = null;
let drag: {
  mode: 'move' | 'size';
  id: string;
  px: number;
  py: number;
  x: number;
  y: number;
  w: number;
  hasMoved: boolean;
} | null = null;

const shareUrl = computed(() => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/mood?board=${encodeURIComponent(houseKey)}&lang=en`;
});

const currentAuthor = computed<MoodAuthor>(() => {
  // Authenticated user (admin / GitHub user) ALWAYS takes priority over any guest alias
  if (sessionStore.user) {
    const u = sessionStore.user;
    return {
      name: u.name || u.login || t('mood.owner'),
      avatar: u.avatarUrl || defaultAccountAvatar(u.name || u.login),
      email: u.email
    };
  }
  const stored = getStoredParticipant();
  if (stored) {
    return {
      name: stored.name,
      avatar: stored.avatar,
      email: stored.email
    };
  }
  return {
    name: t('mood.owner'),
    avatar: defaultAccountAvatar(t('mood.owner'))
  };
});

const currentAuthorId = computed(() => {
  if (sessionStore.user?.id) return sessionStore.user.id;
  const p = getStoredParticipant();
  if (p?.id) return p.id;
  return currentAuthor.value.name || 'anon';
});

function backfillExistingPiecesAuthor() {
  const author = currentAuthor.value;
  let changed = false;
  for (const p of pieces.value) {
    if (!p.author) {
      p.author = { ...author };
      changed = true;
    }
  }
  if (changed) {
    persist();
  }
}

async function openShareModal() {
  showShareModal.value = true;
  qrSvg.value = await generateQrSvg(shareUrl.value);
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copiedNotice.value = true;
    setTimeout(() => {
      copiedNotice.value = false;
    }, 3000);
  } catch {
    // fallback
  }
}

function openProfileModal() {
  profileEmail.value = currentAuthor.value.email || '';
  profileEmailSavedNotice.value = false;
  showProfileModal.value = true;
}

function saveProfileEmail() {
  const existing = getStoredParticipant();
  const nextEmail = profileEmail.value.trim() || undefined;
  if (existing) {
    existing.email = nextEmail;
    saveStoredParticipant(existing);
    registerBoardParticipant(existing, houseKey);
  }
  profileEmailSavedNotice.value = true;
  setTimeout(() => {
    profileEmailSavedNotice.value = false;
  }, 3000);
}

function reopenJoinPage() {
  showProfileModal.value = false;
  emit('reopen-profile');
}

const isInvited = computed(() => {
  if (sessionStore.user) return false;
  return Boolean(getStoredParticipant());
});

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

function onWindowResize() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768;
  updateScrollState();
}

const displayPieces = computed(() => {
  if (isMobile.value) {
    return [...pieces.value].sort((a, b) => a.y - b.y);
  }
  return pieces.value;
});

function movePieceOrder(piece: MoodPiece, dir: -1 | 1) {
  const currentList = displayPieces.value;
  const idx = currentList.findIndex((p) => p.id === piece.id);
  if (idx < 0) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= currentList.length) return;
  const otherPiece = currentList[targetIdx];

  const tempY = piece.y;
  piece.y = otherPiece.y;
  otherPiece.y = tempY;

  if (piece.y === otherPiece.y) {
    piece.y += dir * 5;
  }

  persist();
}

function isFirstPiece(piece: MoodPiece) {
  return displayPieces.value.length > 0 && displayPieces.value[0].id === piece.id;
}

function isLastPiece(piece: MoodPiece) {
  return displayPieces.value.length > 0 && displayPieces.value[displayPieces.value.length - 1].id === piece.id;
}

function handleClose() {
  if (isInvited.value) {
    return; // No backdoor to Builder 3D for invited guests
  }
  if (props.standalone) {
    void router.push('/build');
  } else {
    store.showMood = false;
  }
}

const formattedCreated = computed(() => {
  if (!createdAt.value) return '';
  const d = new Date(createdAt.value);
  if (isNaN(d.getTime())) return '';
  const loc = locale.value === 'en' ? 'en-US' : 'sv-SE';
  return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' });
});

const imagePieces = computed(() => {
  return pieces.value.filter((p) => p.kind === 'image' && shown(p) && !broken.value[p.id]);
});

const currentLightboxPiece = computed(() => {
  if (lightboxIndex.value === null) return null;
  return imagePieces.value[lightboxIndex.value] ?? null;
});

onMounted(() => {
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  void nextTick(() => updateScrollState());
  if (typeof ResizeObserver !== 'undefined' && stage.value) {
    stageResizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    stageResizeObserver.observe(stage.value);
    if (sheet.value) {
      stageResizeObserver.observe(sheet.value);
    }
  }

  watch(
    () => pieces.value,
    () => {
      void nextTick(() => updateScrollState());
    },
    { deep: true }
  );
  void sessionStore.ensureAccountState().then(() => {
    if (sessionStore.user) {
      clearStoredParticipant();
    } else {
      const existing = getStoredParticipant();
      if (existing) {
        registerBoardParticipant(existing, houseKey);
      }
    }
    backfillExistingPiecesAuthor();
  });
  const data = loadMood(houseKey);
  pieces.value = data.pieces;
  participants.value = data.participants || [];
  title.value = data.title;
  createdAt.value = data.createdAt || (data.pieces.length > 0 ? new Date().toISOString() : '');
  backfillExistingPiecesAuthor();
  refreshLinkPreviews();

  watch(
    () => sessionStore.user,
    (user, previous) => {
      if (user) {
        clearStoredParticipant();
        backfillExistingPiecesAuthor();
      }
      if (user && previous !== user) {
        cloudSettled = false;
        void pullCloud();
      }
    }
  );

  void hydrate();

  void pullCloud();

  window.addEventListener('paste', onPaste);
  window.addEventListener('keydown', onKeyDown);
  stopWatch = watchActiveHouseId(() => {
    const next = moodHouseKey();
    if (next === houseKey) return;
    persist();
    houseKey = next;
    playing.value = '';
    broken.value = {};
    revokeUrls();
    cloudSettled = false;
    const nextData = loadMood(houseKey);
    pieces.value = nextData.pieces;
    participants.value = nextData.participants || [];
    title.value = nextData.title;
    createdAt.value = nextData.createdAt || (nextData.pieces.length > 0 ? new Date().toISOString() : '');
    backfillExistingPiecesAuthor();
    previewAsked.clear();
    refreshLinkPreviews();
    void hydrate();
    void pullCloud();
  });
});

onBeforeUnmount(() => {
  persist();
  if (stageResizeObserver) {
    stageResizeObserver.disconnect();
    stageResizeObserver = null;
  }
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('pointermove', onPointer);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  if (dragTimer) clearTimeout(dragTimer);
  stopWatch();
  revokeUrls();
});

function isLikedByMe(piece: MoodPiece): boolean {
  if (!piece.likedBy || !Array.isArray(piece.likedBy)) return false;
  return piece.likedBy.includes(currentAuthorId.value);
}

function toggleLike(piece: MoodPiece) {
  const likerId = currentAuthorId.value;
  if (!Array.isArray(piece.likedBy)) piece.likedBy = [];
  const idx = piece.likedBy.indexOf(likerId);
  if (idx >= 0) {
    piece.likedBy.splice(idx, 1);
    piece.likes = Math.max(0, (piece.likes || 1) - 1);
  } else {
    piece.likedBy.push(likerId);
    piece.likes = (piece.likes || 0) + 1;
  }
  persist();
  void togglePieceLikeCloudflare(houseKey, piece.id, likerId);
}

function openComments(piece: MoodPiece) {
  activeCommentPiece.value = piece;
  commentInputText.value = '';
}

function closeComments() {
  activeCommentPiece.value = null;
}

function submitComment() {
  const text = commentInputText.value.trim();
  const target = activeCommentPiece.value;
  if (!text || !target) return;
  const author = { ...currentAuthor.value };
  const comment: MoodComment = {
    id: `comm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    pieceId: target.id,
    author,
    text,
    createdAt: new Date().toISOString()
  };
  if (!Array.isArray(target.comments)) target.comments = [];
  target.comments.push(comment);
  commentInputText.value = '';
  persist();
  void addPieceCommentCloudflare(houseKey, target.id, text, author);
  setTimeout(() => {
    if (commentThreadRef.value) {
      commentThreadRef.value.scrollTop = commentThreadRef.value.scrollHeight;
    }
  }, 50);
}

function formatCommentTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just nu';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  const loc = locale.value === 'en' ? 'en-US' : 'sv-SE';
  return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
}

function noteClasses(color?: MoodColor) {
  switch (color) {
    case 'sand':
      return 'bg-[#FDF6E2] border-[#E8D9B5] text-[#4A3B22]';
    case 'moss':
      return 'bg-[#EDF5ED] border-[#C8DEC8] text-[#244224]';
    case 'sky':
      return 'bg-[#EAF2F8] border-[#BCD5E8] text-[#1E3A52]';
    case 'rose':
      return 'bg-[#FDF0F0] border-[#F2C4C4] text-[#541C1C]';
    case 'yellow':
    default:
      return 'bg-[#FEF9C3] border-[#FDE047] text-[#713F12]';
  }
}

function noteDotClass(color: MoodColor) {
  switch (color) {
    case 'sand':
      return 'bg-[#FDF6E2]';
    case 'moss':
      return 'bg-[#EDF5ED]';
    case 'sky':
      return 'bg-[#EAF2F8]';
    case 'rose':
      return 'bg-[#FDF0F0]';
    case 'yellow':
    default:
      return 'bg-[#FEF9C3]';
  }
}

const sheetStyle = computed(() => {
  if (isMobile.value) {
    return {};
  }
  let maxY = 60;
  for (const piece of pieces.value) {
    if (piece.y > maxY) maxY = piece.y;
  }
  const minHeightPx = Math.max(800, Math.round((maxY + 55) * SCALE_Y));
  return {
    minHeight: `${minHeightPx}px`
  };
});

function frame(piece: MoodPiece) {
  if (isMobile.value) {
    return {};
  }
  return {
    left: `${piece.x}%`,
    top: `${Math.round(piece.y * SCALE_Y)}px`,
    width: `${piece.w}%`,
    transform: `rotate(${piece.tilt}deg)`,
    zIndex: drag?.id === piece.id ? 25 : (activeId.value === piece.id ? 10 : 1)
  };
}

function shown(piece: MoodPiece) {
  return piece.src.startsWith('local:') ? urls.value[piece.id] ?? '' : piece.src;
}

function embed(piece: MoodPiece) {
  if (piece.clip === 'youtube') return youtubeEmbed(piece.ref);
  if (piece.clip === 'vimeo') return vimeoEmbed(piece.ref);
  return '';
}

function markBroken(id: string) {
  broken.value = { ...broken.value, [id]: true };
}

async function hydrate() {
  const next: Record<string, string> = {};
  for (const piece of pieces.value) {
    if (!piece.src.startsWith('local:')) continue;
    const blob = await getClip(piece.id);
    if (!blob) continue;
    next[piece.id] = URL.createObjectURL(blob);
  }
  revokeUrls();
  urls.value = next;
}

function revokeUrls() {
  for (const url of Object.values(urls.value)) URL.revokeObjectURL(url);
  urls.value = {};
}

function applyRemote(remote: { title: string; createdAt: string; pieces: MoodPiece[]; participants?: MoodParticipant[] }) {
  if (remote.title && !title.value) title.value = remote.title;
  if (remote.createdAt && !createdAt.value) createdAt.value = remote.createdAt;
  if (remote.participants?.length) {
    const mergedPart = [...participants.value];
    for (const person of remote.participants) {
      if (!mergedPart.some((existing) => existing.id === person.id)) mergedPart.push(person);
    }
    participants.value = mergedPart;
  }
  if (!remote.pieces?.length) return;
  const localMap = new Map(pieces.value.map((piece) => [piece.id, piece]));
  for (const remotePiece of remote.pieces) {
    const localPiece = localMap.get(remotePiece.id);
    if (!localPiece) {
      localMap.set(remotePiece.id, remotePiece);
    } else {
      if (Array.isArray(remotePiece.likedBy) && remotePiece.likedBy.length >= (localPiece.likedBy?.length || 0)) {
        localPiece.likedBy = remotePiece.likedBy;
        localPiece.likes = remotePiece.likes;
      }
      if (Array.isArray(remotePiece.comments) && remotePiece.comments.length >= (localPiece.comments?.length || 0)) {
        localPiece.comments = remotePiece.comments;
      }
    }
  }
  pieces.value = Array.from(localMap.values());
  for (const id of previewAsked) {
    if (!localMap.has(id)) previewAsked.delete(id);
  }
  refreshLinkPreviews();
  void hydrate();
}

async function pullCloud() {
  const requested = houseKey;
  const remote = await syncMoodWithCloudflare(requested);
  if (!remote || requested !== houseKey) return;
  const remoteCount = remote.pieces.length;
  applyRemote(remote);
  cloudSettled = true;
  if (pieces.value.length > remoteCount) persist();
}

function persist() {
  if (!createdAt.value && (pieces.value.length > 0 || title.value.trim())) {
    createdAt.value = new Date().toISOString();
  }
  saveMood({
    title: title.value,
    createdAt: createdAt.value,
    pieces: pieces.value,
    participants: participants.value
  }, houseKey, cloudSettled);
  triggerSessionAutosaveBadge('moodboard');
}

function submitLink() {
  const raw = link.value;
  link.value = '';
  addLink(raw);
}

function addLink(raw: string) {
  notice.value = '';
  if (pieces.value.length >= MOOD_LIMIT) {
    notice.value = 'mood.full';
    return;
  }
  const parsed = readLink(raw);
  if (!parsed) {
    notice.value = 'mood.bad';
    return;
  }
  const piece = pieceFrom(parsed, pieces.value.length, '', { ...currentAuthor.value });
  if (isMobile.value && pieces.value.length > 0) {
    piece.y = Math.max(...pieces.value.map((p) => p.y)) + 25;
  }
  pieces.value.push(piece);
  persist();
  attachPreview(piece);
}

function refreshLinkPreviews() {
  for (const piece of pieces.value) attachPreview(piece);
}

function attachPreview(piece: MoodPiece) {
  if (piece.kind !== 'link' || piece.thumb || previewAsked.has(piece.id)) return;
  previewAsked.add(piece.id);
  const requestedHouse = houseKey;
  const requestedSrc = piece.src;
  void fetchLinkPreview(piece.src).then((preview) => {
    if (requestedHouse !== houseKey) return;
    const current = pieces.value.find((item) => item.id === piece.id);
    if (!current || current.kind !== 'link' || current.src !== requestedSrc || !preview) return;
    let changed = false;
    if (preview.image && current.thumb !== preview.image) {
      current.thumb = preview.image;
      changed = true;
    }
    if (preview.title && !current.caption) {
      current.caption = preview.title.slice(0, 500);
      changed = true;
    }
    if (changed) persist();
  });
}

function addPostIt(color: MoodColor = 'yellow') {
  notice.value = '';
  if (pieces.value.length >= MOOD_LIMIT) {
    notice.value = 'mood.full';
    return;
  }
  const spot = placeFor(pieces.value.length);
  const note: MoodPiece = {
    id: moodId(),
    kind: 'note',
    src: '',
    clip: '',
    ref: '',
    color,
    x: spot.x,
    y: isMobile.value && pieces.value.length > 0 ? Math.max(...pieces.value.map((p) => p.y)) + 15 : spot.y,
    w: 22,
    tilt: Math.random() * 4 - 2,
    caption: '',
    author: { ...currentAuthor.value }
  };
  pieces.value.push(note);
  persist();
  showToast('Post-it tillagd', 'success');
}

async function addFiles(files: File[]) {
  if (!files.length) return;
  const finish = startFeedback('Läser in bildfiler...');
  try {
    notice.value = '';
    let added = 0;
    for (const file of files) {
      if (pieces.value.length >= MOOD_LIMIT) {
        notice.value = 'mood.full';
        break;
      }
      if (file.type.startsWith('video/')) {
        if (file.size > CLIP_LIMIT) {
          notice.value = 'mood.big';
          continue;
        }
        const id = moodId();
        try {
          await putClip(id, file);
        } catch {
          notice.value = 'mood.bad';
          continue;
        }
        const parsed = readLink(`local:${id}`);
        if (!parsed) continue;
        urls.value = { ...urls.value, [id]: URL.createObjectURL(file) };
        const pieceY = isMobile.value && pieces.value.length > 0 ? Math.max(...pieces.value.map((p) => p.y)) + 25 : placeFor(pieces.value.length).y;
        pieces.value.push({ id, ...parsed, ...placeFor(pieces.value.length), y: pieceY, caption: '', author: { ...currentAuthor.value } });
        added++;
        continue;
      }
      if (!file.type.startsWith('image/')) {
        notice.value = 'mood.bad';
        continue;
      }
      try {
        const data = await pictureDataUrl(file);
        const parsed = readLink(data);
        if (!parsed) {
          notice.value = 'mood.bad';
          continue;
        }
        const piece = pieceFrom(parsed, pieces.value.length, '', { ...currentAuthor.value });
        if (isMobile.value && pieces.value.length > 0) {
          piece.y = Math.max(...pieces.value.map((p) => p.y)) + 25;
        }
        pieces.value.push(piece);
        added++;
      } catch {
        notice.value = 'mood.big';
      }
    }
    persist();
    if (added > 0) {
      showToast(`${added} ${added === 1 ? 'fil tillagd' : 'filer tillagda'}`, 'success');
    }
  } finally {
    finish();
  }
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = '';
  void addFiles(files);
}

function remove(piece: MoodPiece) {
  if (piece.src.startsWith('local:')) {
    const url = urls.value[piece.id];
    if (url) URL.revokeObjectURL(url);
    const next = { ...urls.value };
    delete next[piece.id];
    urls.value = next;
    void deleteClip(piece.id);
  }
  if (playing.value === piece.id) playing.value = '';
  pieces.value = pieces.value.filter((item) => item.id !== piece.id);
  persist();
}

function onCaption(piece: MoodPiece, event: Event) {
  piece.caption = (event.target as HTMLTextAreaElement).value.slice(0, 500);
}

function onImageAreaClick(piece: MoodPiece) {
  if (justDragged) return;
  if (piece.kind === 'image' && shown(piece) && !broken.value[piece.id]) {
    openLightbox(piece);
  }
}

function openLightbox(piece: MoodPiece) {
  const idx = imagePieces.value.findIndex((p) => p.id === piece.id);
  if (idx >= 0) {
    lightboxIndex.value = idx;
  }
}

function closeLightbox() {
  lightboxIndex.value = null;
}

function nextImage() {
  if (lightboxIndex.value === null || imagePieces.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % imagePieces.value.length;
}

function prevImage() {
  if (lightboxIndex.value === null || imagePieces.value.length === 0) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + imagePieces.value.length) % imagePieces.value.length;
}

function onPaste(event: ClipboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea')) return;
  const files = [...(event.clipboardData?.files ?? [])];
  if (files.length) {
    event.preventDefault();
    void addFiles(files);
    return;
  }
  const text = event.clipboardData?.getData('text') ?? '';
  if (!readLink(text)) return;
  event.preventDefault();
  addLink(text);
}

function onKeyDown(event: KeyboardEvent) {
  if (lightboxIndex.value !== null) {
    if (event.key === 'Escape') {
      closeLightbox();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      prevImage();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      nextImage();
      event.preventDefault();
    }
    return;
  }
  if (event.key === 'Escape') {
    store.showMood = false;
  }
}

function onDragEnter(event: DragEvent) {
  if (!hasFiles(event)) return;
  dragDepth += 1;
  over.value = true;
}

function onDragOver(event: DragEvent) {
  if (!hasFiles(event)) return;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  over.value = true;
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) over.value = false;
}

function onDrop(event: DragEvent) {
  dragDepth = 0;
  over.value = false;
  void addFiles([...(event.dataTransfer?.files ?? [])]);
}

function hasFiles(event: DragEvent) {
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}

function onDown(event: PointerEvent, piece: MoodPiece, mode: 'move' | 'size') {
  if (isMobile.value && mode === 'move') return;
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (mode === 'move' && target?.closest('input, button, textarea, iframe, video, select, a')) return;

  activeId.value = piece.id;

  drag = {
    mode,
    id: piece.id,
    px: event.clientX,
    py: event.clientY,
    x: piece.x,
    y: piece.y,
    w: piece.w,
    hasMoved: false
  };

  window.addEventListener('pointermove', onPointer);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

function onPointer(event: PointerEvent) {
  if (!drag || !sheet.value) return;
  const piece = pieces.value.find((item) => item.id === drag?.id);
  if (!piece) return;

  const dx = event.clientX - drag.px;
  const dy = event.clientY - drag.py;
  if (Math.hypot(dx, dy) > 5) {
    drag.hasMoved = true;
  }
  if (!drag.hasMoved) return;

  const rect = sheet.value.getBoundingClientRect();
  if (drag.mode === 'move') {
    piece.x = clamp(drag.x + (dx / rect.width) * 100, 0, 100 - piece.w);
    piece.y = Math.max(2, Math.round(drag.y + dy / SCALE_Y));
    return;
  }
  piece.w = clamp(drag.w + (dx / rect.width) * 100, 14, 72);
  piece.x = Math.min(piece.x, 100 - piece.w);
}

function onUp() {
  window.removeEventListener('pointermove', onPointer);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);

  if (!drag) return;
  const didDrag = drag.hasMoved;
  drag = null;
  persist();

  if (didDrag) {
    justDragged = true;
    if (dragTimer) clearTimeout(dragTimer);
    dragTimer = setTimeout(() => {
      justDragged = false;
      dragTimer = null;
    }, 150);
  }
}

function onPieceKey(event: KeyboardEvent, piece: MoodPiece) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, iframe, video')) return;
  const step = event.shiftKey ? 8 : 2;
  if (event.key === 'ArrowLeft') piece.x = clamp(piece.x - step, 0, 100 - piece.w);
  else if (event.key === 'ArrowRight') piece.x = clamp(piece.x + step, 0, 100 - piece.w);
  else if (event.key === 'ArrowUp') piece.y = Math.max(2, piece.y - step);
  else if (event.key === 'ArrowDown') piece.y = piece.y + step;
  else if (event.key === 'Delete' || event.key === 'Backspace') remove(piece);
  else return;
  event.preventDefault();
  persist();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
</script>

<style scoped>
.mood-board ::selection {
  background: #173d35;
  color: #f5f3ec;
}
.mood-link::placeholder {
  color: #5c6b64;
}
.mood-caption::placeholder {
  color: #8c9b94;
}
.mood-caption:focus::placeholder {
  color: #5c6b64;
}
.mood-note-text::placeholder {
  color: rgba(0, 0, 0, 0.35);
}
.mood-size {
  opacity: 0.85;
}
.mood-piece:hover .mood-size,
.mood-piece:focus-within .mood-size {
  opacity: 1;
}
@media (hover: none) {
  .mood-size {
    opacity: 1;
  }
}
.mood-piece {
  animation: mood-in 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes mood-in {
  from {
    opacity: 0;
    filter: blur(6px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 180ms ease-out;
}
@keyframes slideLeft {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-slideLeft {
  animation: slideLeft 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
@media (prefers-reduced-motion: reduce) {
  .mood-piece,
  .animate-fadeIn,
  .animate-slideLeft {
    animation: none;
  }
}
</style>
