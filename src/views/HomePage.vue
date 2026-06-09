<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Feather, ArrowUp, Menu, X, BookOpen, BookMarked, GitBranch, ChevronRight } from '@lucide/vue'
import { useWordOfGod } from '@/composables/useWordOfGod'
import { useDiary } from '@/composables/useDiary'
import { useAuth } from '@/composables/useAuth'
import { getAppConfig } from '@/services/profile.service'
import NarrativeResponse  from '@/components/bible/NarrativeResponse.vue'
import PasswordGate       from '@/components/diary/PasswordGate.vue'
import SearchingAnimation from '@/components/ui/SearchingAnimation.vue'

const route = useRoute()
const { loading, loadingStep, askWord } = useWordOfGod()
const { hasDiary, saveNewEntry } = useDiary()
const { user } = useAuth()

const showMobileNav = ref(false)

// ─── Nombre invitado ───────────────────────────────────────────────────────────
const guestName      = ref(localStorage.getItem('rhema_guest_name') || '')
const guestNameInput = ref('')
const nameInputRef   = ref(null)
const showNamePrompt = computed(() => !user.value && !guestName.value)

function saveGuestName() {
  const name = guestNameInput.value.trim()
  if (!name) { guestName.value = '_skip'; return }
  guestName.value = name
  localStorage.setItem('rhema_guest_name', name)
  guestNameInput.value = ''
}

function skipGuestName() {
  guestName.value = '_skip'
}

// ─── Post dinámico ─────────────────────────────────────────────────────────────
const postImageUrl = ref('/assets/post.webp')

onMounted(async () => {
  try {
    const url = await getAppConfig('homepage_post_url')
    if (url) postImageUrl.value = url
  } catch { /* mantener default */ }
})

// ─── Sessions ─────────────────────────────────────────────────────────────────
const sessions    = ref([])   // { id, concern, result, error, saved, saveError }
const contentRef  = ref(null)
const textareaRef = ref(null)

// ─── Writing bar ───────────────────────────────────────────────────────────────
const currentConcern = ref('')

const btnState = computed(() => {
  if (loading.value)                       return 'loading'
  if (currentConcern.value.trim().length > 5) return 'active'
  return 'idle'
})

function adjustHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

async function handleAsk() {
  const trimmed = currentConcern.value.trim()
  if (!trimmed || loading.value) return

  const id = Date.now()
  sessions.value.push({ id, concern: trimmed, result: null, error: null, saved: false, saveError: null })
  currentConcern.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'

  const { result: res, error: err } = await askWord(trimmed)

  const sess = sessions.value.find(s => s.id === id)
  if (sess) {
    sess.result = res ?? null
    sess.error  = err ?? null
  }

  await nextTick()
  scrollToLatest()
}

function scrollToLatest() {
  const el = contentRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

// ─── Save to diary ─────────────────────────────────────────────────────────────
const showSaveGate  = ref(false)
const saveTargetId  = ref(null)

function handleSave(sessionId) {
  saveTargetId.value = sessionId
  showSaveGate.value = true
}

async function onSavePassword(password) {
  showSaveGate.value = false
  const sess = sessions.value.find(s => s.id === saveTargetId.value)
  if (!sess?.result) return
  try {
    await saveNewEntry({
      password,
      rawContent: sess.concern,
      title: null,
      emotionContext: sess.result.emotionContext,
      verses:   sess.result.cards,
      narrative: { intro: sess.result.intro, cards: sess.result.cards, closing: sess.result.closing },
    })
    sess.saved = true
  } catch (err) {
    sess.saveError = 'Error al guardar: ' + err.message
  }
}

// ─── Particles (deterministic pseudo-random) ────────────────────────────────
const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id:       i,
  x:        ((i * 31 + 7)  % 88) + 6,
  y:        ((i * 47 + 13) % 87) + 6,
  size:     0.5 + (i % 5) * 0.25,
  opacity:  0.06 + (i % 7) * 0.028,
  duration: 18 + (i % 9) * 3.5,
  delay:    -(i * 0.6),
  dx:       ((i * 11 + 5) % 32) - 16,
  dy:       ((i * 7  + 3) % 28) - 14,
}))
</script>

