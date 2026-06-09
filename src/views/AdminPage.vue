<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Users, Activity, Image, Settings, ChevronRight, X,
  RefreshCw, Send, Upload, Check, AlertCircle, Edit2,
  Loader, ExternalLink, BarChart2,
} from '@lucide/vue'
import { useAdmin } from '@/composables/useAdmin'

const {
  users, statsMap, postUrl,
  loading, saving, errorMsg,
  loadAll, saveUser, resetPassword, loadUserHistory,
  savePostImage, savePostUrl,
} = useAdmin()

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'users',   label: 'Usuarios',     icon: Users    },
  { id: 'post',    label: 'Post portada', icon: Image    },
]
const activeTab = ref('users')

// ─── User table ────────────────────────────────────────────────────────────────
const search      = ref('')
const selectedUser = ref(null)
const userHistory  = ref([])
const historyLoading = ref(false)

const PLAN_LABELS  = { free: 'Gratis', basic: 'Básico', pro: 'Pro' }
const ROLE_LABELS  = { user: 'Usuario', admin: 'Admin' }
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo', cancelled: 'Cancelado', trial: 'Trial' }

const EMOTION_COLORS = {
  gratitud:'#a8c4a2', paz:'#6aaa88', tristeza:'#5a7ab0', miedo:'#7a5a9f',
  ansiedad:'#b07a50', soledad:'#6a8fa8', ira:'#b05a5a', culpa:'#7a6a50',
  duda_de_fe:'#6a7a8a', desesperanza:'#505a70', confusión:'#8a7a60', vergüenza:'#8a5a70',
}

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => u.email?.toLowerCase().includes(q))
})

const enrichedUsers = computed(() =>
  filteredUsers.value.map(u => {
    const s  = statsMap.value[u.id] ?? {}
    const topEmotion = s.emotions
      ? Object.entries(s.emotions).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null
    return { ...u, ...s, topEmotion }
  })
)

async function openUser(user) {
  selectedUser.value = { ...user, _editRole: user.role, _editPlan: user.plan, _editStatus: user.plan_status }
  historyLoading.value = true
  userHistory.value = await loadUserHistory(user.id)
  historyLoading.value = false
}

function closeUser() { selectedUser.value = null; userHistory.value = [] }

const resetFeedback  = ref('')
const saveFeedback   = ref('')

async function handleResetPassword() {
  resetFeedback.value = ''
  await resetPassword(selectedUser.value.email)
  resetFeedback.value = 'Correo enviado'
  setTimeout(() => { resetFeedback.value = '' }, 3000)
}

async function handleSaveUser() {
  const u = selectedUser.value
  await saveUser(u.id, {
    role:         u._editRole,
    plan:         u._editPlan,
    plan_status:  u._editStatus,
  })
  Object.assign(selectedUser.value, {
    role: u._editRole, plan: u._editPlan, plan_status: u._editStatus,
  })
  saveFeedback.value = 'Guardado'
  setTimeout(() => { saveFeedback.value = '' }, 2500)
}

// ─── Post image ────────────────────────────────────────────────────────────────
const fileInput    = ref(null)
const previewUrl   = ref('')
const postFeedback = ref('')
const newPostUrl   = ref('')

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  previewUrl.value = URL.createObjectURL(file)
}

async function uploadPost() {
  const file = fileInput.value?.files?.[0]
  if (!file) return
  postFeedback.value = ''
  const url = await savePostImage(file)
  previewUrl.value = ''
  postFeedback.value = 'Post actualizado'
  newPostUrl.value = url
  setTimeout(() => { postFeedback.value = '' }, 3000)
  if (fileInput.value) fileInput.value.value = ''
}

async function setUrlPost() {
  if (!newPostUrl.value.trim()) return
  await savePostUrl(newPostUrl.value.trim())
  postFeedback.value = 'URL guardada'
  setTimeout(() => { postFeedback.value = '' }, 3000)
}

// ─── Stats summary ─────────────────────────────────────────────────────────────
const totalQuestions = computed(() =>
  Object.values(statsMap.value).reduce((s, u) => s + (u.questions ?? 0), 0)
)
const totalTokens = computed(() =>
  Object.values(statsMap.value).reduce((s, u) => s + (u.tokens_total ?? 0), 0)
)
const activeUsers = computed(() =>
  users.value.filter(u => statsMap.value[u.id]?.questions > 0).length
)

