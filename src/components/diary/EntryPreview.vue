<script setup>
import { computed } from 'vue'
import { Lock } from '@lucide/vue'

const props = defineProps({ entry: { type: Object, required: true } })
defineEmits(['open'])

const COLORS = {
  tristeza:'var(--emotion-tristeza)', miedo:'var(--emotion-miedo)',
  ansiedad:'var(--emotion-ansiedad)', soledad:'var(--emotion-soledad)',
  ira:'var(--emotion-ira)', culpa:'var(--emotion-culpa)',
  duda_de_fe:'var(--emotion-duda)', gratitud:'var(--emotion-gratitud)',
  paz:'var(--emotion-paz)', desesperanza:'var(--emotion-tristeza)',
  confusión:'var(--emotion-duda)', vergüenza:'var(--emotion-culpa)',
}

const dotColor = computed(() => COLORS[props.entry.emotion] ?? 'var(--emotion-default)')

const dateLabel = computed(() => {
  if (!props.entry.entry_date) return ''
  const d = new Date(props.entry.entry_date + 'T00:00:00')
  return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
})
</script>

<template>
  <button class="row" @click="$emit('open', entry.id)">
    <span class="dot" :style="{ background: dotColor }" />
    <div class="meta">
      <span class="date">{{ dateLabel }}</span>
      <span class="title">{{ entry.title || 'Entrada del día' }}</span>
    </div>
    <span v-if="entry.intensity" class="badge">{{ entry.intensity }}</span>
    <Lock class="lock" />
  </button>
</template>

<style scoped>
.row {
  display: flex; align-items: center; gap: 0.875rem;
  width: 100%; padding: 0.875rem 0.75rem;
  border-radius: var(--rhema-radius-md); background: none; border: none;
  cursor: pointer; text-align: left;
  transition: background var(--transition-fast);
}
.row:hover { background: var(--color-rhema-surface); }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.date { font-size: 0.75rem; color: var(--color-rhema-muted); text-transform: capitalize; }
.title { font-size: 0.9375rem; color: var(--color-rhema-text); font-weight: var(--fw-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { font-size: 0.6875rem; color: var(--color-rhema-muted); letter-spacing: 0.04em; flex-shrink: 0; }
.lock { width: 14px; height: 14px; color: var(--color-rhema-border); flex-shrink: 0; }
</style>