<template>
  <main class="home-page">

    <!-- ══ CONTENT ZONE ═══════════════════════════════════════════════════════ -->
    <div ref="contentRef" class="content-zone">

      <!-- Empty state -->
      <div v-if="!sessions.length" class="empty-state">
        <!-- Ambient particles -->
        <div
          v-for="p in PARTICLES"
          :key="p.id"
          class="particle"
          :style="{
            left:      p.x + '%',
            top:       p.y + '%',
            width:     p.size + 'px',
            height:    p.size + 'px',
            opacity:   p.opacity,
            '--dur':   p.duration + 's',
            '--del':   p.delay + 's',
            '--dx':    p.dx + 'px',
            '--dy':    p.dy + 'px',
          }"
        />

        <!-- Hero image -->
        <div class="hero-image-wrap">
          <img :src="postImageUrl" alt="" class="hero-image" />
          <div class="hero-image-fade" />
        </div>

        <!-- Text content -->
        <div class="hero-body">
          <span class="empty-ornament">✦</span>
          <h1 class="empty-title">Rhema</h1>
          <p class="empty-tagline">La Palabra de Dios para tu momento de hoy</p>
          <p class="empty-description">
            Comparte lo que llevas en el corazón — una carga, una duda, un miedo,
            una gratitud — y recibe versículos bíblicos con una reflexión
            escrita especialmente para ti.
          </p>
          <div class="empty-features">
            <span class="feature-pill">📖 Consulta la Palabra</span>
            <span class="feature-pill">📔 Diario espiritual</span>
            <span class="feature-pill">🌿 Tu historia emocional</span>
          </div>
        </div>
      </div>

      <!-- Session history -->
      <template v-for="(sess, idx) in sessions" :key="sess.id">

        <div v-if="idx > 0" class="session-divider"><span>✦</span></div>

        <div class="session" :class="{ 'session-dimmed': idx < sessions.length - 1 }">

          <!-- Response (appears with transition) -->
          <Transition name="response">
            <NarrativeResponse
              v-if="sess.result"
              :intro="sess.result.intro"
              :cards="sess.result.cards"
              :closing="sess.result.closing"
              :show-save="hasDiary && !sess.saved"
              :show-reset="false"
              @save="handleSave(sess.id)"
            />
          </Transition>

          <!-- Error -->
          <div v-if="sess.error" class="session-error">
            <p>{{ sess.error }}</p>
          </div>

          <!-- Save feedback -->
          <p v-if="sess.saved" class="save-feedback save-ok">Guardado en tu diario ✦</p>
          <p v-if="sess.saveError" class="save-feedback">{{ sess.saveError }}</p>

        </div>
      </template>
    </div>

    <!-- ══ SEARCHING ANIMATION ════════════════════════════════════════════════ -->
    <Transition name="searching">
      <SearchingAnimation v-if="loading" :step="loadingStep" class="searching-layer" />
    </Transition>

    <!-- ══ NOMBRE GATE (bloquea el chat hasta que el usuario se presenta) ══════ -->
    <Transition name="name-gate">
      <div v-if="showNamePrompt" class="name-gate">
        <div class="name-gate-card">
          <span class="name-gate-ornament">✦</span>
          <p class="name-gate-heading">¿Cómo te llamas?</p>
          <p class="name-gate-sub">Así podré dirigirme a ti de manera personal</p>
          <div class="name-gate-row">
            <input
              ref="nameInputRef"
              v-model="guestNameInput"
              class="name-gate-input"
              placeholder="Tu nombre"
              maxlength="40"
              autofocus
              @keydown.enter.prevent="saveGuestName"
            />
            <button class="name-gate-btn" @click="saveGuestName">
              <ChevronRight :size="16" />
            </button>
          </div>
          <button class="name-gate-skip" @click="skipGuestName">
            Prefiero no decirlo
          </button>
        </div>
      </div>
    </Transition>

    <!-- ══ WRITING BAR ════════════════════════════════════════════════════════ -->
    <Transition name="writing-bar-reveal">
      <div v-if="!showNamePrompt" class="writing-bar">
        <div class="writing-bar-inner">
          <!-- Nav toggle — only visible on mobile -->
          <button
            class="nav-toggle-btn"
            :class="{ 'is-open': showMobileNav }"
            aria-label="Navegación"
            @click="showMobileNav = !showMobileNav"
          >
            <X v-if="showMobileNav" :size="18" />
            <Menu v-else :size="18" />
          </button>

          <textarea
            ref="textareaRef"
            v-model="currentConcern"
            placeholder="¿Qué hay en tu corazón hoy?"
            rows="1"
            :disabled="loading"
            @input="adjustHeight"
            @keydown.meta.enter.prevent="handleAsk"
            @keydown.ctrl.enter.prevent="handleAsk"
          />
          <button
            class="send-btn"
            :class="`send-${btnState}`"
            :disabled="loading || !currentConcern.trim()"
            @click="handleAsk"
          >
            <ArrowUp v-if="btnState === 'active'" class="w-5 h-5" />
            <Feather v-else class="w-5 h-5" :class="{ 'spin-slow': loading }" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- ══ MOBILE NAV PANEL ══════════════════════════════════════════════════ -->
    <Transition name="nav-panel">
      <nav v-if="showMobileNav" class="mobile-nav-panel">
        <RouterLink
          to="/"
          class="mnp-item"
          :class="{ 'mnp-active': route.path === '/' }"
          @click="showMobileNav = false"
        >
          <BookOpen :size="22" :stroke-width="1.5" />
          <span class="mnp-label">Palabra</span>
        </RouterLink>
        <RouterLink
          to="/diario"
          class="mnp-item"
          :class="{ 'mnp-active': route.path.startsWith('/diario') && !route.path.startsWith('/diario/timeline') }"
          @click="showMobileNav = false"
        >
          <BookMarked :size="22" :stroke-width="1.5" />
          <span class="mnp-label">Diario</span>
        </RouterLink>
        <RouterLink
          to="/diario/timeline"
          class="mnp-item"
          :class="{ 'mnp-active': route.path === '/diario/timeline' }"
          @click="showMobileNav = false"
        >
          <GitBranch :size="22" :stroke-width="1.5" />
          <span class="mnp-label">Camino</span>
        </RouterLink>
      </nav>
    </Transition>

    <!-- ══ PASSWORD GATE ══════════════════════════════════════════════════════ -->
    <PasswordGate
      v-if="showSaveGate"
      mode="write"
      @confirmed="onSavePassword"
      @cancelled="showSaveGate = false"
    />

  </main>
