import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'

export function useAuth() {
  const store = useAuthStore()
  const { user } = storeToRefs(store)
  return {
    user,
    init:    store.init,
    login:   store.login,
    register: store.register,
    logout:  store.logout,
    cleanup: () => {},
  }
}
