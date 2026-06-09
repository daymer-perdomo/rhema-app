<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { X, Feather } from '@lucide/vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { useDiary } from '@/composables/useDiary'
import { useSession } from '@/composables/useSession'
import { useProfile } from '@/composables/useProfile'
import PasswordGate      from './PasswordGate.vue'
import NarrativeResponse from '@/components/bible/NarrativeResponse.vue'

const emit = defineEmits(['saved'])
const { saveNewEntry } = useDiary()
const { sessionPassword, setPassword } = useSession()
const { displayName } = useProfile()

// ─── State ────────────────────────────────────────────────────────────────────
const mode        = ref('idle')   // idle | writing | processing | result
const titleEl     = ref(null)
const bodyEl      = ref(null)
const overlayRef  = ref(null)
const titleText   = ref('')
const bodyText    = ref('')
const charCount   = ref(0)
const showGate    = ref(false)
const errorMsg    = ref('')
const resultWord  = ref(null)
const resultDate  = ref('')

// ─── Computed ─────────────────────────────────────────────────────────────────
const show         = computed(() => mode.value !== 'idle')
const showSeal     = computed(() => charCount.value > 15)
const isBodyEmpty  = computed(() => !bodyText.value)
const isTitleEmpty = computed(() => !titleText.value)

const wordCount = computed(() => {
  const words = bodyText.value.trim().split(/\s+/).filter(Boolean)
  return words.length
})

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

function closeResult() {
  mode.value = 'idle'
}

function afterLeave() {
  if (titleEl.value) titleEl.value.innerHTML = ''
  if (bodyEl.value)  bodyEl.value.innerHTML  = ''
  titleText.value  = ''
  bodyText.value   = ''
  charCount.value  = 0
  errorMsg.value   = ''
  resultWord.value = null
  resultDate.value = ''
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
  if (sessionPassword.value) {
    onPassword(sessionPassword.value)
  } else {
    showGate.value = true
  }
}

async function onPassword(password) {
  showGate.value = false
  mode.value = 'processing'
  errorMsg.value = ''
  setPassword(password)

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

    const word = await generateWord(bodyText.value, verses, emotion, displayName.value || undefined)
    if (word.crisis) {
      errorMsg.value = word.message ?? CRISIS; mode.value = 'writing'; return
    }

    await saveNewEntry({
      rawContent:     bodyText.value,
      title:          titleText.value || null,
      emotionContext: emotion,
      verses,
      narrative: { intro: word.intro, cards: word.cards, closing: word.closing },
      password,
    })

    resultWord.value = word
    resultDate.value = today.value
    mode.value = 'result'
    emit('saved')
  } catch (err) {
    errorMsg.value = err.message ?? 'Ocurrió un error. Inténtalo de nuevo.'
    mode.value = 'writing'
  }
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (mode.value === 'idle') return
  if (e.key === 'Escape') {
    e.preventDefault()
    if (mode.value === 'writing') close()
    if (mode.value === 'result')  closeResult()
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

      <div class="jw-page" :class="{ 'is-result': mode === 'result' }">

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

        <!-- ── WRITING mode ──────────────────────────────────────────── -->
        <template v-if="mode !== 'result'">

          <!-- Page header -->
          <div class="page-header">
            <span class="page-ornament">✦</span>
            <span class="page-date">{{ today }}</span>
            <div class="page-divider" />
          </div>

          <!-- Title field -->
          <div
            ref="titleEl"
            contenteditable="true"
            class="title-field"
            :class="{ 'is-empty': isTitleEmpty }"
            data-placeholder="Título para este momento  (opcional)"
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
            <div class="footer-left">
              <button class="close-btn" :disabled="mode === 'processing'" @click="close" aria-label="Cerrar">
                <X :size="15" />
              </button>
              <span v-if="wordCount > 0" class="word-count">{{ wordCount }} {{ wordCount === 1 ? 'palabra' : 'palabras' }}</span>
            </div>

            <Transition name="seal">
              <button v-if="showSeal" class="seal-btn" :disabled="mode === 'processing'" @click="seal">
                <Feather :size="13" />
                <span>Sellar entrada</span>
              </button>
            </Transition>
          </div>

        </template>

        <!-- ── RESULT mode ───────────────────────────────────────────── -->
        <Transition name="result-in">
          <div v-if="mode === 'result' && resultWord" class="result-view">

            <div class="result-header">
              <span class="result-ornament">✦</span>
              <span class="result-date">{{ resultDate }}</span>
              <div class="result-divider" />
            </div>

            <div class="result-scroll">
              <NarrativeResponse
                :intro="resultWord.intro"
                :cards="resultWord.cards ?? []"
                :closing="resultWord.closing"
                :show-save="false"
                :show-reset="false"
              />
            </div>

            <div class="result-footer">
              <span class="result-saved">✦ Sellado y guardado</span>
              <button class="close-btn" @click="closeResult" aria-label="Cerrar">
                <X :size="15" />
              </button>
            </div>

          </div>
        </Transition>

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
  background: rgba(6, 6, 6, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
.jw-page {
  position: relative;
  width: 100%;
  max-width: 620px;
  min-height: 68vh;
  padding: 2.5rem 3.5rem 1.75rem;
  background: #0c0c0c;
  border: 1px solid rgba(225, 237, 224, 0.09);
  border-top: 2px solid rgba(225, 237, 224, 0.2);
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(225, 237, 224, 0.03);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
}

/* Result mode: no left margin line, allow taller */
.jw-page.is-result {
  min-height: auto;
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Subtle left margin line — only while writing */
.jw-page:not(.is-result)::before {
  content: '';
  position: absolute;
  top: 3.5rem;
  bottom: 3rem;
  left: 2.75rem;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(225, 237, 224, 0.06) 10%,
    rgba(225, 237, 224, 0.06) 90%,
    transparent
  );
  pointer-events: none;
}

@media (max-width: 640px) {
  .jw-overlay {
    padding: 0;
    align-items: flex-start;
  }
  .jw-page {
    min-height: 100dvh;
    border-radius: 0;
    border-top: none;
    border-left: none;
    border-right: none;
    padding: 2rem 1.25rem 1.5rem 1.75rem;
  }
  .jw-page.is-result {
    max-height: 100dvh;
  }
  .jw-page:not(.is-result)::before {
    top: 3rem;
    bottom: 2.5rem;
    left: 1.25rem;
  }
}

/* ─── Processing overlay ─────────────────────────────────────────────────────── */
.proc-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 6, 6, 0.82);
  border-radius: 3px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.proc-ornament {
  font-size: 1.25rem;
  color: var(--color-accent);
  animation: proc-breathe 2s ease-in-out infinite;
}

.proc-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  color: var(--color-accent);
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
  background: var(--color-accent);
  animation: dot-pulse 1.2s ease-in-out infinite;
}
.proc-dot:nth-child(2) { animation-delay: 0.2s; }
.proc-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes proc-breathe {
  0%, 100% { opacity: 0.35; transform: scale(0.95); }
  50%       { opacity: 1;    transform: scale(1.1);  }
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
  gap: 0.4rem;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.page-ornament {
  font-size: 0.75rem;
  color: var(--color-accent);
  opacity: 0.45;
  letter-spacing: 0.2em;
  animation: proc-breathe 4s ease-in-out infinite;
}

.page-date {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.page-divider {
  width: 44px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(225,237,224,0.12), transparent);
  margin-top: 0.25rem;
}

/* ─── Title field ────────────────────────────────────────────────────────────── */
.title-field {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.01em;
  outline: none;
  border: none;
  background: transparent;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid rgba(225, 237, 224, 0.07);
  margin-bottom: 1.25rem;
  min-height: 1.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  transition: border-color var(--transition-base);
}

.title-field:focus-within,
.title-field:not(.is-empty) {
  border-bottom-color: rgba(225, 237, 224, 0.14);
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
  caret-color: var(--color-accent);
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
  line-height: 1.5;
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
.page-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(225, 237, 224, 0.06);
  flex-shrink: 0;
  gap: 1rem;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.word-count {
  font-size: 0.6875rem;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  opacity: 0.55;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid rgba(225, 237, 224, 0.1);
  border-radius: 50%;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  touch-action: manipulation;
}
.close-btn:hover:not(:disabled) {
  border-color: rgba(225, 237, 224, 0.25);
  color: var(--color-text);
  background: rgba(225, 237, 224, 0.04);
}
.close-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.seal-btn {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  background: rgba(225, 237, 224, 0.05);
  border: 1px solid rgba(225, 237, 224, 0.18);
  border-radius: var(--r-md);
  color: var(--color-accent);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
  padding: 0.4375rem 0.875rem;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  touch-action: manipulation;
  white-space: nowrap;
}
.seal-btn:hover:not(:disabled) {
  background: rgba(225, 237, 224, 0.1);
  border-color: rgba(225, 237, 224, 0.32);
  box-shadow: 0 0 16px rgba(225, 237, 224, 0.07);
}
.seal-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── iOS: prevent zoom ──────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .title-field { font-size: 16px; }
  .body-field  { font-size: 18px; line-height: 2rem; }
}

/* ─── Result view ────────────────────────────────────────────────────────────── */
.result-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.result-ornament {
  font-size: 0.75rem;
  color: var(--color-accent);
  opacity: 0.5;
  letter-spacing: 0.2em;
  animation: proc-breathe 4s ease-in-out infinite;
}

.result-date {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-muted);
  opacity: 0.65;
}

