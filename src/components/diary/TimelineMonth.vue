<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { useDiary } from '@/composables/useDiary'
import { getEntries } from '@/services/diary.service'

const EMOJIS = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
}

const emit = defineEmits(['selectEntry'])
const { diaryId } = useDiary()

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_LABELS = ['L','M','X','J','V','S','D']

const now = new Date()
const month = ref(now.getMonth())
const year  = ref(now.getFullYear())
const data  = ref([])
const loading = ref(false)

const byDate = computed(() => {
  const m = {}
  for (const e of data.value) m[e.entry_date] = e
  return m
})

const weeks = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const last  = new Date(year.value, month.value + 1, 0)
  const startDow = (first.getDay() + 6) % 7
  const cells = Array(startDow).fill(null)
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year.value, month.value, d)
    const dateStr = date.toISOString().split('T')[0]
    cells.push({ day: d, dateStr, entry: byDate.value[dateStr] ?? null })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const w = []
  for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
  return w
})

async function reload() {
  if (!diaryId.value) return
  const start = new Date(year.value, month.value, 1).toISOString().split('T')[0]
  const end   = new Date(year.value, month.value + 1, 0).toISOString().split('T')[0]
  loading.value = true
  try { data.value = await getEntries(diaryId.value, { startDate: start, endDate: end }) }
  catch { data.value = [] }
  finally { loading.value = false }
}

function prev() { month.value === 0 ? (month.value = 11, year.value--) : month.value-- }
function next() { month.value === 11 ? (month.value = 0, year.value++) : month.value++ }

watch([month, year], reload)
onMounted(reload)
</script>

<template>
  <div class="month-cal">
    <div class="cal-header">
      <button class="nav-btn" @click="prev"><ChevronLeft class="w-4 h-4" /></button>
      <span class="cal-title">{{ MONTHS[month] }} {{ year }}</span>
      <button class="nav-btn" @click="next"><ChevronRight class="w-4 h-4" /></button>
    </div>
    <div class="day-labels">
      <span v-for="l in DAY_LABELS" :key="l">{{ l }}</span>
    </div>
    <div v-if="loading" class="muted-msg">Cargando...</div>
    <div v-else class="cal-grid">
      <div v-for="(week, wi) in weeks" :key="wi" class="cal-week">
        <div v-for="(cell, di) in week" :key="di" class="cal-cell"
             :class="{ clickable: cell?.entry }"
             @click="cell?.entry && $emit('selectEntry', cell.entry.id)">
          <template v-if="cell">
            <span class="day-num" :class="{ muted: !cell.entry }">{{ cell.day }}</span>
            <span v-if="cell.entry" class="cell-emoji">
              {{ EMOJIS[cell.entry.emotion] || '✦' }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.month-cal { max-width: 420px; margin: 0 auto; }
.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.cal-title { font-size: 1rem; font-weight: var(--fw-semibold); color: var(--color-rhema-text); }
.nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: 50%;
  background: none; border: none; color: var(--color-rhema-muted); cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.nav-btn:hover { background: var(--color-rhema-surface); color: var(--color-rhema-text); }
.day-labels { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 0.5rem; }
.day-labels span { font-size: 0.75rem; color: var(--color-rhema-muted); font-weight: var(--fw-medium); }
.muted-msg { color: var(--color-rhema-muted); font-size: 0.875rem; padding: 2rem 0; text-align: center; }
.cal-grid { display: flex; flex-direction: column; gap: 2px; }
.cal-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-cell {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 4px; border-radius: var(--rhema-radius-xs); min-height: 40px; transition: background var(--transition-fast);
}
.cal-cell.clickable { cursor: pointer; }
.cal-cell.clickable:hover { background: var(--color-rhema-surface); }
.day-num { font-size: 0.8125rem; color: var(--color-rhema-text); font-weight: var(--fw-medium); }
.day-num.muted { color: var(--color-rhema-muted); }
.cell-emoji { font-size: 0.85rem; line-height: 1; display: block; text-align: center; }
</style>
