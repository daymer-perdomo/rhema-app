<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Share2, Download, Loader } from '@lucide/vue'
import { toPng } from 'html-to-image'
import { getEntry } from '@/services/diary.service'
import { decrypt } from '@/services/crypto.service'
import { useDiary } from '@/composables/useDiary'
import { useSession } from '@/composables/useSession'
import PasswordGate    from '@/components/diary/PasswordGate.vue'
import NarrativeResponse from '@/components/bible/NarrativeResponse.vue'
import ShareCard       from '@/components/diary/ShareCard.vue'

const route  = useRoute()
const router = useRouter()
const { verify } = useDiary()
const { sessionPassword, setPassword } = useSession()

const entry     = ref(null)
const narrative = ref(null)
const rawText   = ref('')
const loading   = ref(true)
const gateError = ref('')
const unlocked  = ref(false)

onMounted(async () => {
  try {
    entry.value = await getEntry(route.params.id)
    if (sessionPassword.value) {
      await onPassword(sessionPassword.value)
    }
  } catch {
    gateError.value = 'No se encontró esta entrada.'
  } finally {
    loading.value = false
  }
})

async function onPassword(password) {
  gateError.value = ''
  const valid = await verify(password)
  if (!valid) { gateError.value = 'Contraseña incorrecta.'; return }
  const text = decrypt(entry.value.content_encrypted, password)
  if (!text) { gateError.value = 'No se pudo descifrar la entrada.'; return }
  setPassword(password)
  rawText.value   = text
  narrative.value = entry.value.narrative
  unlocked.value  = true
}

function onGateCancelled() { router.push('/diario') }

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T00:00:00').toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Share ────────────────────────────────────────────────────────────────────
const shareCardRef = ref(null)
const sharing      = ref(false)
const canShare     = typeof navigator !== 'undefined' && !!navigator.share

async function shareEntry() {
  if (!shareCardRef.value) return
  sharing.value = true
  try {
    await document.fonts.ready
    const dataUrl = await toPng(shareCardRef.value.$el, {
      pixelRatio: 3,
      cacheBust: true,
      skipAutoScale: true,
    })

    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'rhema-entrada.png', { type: 'image/png' })

    if (canShare && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files:  [file],
        title:  'Rhema — Palabra del día',
        text:   entry.value?.title || 'Mi entrada del diario espiritual',
      })
    } else {
      // Desktop fallback: download
      const a = document.createElement('a')
      a.href     = dataUrl
      a.download = 'rhema-entrada.png'
      a.click()
    }
  } catch (err) {
    if (err?.name !== 'AbortError') console.error('share error', err)
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <div class="page">
    <RouterLink to="/diario" class="back"><ArrowLeft class="w-4 h-4" /> Volver al diario</RouterLink>

    <div v-if="loading" class="muted-msg">Cargando entrada...</div>

    <template v-else-if="entry">
      <div class="entry-header">
        <p class="entry-date">{{ formatDate(entry.entry_date) }}</p>
        <div class="entry-title-row">
          <h1 class="entry-title">{{ entry.title || 'Entrada del día' }}</h1>
          <!-- Share button — only shown when entry is unlocked and has narrative -->
          <button v-if="unlocked && narrative?.cards?.length"
                  class="share-btn"
                  :disabled="sharing"
                  :aria-label="canShare ? 'Compartir entrada' : 'Descargar imagen'"
                  @click="shareEntry">
            <Loader v-if="sharing" :size="16" class="spin" />
            <Share2 v-else-if="canShare" :size="16" />
            <Download v-else :size="16" />
          </button>
        </div>
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

    <!-- Share card — rendered off-screen, captured by html-to-image -->
    <div class="share-card-offscreen" aria-hidden="true">
      <ShareCard
        v-if="entry && unlocked && narrative"
        ref="shareCardRef"
        :entry="entry"
        :raw-text="rawText"
        :narrative="narrative"
      />
    </div>
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
.entry-date   { font-size: 0.8125rem; color: var(--color-rhema-muted); text-transform: capitalize; }

.entry-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.entry-title {
  font-size: 1.5rem; font-weight: var(--fw-semibold);
  color: var(--color-rhema-text); flex: 1; min-width: 0;
}

.share-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--color-rhema-border);
  background: none;
  color: var(--color-rhema-muted);
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast),
              background var(--transition-fast);
}
.share-btn:hover:not(:disabled) {
  border-color: rgba(225, 237, 224, 0.35);
  color: var(--color-rhema-text);
  background: rgba(225, 237, 224, 0.05);
}
.share-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.emotion-badge {
  display: inline-block;
  background: rgba(225,237,224,0.1); border: 1px solid rgba(225,237,224,0.2);
  color: var(--color-rhema-gold); font-size: 0.75rem; padding: 0.25rem 0.75rem;
  border-radius: var(--rhema-radius-full); text-transform: capitalize; letter-spacing: 0.04em;
  width: fit-content;
}

.concern-block {
  background: var(--color-rhema-surface); border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
}
.concern-label { font-size: 0.75rem; color: var(--color-rhema-muted); margin-bottom: 0.5rem; }
.concern-text  { font-size: 1rem; line-height: 1.7; color: var(--color-rhema-text); }

.gate-err { color: var(--color-error); font-size: 0.8125rem; text-align: center; margin-top: 0.5rem; }

/* Card rendered off-screen for capture */
.share-card-offscreen {
  position: fixed;
  top: 0;
  left: -9999px;
  pointer-events: none;
  visibility: hidden;
}
</style>
