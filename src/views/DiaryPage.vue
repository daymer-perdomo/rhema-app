<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Eye, EyeOff, BookOpen, Lock } from '@lucide/vue'
import { useDiary } from '@/composables/useDiary'
import { useAuth } from '@/composables/useAuth'
import LifeCanvas    from '@/components/diary/LifeCanvas.vue'
import JournalWriter from '@/components/diary/JournalWriter.vue'
import BookGrid      from '@/components/diary/BookGrid.vue'

const router = useRouter()
const { user } = useAuth()
const { diaryId, hasDiary, entries, loading, create, loadEntries, initDiary } = useDiary()

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
const showPwd    = ref(false)
const showConf   = ref(false)

async function handleCreate() {
  createErr.value = ''
  if (!newPwd.value)                     { createErr.value = 'Ingresa una contraseña.'; return }
  if (newPwd.value.length < 6)           { createErr.value = 'Mínimo 6 caracteres.'; return }
  if (newPwd.value !== newPwdConf.value) { createErr.value = 'Las contraseñas no coinciden.'; return }
  creating.value = true
  try {
    await create(newName.value || 'Mi Diario', newPwd.value)
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
          <div class="cp-header">
            <div class="cp-icon-wrap">
              <div class="cp-icon-ring" />
              <BookOpen :size="20" class="cp-icon" />
            </div>
            <h2 class="cp-title">Tu diario espiritual</h2>
            <p class="cp-quote">"Cada día que vives merece ser recordado."</p>
          </div>
          <div class="cp-divider" />
          <p class="cp-access-note">
            Inicia sesión para acceder a tu diario espiritual desde cualquier dispositivo.
          </p>
          <RouterLink to="/perfil" class="create-btn--link">
            Iniciar sesión
          </RouterLink>
        </div>

        <!-- Con sesión pero sin diario → crear -->
        <div v-else class="create-panel">

          <!-- Header -->
          <div class="cp-header">
            <div class="cp-icon-wrap">
              <div class="cp-icon-ring" />
              <BookOpen :size="20" class="cp-icon" />
            </div>
            <h2 class="cp-title">Tu diario espiritual</h2>
            <p class="cp-quote">"Cada día que vives merece ser recordado."</p>
          </div>

          <div class="cp-divider" />

          <!-- Form -->
          <form class="create-form" @submit.prevent="handleCreate">

            <div class="cp-field-group">
              <label class="cp-label">Nombre del diario</label>
              <input
                v-model="newName"
                type="text"
                placeholder="Mi Diario"
                class="cp-input"
                autocomplete="off"
              />
            </div>

            <div class="cp-field-group">
              <label class="cp-label">Contraseña personal</label>
              <div class="cp-input-wrap">
                <input
                  v-model="newPwd"
                  :type="showPwd ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres"
                  class="cp-input"
                  autocomplete="new-password"
                />
                <button type="button" class="cp-eye" tabindex="-1" @click="showPwd = !showPwd">
                  <EyeOff v-if="showPwd" :size="14" />
                  <Eye    v-else         :size="14" />
                </button>
              </div>
            </div>

            <div class="cp-field-group">
              <label class="cp-label">Confirmar contraseña</label>
              <div class="cp-input-wrap">
                <input
                  v-model="newPwdConf"
                  :type="showConf ? 'text' : 'password'"
                  placeholder="Repite tu contraseña"
                  class="cp-input"
                  autocomplete="new-password"
                />
                <button type="button" class="cp-eye" tabindex="-1" @click="showConf = !showConf">
                  <EyeOff v-if="showConf" :size="14" />
                  <Eye    v-else          :size="14" />
                </button>
              </div>
            </div>

            <!-- Security note -->
            <div class="cp-security">
              <Lock :size="12" class="cp-security-icon" />
              <p class="cp-security-text">
                Todo se cifra con tu contraseña. Si la pierdes, no podremos recuperar tus entradas.
              </p>
            </div>

            <p v-if="createErr" class="create-err">{{ createErr }}</p>

            <button type="submit" class="cp-btn" :disabled="creating">
              {{ creating ? 'Creando tu diario…' : 'Crear mi diario' }}
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
  gap: 1.25rem;
  padding: 0.5rem 0 1.5rem;
}

/* Header */
.cp-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.cp-icon-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cp-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(225, 237, 224, 0.14);
  background: rgba(225, 237, 224, 0.05);
}

.cp-icon {
  position: relative;
  color: var(--color-accent);
  opacity: 0.8;
}

.cp-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.2;
}

.cp-quote {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.cp-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(225,237,224,0.1), transparent);
}

/* Form */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.cp-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

.cp-label {
  font-size: 0.6875rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.cp-input-wrap {
  position: relative;
  width: 100%;
}

.cp-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(225, 237, 224, 0.1);
  border-radius: var(--r-md);
  padding: 0.6875rem 2.5rem 0.6875rem 0.875rem;
  font-size: 16px;
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-base), background var(--transition-base);
}

/* When input is not inside a wrap (no eye button) remove right padding */
.cp-field-group > .cp-input {
  padding-right: 0.875rem;
}

.cp-input:focus {
  border-color: rgba(225, 237, 224, 0.26);
  background: rgba(255, 255, 255, 0.05);
}

.cp-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.45;
}

.cp-eye {
  position: absolute;
  right: 0.6875rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  opacity: 0.45;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: opacity var(--transition-fast);
  touch-action: manipulation;
}
.cp-eye:hover { opacity: 1; }

/* Security note */
.cp-security {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: rgba(225, 237, 224, 0.02);
  border-left: 2px solid rgba(225, 237, 224, 0.1);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

.cp-security-icon {
  color: var(--color-accent);
  opacity: 0.45;
  flex-shrink: 0;
  margin-top: 1px;
}

.cp-security-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  line-height: 1.6;
}

.create-err {
  font-size: 0.8125rem;
  color: var(--color-error);
  line-height: 1.4;
}

.cp-btn {
  width: 100%;
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: var(--fw-medium);
  font-size: 0.9375rem;
  padding: 0.75rem;
  border-radius: var(--r-md);
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast), box-shadow var(--transition-fast);
  touch-action: manipulation;
  margin-top: 0.25rem;
}
.cp-btn:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 4px 20px rgba(225, 237, 224, 0.1);
}
.cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* "Login link" state */
.create-btn--link {
  display: inline-block;
  text-decoration: none;
  text-align: center;
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: var(--fw-medium);
  font-size: 0.9375rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--r-md);
  transition: opacity var(--transition-fast);
}
.create-btn--link:hover { opacity: 0.88; }

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

.cp-access-note {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.muted-msg {
  color: var(--color-rhema-muted);
  font-size: 0.875rem;
  padding: 1.5rem 0;
  text-align: center;
  flex-shrink: 0;
}


</style>
