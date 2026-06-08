<script setup>
import { computed } from 'vue'
import BookPage from './BookPage.vue'

defineProps({
  entries:  { type: Array,  required: true },
  activeId: { type: String, default: null },
})
defineEmits(['open'])

const today = computed(() => {
  const d   = new Date()
  const str = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  return str.charAt(0).toUpperCase() + str.slice(1)
})
</script>

<template>
  <!-- Entry grid -->
  <div v-if="entries.length > 0" class="book-grid">
    <BookPage
      v-for="(entry, index) in entries"
      :key="entry.id"
      :entry="entry"
      :index="index"
      :is-active="entry.id === activeId"
      :style="{ animationDelay: index * 80 + 'ms' }"
      @open="$emit('open', entry.id)"
    />
  </div>

  <!-- Empty state — floating single page -->
  <div v-else class="book-empty">
    <div class="empty-page">
      <div class="ep-stack ep-stack-2" />
      <div class="ep-stack ep-stack-1" />
      <div class="ep-front">
        <div class="ep-emotion-line" />
        <time class="ep-date">{{ today }}</time>
        <h3 class="ep-title">Tu primer capítulo aún no ha sido escrito.</h3>
        <div class="ep-ornament">✦</div>
        <p class="ep-meta">Reflexión</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Grid ───────────────────────────────────────────────────────────────── */
.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3rem 2.5rem;
  padding: 1.5rem 1.75rem 5rem;
  align-items: start;
}

/* even pages drop down for organic layout */
.book-page:nth-child(even) {
  margin-top: 1.75rem;
}

/* 3 columns on tablet */
@media (min-width: 700px) and (max-width: 1023px) {
  .book-grid { grid-template-columns: repeat(3, 1fr); }
  .book-page:nth-child(3n+2) { margin-top: 1.75rem; }
  .book-page:nth-child(even) { margin-top: 0; }
}

/* 2 columns on desktop panel */
@media (min-width: 1024px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem 2rem;
  }
  .book-page:nth-child(even)  { margin-top: 1.75rem; }
  .book-page:nth-child(3n+2) { margin-top: 0; }
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
.book-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.empty-page {
  position: relative;
  width: 180px;
  animation: float 4s ease-in-out infinite;
}

.ep-stack {
  position: absolute;
  inset: 0;
  border-radius: 2px 6px 6px 2px;
  background: var(--page-warm);
  border: 1px solid var(--color-rhema-border);
  pointer-events: none;
}

.ep-stack-1 {
  transform: rotate(1.5deg) translate(3px, 3px);
  opacity: 0.55;
}

.ep-stack-2 {
  transform: rotate(3deg) translate(6px, 6px);
  opacity: 0.3;
}

.ep-front {
  position: relative;
  background: var(--page-warm);
  border: 1px solid var(--color-rhema-border);
  border-left: 3px solid var(--page-spine);
  border-radius: 2px 6px 6px 2px;
  padding: 1.5rem 1.25rem 1.25rem;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  box-shadow: var(--page-shadow-1), var(--page-shadow-2), var(--page-shadow-3);
}

.ep-emotion-line {
  position: absolute;
  top: 0; left: 12px; right: 12px;
  height: 2px;
  background: var(--color-rhema-gold);
  border-radius: 0 0 2px 2px;
  opacity: 0.25;
}

.ep-date {
  display: block;
  font-family: var(--font-body);
  font-size: 0.58rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-rhema-gold);
  opacity: 0.5;
  margin-top: 0.25rem;
}

.ep-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: var(--fw-semibold);
  font-style: italic;
  color: var(--color-rhema-muted);
  line-height: 1.45;
  flex: 1;
}

.ep-ornament {
  font-size: 0.6rem;
  color: var(--color-rhema-gold);
  opacity: 0.3;
  text-align: center;
}

.ep-meta {
  font-family: var(--font-body);
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-rhema-muted);
  opacity: 0.35;
}

@keyframes float {
  0%, 100% { transform: rotate(-1.5deg) translateY(0);     }
  50%       { transform: rotate(-1.5deg) translateY(-12px); }
}
</style>
