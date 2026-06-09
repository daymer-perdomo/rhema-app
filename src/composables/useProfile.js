import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAuthStore } from '@/stores/useAuthStore'

export function useProfile() {
  const store     = useProfileStore()
  const authStore = useAuthStore()
  const { profile, loading, isAdmin, plan, displayName } = storeToRefs(store)

  async function loadProfile() {
    await store.load(authStore.user?.id)
  }

  return { profile, loading, isAdmin, plan, displayName, loadProfile }
}
