import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { createDiary, getEntries, saveEntry, verifyPassword, findDiaryByUser } from '@/services/diary.service'
import { cacheGet, cacheSet, cacheDelete, TTL } from '@/services/cache.service'

export const useDiaryStore = defineStore('diary', () => {
  const diaryId  = ref(localStorage.getItem('rhema_diary_id') || null)
  const hasDiary = computed(() => !!diaryId.value)
  const entries  = ref([])
  const loading  = ref(false)

  // Tracks the in-flight initDiary promise and which user it was last validated for
  let _initPromise        = null
  let _validatedForUserId = null

  async function create(userId, name, password) {
    loading.value = true
    try {
      const diary = await createDiary({ name, password, userId })
      diaryId.value = diary.id
      localStorage.setItem('rhema_diary_id', diary.id)
      _initPromise        = Promise.resolve()
      _validatedForUserId = userId
    } finally {
      loading.value = false
    }
  }

  async function loadEntries(filters = {}) {
    if (!diaryId.value) return
    const noFilters = !Object.keys(filters).length
    const cacheKey  = `entries_${diaryId.value}`

    if (noFilters) {
      const cached = cacheGet(cacheKey)
      if (cached) { entries.value = cached; return }
    }

    loading.value = true
    try {
      const data = await getEntries(diaryId.value, filters)
      entries.value = data
      if (noFilters) cacheSet(cacheKey, data, TTL.diary)
    } catch {
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function saveNewEntry(userId, data) {
    // Always validate that diaryId belongs to the current user before inserting.
    // If the stored diary ID hasn't been verified for this user yet (e.g., stale
    // localStorage from a previous account, or race condition on first load),
    // run initDiary now to fetch the correct diary from the database.
    if (userId && _validatedForUserId !== userId) {
      await initDiary(userId)
    } else if (_initPromise) {
      await _initPromise
    }

    if (!diaryId.value) return

    const temp = {
      id: `temp_${diaryId.value}_${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
    }
    entries.value = [temp, ...entries.value]

    try {
      const entry = await saveEntry({ diaryId: diaryId.value, ...data })
      entries.value = entries.value.map(e => e.id === temp.id ? entry : e)
      cacheDelete(`entries_${diaryId.value}`)

      if (userId) {
        void Promise.resolve(supabase.from('usage_events').insert({
          user_id:    userId,
          event_type: 'diary_save',
          emotion:    data.emotionContext?.emotion ?? null,
        })).catch(() => {})
      }

      return entry
    } catch (err) {
      entries.value = entries.value.filter(e => e.id !== temp.id)
      throw err
    }
  }

  async function verify(password) {
    if (!diaryId.value) return false
    return verifyPassword(diaryId.value, password)
  }

  async function initDiary(userId) {
    _initPromise = (async () => {
      const found = await findDiaryByUser(userId)
      if (found) {
        diaryId.value = found.id
        localStorage.setItem('rhema_diary_id', found.id)
      } else {
        // No diary for this user — clear any stale value from a different account
        diaryId.value = null
        localStorage.removeItem('rhema_diary_id')
      }
      _validatedForUserId = userId
    })()
    await _initPromise
  }

  function reset() {
    diaryId.value       = null
    entries.value       = []
    _initPromise        = null
    _validatedForUserId = null
    localStorage.removeItem('rhema_diary_id')
  }

  return { diaryId, hasDiary, entries, loading, create, loadEntries, saveNewEntry, verify, initDiary, reset }
})
