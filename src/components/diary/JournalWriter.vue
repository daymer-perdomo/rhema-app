<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { X, Feather } from '@lucide/vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { useDiary } from '@/composables/useDiary'
import PasswordGate from './PasswordGate.vue'

const emit = defineEmits(['saved'])
const { saveNewEntry } = useDiary()

// ─── State ────────────────────────────────────────────────────────────────────
const mode      = ref('idle')   // idle | writing | processing
const titleEl   = ref(null)
const bodyEl    = ref(null)
const overlayRef = ref(null)
const titleText = ref('')
const bodyText  = ref('')
const charCount = ref(0)
const showGate  = ref(false)
const errorMsg  = ref('')

// ─── Computed ─────────────────────────────────────────────────────────────────
const show         = computed(() => mode.value !== 'idle')
const showSeal     = computed(() => charCount.value > 15)
const isBodyEmpty  = computed(() => !bodyText.value)
const isTitleEmpty = computed(() => !titleText.value)

const today = computed(() => {
  const str = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return str.charAt(0).toUpperCase() + str.slice(1)
})

// ─── Open / Close ─────────────────────────────────────────────────────────────
function open() {
  if (mode.value !== 'idle') return
  mode.value = 'writing'
  nextTick(() => bodyEl.value?.focus())
}

function close() {
  if (charCount.value > 0 && !confirm('¿Cerrar sin guardar? Tu texto se perderá.')) return
  mode.value = 'idle'
}

function afterLeave() {
  if (titleEl.value) titleEl.value.innerHTML = ''
  if (bodyEl.value)  bodyEl.value.innerHTML  = ''
  titleText.value = ''
  bodyText.value  = ''
  charCount.value = 0
  errorMsg.value  = ''
}

// ─── Input handlers ───────────────────────────────────────────────────────────
function onTitleInput() {
  titleText.value = titleEl.value?.innerText.trim() ?? ''
}

function onBodyInput() {
  const raw  = bodyEl.value?.innerText ?? ''
  const text = raw === '\n' ? '' : raw
  bodyText.value  = text
  charCount.value = text.replace(/[\s\n]/g, '').length
}

// ─── Seal flow ────────────────────────────────────────────────────────────────
function seal() {
  if (!bodyText.value.trim()) return
  showGate.value = true
}

async function onPassword(password) {
  showGate.value = false
  mode.value = 'processing'
  errorMsg.value = ''

  const CRISIS = 'Lo que sientes merece atención inmediata. Por favor habla con alguien de confianza.'

  try {
    const emotion = await detectEmotion(bodyText.value)
    if (emotion.crisis || emotion.intensity === 'crisis') {
      errorMsg.value = CRISIS; mode.value = 'writing'; return
    }

    const verses = await searchVerses(bodyText.value, emotion.themes ?? [])
    if (!verses?.length) {
      errorMsg.value = 'No encontré versículos. Intenta con otras palabras.'; mode.value = 'writing'; return
    }

    const word = await generateWord(bodyText.value, verses, emotion)
    if (word.crisis) {
      errorMsg.value = word.message ?? CRISIS; mode.value = 'writing'; return
    }

    await saveNewEntry({
      rawContent:    bodyText.value,
      title:         titleText.value || null,
      emotionContext: emotion,
      verses,
      narrative: { intro: word.intro, cards: word.cards, closing: word.closing },
      password,
    })

    mode.value = 'idle'
    emit('saved')
  } catch (err) {
    errorMsg.value = err.message ?? 'Ocurrió un error. Inténtalo de nuevo.'
    mode.value = 'writing'
  }
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (mode.value === 'idle') return
  if (e.key === 'Escape' && mode.value === 'writing') {
    e.preventDefault(); close()
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode.value === 'writing') {
    e.preventDefault(); seal()
  }
}

