<script setup>
import { computed, onMounted } from 'vue'
import EmotionCell from './EmotionCell.vue'
import { useTimeline } from '@/composables/useTimeline'
import { useDiary } from '@/composables/useDiary'

const { diaryId } = useDiary()
const { timelineData, loading, loadTimeline } = useTimeline()

const YEAR   = new Date().getFullYear()
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const LEGEND = ['tristeza','miedo','ansiedad','soledad','ira','culpa','gratitud','paz']
const EMOJIS = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
}
const LABELS = {
  tristeza:'Tristeza', miedo:'Miedo', ansiedad:'Ansiedad', soledad:'Soledad',
  ira:'Enojo', culpa:'Culpa', duda_de_fe:'Duda de fe', gratitud:'Gratitud',
  paz:'Paz', desesperanza:'Desesperanza', confusión:'Confusión', vergüenza:'Vergüenza',
}

const byDate = computed(() => {
  const m = {}
  for (const e of timelineData.value) m[e.entry_date] = e
  return m
})

const weeks = computed(() => {
  const yearStart = new Date(YEAR, 0, 1)
  const today = new Date()
  const end = Math.min(new Date(YEAR, 11, 31).getTime(), today.getTime())

  // Monday on or before Jan 1
  const dow = yearStart.getDay()
  const cursor = new Date(yearStart)
  cursor.setDate(yearStart.getDate() + (dow === 0 ? -6 : 1 - dow))
  cursor.setHours(0, 0, 0, 0)

  const result = []
  while (cursor.getTime() <= end) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor.getTime() + d * 86400000)
      const dateStr = date.toISOString().split('T')[0]
      const inYear = date.getFullYear() === YEAR
      const entry = inYear ? (byDate.value[dateStr] ?? null) : null
      week.push({ date, dateStr, inYear, entry, hasEntry: !!entry })
    }
    result.push(week)
    cursor.setDate(cursor.getDate() + 7)
  }
  return result
})

const monthLabels = computed(() => {
  const labels = []
  let last = -1
  weeks.value.forEach((week, wi) => {
    const first = week.find(d => d.inYear)
    if (first) {
      const m = first.date.getMonth()
      if (m !== last) { labels.push({ label: MONTHS[m], weekIdx: wi }); last = m }
    }
  })
  return labels
})

// px per column = cell-size (14) + gap (3)
const COL_W = 17

onMounted(() => loadTimeline(diaryId.value, 'year'))
</script>

<template>
  <div class="year-wrap">
    <div v-if="loading" class="muted-msg">Cargando...</div>
    <div v-else class="heatmap-outer">
      <!-- Month labels -->
      <div class="months-row" :style="{ width: `${weeks.length * COL_W}px` }">
        <span v-for="(lbl, i) in monthLabels" :key="i"
              class="month-lbl" :style="{ left: `${lbl.weekIdx * COL_W}px` }">
          {{ lbl.label }}
        </span>
      </div>

      <!-- Heatmap -->
      <div class="heatmap" :style="{ gridTemplateColumns: `repeat(${weeks.length}, var(--cell-size, 14px))` }">
        <div v-for="(week, wi) in weeks" :key="wi" class="week-col">
          <EmotionCell v-for="(day, di) in week" :key="di"
                       :emotion="day.entry?.emotion" :intensity="day.entry?.intensity"
                       :date="day.dateStr" :has-entry="day.hasEntry" :in-range="day.inYear" />
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        <span v-for="em in LEGEND" :key="em" class="legend-item">
          <span class="legend-emoji">{{ EMOJIS[em] }}</span>
          <span class="legend-label">{{ LABELS[em] || em }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.year-wrap { overflow-x: auto; }
.muted-msg { color: var(--color-rhema-muted); font-size: 0.875rem; padding: 2rem 0; }
.heatmap-outer { display: flex; flex-direction: column; gap: 6px; width: fit-content; }
.months-row { position: relative; height: 1.25rem; }
.month-lbl { position: absolute; font-size: 0.6875rem; color: var(--color-rhema-muted); white-space: nowrap; }
.heatmap { display: grid; gap: var(--cell-gap, 3px); }
.week-col { display: flex; flex-direction: column; gap: var(--cell-gap, 3px); }
.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
.legend-item { display: flex; align-items: center; gap: 0.375rem; }
.legend-emoji { font-size: 0.9rem; line-height: 1; }
.legend-label { font-size: 0.6875rem; color: var(--color-rhema-muted); }
</style>
