<script setup>
import { computed } from 'vue'
import { Lock } from '@lucide/vue'

const props = defineProps({
  entry:    { type: Object,  required: true },
  index:    { type: Number,  required: true },
  isActive: { type: Boolean, default: false },
})
defineEmits(['open'])

const ROTATIONS = [-2.5, 1.8, -1.2, 2.1, -0.8, 1.5, -2.0, 0.9]

const EMOTION_COLORS = {
  tristeza:     'var(--emotion-tristeza)',
  miedo:        'var(--emotion-miedo)',
  ansiedad:     'var(--emotion-ansiedad)',
  soledad:      'var(--emotion-soledad)',
  ira:          'var(--emotion-ira)',
  culpa:        'var(--emotion-culpa)',
  duda_de_fe:   'var(--emotion-duda)',
  gratitud:     'var(--emotion-gratitud)',
  paz:          'var(--emotion-paz)',
  desesperanza: 'var(--emotion-tristeza)',
  confusión:    'var(--emotion-duda)',
  vergüenza:    'var(--emotion-culpa)',
}

const EMOTION_LABELS = {
  tristeza:     'Tristeza',
  miedo:        'Miedo',
  ansiedad:     'Ansiedad',
  gratitud:     'Gratitud',
  soledad:      'Soledad',
  duda_de_fe:   'Duda de fe',
  paz:          'Paz',
  ira:          'Enojo',
  culpa:        'Culpa',
  desesperanza: 'Desesperanza',
  confusión:    'Confusión',
  vergüenza:    'Vergüenza',
}

const rotation     = computed(() => ROTATIONS[props.index % ROTATIONS.length])
const emotionColor = computed(() => EMOTION_COLORS[props.entry.emotion] ?? 'var(--emotion-default)')
const emotionLabel = computed(() => EMOTION_LABELS[props.entry.emotion] ?? 'Reflexión')

const dateLabel = computed(() => {
  if (!props.entry.entry_date) return ''
  const d   = new Date(props.entry.entry_date + 'T00:00:00')
  const str = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  return str.charAt(0).toUpperCase() + str.slice(1)
})
</script>

<template>
  <article
    class="book-page"
    :class="{ 'is-active': isActive }"
    :data-entry-id="entry.id"
    :style="{
      '--rotation':      rotation + 'deg',
      '--emotion-color': emotionColor,
    }"
    @click="$emit('open', entry.id)"
  >
    <!-- depth: pages stacked behind -->
    <div class="page-stack page-stack-2" />
    <div class="page-stack page-stack-1" />

    <!-- main page face -->
    <div class="page-front">
      <div class="page-emotion-line" />
      <time class="page-date">{{ dateLabel }}</time>
      <h3 class="page-title">{{ entry.title || 'Entrada del día' }}</h3>
      <div class="page-ornament">✦</div>
      <p class="page-meta">{{ emotionLabel }}</p>
      <Lock class="page-lock" :size="12" />
    </div>
  </article>
</template>

<style scoped>
.book-page {
  position: relative;
  cursor: pointer;
  transform: rotate(var(--rotation));
  transition: transform var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1),
              filter     var(--transition-slow) ease;
  animation: page-appear 500ms ease both;
}

.book-page:hover,
.book-page.is-active {
  transform: rotate(0deg) translateY(-8px) scale(1.03);
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
  z-index: 10;
}

/* pages stacked behind */
.page-stack {
  position: absolute;
  inset: 0;
  border-radius: 2px 6px 6px 2px;
  background: var(--page-warm);
  border: 1px solid var(--color-rhema-border);
  pointer-events: none;
}

.page-stack-1 {
  transform: rotate(1.5deg) translate(3px, 3px);
  opacity: 0.55;
}

.page-stack-2 {
  transform: rotate(3deg) translate(6px, 6px);
  opacity: 0.3;
}

/* main page */
.page-front {
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
  transition: background var(--transition-base), border-color var(--transition-base);
}

.book-page:hover .page-front {
  background: var(--page-warm-hover);
  border-color: rgba(201, 168, 76, 0.2);
  border-left-color: rgba(201, 168, 76, 0.45);
}

.book-page.is-active .page-front {
  border-color: rgba(201, 168, 76, 0.35);
  border-left-color: rgba(201, 168, 76, 0.55);
}

/* emotion colour bar at top */
.page-emotion-line {
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  background: var(--emotion-color, var(--emotion-default));
  border-radius: 0 0 2px 2px;
  opacity: 0.65;
}

.page-date {
  display: block;
  font-family: var(--font-body);
  font-size: 0.58rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-rhema-gold);
  opacity: 0.7;
  margin-top: 0.25rem;
}

.page-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: var(--fw-semibold);
  font-style: italic;
  color: var(--color-rhema-text);
  line-height: 1.35;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.page-ornament {
  font-size: 0.6rem;
  color: var(--color-rhema-gold);
  opacity: 0.3;
  text-align: center;
}

.page-meta {
  font-family: var(--font-body);
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-rhema-muted);
  opacity: 0.55;
}

.page-lock {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  color: var(--color-rhema-muted);
  opacity: 0.25;
}

@keyframes page-appear {
  from {
    opacity: 0;
    transform: rotate(var(--rotation)) translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: rotate(var(--rotation)) translateY(0) scale(1);
  }
}
</style>