</template>

<style scoped>
/* ─── Wrapper ─────────────────────────────────────────────────────────────── */
.home-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: var(--color-bg);
}

/* ─── Content zone ────────────────────────────────────────────────────────── */
.content-zone {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 1rem;
  padding-bottom: 130px;
  position: relative;
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(225, 237, 224, 0.8);
  animation: particle-drift var(--dur) ease-in-out var(--del) infinite;
  pointer-events: none;
}

@keyframes particle-drift {
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(var(--dx), var(--dy)); }
  100% { transform: translate(0, 0); }
}

/* ─── Hero image ──────────────────────────────────────────────────────────── */
.hero-image-wrap {
  position: relative;
  width: 100%;
  height: 52vw;
  max-height: 380px;
  min-height: 200px;
  overflow: hidden;
  flex-shrink: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  display: block;
}

.hero-image-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--color-bg) 0%, transparent 30%, transparent 30%),
    linear-gradient(to top,    var(--color-bg) 0%, transparent 45%);
  pointer-events: none;
}

/* ─── Hero body ───────────────────────────────────────────────────────────── */
.hero-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
  max-width: 480px;
  margin: -2.5rem auto 0;
  pointer-events: auto;
}

.empty-ornament {
  display: block;
  color: var(--color-accent);
  font-size: 0.9rem;
  animation: pulse-ornament 3s ease-in-out infinite;
}

@keyframes pulse-ornament {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(1.15); }
}

.empty-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 2.25rem;
  font-weight: var(--fw-semibold);
  color: var(--color-text);
  line-height: 1;
  letter-spacing: 0.04em;
}

.empty-tagline {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-accent);
  opacity: 0.85;
  line-height: 1.4;
}

.empty-description {
  font-family: var(--font-prose);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.empty-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.25rem;
}

.feature-pill {
  font-size: 0.75rem;
  color: var(--color-text-soft);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* ─── Sessions ────────────────────────────────────────────────────────────── */
.session {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 3rem;
  width: 100%;
  transition: opacity 0.4s ease;
}

/* NarrativeResponse fills the session — sin re-centrar dentro */
.session :deep(.narrative) {
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.session-dimmed { opacity: 0.6; }

.session-divider {
  text-align: center;
  color: var(--color-accent);
  opacity: 0.3;
  font-size: 0.9rem;
  margin: 1.5rem 0;
}

.session-error {
  padding: 1.25rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 767px) {
  .session { padding: 1.25rem 0.75rem; }
}

.save-feedback {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  padding-bottom: 1.5rem;
}

.save-ok { color: var(--color-accent); }

/* ─── Searching layer ─────────────────────────────────────────────────────── */
.searching-layer {
  position: fixed !important;
  inset: 0;
  left: 0;
}

@media (min-width: 1024px) {
  .searching-layer { left: 220px; }
}

/* ─── Writing bar ─────────────────────────────────────────────────────────── */
.writing-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.875rem 0.625rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(
    to top,
    rgba(14, 14, 14, 1.00) 0%,
    rgba(14, 14, 14, 0.95) 70%,
    rgba(14, 14, 14, 0.00) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 50;
}

@media (min-width: 1024px) {
  .writing-bar { left: 220px; padding-left: 1.5rem; padding-right: 1.5rem; }
}

.writing-bar-inner {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 0 0.375rem;
}

.writing-bar textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0.75rem 1.125rem;
  font-family: var(--font-prose);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.5;
  resize: none;
  outline: none;
  max-height: 140px;
  overflow-y: auto;
  transition: border-color 200ms ease;
  display: block;
}

.writing-bar textarea:focus        { border-color: rgba(225, 237, 224, 0.35); }
.writing-bar textarea::placeholder { color: var(--ink-placeholder); font-style: italic; }
.writing-bar textarea:disabled     { opacity: 0.5; }

/* ─── Send button ─────────────────────────────────────────────────────────── */
.send-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 250ms ease;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
}