.result-divider {
  width: 44px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(225,237,224,0.12), transparent);
  margin-top: 0.25rem;
}

.result-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-right: 0.25rem;
  padding-bottom: 0.5rem;

  /* thin scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(225,237,224,0.1) transparent;
}
.result-scroll::-webkit-scrollbar { width: 4px; }
.result-scroll::-webkit-scrollbar-track { background: transparent; }
.result-scroll::-webkit-scrollbar-thumb { background: rgba(225,237,224,0.12); border-radius: 2px; }


.result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.25rem;
  padding-top: 0.875rem;
  border-top: 1px solid rgba(225, 237, 224, 0.06);
  flex-shrink: 0;
}

.result-saved {
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  opacity: 0.45;
}

/* ─── Overlay transition ─────────────────────────────────────────────────────── */
.jw-enter-active { transition: opacity 200ms ease; }
.jw-leave-active { transition: opacity 260ms ease-in; }
.jw-enter-from,
.jw-leave-to     { opacity: 0; }

.jw-enter-active .jw-page {
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 320ms ease;
}
.jw-leave-active .jw-page {
  transition: transform 260ms ease-in, opacity 260ms ease-in;
}
.jw-enter-from .jw-page,
.jw-leave-to   .jw-page {
  transform: scaleY(0.1);
  opacity: 0;
}

/* Seal button appear */
.seal-enter-active { transition: opacity 300ms ease, transform 300ms ease; }
.seal-leave-active { transition: opacity 150ms ease; }
.seal-enter-from   { opacity: 0; transform: translateX(6px); }
.seal-leave-to     { opacity: 0; }

/* Processing overlay */
.proc-enter-active,
.proc-leave-active { transition: opacity 200ms ease; }
.proc-enter-from,
.proc-leave-to     { opacity: 0; }

/* Result content appear */
.result-in-enter-active { transition: opacity 350ms ease 120ms, transform 350ms ease 120ms; }
.result-in-enter-from   { opacity: 0; transform: translateY(8px); }
</style>
