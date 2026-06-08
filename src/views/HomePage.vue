<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Feather, ArrowUp, Menu, X, BookOpen, BookMarked, GitBranch } from '@lucide/vue'
import { useWordOfGod } from '@/composables/useWordOfGod'
import { useDiary } from '@/composables/useDiary'
import NarrativeResponse  from '@/components/bible/NarrativeResponse.vue'
import PasswordGate       from '@/components/diary/PasswordGate.vue'
import SearchingAnimation from '@/components/ui/SearchingAnimation.vue'

const route = useRoute()
const { loading, error, result, askWord } = useWordOfGod()
const { hasDiary, saveNewEntry } = useDiary()

const showMobileNav = ref(false)

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

  await askWord(trimmed)

  const sess = sessions.value.find(s => s.id === id)
  if (sess) {
    sess.result = result.value ?? null
    sess.error  = error.value  ?? null
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
        <div class="empty-center">
          <span class="empty-ornament">✦</span>
          <p class="empty-text">¿Qué hay en tu<br>corazón hoy?</p>
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
      <SearchingAnimation v-if="loading" class="searching-layer" />
    </Transition>

    <!-- ══ WRITING BAR ════════════════════════════════════════════════════════ -->
    <div class="writing-bar">
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

  background-color: var(--color-rhema-dark);
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent calc(var(--writing-leading) - 1px),
      rgba(201, 168, 76, 0.025) calc(var(--writing-leading) - 1px),
      rgba(201, 168, 76, 0.025) var(--writing-leading)
    ),
    linear-gradient(rgba(201, 168, 76, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201, 168, 76, 0.02) 1px, transparent 1px);
  background-size:
    100% var(--writing-leading),
    40px 40px,
    40px 40px;
}

/* ─── Content zone ────────────────────────────────────────────────────────── */
.content-zone {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 120px;
  position: relative;
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.8);
  animation: particle-drift var(--dur) ease-in-out var(--del) infinite;
}

@keyframes particle-drift {
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(var(--dx), var(--dy)); }
  100% { transform: translate(0, 0); }
}

.empty-center {
  text-align: center;
  z-index: 1;
  position: relative;
}

.empty-ornament {
  display: block;
  color: var(--color-rhema-gold);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  animation: pulse-ornament 3s ease-in-out infinite;
}

@keyframes pulse-ornament {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%       { opacity: 0.7; transform: scale(1.15); }
}

.empty-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.5rem;
  color: var(--color-rhema-muted);
  opacity: 0.6;
  line-height: 1.6;
}

/* ─── Sessions ────────────────────────────────────────────────────────────── */
.session {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 1rem;
  transition: opacity 0.4s ease;
}

.session-dimmed { opacity: 0.6; }

.session-divider {
  text-align: center;
  color: var(--color-rhema-gold);
  opacity: 0.3;
  font-size: 0.9rem;
  margin: 2rem 0;
}

.session-error {
  max-width: 640px;
  margin: 2rem auto;
  padding: 1.25rem 1.5rem;
  background: var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  border-radius: 1rem;
  color: var(--color-rhema-muted);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.save-feedback {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-rhema-muted);
  padding-bottom: 1.5rem;
}

.save-ok { color: var(--color-rhema-gold); }

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
  padding: 0.875rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(
    to top,
    rgba(13, 13, 15, 1.00) 0%,
    rgba(13, 13, 15, 0.95) 70%,
    rgba(13, 13, 15, 0.00) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  z-index: 50;
}

.writing-bar textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-rhema-border);
  border-radius: 20px;
  padding: 0.75rem 1.125rem;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-rhema-text);
  line-height: 1.5;
  resize: none;
  outline: none;
  max-height: 140px;
  overflow-y: auto;
  transition: border-color 200ms ease;
  display: block;
}

.writing-bar textarea:focus        { border-color: rgba(201, 168, 76, 0.35); }
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
  border: 1px solid var(--color-rhema-border);
  background: transparent;
  color: var(--color-rhema-muted);
}

.send-btn.send-active {
  background: var(--color-rhema-gold);
  border-color: var(--color-rhema-gold);
  color: var(--color-rhema-dark);
  box-shadow: 0 0 16px rgba(201, 168, 76, 0.3);
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
  border: 1px solid var(--color-rhema-border);
  color: var(--color-rhema-muted);
  cursor: pointer;
  transition: color var(--transition-base), border-color var(--transition-base);
}
.nav-toggle-btn.is-open {
  color: var(--color-rhema-gold);
  border-color: rgba(201, 168, 76, 0.35);
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
  background: rgba(8, 14, 24, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-rhema-border);
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
  color: var(--color-rhema-muted);
  text-decoration: none;
  position: relative;
  transition: color var(--transition-base);
}

.mnp-item.mnp-active {
  color: var(--color-rhema-gold);
}

.mnp-item.mnp-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 22%; right: 22%;
  height: 1.5px;
  background: var(--color-rhema-gold);
  border-radius: 0 0 2px 2px;
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.5);
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
</style>