.send-btn.send-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg);
  box-shadow: 0 0 16px rgba(225, 237, 224, 0.3);
}

.send-btn.send-loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:disabled { cursor: not-allowed; }

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spin-slow { animation: spin-slow 3s linear infinite; }

/* ─── Transitions ─────────────────────────────────────────────────────────── */
.response-enter-active { transition: opacity 600ms ease, transform 600ms ease; }
.response-enter-from   { opacity: 0; transform: translateY(20px); }

.searching-enter-active { transition: opacity 400ms ease; }
.searching-enter-from   { opacity: 0; }
.searching-leave-active { transition: opacity 600ms ease; }
.searching-leave-to     { opacity: 0; }

/* ─── Nav toggle button (mobile only) ─────────────────────────────────────── */
.nav-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);
}
.nav-toggle-btn.is-open {
  color: var(--color-accent);
  border-color: rgba(225, 237, 224, 0.35);
}

@media (max-width: 1023px) {
  .nav-toggle-btn { display: flex; }
}

/* ─── Mobile nav panel ─────────────────────────────────────────────────────── */
.mobile-nav-panel {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: calc(72px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(14, 14, 14, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  z-index: calc(var(--z-sidebar) + 1);
}

.mnp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  height: 72px;
  padding: 10px 4px;
  color: var(--color-text-muted);
  text-decoration: none;
  position: relative;
  transition: color var(--transition-base);
}

.mnp-item.mnp-active {
  color: var(--color-accent);
}

.mnp-item.mnp-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 22%; right: 22%;
  height: 1.5px;
  background: var(--color-accent);
  border-radius: 0 0 2px 2px;
  box-shadow: 0 0 8px rgba(225, 237, 224, 0.5);
}

.mnp-label {
  font-family: var(--font-body, var(--font-sans));
  font-size: 0.6rem;
  font-weight: var(--fw-medium);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Nav panel transition */
.nav-panel-enter-active,
.nav-panel-leave-active {
  transition: transform var(--transition-base) ease, opacity var(--transition-base) ease;
}
.nav-panel-enter-from,
.nav-panel-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ─── Nombre gate ─────────────────────────────────────────────────────────── */
.name-gate {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.875rem 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(
    to top,
    rgba(14,14,14,1) 0%,
    rgba(14,14,14,0.97) 70%,
    rgba(14,14,14,0) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 50;
  display: flex;
  justify-content: center;
}

@media (min-width: 1024px) {
  .name-gate { left: 220px; }
}

.name-gate-card {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  text-align: center;
}

.name-gate-ornament {
  font-size: 0.85rem;
  color: var(--color-accent);
  opacity: 0.55;
  animation: pulse-ornament 3s ease-in-out infinite;
}

.name-gate-heading {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.2;
}

.name-gate-sub {
  font-family: var(--font-prose);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  opacity: 0.65;
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.name-gate-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.name-gate-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--color-border-light);
  border-radius: 20px;
  padding: 0.7rem 1.125rem;
  font-family: var(--font-prose);
  font-size: 1rem;
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.name-gate-input:focus {
  border-color: rgba(225,237,224,0.4);
  background: rgba(255,255,255,0.07);
}
.name-gate-input::placeholder { color: var(--color-text-muted); opacity: 0.45; font-style: italic; }

.name-gate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.name-gate-btn:hover { opacity: 0.85; }

.name-gate-skip {
  background: none;
  border: none;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.4;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: opacity var(--transition-fast);
  touch-action: manipulation;
}
.name-gate-skip:hover { opacity: 0.7; }

/* Transiciones gate */
.name-gate-enter-active { transition: opacity 350ms ease, transform 350ms cubic-bezier(0.34,1.56,0.64,1); }
.name-gate-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.name-gate-enter-from   { opacity: 0; transform: translateY(20px); }
.name-gate-leave-to     { opacity: 0; transform: translateY(10px); }

/* Writing bar aparece tras la gate */
.writing-bar-reveal-enter-active { transition: opacity 400ms ease 100ms, transform 400ms cubic-bezier(0.34,1.2,0.64,1) 100ms; }
.writing-bar-reveal-enter-from   { opacity: 0; transform: translateY(16px); }
</style>