// ─── Mobile: visualViewport ───────────────────────────────────────────────────
let vvListener = null
function setupViewport() {
  if (!window.visualViewport) return
  vvListener = () => {
    const el = overlayRef.value
    if (!el) return
    const vv = window.visualViewport
    el.style.height = `${vv.height}px`
    el.style.top    = `${vv.offsetTop}px`
  }
  window.visualViewport.addEventListener('resize', vvListener)
  window.visualViewport.addEventListener('scroll', vvListener)
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  setupViewport()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (window.visualViewport && vvListener) {
    window.visualViewport.removeEventListener('resize', vvListener)
    window.visualViewport.removeEventListener('scroll', vvListener)
  }
})

defineExpose({ open })
</script>

<template>
  <Transition name="jw" :duration="{ enter: 320, leave: 260 }" @after-leave="afterLeave">
    <div v-if="show" ref="overlayRef" class="jw-overlay">

      <div class="jw-page">

        <!-- Processing overlay -->
        <Transition name="proc">
          <div v-if="mode === 'processing'" class="proc-overlay">
            <span class="proc-ornament">✦</span>
            <p class="proc-text">Buscando en la Palabra...</p>
            <div class="proc-dots">
              <span class="proc-dot" />
              <span class="proc-dot" />
              <span class="proc-dot" />
            </div>
          </div>
        </Transition>

        <!-- Page header -->
        <div class="page-header">
          <span class="page-date">{{ today }}</span>
          <div class="page-divider" />
        </div>

        <!-- Title field -->
        <div
          ref="titleEl"
          contenteditable="true"
          class="title-field"
          :class="{ 'is-empty': isTitleEmpty }"
          data-placeholder="Un título para este momento  (opcional)"
          role="textbox"
          aria-label="Título de la entrada"
          @input="onTitleInput"
          @keydown.enter.prevent
        />

        <!-- Body field -->
        <div
          ref="bodyEl"
          contenteditable="true"
          class="body-field"
          :class="{ 'is-empty': isBodyEmpty }"
          data-placeholder="Escribe lo que hay en tu corazón..."
          role="textbox"
          aria-label="Contenido de la entrada"
          aria-multiline="true"
          @input="onBodyInput"
        />

        <!-- Error -->
        <p v-if="errorMsg" class="err-msg">{{ errorMsg }}</p>

        <!-- Footer -->
        <div class="page-footer">
          <button class="close-btn" :disabled="mode === 'processing'" @click="close">
            <X class="w-4 h-4" />
          </button>
          <Transition name="seal">
            <button v-if="showSeal" class="seal-btn" :disabled="mode === 'processing'" @click="seal">
              <Feather class="w-3.5 h-3.5" />
              <span>Sellar esta entrada</span>
            </button>
          </Transition>
        </div>

      </div>
    </div>
  </Transition>

  <!-- Password gate rendered at the same level to avoid z-index issues -->
  <PasswordGate
    v-if="showGate"
    mode="write"
    :entry-title="titleText || 'Nueva entrada'"
    @confirmed="onPassword"
    @cancelled="showGate = false"
  />
</template>

<style scoped>
/* ─── Overlay ────────────────────────────────────────────────────────────────── */
.jw-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}

/* ─── Page (pergamino) ───────────────────────────────────────────────────────── */
.jw-page {
  position: relative;
  width: 100%;
  max-width: 640px;
  min-height: 70vh;
  padding: 3rem 3.5rem;
  background: var(--page-bg);
  border: 1px solid var(--page-border);
  box-shadow: var(--page-shadow);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .jw-overlay {
    padding: 0;
    align-items: flex-start;
  }
  .jw-page {
    min-height: 100dvh;
    border-radius: 0;
    padding: 2.5rem 1.5rem 2rem;
  }
}

