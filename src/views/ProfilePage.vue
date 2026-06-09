<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CircleUser, LogOut, Loader, Check } from '@lucide/vue'
import { useAuth }    from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'
import { updateFullName, getProfileStats } from '@/services/profile.service'

const router = useRouter()
const route  = useRoute()
const { user, login, register, logout } = useAuth()
const { profile, displayName, loadProfile } = useProfile()

const mode       = ref('login')
const email      = ref('')
const password   = ref('')
const loading    = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')
const isLogin    = computed(() => mode.value === 'login')
const initials   = computed(() => displayName.value?.[0]?.toUpperCase() ?? user.value?.email?.[0]?.toUpperCase() ?? '?')

// ─── Nombre ───────────────────────────────────────────────────────────────────
const nameInput    = ref('')
const nameSaving   = ref(false)
const nameFeedback = ref('')

watch(profile, p => { if (p?.full_name) nameInput.value = p.full_name }, { immediate: true })

async function saveName() {
  const val = nameInput.value.trim()
  nameSaving.value = true; nameFeedback.value = ''
  try {
    await updateFullName(val)
    if (profile.value) profile.value.full_name = val
    nameFeedback.value = 'Guardado'
    setTimeout(() => { nameFeedback.value = '' }, 2500)
  } catch { nameFeedback.value = 'Error al guardar' }
  finally  { nameSaving.value = false }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const statsLoading   = ref(false)
const questionsCount = ref(0)
const monthEntries   = ref([])

const EMOTION_ICONS = {
  tristeza:'😢', miedo:'😨', ansiedad:'😟', soledad:'😔',
  ira:'😤', culpa:'😞', duda_de_fe:'🤔', gratitud:'🙏',
  paz:'😌', desesperanza:'💔', confusión:'😵', vergüenza:'😳',
  amor:'🩷',
}
const EMOTION_LABELS = {
  tristeza:'Tristeza', miedo:'Miedo', ansiedad:'Ansiedad', soledad:'Soledad',
  ira:'Ira', culpa:'Culpa', duda_de_fe:'Duda de fe', gratitud:'Gratitud',
  paz:'Paz', desesperanza:'Desesperanza', confusión:'Confusión', vergüenza:'Vergüenza',
  amor:'Amor',
}
const EMOTION_COLORS = {
  tristeza:'#5a7ab0', miedo:'#7a5a9f', ansiedad:'#b07a50', soledad:'#6a8fa8',
  ira:'#b05a5a', culpa:'#7a6a50', duda_de_fe:'#6a7a8a', gratitud:'#a8c4a2',
  paz:'#6aaa88', desesperanza:'#505a70', confusión:'#8a7a60', vergüenza:'#8a5a70',
  amor:'#c4789a',
}
// Higher = more positive
const EMOTION_VALUE = {
  desesperanza:1, ira:1.5, tristeza:2, vergüenza:2.5, miedo:2.5,
  culpa:3, soledad:3, ansiedad:3.5, confusión:4.5, duda_de_fe:5,
  paz:8, amor:8.5, gratitud:9,
}

const totalEntries = computed(() => monthEntries.value.length)

const monthName = computed(() => {
  const s = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const memberSince = computed(() => {
  if (!profile.value?.created_at) return null
  return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(new Date(profile.value.created_at))
})

async function loadStats() {
  if (!user.value) return
  statsLoading.value = true
  try {
    const stats = await getProfileStats(user.value.id)
    if (stats) { questionsCount.value = stats.questionsCount; monthEntries.value = stats.monthEntries }
  } catch {}
  finally { statsLoading.value = false }
}

watch(user, u => { if (u) loadStats() }, { immediate: true })

// ─── Emotion timeline chart ───────────────────────────────────────────────────
//
// ViewBox 0 0 300 108:
//   emoji zone   y 0–20
//   chart area   y 20–86  (66 px, values 1–9)
//   day labels   y 98–108
//   Y-axis strip x 0–20, chart x 24–288

const CX0 = 24, CX1 = 288
const CY0 = 20, CY1 = 86

function f(n) { return n.toFixed(2) }

function valToY(v) {
  return CY1 - ((v - 1) / 8) * (CY1 - CY0)
}

// One chart point per day (multiple same-day entries → average + dominant emotion)
const chartPoints = computed(() => {
  if (!monthEntries.value.length) return []

  const byDay = {}
  for (const e of monthEntries.value) {
    if (!e.emotion) continue
    const day = parseInt(e.entry_date.split('-')[2], 10)
    if (!byDay[day]) byDay[day] = { day, emotions: [] }
    byDay[day].emotions.push(e.emotion)
  }

  const days = Object.values(byDay).sort((a, b) => a.day - b.day)
  if (!days.length) return []

  const firstDay = days[0].day
  const lastDay  = days[days.length - 1].day
  const span     = Math.max(lastDay - firstDay, 1)

  return days.map(d => {
    const values = d.emotions.map(em => EMOTION_VALUE[em] ?? 5)
    const avg    = values.reduce((s, v) => s + v, 0) / values.length
    const emotion = d.emotions.reduce((best, em) =>
      Math.abs((EMOTION_VALUE[em] ?? 5) - avg) < Math.abs((EMOTION_VALUE[best] ?? 5) - avg) ? em : best
    , d.emotions[0])
    const x = days.length === 1
      ? (CX0 + CX1) / 2
      : CX0 + ((d.day - firstDay) / span) * (CX1 - CX0)
    const y = valToY(avg)
    return { day: d.day, x, y, emotion, value: avg }
  })
})

// Per-segment Catmull-Rom bezier paths with individual gradient IDs
const svgSegments = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return []
  return pts.slice(0, -1).map((p1, i) => {
    const p0  = pts[i - 1] ?? pts[i]
    const p2  = pts[i + 1]
    const p3  = pts[i + 2] ?? pts[i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    return {
      id: `s${i}`,
      d: `M ${f(p1.x)} ${f(p1.y)} C ${f(cp1x)} ${f(cp1y)}, ${f(cp2x)} ${f(cp2y)}, ${f(p2.x)} ${f(p2.y)}`,
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      c1: EMOTION_COLORS[p1.emotion] ?? '#e1ede0',
      c2: EMOTION_COLORS[p2.emotion] ?? '#e1ede0',
    }
  })
})

// Full path for the area fill
const svgArea = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0  = pts[i - 1] ?? pts[i]
    const p1  = pts[i]
    const p2  = pts[i + 1]
    const p3  = pts[i + 2] ?? pts[i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${f(cp1x)} ${f(cp1y)}, ${f(cp2x)} ${f(cp2y)}, ${f(p2.x)} ${f(p2.y)}`
  }
  const last = pts[pts.length - 1]
  return `${d} L ${f(last.x)} ${CY1} L ${f(pts[0].x)} ${CY1} Z`
})

// Sorted entries for the list
const sortedEntries = computed(() =>
  [...monthEntries.value]
    .filter(e => e.emotion)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
)

function entryDay(dateStr) {
  return parseInt(dateStr.split('-')[2], 10)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function switchMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  errorMsg.value = ''; successMsg.value = ''; email.value = ''; password.value = ''
}

async function submit() {
  errorMsg.value = ''; successMsg.value = ''
  if (!email.value || !password.value) { errorMsg.value = 'Completa todos los campos.'; return }
  loading.value = true
  try {
    if (isLogin.value) {
      await login(email.value, password.value)
      const dest = route.query.redirect
      if (dest) router.push(dest)
    } else {
      await register(email.value, password.value)
      successMsg.value = 'Revisa tu correo para confirmar tu cuenta.'
    }
  } catch (err) { errorMsg.value = err.message }
  finally { loading.value = false }
}

async function handleLogout() { await logout() }
</script>

<template>
  <div class="profile-page">

    <!-- ══ LOGGED IN ══════════════════════════════════════════════════════════ -->
    <div v-if="user" class="profile-card">
      <span class="ornament">✦</span>

      <div class="avatar-wrap">
        <span class="avatar-initials">{{ initials }}</span>
      </div>

      <h1 class="profile-title">{{ displayName ? `Hola, ${displayName}` : 'Mi Perfil' }}</h1>
      <p class="profile-email">{{ user.email }}</p>

      <div class="divider" />

      <!-- Nombre -->
      <div class="name-section">
        <label class="name-label">Tu nombre</label>
        <div class="name-row">
          <input v-model="nameInput" class="field name-field"
                 placeholder="¿Cómo quieres que te llamemos?" maxlength="60"
                 @keydown.enter.prevent="saveName" />
          <button class="name-save-btn" :disabled="nameSaving" @click="saveName">
            <Loader v-if="nameSaving" class="spin" :size="14" />
            <Check v-else :size="14" />
          </button>
        </div>
        <p v-if="nameFeedback" class="name-feedback">{{ nameFeedback }}</p>
      </div>

      <div class="divider" />

      <!-- Stats strip -->
      <div class="stats-strip">
        <div class="stat-item">
          <span class="stat-value">{{ totalEntries }}</span>
          <span class="stat-label">entradas</span>
        </div>
        <div class="stat-sep" />
        <div class="stat-item">
          <span class="stat-value">{{ questionsCount }}</span>
          <span class="stat-label">consultas</span>
        </div>
        <template v-if="memberSince">
          <div class="stat-sep" />
          <div class="stat-item">
            <span class="stat-value stat-value--sm">{{ memberSince }}</span>
            <span class="stat-label">miembro</span>
          </div>
        </template>
      </div>

      <div class="divider" />

      <!-- ── Emotion timeline ───────────────────────────────────────────────── -->
      <div class="emotion-section">
        <div class="emotion-header">
          <span class="emotion-title">Recorrido emocional</span>
          <span class="emotion-month">{{ monthName }}</span>
        </div>

        <!-- Skeleton -->
        <div v-if="statsLoading" class="emotion-loading">
          <div class="emotion-loading-bar" />
        </div>

        <!-- Chart: 2+ distinct days -->
        <div v-else-if="chartPoints.length >= 2" class="emotion-chart-wrap">
          <svg viewBox="0 0 300 108" class="emotion-svg" overflow="visible" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="emo-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="rgba(225,237,224,0.08)" />
                <stop offset="100%" stop-color="rgba(225,237,224,0)"    />
              </linearGradient>
              <!-- One gradient per line segment, colored by emotion -->
              <linearGradient
                v-for="seg in svgSegments" :key="seg.id"
                :id="`emo-${seg.id}`"
                gradientUnits="userSpaceOnUse"
                :x1="f(seg.x1)" :y1="f(seg.y1)"
                :x2="f(seg.x2)" :y2="f(seg.y2)"
              >
                <stop offset="0%"   :stop-color="seg.c1" stop-opacity="0.9" />
                <stop offset="100%" :stop-color="seg.c2" stop-opacity="0.9" />
              </linearGradient>
            </defs>

            <!-- Y-axis: + / − labels -->
            <text x="10" y="24"
                  text-anchor="middle" font-size="10" font-weight="600"
                  fill="rgba(225,237,224,0.3)" font-family="sans-serif">+</text>
            <text x="10" y="87"
                  text-anchor="middle" font-size="10" font-weight="600"
                  fill="rgba(225,237,224,0.3)" font-family="sans-serif">−</text>

            <!-- Horizontal guide lines at top / neutral / bottom -->
            <line x1="20" :y1="f(valToY(9))" x2="292" :y2="f(valToY(9))"
                  stroke="rgba(225,237,224,0.06)" stroke-width="1" stroke-dasharray="2 5" />
            <line x1="20" :y1="f(valToY(5))" x2="292" :y2="f(valToY(5))"
                  stroke="rgba(225,237,224,0.09)" stroke-width="1" stroke-dasharray="2 5" />
            <line x1="20" :y1="f(valToY(1))" x2="292" :y2="f(valToY(1))"
                  stroke="rgba(225,237,224,0.06)" stroke-width="1" stroke-dasharray="2 5" />

            <!-- Area fill under the curve -->
            <path :d="svgArea" fill="url(#emo-area)" />

            <!-- Glow (wider, transparent stroke behind each segment) -->
            <path v-for="seg in svgSegments" :key="`g-${seg.id}`"
                  :d="seg.d" :stroke="`url(#emo-${seg.id})`"
                  stroke-width="7" stroke-linecap="round" opacity="0.13" />

            <!-- Main colored curve -->
            <path v-for="seg in svgSegments" :key="`l-${seg.id}`"
                  :d="seg.d" :stroke="`url(#emo-${seg.id})`"
                  stroke-width="1.75" stroke-linecap="round" />

            <!-- Data points + emoji + day label -->
            <g v-for="pt in chartPoints" :key="pt.day">
              <!-- Emoji above point -->
              <text :x="f(pt.x)" :y="f(pt.y - 10)"
                    text-anchor="middle" font-size="12"
                    dominant-baseline="auto">{{ EMOTION_ICONS[pt.emotion] ?? '✦' }}</text>
              <!-- Halo -->
              <circle :cx="f(pt.x)" :cy="f(pt.y)" r="7"
                      :fill="EMOTION_COLORS[pt.emotion] ?? '#e1ede0'" opacity="0.15" />
              <!-- Dot -->
              <circle :cx="f(pt.x)" :cy="f(pt.y)" r="3"
                      :fill="EMOTION_COLORS[pt.emotion] ?? '#e1ede0'"
                      stroke="rgba(0,0,0,0.5)" stroke-width="0.75" />
              <!-- Day number (X axis) -->
              <text :x="f(pt.x)" y="101"
                    text-anchor="middle" font-size="8"
                    fill="rgba(225,237,224,0.35)" font-family="sans-serif">{{ pt.day }}</text>
            </g>
          </svg>

          <!-- Entry list -->
          <ul class="entry-list">
            <li v-for="e in sortedEntries" :key="e.entry_date + e.emotion" class="entry-row">
              <span class="entry-day">{{ entryDay(e.entry_date) }}</span>
              <span class="entry-emoji">{{ EMOTION_ICONS[e.emotion] ?? '✦' }}</span>
              <span class="entry-label" :style="{ color: EMOTION_COLORS[e.emotion] }">
                {{ EMOTION_LABELS[e.emotion] ?? e.emotion }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Single day -->
        <div v-else-if="chartPoints.length === 1" class="single-point">
          <span class="single-emoji">{{ EMOTION_ICONS[chartPoints[0].emotion] ?? '✦' }}</span>
          <p class="single-text">
            {{ EMOTION_LABELS[chartPoints[0].emotion] }} · día {{ chartPoints[0].day }}
          </p>
        </div>

        <!-- Empty -->
        <p v-else class="emotion-empty">Aún no hay entradas este mes.</p>
      </div>

      <div class="divider" />

      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="16" /> Cerrar sesión
      </button>
    </div>

    <!-- ══ LOGGED OUT ═════════════════════════════════════════════════════════ -->
    <div v-else class="profile-card">
      <span class="ornament">✦</span>
      <div class="avatar-wrap">
        <CircleUser class="avatar-icon" :size="48" :stroke-width="1" />
      </div>
      <div class="auth-header">
        <h1 class="profile-title">{{ isLogin ? 'Bienvenido' : 'Crear cuenta' }}</h1>
        <p class="auth-subtitle">
          {{ isLogin ? 'Accede para guardar tu camino espiritual' : 'Guarda tus palabras recibidas' }}
        </p>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <div class="field-wrap">
          <input v-model="email" type="email" placeholder="Correo electrónico"
                 autocomplete="email" class="field" />
        </div>
        <div class="field-wrap">
          <input v-model="password" type="password" placeholder="Contraseña"
                 :autocomplete="isLogin ? 'current-password' : 'new-password'" class="field" />
        </div>
        <p v-if="errorMsg"   class="msg-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="msg-success">{{ successMsg }}</p>
        <button type="submit" class="submit-btn" :disabled="loading">
          <Loader v-if="loading" class="spin" :size="16" />
          <span>{{ isLogin ? 'Entrar' : 'Registrarme' }}</span>
        </button>
      </form>
      <div class="divider" />
      <p class="switch-text">
        {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
        <button class="switch-btn" @click="switchMode">
          {{ isLogin ? 'Regístrate' : 'Inicia sesión' }}
        </button>
      </p>
    </div>

  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100dvh;
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1.5rem;
}
.profile-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 1.25rem; width: 100%; max-width: 340px; text-align: center;
}

.ornament {
  font-size: 1rem; color: var(--color-rhema-gold); opacity: 0.45;
  animation: pulse-ornament 3s ease-in-out infinite;
}
@keyframes pulse-ornament {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%       { opacity: 0.8;  transform: scale(1.15); }
}

.avatar-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(225,237,224,0.14) 0%, transparent 100%);
  border: 1px solid var(--color-rhema-border);
  display: flex; align-items: center; justify-content: center;
}
.avatar-initials {
  font-family: var(--font-display); font-size: 1.875rem;
  font-weight: var(--fw-semibold); color: var(--color-rhema-gold); line-height: 1;
}
.avatar-icon { color: var(--color-rhema-gold); opacity: 0.75; }

.profile-title {
  font-family: var(--font-display); font-style: italic;
  font-size: 1.875rem; font-weight: var(--fw-semibold);
  color: var(--color-rhema-text); line-height: 1;
}
.profile-email { font-size: 0.875rem; color: var(--color-rhema-muted); margin-top: -0.5rem; }
.auth-header   { display: flex; flex-direction: column; gap: 0.375rem; }
.auth-subtitle { font-size: 0.8125rem; color: var(--color-rhema-muted); line-height: 1.5; margin-top: -0.5rem; }

.divider {
  width: 80px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-rhema-border), transparent);
}

