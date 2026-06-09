<script setup>
import { computed } from 'vue'
import BookPage from './BookPage.vue'

const props = defineProps({
  entries:  { type: Array,  required: true },
  activeId: { type: String, default: null },
})
defineEmits(['open'])

const BOOKS_PER_SHELF = 6

const shelves = computed(() => {
  const rows = []
  for (let i = 0; i < props.entries.length; i += BOOKS_PER_SHELF) {
    rows.push(props.entries.slice(i, i + BOOKS_PER_SHELF))
  }
  return rows
})
</script>

<template>

  <!-- ── BOOKSHELF ────────────────────────────────────────────────────────── -->
  <div v-if="entries.length > 0" class="bookshelf" role="list">

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
        role="listitem"
        @open="$emit('open', entry.id)"
      />
      <div class="shelf-filler" />
    </div>

  </div>

  <!-- ── EMPTY STATE ───────────────────────────────────────────────────────── -->
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

/* ── Bookshelf container ──────────────────────────────────────────────────── */
.bookshelf {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1.5rem 1.25rem 5rem;
}

/* ── Shelf row ────────────────────────────────────────────────────────────── */
.shelf-row {
  position: relative;
  display: flex;
  align-items: flex-end;   /* books stand on the board */
  gap: 3px;
  flex-wrap: wrap;
  padding-bottom: 14px;    /* clearance above the board */
}

/* Fills row so books stay left-aligned on partial rows */
.shelf-filler { flex: 1 1 0; min-width: 0; }

/* ── Shelf board ──────────────────────────────────────────────────────────── */
.shelf-row::before {
  /* front edge highlight — top surface of the plank */
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
  /* the plank body */
  content: '';
  position: absolute;
  bottom: 0;
  left: -22px; right: -22px;
  height: 14px;
  background: linear-gradient(
    180deg,
    #2d2d2d 0%,
    #222222 25%,
    #1a1a1a 65%,
    #0f0f0f 100%
  );
  border-top: 1px solid rgba(255,255,255,0.07);
  border-radius: 0 0 3px 3px;
  box-shadow:
    0 10px 35px rgba(0,0,0,0.85),
    0 4px  12px rgba(0,0,0,0.65),
    0 2px  4px  rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.055),
    inset 0 -1px 0 rgba(0,0,0,0.6);
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
  padding-bottom: 0;
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
  background: linear-gradient(
    180deg,
    #2d2d2d 0%, #222 25%, #1a1a1a 65%, #0f0f0f 100%
  );
  border-top: 1px solid rgba(255,255,255,0.07);
  border-radius: 0 0 3px 3px;
  box-shadow:
    0 10px 35px rgba(0,0,0,0.85),
    inset 0 1px 0 rgba(255,255,255,0.055);
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
