<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDiary } from '@/composables/useDiary'
import { getEntries } from '@/services/diary.service'

const emit = defineEmits(['openEntry'])
const { diaryId } = useDiary()

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

const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const data = ref([])
const loading = ref(false)

onMounted(async () => {
  if (!diaryId.value) return
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  loading.value = true
  try {
    data.value = await getEntries(diaryId.value, {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    })
  } finally {
    loading.value = false
  }
})

const days = computed(() => {
  const byDate = {}
  for (const e of data.value) byDate[e.entry_date] = e

  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const entry = byDate[dateStr]
    return {
      dayName: DAY_NAMES[i],
      dateLabel: d.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      dateStr, entry,
    }
  })
})
</script>

<template>
  <div class="week-list">
    <div v-if="loading" class="muted-msg">Cargando...</div>
    <div v-for="day in days" :key="day.dateStr" class="day-row"
         :class="{ clickable: !!day.entry }"
         @click="day.entry && $emit('openEntry', day.entry.id)">
      <span class="emotion-icon">{{ day.entry ? (EMOJIS[day.entry.emotion] ?? '✦') : '' }}</span>
      <div class="info">
        <span class="name" :class="{ muted: !day.entry }">{{ day.dayName }}</span>
        <span class="date">{{ day.dateLabel }}</span>
      </div>
      <span v-if="day.entry" class="emotion-tag">{{ LABELS[day.entry.emotion] ?? day.entry.emotion }}</span>
      <span v-else class="no-entry">Sin entrada</span>
    </div>
  </div>
</template>

<style scoped>
.week-list { display: flex; flex-direction: column; gap: 0.125rem; }
.muted-msg { color: var(--color-rhema-muted); font-size: 0.875rem; padding: 1rem 0; }
.day-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.75rem 0.875rem; border-radius: var(--rhema-radius-sm);
  transition: background var(--transition-fast);
}
.day-row.clickable { cursor: pointer; }
.day-row.clickable:hover { background: var(--color-rhema-surface); }
.emotion-icon { font-size: 1.25rem; width: 28px; text-align: center; flex-shrink: 0; line-height: 1; }
.info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
.name { font-size: 0.9375rem; color: var(--color-rhema-text); font-weight: var(--fw-medium); text-transform: capitalize; }
.name.muted { color: var(--color-rhema-muted); }
.date { font-size: 0.75rem; color: var(--color-rhema-muted); }
.emotion-tag { font-size: 0.8125rem; color: var(--color-rhema-muted); text-transform: capitalize; }
.no-entry { font-size: 0.8125rem; color: var(--color-rhema-border); }
</style>