.auth-form  { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
.field-wrap { width: 100%; }
.field {
  width: 100%; background: var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--color-rhema-text);
  outline: none; transition: border-color var(--transition-base); text-align: left;
}
.field:focus { border-color: var(--color-rhema-gold); }
.field::placeholder { color: var(--color-rhema-muted); }
.msg-error   { font-size: 0.8125rem; color: var(--color-error); text-align: left; width: 100%; }
.msg-success { font-size: 0.8125rem; color: #6ab58b; text-align: left; width: 100%; }
.submit-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: var(--color-rhema-gold); color: var(--color-rhema-dark);
  font-weight: var(--fw-medium); font-size: 0.9375rem;
  padding: 0.75rem 1.25rem; border-radius: var(--rhema-radius-sm);
  border: none; cursor: pointer;
  transition: background var(--transition-base), transform var(--transition-fast);
}
.submit-btn:hover:not(:disabled) { background: var(--color-rhema-gold-light); }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.switch-text { font-size: 0.8125rem; color: var(--color-rhema-muted); }
.switch-btn {
  background: none; border: none; color: var(--color-rhema-gold);
  font-size: 0.8125rem; cursor: pointer; padding: 0; margin-left: 0.25rem;
  transition: color var(--transition-fast);
}
.switch-btn:hover { color: var(--color-rhema-gold-light); }

