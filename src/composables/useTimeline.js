import { ref } from 'vue'
import { getEntriesByRange } from '@/services/diary.service'

const EMOTION_COLORS = {
  tristeza:    'var(--emotion-tristeza)',
  miedo:       'var(--emotion-miedo)',
  ansiedad:    'var(--emotion-ansiedad)',
  soledad:     'var(--emotion-soledad)',
  ira:         'var(--emotion-ira)',
  culpa:       'var(--emotion-culpa)',
  duda_de_fe:  'var(--emotion-duda)',
  gratitud:    'var(--emotion-gratitud)',
  paz:         'var(--emotion-paz)',
  desesperanza:'var(--emotion-tristeza)',
  confusión:   'var(--emotion-duda)',
  vergüenza:   'var(--emotion-culpa)',
}

const INTENSITY_OPACITY = { leve: 0.4, moderada: 0.7, intensa: 1.0, crisis: 1.0 }

const timelineData = ref([])
const loading = ref(false)

export function useTimeline() {
  async function loadTimeline(diaryId, range) {
    if (!diaryId) return
    loading.value = true
    try {
      timelineData.value = await getEntriesByRange(diaryId, range)
    } catch {
      timelineData.value = []
    } finally {
      loading.value = false
    }
  }

  function getEmotionColor(emotion) {
    return EMOTION_COLORS[emotion] ?? 'var(--emotion-default)'
  }

  function getCellIntensity(intensity) {
    return INTENSITY_OPACITY[intensity] ?? 0.5
  }

  return { timelineData, loading, loadTimeline, getEmotionColor, getCellIntensity }
}
