<script setup>
import { computed } from 'vue'

const props = defineProps({
  entry:    { type: Object,  required: true },
  index:    { type: Number,  required: true },
  isActive: { type: Boolean, default: false },
})
defineEmits(['open'])

// Heights / widths for organic variation
const HEIGHTS = [178, 195, 160, 185, 170, 200, 155, 188, 175, 193]
const WIDTHS  = [57,  49,  65,  52,  59,  47,  63,  54,  58,  50]

// Colors from main.css emotion tokens
const EMOTION_COLORS = {
  tristeza:     '#5a7ab0',
  miedo:        '#7a5a9f',
  ansiedad:     '#b07a50',
  soledad:      '#6a8fa8',
  ira:          '#b05a5a',
  culpa:        '#7a6a50',
  duda_de_fe:   '#6a7a8a',
  gratitud:     '#a8c4a2',
  paz:          '#6aaa88',
  desesperanza: '#505a70',
  confusión:    '#8a7a60',
  vergüenza:    '#8a5a70',
}

// RGB equivalents for rgba() usage in CSS
const EMOTION_RGB = {
  tristeza:     '90,122,176',
  miedo:        '122,90,159',
  ansiedad:     '176,122,80',
  soledad:      '106,143,168',
  ira:          '176,90,90',
  culpa:        '122,106,80',
  duda_de_fe:   '106,122,138',
  gratitud:     '168,196,162',
  paz:          '106,170,136',
  desesperanza: '80,90,112',
  confusión:    '138,122,96',
  vergüenza:    '138,90,112',
}

const EMOTION_ICONS = {
  tristeza:     '😢',
  miedo:        '😨',
  ansiedad:     '😟',
  soledad:      '😔',
  ira:          '😤',
  culpa:        '😞',
  duda_de_fe:   '🤔',
  gratitud:     '🙏',
  paz:          '😌',
  desesperanza: '💔',
  confusión:    '😵',
  vergüenza:    '😳',
}

const h     = computed(() => HEIGHTS[props.index % HEIGHTS.length])
const w     = computed(() => WIDTHS[props.index % WIDTHS.length])
const color = computed(() => EMOTION_COLORS[props.entry.emotion] ?? '#6a7a8a')
const rgb   = computed(() => EMOTION_RGB[props.entry.emotion]    ?? '106,122,138')
const icon  = computed(() => EMOTION_ICONS[props.entry.emotion]  ?? '✦')

const shortDate = computed(() => {
  if (!props.entry.entry_date) return ''
  const d = new Date(props.entry.entry_date + 'T00:00:00')
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
})

const spineStyle = computed(() => ({
  '--ec':    color.value,
  '--er':    rgb.value,
  '--bh':    h.value + 'px',
  '--bw':    w.value + 'px',
  '--delay': (props.index * 60) + 'ms',
}))
</script>

<template>
  <article
    class="book-spine"
    :class="{ 'is-active': isActive }"
    :data-entry-id="entry.id"
    :style="spineStyle"
    :title="entry.title || 'Entrada del día'"
    @click="$emit('open', entry.id)"
  >
    <!-- emotion icon -->
    <span class="spine-icon" aria-hidden="true">{{ icon }}</span>

    <!-- thin ornamental rule -->
    <div class="spine-rule" />

    <!-- entry title — reads bottom to top -->
    <p class="spine-title">{{ entry.title || 'Entrada' }}</p>

    <!-- bottom: ornament + date -->
    <footer class="spine-footer">
      <span class="spine-ornament" aria-hidden="true">✦</span>
      <span class="spine-date">{{ shortDate }}</span>
    </footer>
  </article>
</template>

<style scoped>
/* ── Book spine ─────────────────────────────────────────────────────────────
   Left border  = binding (pure emotion color)
   Background   = emotion color bleeds from binding into dark cloth
   ::before     = subtle cloth-weave texture overlay
   ::after      = top-light reflection (ambient sheen)
   ──────────────────────────────────────────────────────────────────────── */
.book-spine {
  position: relative;
  width:    var(--bw, 57px);
  height:   var(--bh, 178px);
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;

  /* Material layers (bottom to top) */
  background:
    /* cloth-weave horizontal grain */
    repeating-linear-gradient(
      0deg,
      transparent 0px, transparent 3px,
      rgba(0, 0, 0, 0.055) 3px, rgba(0, 0, 0, 0.055) 4px
    ),
    /* emotion color bleeds from binding */
    linear-gradient(
      to right,
      rgba(var(--er), 0.32) 0%,
      rgba(var(--er), 0.10) 40%,
      rgba(var(--er), 0.02) 75%,
      transparent 100%
    ),
    /* base dark cloth */
    linear-gradient(180deg, #252525 0%, #1c1c1c 50%, #151515 100%);

  /* Binding strip — left edge */
  border-left: 7px solid var(--ec);
  border-radius: 1px 4px 4px 1px;

  /* 3-D depth */
  box-shadow:
    /* binding inner glow */
    inset 12px 0 22px rgba(var(--er), 0.28),
    /* right-edge page block darkness */
    inset -2px 0 4px rgba(0, 0, 0, 0.55),
    /* physical depth shadows */
    4px 0 14px rgba(0, 0, 0, 0.92),
    2px 0 5px  rgba(0, 0, 0, 0.7),
    /* subtle emotion aura */
    -1px 0 8px rgba(var(--er), 0.15);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10px 5px 9px;

  /* Entrance animation */
  animation-name: book-rise;
  animation-duration: 420ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  animation-delay: var(--delay, 0ms);
  animation-fill-mode: both;

  /* Hover transition */
  transition:
    transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1),
    filter    240ms ease,
    z-index   0ms;
  z-index: 1;
}

/* Cloth-surface sheen — top ambient reflection */
.book-spine::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 45%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.01) 60%,
    transparent 100%
  );
  pointer-events: none;
}

/* ── Hover / active ─────────────────────────────────────────────────────── */
.book-spine:hover,
.book-spine.is-active {
  transform: translateY(-20px) rotate(-0.8deg);
  z-index: 20;
  filter:
    brightness(1.35)
    saturate(1.3)
    drop-shadow(0 22px 38px rgba(0, 0, 0, 0.88))
    drop-shadow(0 8px 16px rgba(var(--er), 0.38));
}

/* ── Icon ───────────────────────────────────────────────────────────────── */
.spine-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

/* ── Ornamental rule ────────────────────────────────────────────────────── */
.spine-rule {
  width: 70%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--er), 0.55) 30%,
    rgba(var(--er), 0.55) 70%,
    transparent
  );
  flex-shrink: 0;
  margin: 2px 0;
}

/* ── Title — vertical, bottom-to-top ───────────────────────────────────── */
.spine-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  flex: 1;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.02em;

  /* warm ivory with emotion glow */
  color: rgba(240, 232, 216, 0.92);
  text-shadow:
    0 1px 4px rgba(0, 0, 0, 0.7),
    0 0 10px rgba(var(--er), 0.22);

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-height: 96px;
  text-align: center;
  padding: 4px 0;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
.spine-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.spine-ornament {
  font-size: 0.45rem;
  color: rgba(var(--er), 0.55);
  line-height: 1;
}

.spine-date {
  font-size: 0.46rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(var(--er), 0.52);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  line-height: 1;
}

/* ── Entrance animation ─────────────────────────────────────────────────── */
@keyframes book-rise {
  from {
    opacity: 0;
    transform: translateY(24px) scaleY(0.92);
    filter: brightness(0.6);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
    filter: brightness(1);
  }
}
</style>
