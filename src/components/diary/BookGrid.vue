<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import BookPage from './BookPage.vue'

const props = defineProps({
  entries:  { type: Array,  required: true },
  activeId: { type: String, default: null },
})
defineEmits(['open'])

const ENTRIES_PER_PAGE = 16
const BOOKS_PER_SHELF  = 6

// ─── Pagination ───────────────────────────────────────────────────────────────
const currentPage = ref(1)
const totalPages  = computed(() => Math.max(1, Math.ceil(props.entries.length / ENTRIES_PER_PAGE)))

// Jump to page 1 whenever a new entry is added (the newest is always on page 1)
watch(() => props.entries.length, (next, prev) => {
  if (next > prev) currentPage.value = 1
})

const pageEntries = computed(() => {
  const start = (currentPage.value - 1) * ENTRIES_PER_PAGE
  return props.entries.slice(start, start + ENTRIES_PER_PAGE)
})

const shelves = computed(() => {
  const rows = []
  for (let i = 0; i < pageEntries.value.length; i += BOOKS_PER_SHELF) {
    rows.push(pageEntries.value.slice(i, i + BOOKS_PER_SHELF))
  }
  return rows
})

// Page number list with ellipsis
const pageNumbers = computed(() => {
  const t = totalPages.value
  const c = currentPage.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  if (c <= 4)        return [1, 2, 3, 4, 5, '…', t]
  if (c >= t - 3)    return [1, '…', t - 4, t - 3, t - 2, t - 1, t]
  return [1, '…', c - 1, c, c + 1, '…', t]
})

function goTo(page) {
  if (typeof page !== 'number') return
  currentPage.value = Math.max(1, Math.min(totalPages.value, page))
}
</script>

<template>

  <!-- ── BOOKSHELF ─────────────────────────────────────────────────────────── -->
  <div v-if="entries.length > 0" class="bookshelf-wrap">

    <div class="bookshelf" role="list">
      <div
        v-for="(shelf, si) in shelves"
        :key="si"
        class="shelf-row"
      >
        <BookPage
          v-for="(entry, i) in shelf"
          :key="entry.id"
          :entry="entry"
          :index="si * BOOKS_PER_SHELF + i"
          :is-active="entry.id === activeId"
          :is-latest="currentPage === 1 && si === 0 && i === 0"
          role="listitem"
          @open="$emit('open', entry.id)"
        />
        <div class="shelf-filler" />
      </div>
    </div>

    <!-- ── Pagination ──────────────────────────────────────────────────────── -->
    <nav v-if="totalPages > 1" class="pagination" aria-label="Páginas del diario">

      <!-- Prev -->
      <button
        class="pg-arrow"
        :disabled="currentPage === 1"
        aria-label="Página anterior"
        @click="goTo(currentPage - 1)"
      >
        <ChevronLeft :size="14" />
      </button>

      <!-- Desktop: numbered pages -->
      <div class="pg-numbers desktop-only">
        <button
          v-for="(p, idx) in pageNumbers"
          :key="idx"
          class="pg-num"
          :class="{ active: p === currentPage, ellipsis: p === '…' }"
          :disabled="p === '…'"
          @click="goTo(p)"
        >
          {{ p }}
        </button>
      </div>

      <!-- Mobile: "X / Y" -->
      <span class="pg-counter mobile-only">{{ currentPage }} / {{ totalPages }}</span>

      <!-- Next -->
      <button
        class="pg-arrow"
        :disabled="currentPage === totalPages"
        aria-label="Página siguiente"
        @click="goTo(currentPage + 1)"
      >
        <ChevronRight :size="14" />
      </button>

    </nav>

  </div>

  <!-- ── EMPTY STATE ────────────────────────────────────────────────────────── -->
  <div v-else class="shelf-empty">
    <div class="ghost-shelf">
      <div class="ghost-book" style="--gh:178px;--gw:57px;--gd:0s"   />
      <div class="ghost-book" style="--gh:195px;--gw:49px;--gd:0.3s" />
      <div class="ghost-book" style="--gh:160px;--gw:65px;--gd:0.6s" />
      <div class="ghost-book" style="--gh:185px;--gw:52px;--gd:0.9s" />
      <div class="ghost-book" style="--gh:170px;--gw:59px;--gd:1.2s" />
    </div>
    <div class="ghost-board" />
    <p class="empty-msg">
      Tu primer capítulo<br>aún no ha sido escrito.
    </p>
  </div>