onMounted(loadAll)
</script>

<template>
  <div class="admin-page">

    <!-- ══ Header ══════════════════════════════════════════════════════════════ -->
    <header class="admin-header">
      <div class="admin-header-left">
        <span class="admin-ornament">✦</span>
        <h1 class="admin-title">Panel Admin</h1>
      </div>
      <button class="refresh-btn" :disabled="loading" @click="loadAll">
        <RefreshCw :size="15" :class="{ spin: loading }" />
      </button>
    </header>

    <!-- ══ Stats bar ═══════════════════════════════════════════════════════════ -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ users.length }}</span>
        <span class="stat-label">Usuarios</span>
      </div>
      <div class="stat-sep" />
      <div class="stat-item">
        <span class="stat-value">{{ activeUsers }}</span>
        <span class="stat-label">Con actividad</span>
      </div>
      <div class="stat-sep" />
      <div class="stat-item">
        <span class="stat-value">{{ totalQuestions.toLocaleString() }}</span>
        <span class="stat-label">Preguntas</span>
      </div>
      <div class="stat-sep" />
      <div class="stat-item">
        <span class="stat-value">{{ (totalTokens / 1000).toFixed(1) }}k</span>
        <span class="stat-label">Tokens est.</span>
      </div>
    </div>

    <!-- ══ Tabs ════════════════════════════════════════════════════════════════ -->
    <nav class="tabs">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
      </button>
    </nav>

    <div v-if="errorMsg" class="admin-error">
      <AlertCircle :size="14" /> {{ errorMsg }}
    </div>

    <!-- ══ TAB: Usuarios ═══════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'users'" class="tab-content">

      <div class="table-toolbar">
        <input v-model="search" class="search-input" placeholder="Buscar por email…" />
        <span class="table-count">{{ filteredUsers.length }} usuarios</span>
      </div>

      <div class="table-wrap">
        <table class="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Plan</th>
              <th class="num-col">Preguntas</th>
              <th class="num-col">Tokens</th>
              <th>Emoción top</th>
              <th>Último acceso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="loading-row">
                <Loader :size="16" class="spin" /> Cargando…
              </td>
            </tr>
            <tr
              v-for="u in enrichedUsers"
              :key="u.id"
              class="user-row"
              @click="openUser(u)"
            >
              <td class="email-cell">
                <span class="email-text">{{ u.email }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${u.role}`">{{ ROLE_LABELS[u.role] }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${u.plan}`">{{ PLAN_LABELS[u.plan] }}</span>
              </td>
              <td class="num-col">{{ u.questions ?? 0 }}</td>
              <td class="num-col">{{ (u.tokens_total ?? 0).toLocaleString() }}</td>
              <td>
                <span
                  v-if="u.topEmotion"
                  class="emotion-chip"
                  :style="{ '--ec': EMOTION_COLORS[u.topEmotion] ?? '#555' }"
                >{{ u.topEmotion }}</span>
                <span v-else class="muted-dash">—</span>
              </td>
              <td class="date-cell">
                {{ u.last_active ? new Date(u.last_active).toLocaleDateString('es') : '—' }}
              </td>
              <td class="action-cell">
                <ChevronRight :size="14" class="chevron" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ TAB: Post portada ════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'post'" class="tab-content post-tab">

      <div class="post-section">
        <h3 class="section-title">Post actual</h3>
        <div class="post-preview">
          <img
            v-if="postUrl"
            :src="postUrl"
            alt="Post portada actual"
            class="post-preview-img"
          />
          <div v-else class="post-preview-empty">
            <Image :size="32" class="preview-empty-icon" />
            <span>Usando imagen por defecto</span>
          </div>
        </div>
      </div>

      <div class="post-section">
        <h3 class="section-title">Subir nueva imagen</h3>
        <div
          class="upload-drop"
          @click="fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden-input"
            @change="onFileChange"
          />
          <div v-if="previewUrl" class="upload-preview-wrap">
            <img :src="previewUrl" class="upload-preview-img" alt="Preview" />
          </div>
          <div v-else class="upload-placeholder">
            <Upload :size="24" />
            <span>Haz clic para seleccionar imagen</span>
            <span class="upload-hint">JPG, PNG, WebP · máx 5MB</span>
          </div>
        </div>
        <div class="upload-actions">
          <button
            class="admin-btn admin-btn--primary"
            :disabled="!previewUrl || saving"
            @click="uploadPost"
          >
            <Loader v-if="saving" :size="14" class="spin" />
            <Upload v-else :size="14" />
            Publicar imagen
          </button>
          <button
            v-if="previewUrl"
            class="admin-btn admin-btn--ghost"
            @click="previewUrl = ''; fileInput && (fileInput.value = '')"
          >
            <X :size="14" /> Cancelar
          </button>
        </div>
      </div>

      <div class="post-section">
        <h3 class="section-title">O pega una URL externa</h3>
        <div class="url-row">
          <input
            v-model="newPostUrl"
            class="url-input"
            placeholder="https://…"
          />
          <button class="admin-btn admin-btn--primary" :disabled="!newPostUrl.trim() || saving" @click="setUrlPost">
            <Check :size="14" /> Guardar URL
          </button>
        </div>
      </div>

      <p v-if="postFeedback" class="post-feedback">
        <Check :size="13" /> {{ postFeedback }}
      </p>
    </div>

    <!-- ══ Drawer: detalle usuario ════════════════════════════════════════════ -->
    <Transition name="drawer">
      <div v-if="selectedUser" class="drawer-overlay" @click.self="closeUser">
        <div class="drawer">

          <div class="drawer-header">
            <div>
              <p class="drawer-email">{{ selectedUser.email }}</p>
              <p class="drawer-meta">
                Registrado {{ new Date(selectedUser.created_at).toLocaleDateString('es') }}
              </p>
            </div>
            <button class="drawer-close" @click="closeUser"><X :size="16" /></button>
          </div>

          <!-- Stats resumen -->
          <div class="drawer-stats">
            <div class="dstat">
              <span class="dstat-val">{{ selectedUser.questions ?? 0 }}</span>
              <span class="dstat-lbl">Preguntas</span>
            </div>
            <div class="dstat">
              <span class="dstat-val">{{ selectedUser.diary_saves ?? 0 }}</span>
              <span class="dstat-lbl">Entradas diario</span>
            </div>
            <div class="dstat">
              <span class="dstat-val">{{ ((selectedUser.tokens_total ?? 0) / 1000).toFixed(1) }}k</span>
              <span class="dstat-lbl">Tokens</span>
            </div>
          </div>

          <!-- Editar rol / plan -->
          <div class="drawer-section">
            <h4 class="drawer-section-title">Editar perfil</h4>
            <div class="edit-grid">
              <div class="edit-field">
                <label class="edit-label">Rol</label>
                <select v-model="selectedUser._editRole" class="edit-select">
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="edit-field">
                <label class="edit-label">Plan</label>
                <select v-model="selectedUser._editPlan" class="edit-select">
                  <option value="free">Gratis</option>
                  <option value="basic">Básico</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div class="edit-field">
                <label class="edit-label">Estado</label>
                <select v-model="selectedUser._editStatus" class="edit-select">
                  <option value="inactive">Inactivo</option>
                  <option value="active">Activo</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
            <div class="edit-actions">
              <button class="admin-btn admin-btn--primary" :disabled="saving" @click="handleSaveUser">
                <Loader v-if="saving" :size="13" class="spin" />
                <Check v-else :size="13" />
                Guardar cambios
              </button>
              <span v-if="saveFeedback" class="feedback-ok">{{ saveFeedback }}</span>
            </div>
          </div>

          <!-- Reset contraseña -->
          <div class="drawer-section">
            <h4 class="drawer-section-title">Contraseña</h4>
            <div class="edit-actions">
              <button class="admin-btn admin-btn--outline" @click="handleResetPassword">
                <Send :size="13" />
                Enviar correo de restablecimiento
              </button>
              <span v-if="resetFeedback" class="feedback-ok">{{ resetFeedback }}</span>
            </div>
          </div>

          <!-- Historial de uso -->
          <div class="drawer-section">
            <h4 class="drawer-section-title">
              <BarChart2 :size="13" /> Historial reciente
            </h4>
            <div v-if="historyLoading" class="history-loading">
              <Loader :size="14" class="spin" />
            </div>
            <div v-else-if="!userHistory.length" class="history-empty">Sin actividad registrada</div>
            <div v-else class="history-list">
              <div v-for="(e, i) in userHistory" :key="i" class="history-item">
                <span class="history-type" :class="`type--${e.event_type}`">
                  {{ e.event_type === 'question' ? 'Pregunta' : 'Diario' }}
                </span>
                <span v-if="e.emotion" class="history-emotion">{{ e.emotion }}</span>
                <span class="history-tokens">{{ (e.tokens_input + e.tokens_output).toLocaleString() }} tok</span>
                <span class="history-date">{{ new Date(e.created_at).toLocaleDateString('es') }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ─── Page ───────────────────────────────────────────────────────────────────── */
.admin-page {
  min-height: 100dvh;
  background: var(--color-bg);
  color: var(--color-text);
  padding-bottom: 3rem;
}

/* ─── Header ─────────────────────────────────────────────────────────────────── */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem 1.75rem 0;
  max-width: 1100px;
  margin: 0 auto;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.admin-ornament {
  color: var(--color-accent);
  font-size: 0.85rem;
  opacity: 0.6;
}

.admin-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.625rem;
  font-weight: 500;
  color: var(--color-text);
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.refresh-btn:hover { color: var(--color-text); border-color: var(--color-border-light); }

/* ─── Stats bar ──────────────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 0;
  max-width: 1100px;
  margin: 1.5rem auto 0;
  padding: 0 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  gap: 0.25rem;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1;
}

.stat-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.stat-sep {
  width: 1px;
  height: 36px;
  background: var(--color-border);
}

/* ─── Tabs ───────────────────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 0.125rem;
  padding: 1.25rem 1.75rem 0;
  max-width: 1100px;
  margin: 0 auto;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-btn:hover:not(.active) { color: var(--color-text); }

/* ─── Tab content ────────────────────────────────────────────────────────────── */
.tab-content {
  max-width: 1100px;
  margin: 1.5rem auto 0;
  padding: 0 1.75rem;
}

.admin-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 1100px;
  margin: 1rem auto 0;
  padding: 0.75rem 1.75rem;
  font-size: 0.875rem;
  color: var(--color-error);
}

/* ─── Table toolbar ──────────────────────────────────────────────────────────── */
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  width: 260px;
  transition: border-color var(--transition-fast);
}
.search-input:focus { border-color: var(--color-border-light); }
.search-input::placeholder { color: var(--color-text-muted); opacity: 0.5; }

