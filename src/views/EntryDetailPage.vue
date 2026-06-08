<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { getEntry } from '@/services/diary.service'
import { decrypt } from '@/services/crypto.service'
import { useDiary } from '@/composables/useDiary'
import PasswordGate from '@/components/diary/PasswordGate.vue'
import NarrativeResponse from '@/components/bible/NarrativeResponse.vue'

const route  = useRoute()
const router = useRouter()
const { verify } = useDiary()

const entry     = ref(null)
const narrative = ref(null)
const rawText   = ref('')
const loading   = ref(true)
const gateError = ref('')
const unlocked  = ref(false)

onMounted(async () => {
  try { entry.value = await getEntry(route.params.id) }
  catch { gateError.value = 'No se encontró esta entrada.' }
  finally { loading.value = false }
})

async function onPassword(password) {
  gateError.value = ''
  const valid = await verify(password)
  if (!valid) { gateError.value = 'Contraseña incorrecta.'; return }
  const text = decrypt(entry.value.content_encrypted, password)
  if (!text) { gateError.value = 'No se pudo descifrar la entrada.'; return }
  rawText.value   = text
  narrative.value = entry.value.narrative
  unlocked.value  = true
}

// Re-show gate with error preserved
function onGateCancelled() { router.push('/diario') }

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
</script>

<template>
  <div class="page">
    <RouterLink to="/diario" class="back"><ArrowLeft class="w-4 h-4" /> Volver al diario</RouterLink>

    <div v-if="loading" class="muted-msg">Cargando entrada...</div>

    <template v-else-if="entry">
      <div class="entry-header">
        <p class="entry-date">{{ formatDate(entry.entry_date) }}</p>
        <h1 class="entry-title">{{ entry.title || 'Entrada del día' }}</h1>
        <span v-if="entry.emotion" class="emotion-badge">{{ entry.emotion }}</span>
      </div>

      <div v-if="unlocked">
        <div class="concern-block">
          <p class="concern-label">Lo que escribiste</p>
          <p class="concern-text">{{ rawText }}</p>
        </div>
        <NarrativeResponse v-if="narrative?.intro"
          :intro="narrative.intro" :cards="narrative.cards" :closing="narrative.closing"
          @reset="router.push('/diario')" />
      </div>

      <PasswordGate v-else mode="read" :entry-title="entry.title || 'Entrada del día'"
                    @confirmed="onPassword" @cancelled="onGateCancelled" />
      <p v-if="gateError && !unlocked" class="gate-err">{{ gateError }}</p>
    </template>

    <p v-else class="muted-msg">{{ gateError || 'Entrada no encontrada.' }}</p>
  </div>
</template>

<style scoped>
.page { max-width: var(--content-width); margin: 0 auto; padding: 2rem 1.5rem; }
.back {
  display: inline-flex; align-items: center; gap: 0.5rem;
  color: var(--color-rhema-muted); font-size: 0.875rem; text-decoration: none;
  margin-bottom: 2rem; transition: color var(--transition-fast);
}
.back:hover { color: var(--color-rhema-text); }
.muted-msg { color: var(--color-rhema-muted); font-size: 0.9375rem; padding: 3rem 0; text-align: center; }
.entry-header { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 2rem; }
.entry-date { font-size: 0.8125rem; color: var(--color-rhema-muted); text-transform: capitalize; }
.entry-title { font-size: 1.5rem; font-weight: var(--fw-semibold); color: var(--color-rhema-text); }
.emotion-badge {
  display: inline-block;
  background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2);
  color: var(--color-rhema-gold); font-size: 0.75rem; padding: 0.25rem 0.75rem;
  border-radius: var(--rhema-radius-full); text-transform: capitalize; letter-spacing: 0.04em;
  width: fit-content;
}
.concern-block {
  background: var(--color-rhema-surface); border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
}
.concern-label { font-size: 0.75rem; color: var(--color-rhema-muted); margin-bottom: 0.5rem; }
.concern-text { font-size: 1rem; line-height: 1.7; color: var(--color-rhema-text); }
.gate-err { color: var(--color-error); font-size: 0.8125rem; text-align: center; margin-top: 0.5rem; }
</style>
