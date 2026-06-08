import { ref } from 'vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/composables/useAuth'

const CRISIS_MESSAGE = 'Lo que sientes merece atención inmediata. Por favor habla con alguien de confianza o llama a una línea de apoyo.'

export function useWordOfGod() {
  const loading = ref(false)
  const error = ref(null)
  const result = ref(null)
  const emotionContext = ref(null)
  const crisis = ref(false)
  const { user } = useAuth()

  async function askWord(concern) {
    loading.value = true
    error.value = null
    result.value = null
    emotionContext.value = null
    crisis.value = false

    try {
      // 1. Detect emotion
      const emotion = await detectEmotion(concern)
      emotionContext.value = emotion

      // 2. Crisis check
      if (emotion.crisis || emotion.intensity === 'crisis') {
        crisis.value = true
        error.value = CRISIS_MESSAGE
        return
      }

      // 3. Search verses using themes from emotion detection
      const verses = await searchVerses(concern, emotion.themes ?? [])

      if (!verses?.length) {
        error.value = 'No encontré versículos para lo que compartiste. Intenta describir tu situación con otras palabras.'
        return
      }

      // 4. Generate word with emotion context
      const word = await generateWord(concern, verses, emotion)

      // 5. Crisis flag can also come from generate-word
      if (word.crisis) {
        crisis.value = true
        error.value = word.message ?? CRISIS_MESSAGE
        return
      }

      result.value = { ...word, emotionContext: emotion }

      if (user.value) {
        supabase.from('readings').insert({
          user_id: user.value.id,
          concern,
          emotion_context: emotion,
          intro: word.intro,
          cards: word.cards,
          closing: word.closing,
        }).then(() => {})
      }
    } catch (err) {
      error.value = err.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    result.value = null
    error.value = null
    emotionContext.value = null
    crisis.value = false
  }

  return { loading, error, result, emotionContext, crisis, askWord, reset }
}