.table-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.55;
}

/* ─── Users table ────────────────────────────────────────────────────────────── */
.table-wrap {
  border: 1px solid var(--color-border);
  border-radius: var(--r-lg);
  overflow: hidden;
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table th {
  text-align: left;
  padding: 0.625rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.users-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
}

.users-table tbody tr:last-child td { border-bottom: none; }

.user-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}
.user-row:hover { background: rgba(255,255,255,0.03); }

.email-cell { max-width: 220px; }
.email-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}

.num-col { text-align: right; color: var(--color-text-muted); }

.date-cell { color: var(--color-text-muted); font-size: 0.8125rem; white-space: nowrap; }

.action-cell { width: 24px; }
.chevron { color: var(--color-text-muted); opacity: 0.4; }

.loading-row {
  text-align: center;
  padding: 2rem !important;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* ─── Badges ─────────────────────────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 0.175rem 0.5rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  border: 1px solid;
}

.badge--user    { color: var(--color-text-muted); border-color: var(--color-border); }
.badge--admin   { color: var(--color-accent); border-color: rgba(225,237,224,0.3); background: rgba(225,237,224,0.06); }
.badge--free    { color: var(--color-text-muted); border-color: var(--color-border); }
.badge--basic   { color: #b07a50; border-color: rgba(176,122,80,0.35); background: rgba(176,122,80,0.07); }
.badge--pro     { color: #7a5a9f; border-color: rgba(122,90,159,0.35); background: rgba(122,90,159,0.07); }

.emotion-chip {
  display: inline-block;
  padding: 0.175rem 0.5rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  border: 1px solid color-mix(in srgb, var(--ec) 40%, transparent);
  background: color-mix(in srgb, var(--ec) 10%, transparent);
  color: var(--ec);
}

.muted-dash { color: var(--color-text-muted); opacity: 0.3; }

/* ─── Post tab ───────────────────────────────────────────────────────────────── */
.post-tab { display: flex; flex-direction: column; gap: 2rem; max-width: 600px; }

.post-section { display: flex; flex-direction: column; gap: 0.875rem; }

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.post-preview {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
  aspect-ratio: 16/9;
  background: var(--color-surface);
}

.post-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.post-preview-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  opacity: 0.4;
}
.preview-empty-icon { opacity: 0.4; }

.upload-drop {
  border: 1px dashed var(--color-border-light);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  overflow: hidden;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-drop:hover { border-color: rgba(225,237,224,0.3); background: rgba(225,237,224,0.02); }

.hidden-input { display: none; }

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  padding: 2rem;
}
.upload-hint { font-size: 0.75rem; opacity: 0.5; }

.upload-preview-wrap { width: 100%; }
.upload-preview-img  { width: 100%; height: 200px; object-fit: cover; display: block; }

.upload-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.url-row {
  display: flex;
  gap: 0.75rem;
}
.url-input {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--r-md);
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-fast);
}
.url-input:focus { border-color: var(--color-border-light); }
.url-input::placeholder { color: var(--color-text-muted); opacity: 0.4; }

