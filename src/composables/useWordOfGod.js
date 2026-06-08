import { ref } from 'vue'
import { searchVerses, generateWord } from '@/services/rhema.service'

export function useWordOfGod() {
  const loading = ref(false)
  const error = ref(null)
  const result = ref(null)

  async function askWord(concern) {
    loading.value = true
    error.value = null
    result.value = null

    try {
      const verses = await searchVerses(concern)

      if (!verses?.length) {
        error.value = 'No encontré versículos para lo que compartiste. Intenta describir tu situación con otras palabras.'
        return
      }

      result.value = await generateWord(concern, verses)
    } catch (err) {
      error.value = err.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    result.value = null
    error.value = null
  }

  return { loading, error, result, askWord, reset }
}
