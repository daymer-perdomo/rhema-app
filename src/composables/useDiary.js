import { ref, computed } from 'vue'
import { createDiary, getEntries, saveEntry, verifyPassword } from '@/services/diary.service'

const diaryId = ref(localStorage.getItem('rhema_diary_id') || null)
const hasDiary = computed(() => !!diaryId.value)
const entries = ref([])
const loading = ref(false)

export function useDiary() {
  async function create(name, password) {
    loading.value = true
    try {
      const diary = await createDiary({ name, password })
      diaryId.value = diary.id
    } finally {
      loading.value = false
    }
  }

  async function loadEntries(filters) {
    if (!diaryId.value) return
    loading.value = true
    try {
      entries.value = await getEntries(diaryId.value, filters)
    } catch {
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function saveNewEntry(data) {
    if (!diaryId.value) return
    const entry = await saveEntry({ diaryId: diaryId.value, ...data })
    await loadEntries()
    return entry
  }

  async function verify(password) {
    if (!diaryId.value) return false
    return verifyPassword(diaryId.value, password)
  }

  return { diaryId, hasDiary, entries, loading, create, loadEntries, saveNewEntry, verify }
}