/* Name editor */
.name-section { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; }
.name-label {
  font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-rhema-muted); opacity: 0.6; text-align: left;
}
.name-row { display: flex; gap: 0.5rem; width: 100%; }
.name-field { flex: 1; }
.name-save-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; flex-shrink: 0;
  border-radius: var(--rhema-radius-sm); border: 1px solid var(--color-rhema-gold);
  background: none; color: var(--color-rhema-gold); cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.name-save-btn:hover:not(:disabled) { background: var(--color-rhema-gold); color: var(--color-rhema-dark); }
.name-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.name-feedback { font-size: 0.75rem; color: #6ab58b; text-align: left; }

/* Stats strip */
.stats-strip {
  display: flex; align-items: center; justify-content: center;
  gap: 0.875rem; width: 100%;
}
.stat-item  { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.stat-value {
  font-family: var(--font-display); font-size: 1.375rem;
  font-weight: var(--fw-semibold); color: var(--color-rhema-text); line-height: 1;
}
.stat-value--sm { font-size: 0.9375rem; }
.stat-label {
  font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-rhema-muted); opacity: 0.6;
}
.stat-sep {
  width: 1px; height: 28px; flex-shrink: 0;
  background: linear-gradient(180deg, transparent, var(--color-rhema-border), transparent);
}

/* Emotion section */
.emotion-section { width: 100%; display: flex; flex-direction: column; gap: 0.875rem; }
.emotion-header  { display: flex; align-items: baseline; justify-content: space-between; }
.emotion-title {
  font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--color-rhema-muted); opacity: 0.6;
}
.emotion-month {
  font-family: var(--font-display); font-style: italic;
  font-size: 0.8125rem; color: var(--color-rhema-muted); opacity: 0.75;
}