</template>

<style scoped>

/* ── Wrapper ─────────────────────────────────────────────────────────────────── */
.bookshelf-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Bookshelf container ──────────────────────────────────────────────────── */
.bookshelf {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1.5rem 1.25rem 2.5rem;
}

/* ── Shelf row ────────────────────────────────────────────────────────────── */
.shelf-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex-wrap: wrap;
  padding-bottom: 14px;
}

.shelf-filler { flex: 1 1 0; min-width: 0; }

/* ── Shelf board ──────────────────────────────────────────────────────────── */
.shelf-row::before {
  content: '';
  position: absolute;
  bottom: 6px;
  left: -22px; right: -22px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.10) 15%,
    rgba(255,255,255,0.10) 85%,
    transparent 100%
  );
  z-index: 2;
}

.shelf-row::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -22px; right: -22px;
  height: 14px;
  background: linear-gradient(180deg, #2d2d2d 0%, #222222 25%, #1a1a1a 65%, #0f0f0f 100%);
  border-top: 1px solid rgba(255,255,255,0.07);
  border-radius: 0 0 3px 3px;
  box-shadow:
    0 10px 35px rgba(0,0,0,0.85),
    0 4px  12px rgba(0,0,0,0.65),
    0 2px  4px  rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.055),
    inset 0 -1px 0 rgba(0,0,0,0.6);
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 1.25rem 1.25rem 3rem;
  flex-shrink: 0;
}

/* Arrows */
.pg-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(225,237,224,0.1);
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 160ms, color 160ms, background 160ms;
  flex-shrink: 0;
}
.pg-arrow:hover:not(:disabled) {
  border-color: rgba(225,237,224,0.26);
  color: var(--color-text);
  background: rgba(225,237,224,0.04);
}
.pg-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* Desktop number buttons */
.pg-numbers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pg-num {
  min-width: 32px;
  height: 32px;
  padding: 0 0.375rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 160ms, color 160ms, background 160ms;
}
.pg-num:hover:not(:disabled):not(.active) {
  border-color: rgba(225,237,224,0.14);
  color: var(--color-text);
  background: rgba(225,237,224,0.04);
}
.pg-num.active {
  border-color: rgba(225,237,224,0.28);
  color: var(--color-accent);
  background: rgba(225,237,224,0.06);
  cursor: default;
}
.pg-num.ellipsis {
  cursor: default;
  opacity: 0.35;
  letter-spacing: 0.05em;
}

/* Mobile counter */
.pg-counter {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  min-width: 52px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Responsive visibility */
.desktop-only { display: flex; }
.mobile-only  { display: none; }

@media (max-width: 480px) {
  .desktop-only { display: none; }
  .mobile-only  { display: block; }
  .pagination   { gap: 0.5rem; }
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
.shelf-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5rem 1.25rem 4rem;
  gap: 0;
}

.ghost-shelf {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  width: 100%;
}

.ghost-book {
  width:  var(--gw, 57px);
  height: var(--gh, 178px);
  flex-shrink: 0;
  background: linear-gradient(
    to right,
    rgba(225,237,224,0.04) 0%,
    rgba(225,237,224,0.02) 60%,
    transparent 100%
  );
  border-left: 4px solid rgba(225,237,224,0.07);
  border-radius: 1px 4px 4px 1px;
  box-shadow: 3px 0 10px rgba(0,0,0,0.7);
  animation: ghost-breathe 3.5s ease-in-out var(--gd, 0s) infinite;
}

@keyframes ghost-breathe {
  0%, 100% { opacity: 0.25; }
  50%       { opacity: 0.55; }
}

.ghost-board {
  width: calc(100% + 44px);
  margin-left: -22px;
  height: 14px;
  background: linear-gradient(180deg, #2d2d2d 0%, #222 25%, #1a1a1a 65%, #0f0f0f 100%);
  border-top: 1px solid rgba(255,255,255,0.07);
  border-radius: 0 0 3px 3px;
  box-shadow: 0 10px 35px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.055);
}

.empty-msg {
  margin-top: 2rem;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  text-align: left;
  line-height: 1.65;
  opacity: 0.5;
}

</style>
