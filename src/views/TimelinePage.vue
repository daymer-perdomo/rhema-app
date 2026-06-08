<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDiary } from '@/composables/useDiary'
import TimelineWeek  from '@/components/diary/TimelineWeek.vue'
import TimelineMonth from '@/components/diary/TimelineMonth.vue'
import TimelineYear  from '@/components/diary/TimelineYear.vue'

const router = useRouter()
const { hasDiary } = useDiary()

const active = ref('month')
const TABS = [
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes'    },
  { key: 'year',  label: 'Año'    },
]

function openEntry(id) { router.push(`/diario/entrada/${id}`) }
</script>

<template>
  <div class="page">
    <h1 class="title">Tu camino espiritual</h1>

    <div v-if="!hasDiary" class="no-diary">
      <p>Primero crea tu diario espiritual para ver tu camino.</p>
      <RouterLink to="/diario" class="link">Ir al diario →</RouterLink>
    </div>

    <template v-else>
      <div class="tabs">
        <button v-for="t in TABS" :key="t.key" class="tab"
                :class="{ active: active === t.key }" @click="active = t.key">
          {{ t.label }}
        </button>
      </div>

      <div class="content">
        <TimelineWeek  v-if="active === 'week'"  @open-entry="openEntry" />
        <TimelineMonth v-else-if="active === 'month'" @select-entry="openEntry" />
        <TimelineYear  v-else-if="active === 'year'" />
      </div>

      <p class="phrase">Cada momento vivido tiene la huella de la Palabra.</p>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: var(--content-width); margin: 0 auto; padding: 2.5rem 1.5rem; }
.title { font-size: 1.5rem; font-weight: var(--fw-semibold); color: var(--color-rhema-text); margin-bottom: 2rem; }
.no-diary { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--color-rhema-muted); padding: 4rem 0; }
.link { color: var(--color-rhema-gold); font-size: 0.875rem; text-decoration: none; }
.tabs { display: flex; border-bottom: 1px solid var(--color-rhema-border); margin-bottom: 2rem; }
.tab {
  padding: 0.625rem 1.25rem; background: none; border: none; cursor: pointer;
  font-size: 0.875rem; font-weight: var(--fw-medium); letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--color-rhema-muted); border-bottom: 2px solid transparent;
  margin-bottom: -1px; transition: color var(--transition-base), border-color var(--transition-base);
}
.tab.active { color: var(--color-rhema-gold); border-bottom-color: var(--color-rhema-gold); }
.tab:hover:not(.active) { color: var(--color-rhema-text); }
.content { min-height: 300px; }
.phrase { margin-top: 3rem; font-style: italic; font-size: 0.9375rem; color: var(--color-rhema-muted); text-align: center; }
</style>