/* Skeleton */
.emotion-loading { width: 100%; }
.emotion-loading-bar {
  height: 108px; border-radius: 6px; width: 100%;
  background: linear-gradient(90deg,
    rgba(225,237,224,0.04) 0%, rgba(225,237,224,0.08) 50%, rgba(225,237,224,0.04) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Chart wrap */
.emotion-chart-wrap { width: 100%; display: flex; flex-direction: column; gap: 0.875rem; }
.emotion-svg        { width: 100%; height: auto; overflow: visible; }

/* Entry list */
.entry-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column;
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  overflow: hidden;
}
.entry-row {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(225,237,224,0.05);
  transition: background var(--transition-fast);
}
.entry-row:last-child { border-bottom: none; }
.entry-row:hover      { background: rgba(225,237,224,0.03); }
.entry-day {
  font-family: var(--font-display); font-size: 0.875rem;
  color: var(--color-rhema-muted); opacity: 0.45;
  min-width: 20px; text-align: right; flex-shrink: 0;
}
.entry-emoji { font-size: 1rem; line-height: 1; flex-shrink: 0; }
.entry-label { font-size: 0.8125rem; }

/* Single point */
.single-point { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; padding: 0.75rem 0; }
.single-emoji { font-size: 2rem; line-height: 1; }
.single-text  { font-size: 0.75rem; color: var(--color-rhema-muted); opacity: 0.65; }

/* Empty */
.emotion-empty {
  font-size: 0.8125rem; color: var(--color-rhema-muted);
  opacity: 0.45; font-style: italic; text-align: center; padding: 0.75rem 0;
}

/* Logout */
.logout-btn {
  display: flex; align-items: center; gap: 0.5rem;
  background: none; border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm); color: var(--color-rhema-muted);
  font-size: 0.875rem; padding: 0.5rem 1.25rem; cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}
.logout-btn:hover { border-color: #f87171; color: #f87171; }
</style>