/* ─── Processing overlay ─────────────────────────────────────────────────────── */
.proc-overlay {
  position: absolute;
  inset: 0;
  background: var(--color-overlay-light);
  border-radius: 2px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.proc-ornament {
  font-size: 1.25rem;
  color: var(--color-rhema-gold);
  animation: proc-breathe 2s ease-in-out infinite;
}

.proc-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  color: var(--color-rhema-gold);
  opacity: 0.9;
}

.proc-dots {
  display: flex;
  gap: 0.5rem;
}

.proc-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-rhema-gold);
  animation: dot-pulse 1.2s ease-in-out infinite;
}
.proc-dot:nth-child(2) { animation-delay: 0.2s; }
.proc-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes proc-breathe {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1;   }
}
@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.2;  transform: scale(0.8); }
  30%           { opacity: 1;    transform: scale(1);   }
}

/* ─── Page header ────────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.page-date {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-rhema-gold);
  opacity: 0.7;
}

.page-divider {
  width: 40px;
  height: 1px;
  background: var(--page-border);
  margin-top: 1rem;
}

/* ─── Title field ────────────────────────────────────────────────────────────── */
.title-field {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-rhema-text);
  letter-spacing: 0.02em;
  outline: none;
  border: none;
  background: transparent;
  margin-bottom: 1.5rem;
  min-height: 1.25em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.title-field.is-empty::before {
  content: attr(data-placeholder);
  color: var(--ink-placeholder);
  font-style: italic;
  pointer-events: none;
  display: block;
}

/* ─── Body field ─────────────────────────────────────────────────────────────── */
.body-field {
  font-family: var(--font-display);
  font-size: var(--writing-size);
  line-height: var(--writing-leading);
  color: var(--ink-color);
  caret-color: var(--color-rhema-gold);
  outline: none;
  border: none;
  background-color: transparent;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(var(--writing-leading) - 1px),
    var(--page-line) calc(var(--writing-leading) - 1px),
    var(--page-line) var(--writing-leading)
  );
  background-position-y: 0.35rem;
  width: 100%;
  min-height: 220px;
  flex: 1;
}

.body-field.is-empty::before {
  content: attr(data-placeholder);
  color: var(--ink-placeholder);
  font-style: italic;
  pointer-events: none;
  display: block;
  line-height: var(--writing-leading);
}

/* ─── Error ──────────────────────────────────────────────────────────────────── */
.err-msg {
  font-size: 0.8125rem;
  color: var(--color-error);
  margin-top: 1rem;
  flex-shrink: 0;
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
.page-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.25rem;
  flex-shrink: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-rhema-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color var(--transition-fast);
}
.close-btn:hover:not(:disabled) { color: var(--color-rhema-text); }
.close-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.seal-btn {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  background: none;
  border: none;
  color: var(--color-rhema-gold);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  padding: 0;
}
.seal-btn:hover:not(:disabled) { opacity: 0.75; }
.seal-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── Overlay transition ─────────────────────────────────────────────────────── */
.jw-enter-active { transition: opacity 200ms ease; }
.jw-leave-active { transition: opacity 260ms ease-in; }
.jw-enter-from,
.jw-leave-to     { opacity: 0; }

/* Page scale within overlay transition */
.jw-enter-active .jw-page {
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity   320ms ease;
}
.jw-leave-active .jw-page {
  transition: transform 260ms ease-in,
              opacity   260ms ease-in;
}
.jw-enter-from .jw-page,
.jw-leave-to   .jw-page {
  transform: scaleY(0.1);
  opacity: 0;
}

/* Seal button appear transition */
.seal-enter-active { transition: opacity 300ms ease, transform 300ms ease; }
.seal-leave-active { transition: opacity 150ms ease; }
.seal-enter-from   { opacity: 0; transform: translateY(4px); }
.seal-leave-to     { opacity: 0; }

/* Processing overlay transition */
.proc-enter-active,
.proc-leave-active { transition: opacity 200ms ease; }
.proc-enter-from,
.proc-leave-to     { opacity: 0; }
</style>
