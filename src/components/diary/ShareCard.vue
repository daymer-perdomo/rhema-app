<script setup>
// Fixed 375×667 px card captured at 3× → 1125×2001 (Stories-ready)
// All colours are hardcoded hex — html-to-image doesn't always resolve CSS vars

const props = defineProps({
  entry:     { type: Object, required: true },
  rawText:   { type: String, default: '' },
  narrative: { type: Object, default: null },
})

const EMOTION_EMOJI = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
  amor:'🩷',
}
const EMOTION_LABEL = {
  tristeza:'Tristeza', miedo:'Miedo', ansiedad:'Ansiedad', soledad:'Soledad',
  ira:'Ira', culpa:'Culpa', duda_de_fe:'Duda de fe', gratitud:'Gratitud',
  paz:'Paz', desesperanza:'Desesperanza', confusión:'Confusión', vergüenza:'Vergüenza',
  amor:'Amor',
}
const EMOTION_COLOR = {
  tristeza:'#5a7ab0', miedo:'#7a5a9f', ansiedad:'#b07a50', soledad:'#6a8fa8',
  ira:'#b05a5a', culpa:'#7a6a50', duda_de_fe:'#6a7a8a', gratitud:'#a8c4a2',
  paz:'#6aaa88', desesperanza:'#505a70', confusión:'#8a7a60', vergüenza:'#8a5a70',
  amor:'#c4789a',
}

import { computed } from 'vue'

const emotion      = computed(() => props.entry?.emotion ?? '')
const accentColor  = computed(() => EMOTION_COLOR[emotion.value] ?? '#6a7a6a')
const emoji        = computed(() => EMOTION_EMOJI[emotion.value] ?? '✦')
const emotionLabel = computed(() => EMOTION_LABEL[emotion.value] ?? emotion.value)

const firstCard = computed(() => props.narrative?.cards?.[0] ?? null)
const verseText = computed(() => {
  const c = firstCard.value
  if (!c) return ''
  return c.text || c.verse || ''
})
const verseRef  = computed(() => firstCard.value?.reference ?? '')
const reflection = computed(() => {
  const r = firstCard.value?.reflection ?? props.narrative?.intro ?? ''
  return r.length > 180 ? r.slice(0, 177) + '…' : r
})

const dateLabel = computed(() => {
  if (!props.entry?.entry_date) return ''
  return new Date(props.entry.entry_date + 'T00:00:00')
    .toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})
</script>

<template>
  <div class="share-card">
    <!-- Emotion glow top -->
    <div class="glow-top" :style="{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}28 0%, transparent 70%)` }" />

    <!-- Header ornament -->
    <div class="ornament" :style="{ color: accentColor }">✦</div>

    <!-- Date -->
    <p class="card-date">{{ dateLabel }}</p>

    <!-- Emotion pill -->
    <div class="emotion-row">
      <span class="emotion-emoji">{{ emoji }}</span>
      <span class="emotion-label" :style="{ color: accentColor }">{{ emotionLabel }}</span>
    </div>

    <!-- Divider -->
    <div class="divider" :style="{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }" />

    <!-- Verse -->
    <div class="verse-block">
      <p class="verse-text">"{{ verseText }}"</p>
      <p v-if="verseRef" class="verse-ref" :style="{ color: accentColor }">— {{ verseRef }}</p>
    </div>

    <!-- Reflection -->
    <p v-if="reflection" class="reflection">{{ reflection }}</p>

    <!-- Spacer -->
    <div class="spacer" />

    <!-- Branding footer -->
    <div class="card-footer">
      <div class="footer-divider" />
      <p class="brand-name">Rhema</p>
      <p class="brand-sub">La Palabra de Dios para tu momento</p>
    </div>
  </div>
</template>

<style scoped>
.share-card {
  position: relative;
  width: 375px;
  height: 667px;
  background: #0f0f0f;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 36px 36px;
  box-sizing: border-box;
  font-family: 'Inter', system-ui, sans-serif;
}

.glow-top {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ornament {
  font-size: 18px;
  opacity: 0.7;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.card-date {
  font-size: 11px;
  color: #6a6a6a;
  letter-spacing: 0.08em;
  text-transform: capitalize;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.emotion-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.emotion-emoji {
  font-size: 22px;
  line-height: 1;
}

.emotion-label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: capitalize;
}

.divider {
  width: 100%;
  height: 1px;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.verse-block {
  width: 100%;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.verse-text {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-size: 19px;
  line-height: 1.65;
  color: #e8e8e8;
  text-align: center;
  margin-bottom: 12px;
}

.verse-ref {
  font-size: 11px;
  text-align: center;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.reflection {
  font-size: 12px;
  line-height: 1.7;
  color: #787878;
  text-align: center;
  position: relative;
  z-index: 1;
}

.spacer { flex: 1; }

.card-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.footer-divider {
  width: 48px;
  height: 1px;
  background: rgba(225, 237, 224, 0.12);
  margin-bottom: 4px;
}

.brand-name {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-size: 20px;
  color: rgba(225, 237, 224, 0.7);
  letter-spacing: 0.04em;
}

.brand-sub {
  font-size: 9px;
  color: rgba(225, 237, 224, 0.25);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
</style>
