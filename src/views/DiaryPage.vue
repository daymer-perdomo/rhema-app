<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@lucide/vue'
import { useDiary } from '@/composables/useDiary'
import { createDiary } from '@/services/diary.service'
import { useAuth } from '@/composables/useAuth'
import LifeCanvas    from '@/components/diary/LifeCanvas.vue'
import JournalWriter from '@/components/diary/JournalWriter.vue'
import BookGrid      from '@/components/diary/BookGrid.vue'

const router = useRouter()
const { user } = useAuth()
const { diaryId, hasDiary, entries, loading, loadEntries, initDiary } = useDiary()

// ─── Responsive ───────────────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 1024)
function onResize() { isMobile.value = window.innerWidth < 1024 }
onMounted(() => { window.addEventListener('resize', onResize) })
onUnmounted(() => { window.removeEventListener('resize', onResize) })

// ─── Canvas ↔ Panel sync ──────────────────────────────────────────────────
const lifeCanvasRef = ref(null)
const panelRef      = ref(null)
const activeEntryId = ref(null)
let   activeTimer   = null

function scrollToEntry(id) {
  const panel = panelRef.value
  if (!panel) return
  const el = panel.querySelector(`[data-entry-id="${id}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function activateEntry(id, duration = 1500) {
  clearTimeout(activeTimer)
  activeEntryId.value = id
  activeTimer = setTimeout(() => { activeEntryId.value = null }, duration)
}

// Canvas node clicked → highlight entry in panel
function onNodeClick(id) {
  activateEntry(id)
  scrollToEntry(id)
  if (isMobile.value) panelRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// Entry preview clicked → highlight node in canvas → navigate
function openEntry(id) {
  lifeCanvasRef.value?.highlightNode(id)
  router.push(`/diario/entrada/${id}`)
}

// ─── Journal writer ───────────────────────────────────────────────────────
const journalWriterRef = ref(null)
function openWriter() { journalWriterRef.value?.open() }
function onSaved() { /* entries reload automatically inside saveNewEntry */ }

// ─── First access: create diary inline ───────────────────────────────────
const newName    = ref('Mi Diario')
const newPwd     = ref('')
const newPwdConf = ref('')
const createErr  = ref('')
const creating   = ref(false)

async function handleCreate() {
  createErr.value = ''
  if (!newPwd.value)                     { createErr.value = 'Ingresa una contraseña.'; return }
  if (newPwd.value.length < 6)           { createErr.value = 'Mínimo 6 caracteres.'; return }
  if (newPwd.value !== newPwdConf.value) { createErr.value = 'Las contraseñas no coinciden.'; return }
  creating.value = true
  try {
    await createDiary({ name: newName.value || 'Mi Diario', password: newPwd.value })
    await loadEntries()
    nextTick(() => openWriter())
  } catch (e) {
    createErr.value = e.message
  } finally {
    creating.value = false
    newPwd.value = ''
    newPwdConf.value = ''
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await initDiary()                          // buscar diario en la nube si no está en localStorage
  if (hasDiary.value) {
    await loadEntries()
    if (!entries.value.length) nextTick(() => openWriter())
  }
})

// Si el usuario inicia sesión mientras está en esta página, re-intentar
watch(user, async (newUser) => {
  if (newUser && !hasDiary.value) {
    await initDiary()
    if (hasDiary.value) await loadEntries()
  }
})
</script>

<template>
  <div class="layout" :class="{ mobile: isMobile }">

    <!-- ══ Canvas ══════════════════════════════════════════════════════════ -->
    <div class="canvas-area">
      <LifeCanvas
        ref="lifeCanvasRef"
        :entries="entries"
        @node-click="onNodeClick"
      />
    </div>

    <!-- ══ Panel ════════════════════════════════════════════════════════════ -->
    <div ref="panelRef" class="panel">

      <!-- FIRST ACCESS: no diary yet -->
      <template v-if="!hasDiary">

        <!-- No sesión → invitar a iniciar sesión -->
        <div v-if="!user" class="create-panel">
          <span class="ornament">✦</span>
          <p class="create-quote">
            "Cada día que vives<br>merece ser recordado."
          </p>
          <p class="create-note">
            Inicia sesión para acceder a tu diario espiritual<br>
            desde cualquier dispositivo.
          </p>
          <RouterLink to="/perfil" class="create-btn create-btn--link">
            Iniciar sesión →
          </RouterLink>
        </div>

        <!-- Con sesión pero sin diario → crear -->
        <div v-else class="create-panel">
          <span class="ornament">✦</span>
          <p class="create-quote">
            "Cada día que vives<br>merece ser recordado."
          </p>
          <form class="create-form" @submit.prevent="handleCreate">
            <input v-model="newName"    type="text"     placeholder="Nombre de tu diario"  class="field" />
            <input v-model="newPwd"     type="password" placeholder="Contraseña personal"   class="field" />
            <input v-model="newPwdConf" type="password" placeholder="Confirmar contraseña"  class="field" />
            <p class="create-note">
              Tu contenido se encripta con tu contraseña.<br>Nadie más puede leer tu diario.
            </p>
            <p v-if="createErr" class="create-err">{{ createErr }}</p>
            <button type="submit" class="create-btn" :disabled="creating">
              {{ creating ? 'Creando…' : 'Crear mi diario →' }}
            </button>
          </form>
        </div>

      </template>

      <!-- HAS DIARY -->
      <template v-else>
        <!-- Header -->
        <div class="panel-header">
          <h1 class="panel-title">Mi Diario</h1>
          <button class="add-btn" @click="openWriter">
            <Plus class="w-4 h-4" />
            <span>Nueva entrada</span>
          </button>
        </div>

        <!-- Loading -->
        <p v-if="loading" class="muted-msg">Cargando entradas…</p>

        <!-- Book grid -->
        <BookGrid
          v-else
          :entries="entries"
          :active-id="activeEntryId"
          @open="openEntry"
        />
      </template>
    </div>

    <!-- ══ Journal Writer (modal, fixed) ═══════════════════════════════════ -->
    <JournalWriter ref="journalWriterRef" @saved="onSaved" />
  </div>
</template>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────────────────── */
.layout {
  display: flex;
  flex-direction: row;
  height: 100dvh;
  overflow: hidden;
}

.layout.mobile {
  flex-direction: column;
  height: auto;
  overflow: visible;
}

/* ─── Canvas area ───────────────────────────────────────────────────────── */
.canvas-area {
  flex: 1;
  min-width: 0;
  background: var(--canvas-bg, #080e18);
}

.layout.mobile .canvas-area {
  flex: none;
  max-height: 350px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ─── Panel ─────────────────────────────────────────────────────────────── */
.panel {
  width: var(--panel-width-lg, 420px);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-canvas);
  border-left: 1px solid var(--color-rhema-border);
  padding: 1.5rem 1.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.layout.mobile .panel {
  width: 100%;
  border-left: none;
  border-top: 1px solid var(--color-rhema-border);
  overflow-y: visible;
}

/* ─── First access ──────────────────────────────────────────────────────── */
.create-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1rem 0;
}

.ornament {
  color: var(--ornament-color);
  font-size: 1rem;
  letter-spacing: 0.3em;
}

.create-quote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  line-height: 1.5;
  color: var(--color-rhema-text);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.field {
  background: var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: var(--color-rhema-text);
  outline: none;
  transition: border-color var(--transition-base);
  width: 100%;
}

.field:focus { border-color: var(--color-rhema-gold); }
.field::placeholder { color: var(--color-rhema-muted); }

.create-note {
  font-size: 0.75rem;
  color: var(--color-rhema-muted);
  line-height: 1.5;
}

.create-err { font-size: 0.8125rem; color: var(--color-error); }

.create-btn {
  background: var(--color-rhema-gold);
  color: var(--color-rhema-dark);
  font-weight: var(--fw-medium);
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--rhema-radius-sm);
  border: none;
  cursor: pointer;
  transition: background var(--transition-base);
  align-self: flex-start;
}

.create-btn:hover:not(:disabled) { background: var(--color-rhema-gold-light); }
.create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.create-btn--link {
  display: inline-block;
  text-decoration: none;
  text-align: center;
}

/* ─── Panel header ──────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: var(--fw-semibold);
  color: var(--color-rhema-text);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  color: var(--color-rhema-muted);
  font-size: 0.8125rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.add-btn:hover {
  border-color: var(--color-rhema-gold);
  color: var(--color-rhema-gold);
}

.muted-msg {
  color: var(--color-rhema-muted);
  font-size: 0.875rem;
  padding: 1.5rem 0;
  text-align: center;
  flex-shrink: 0;
}


</style>
