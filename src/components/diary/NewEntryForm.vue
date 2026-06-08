<script setup>
import { ref } from 'vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { useDiary } from '@/composables/useDiary'
import PasswordGate from './PasswordGate.vue'

defineProps({ diaryId: { type: String, required: true } })
const emit = defineEmits(['saved'])

const { saveNewEntry } = useDiary()

const title = ref('')
const concern = ref('')
const loading = ref(false)
const errorMsg = ref('')
const showGate = ref(false)
const pending = ref(null)

const CRISIS = 'Lo que sientes merece atención inmediata. Por favor habla con alguien de confianza.'

async function submit() {
  if (!concern.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  try {
    const emotion = await detectEmotion(concern.value)
    if (emotion.crisis || emotion.intensity === 'crisis') { errorMsg.value = CRISIS; return }

    const verses = await searchVerses(concern.value, emotion.themes ?? [])
    if (!verses?.length) { errorMsg.value = 'No encontré versículos. Intenta con otras palabras.'; return }

    const word = await generateWord(concern.value, verses, emotion)
    if (word.crisis) { errorMsg.value = word.message ?? CRISIS; return }

    pending.value = {
      rawContent: concern.value,
      title: title.value.trim() || null,
      emotionContext: emotion,
      verses,
      narrative: { intro: word.intro, cards: word.cards, closing: word.closing },
    }
    showGate.value = true
  } catch (err) {
    errorMsg.value = err.message ?? 'Ocurrió un error. Inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

async function onPassword(password) {
  showGate.value = false
  try {
    await saveNewEntry({ ...pending.value, password })
    title.value = ''
    concern.value = ''
    pending.value = null
    emit('saved')
  } catch (err) {
    errorMsg.value = 'Error al guardar: ' + err.message
  }
}
</script>

<template>
  <div class="form">
    <input v-model="title" type="text" placeholder="Título (opcional)" class="field" />
    <textarea v-model="concern" placeholder="¿Qué está pasando en tu vida hoy?"
              class="area" rows="5" />
    <p v-if="errorMsg" class="err">{{ errorMsg }}</p>
    <button class="save-btn" :disabled="loading || !concern.trim()" @click="submit">
      {{ loading ? 'Procesando...' : 'Guardar con respaldo bíblico' }}
    </button>
    <PasswordGate v-if="showGate" mode="write" :entry-title="pending?.title || 'Nueva entrada'"
                  @confirmed="onPassword" @cancelled="showGate = false" />
  </div>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 0.75rem; }
.field, .area {
  background: var(--color-rhema-dark);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm); padding: 0.625rem 1rem;
  font-size: 0.9375rem; color: var(--color-rhema-text);
  outline: none; transition: border-color var(--transition-base); width: 100%;
}
.area { resize: vertical; min-height: 120px; font-family: inherit; line-height: 1.6; }
.field:focus, .area:focus { border-color: var(--color-rhema-gold); }
.field::placeholder, .area::placeholder { color: var(--color-rhema-muted); }
.err { font-size: 0.8125rem; color: var(--color-error); }
.save-btn {
  align-self: flex-end;
  background: var(--color-rhema-gold); color: var(--color-rhema-dark);
  font-weight: var(--fw-medium); font-size: 0.875rem; padding: 0.625rem 1.25rem;
  border-radius: var(--rhema-radius-sm); border: none; cursor: pointer;
  transition: background var(--transition-base), opacity var(--transition-base);
}
.save-btn:hover:not(:disabled) { background: var(--color-rhema-gold-light); }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
