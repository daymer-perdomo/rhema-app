import { ref } from 'vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/composables/useAuth'

const CRISIS_MESSAGE = 'Lo que sientes merece atención inmediata. Por favor habla con alguien de confianza o llama a una línea de apoyo.'

// Module-level so loading state is shared across instances
const loading     = ref(false)
const loadingStep = ref(0)   // 0=idle, 1=detectar, 2=buscar, 3=generar

export function useWordOfGod() {
  const { user } = useAuth()

  async function askWord(concern) {
    loading.value     = true
    loadingStep.value = 0

    try {
      loadingStep.value = 1
      const emotion = await detectEmotion(concern)

      if (emotion.crisis || emotion.intensity === 'crisis') {
        return { error: CRISIS_MESSAGE, crisis: true }
      }

      loadingStep.value = 2
      const verses = await searchVerses(concern, emotion.themes ?? [])

      if (!verses?.length) {
        return { error: 'No encontré versículos para lo que compartiste. Intenta con otras palabras.' }
      }

      loadingStep.value = 3
      const word = await generateWord(concern, verses, emotion)

      if (word.crisis) {
        return { error: word.message ?? CRISIS_MESSAGE, crisis: true }
      }

      const finalResult = { ...word, emotionContext: emotion }

      if (user.value) {
        supabase.from('readings').insert({
          user_id:         user.value.id,
          concern,
          emotion_context: emotion,
          intro:           word.intro,
          cards:           word.cards,
          closing:         word.closing,
        }).catch(() => {})
      }

      return { result: finalResult }

    } catch (err) {
      const msg = err.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.'
      return { error: msg }
    } finally {
      loading.value     = false
      loadingStep.value = 0
    }
  }

  return { loading, loadingStep, askWord }
}
