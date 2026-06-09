import { ref } from 'vue'
import { detectEmotion, searchVerses, generateWord } from '@/services/rhema.service'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'

const CRISIS_MESSAGE = 'Lo que sientes merece atención inmediata. Por favor habla con alguien de confianza o llama a una línea de apoyo.'

// Module-level so loading state is shared across instances
const loading     = ref(false)
const loadingStep = ref(0)   // 0=idle, 1=detectar, 2=buscar, 3=generar

export function useWordOfGod() {
  const { user } = useAuth()
  const { displayName } = useProfile()

  function resolveUserName() {
    if (user.value) return displayName.value || null
    return localStorage.getItem('rhema_guest_name') || null
  }

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
      const word = await generateWord(concern, verses, emotion, resolveUserName())

      if (word.crisis) {
        return { error: word.message ?? CRISIS_MESSAGE, crisis: true }
      }

      const finalResult = { ...word, emotionContext: emotion }

      if (user.value) {
        // Rough token estimate: ~1 token per 4 chars
        const tokensIn  = Math.round((concern.length + JSON.stringify(verses).length) / 4)
        const tokensOut = Math.round(((word.intro?.length ?? 0) + (word.closing?.length ?? 0)) / 4)

        supabase.from('readings').insert({
          user_id:         user.value.id,
          concern,
          emotion_context: emotion,
          intro:           word.intro,
          cards:           word.cards,
          closing:         word.closing,
        }).catch(() => {})

        supabase.from('usage_events').insert({
          user_id:       user.value.id,
          event_type:    'question',
          tokens_input:  tokensIn,
          tokens_output: tokensOut,
          emotion:       emotion?.emotion ?? null,
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
