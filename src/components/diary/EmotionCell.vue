<script setup>
import { computed } from 'vue'

const props = defineProps({
  emotion:  String,
  intensity: String,
  date:     String,
  hasEntry: { type: Boolean, default: false },
  inRange:  { type: Boolean, default: true },
})

const COLORS = {
  tristeza:'var(--emotion-tristeza)', miedo:'var(--emotion-miedo)',
  ansiedad:'var(--emotion-ansiedad)', soledad:'var(--emotion-soledad)',
  ira:'var(--emotion-ira)', culpa:'var(--emotion-culpa)',
  duda_de_fe:'var(--emotion-duda)', gratitud:'var(--emotion-gratitud)',
  paz:'var(--emotion-paz)', desesperanza:'var(--emotion-tristeza)',
  confusión:'var(--emotion-duda)', vergüenza:'var(--emotion-culpa)',
  amor:'var(--emotion-amor)',
}
const EMOJIS = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
  amor:'🩷',
}
const LABELS = {
  tristeza:'Tristeza', miedo:'Miedo', ansiedad:'Ansiedad', soledad:'Soledad',
  ira:'Enojo', culpa:'Culpa', duda_de_fe:'Duda de fe', gratitud:'Gratitud',
  paz:'Paz', desesperanza:'Desesperanza', confusión:'Confusión', vergüenza:'Vergüenza',
  amor:'Amor',
}
const OPACITY = { leve: 0.4, moderada: 0.7, intensa: 1.0, crisis: 1.0 }

const cellStyle = computed(() => {
  if (!props.inRange) return { background: 'transparent' }
  if (!props.hasEntry) return { background: 'var(--emotion-default)', opacity: 0.3 }
  return { background: COLORS[props.emotion] ?? 'var(--emotion-default)', opacity: OPACITY[props.intensity] ?? 0.5 }
})

const tooltip = computed(() => {
  if (!props.inRange || !props.date) return ''
  const d = new Date(props.date + 'T00:00:00')
  const label = d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!props.hasEntry) return label
  const emoji = EMOJIS[props.emotion] || '✦'
  const em    = LABELS[props.emotion]  || props.emotion || ''
  return `${emoji} ${label} · ${em}`
})
</script>

<template>
  <div class="cell" :style="cellStyle" :data-tooltip="tooltip" />
</template>

<style scoped>
.cell {
  width: var(--cell-size, 14px);
  height: var(--cell-size, 14px);
  border-radius: var(--cell-radius, 3px);
  flex-shrink: 0;
  position: relative;
  transition: transform 0.1s ease;
}
.cell:hover { transform: scale(1.4); z-index: 2; }
.cell[data-tooltip]:hover::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%; left: 50%;
  transform: translateX(-50%);
  background: var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  color: var(--color-rhema-text);
  padding: 3px 8px; border-radius: 6px;
  font-size: 11px; white-space: nowrap;
  pointer-events: none; z-index: 10;
}
</style>
