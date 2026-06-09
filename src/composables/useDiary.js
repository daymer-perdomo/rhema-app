import { ref, computed } from 'vue'
import { createDiary, getEntries, saveEntry, verifyPassword, findDiaryByUser } from '@/services/diary.service'
import { supabase } from '@/services/supabase'

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
    // Log diary save usage event (fire-and-forget)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      supabase.from('usage_events').insert({
        user_id:    user.id,
        event_type: 'diary_save',
        emotion:    data.emotionContext?.emotion ?? null,
      }).catch(() => {})
    }
    return entry
  }

  async function verify(password) {
    if (!diaryId.value) return false
    return verifyPassword(diaryId.value, password)
  }

  async function initDiary() {
    const found = await findDiaryByUser()
    if (found) {
      diaryId.value = found.id
      localStorage.setItem('rhema_diary_id', found.id)
    }
  }

  return { diaryId, hasDiary, entries, loading, create, loadEntries, saveNewEntry, verify, initDiary }
}