.post-feedback {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: var(--color-accent);
}

/* ─── Admin buttons ──────────────────────────────────────────────────────────── */
.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.5rem 0.875rem;
  border-radius: var(--r-md);
  border: 1px solid;
  cursor: pointer;
  transition: opacity var(--transition-fast), background var(--transition-fast);
  white-space: nowrap;
  touch-action: manipulation;
}
.admin-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.admin-btn--primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
}
.admin-btn--primary:hover:not(:disabled) { opacity: 0.85; }

.admin-btn--outline {
  background: none;
  border-color: var(--color-border-light);
  color: var(--color-text-muted);
}
.admin-btn--outline:hover:not(:disabled) { color: var(--color-text); border-color: rgba(225,237,224,0.3); }

.admin-btn--ghost {
  background: none;
  border-color: var(--color-border);
  color: var(--color-text-muted);
}
.admin-btn--ghost:hover:not(:disabled) { color: var(--color-text); }

/* ─── Drawer ─────────────────────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(4, 4, 4, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(480px, 95vw);
  height: 100%;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.drawer-email {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  word-break: break-all;
}

.drawer-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.drawer-close:hover { color: var(--color-text); border-color: var(--color-border-light); }

.drawer-stats {
  display: flex;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.dstat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.dstat-val {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text);
}

.dstat-lbl {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  opacity: 0.55;
}

.drawer-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.drawer-section:last-child { border-bottom: none; }

.drawer-section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.edit-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  opacity: 0.6;
}

.edit-select {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.6rem;
  font-size: 0.8125rem;
  color: var(--color-text);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.edit-select:focus { border-color: rgba(225,237,224,0.25); }

.edit-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.feedback-ok {
  font-size: 0.8125rem;
  color: var(--color-accent);
}

/* ─── History ────────────────────────────────────────────────────────────────── */
.history-loading, .history-empty {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  opacity: 0.55;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 260px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8125rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.history-item:last-child { border-bottom: none; }

.history-type {
  font-size: 0.6875rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid;
  white-space: nowrap;
}

.type--question {
  color: var(--color-accent);
  border-color: rgba(225,237,224,0.25);
  background: rgba(225,237,224,0.05);
}

.type--diary_save {
  color: #7a9abf;
  border-color: rgba(122,154,191,0.25);
  background: rgba(122,154,191,0.05);
}

.history-emotion {
  flex: 1;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-tokens {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  opacity: 0.5;
  white-space: nowrap;
}

.history-date {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  opacity: 0.45;
  white-space: nowrap;
}

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Drawer transition ──────────────────────────────────────────────────────── */
.drawer-enter-active { transition: transform 280ms cubic-bezier(0.32, 0, 0.15, 1); }
.drawer-leave-active { transition: transform 220ms cubic-bezier(0.32, 0, 0.67, 0); }
.drawer-enter-from,
.drawer-leave-to     { transform: translateX(100%); }

/* ─── Mobile ─────────────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .admin-header, .stats-bar, .tabs, .tab-content { padding-left: 1rem; padding-right: 1rem; }
  .stats-bar { margin-left: 1rem; margin-right: 1rem; }
  .stat-value { font-size: 1.25rem; }
  .edit-grid { grid-template-columns: 1fr 1fr; }
  .search-input { width: 100%; }
  .table-toolbar { flex-direction: column; align-items: flex-start; }
  .url-row { flex-direction: column; }
}
</style>
