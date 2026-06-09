import { storeToRefs } from 'pinia'
import { useDiaryStore } from '@/stores/useDiaryStore'
import { useAuthStore } from '@/stores/useAuthStore'

export function useDiary() {
  const store     = useDiaryStore()
  const authStore = useAuthStore()
  const { diaryId, hasDiary, entries, loading } = storeToRefs(store)

  async function create(name, password) {
    return store.create(authStore.user?.id, name, password)
  }

  async function saveNewEntry(data) {
    return store.saveNewEntry(authStore.user?.id, data)
  }

  async function initDiary() {
    return store.initDiary(authStore.user?.id)
  }

  return {
    diaryId,
    hasDiary,
    entries,
    loading,
    create,
    loadEntries: store.loadEntries,
    saveNewEntry,
    verify:      store.verify,
    initDiary,
  }
}
