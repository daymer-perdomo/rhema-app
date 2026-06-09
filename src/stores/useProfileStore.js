import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMyProfile, updateFullName } from '@/services/profile.service'
import { cacheGet, cacheSet, cacheDelete, TTL } from '@/services/cache.service'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const loading = ref(false)

  const isAdmin     = computed(() => profile.value?.role === 'admin')
  const plan        = computed(() => profile.value?.plan ?? 'free')
  const displayName = computed(() => {
    if (!profile.value) return null
    if (profile.value.full_name?.trim()) return profile.value.full_name.trim()
    const prefix = profile.value.email?.split('@')[0] ?? ''
    return prefix.split('.')[0] || null
  })

  async function load(userId) {
    if (!userId) { profile.value = null; return }

    const cached = cacheGet(`profile_${userId}`)
    if (cached) { profile.value = cached; return }

    loading.value = true
    try {
      const data = await getMyProfile()

      const guestName = localStorage.getItem('rhema_guest_name')
      if (guestName && guestName !== '_skip' && !data?.full_name?.trim()) {
        await updateFullName(guestName)
        if (data) data.full_name = guestName
        localStorage.removeItem('rhema_guest_name')
      }

      profile.value = data
      if (data) cacheSet(`profile_${userId}`, data, TTL.profile)
    } catch {
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  function clear(userId) {
    if (userId) cacheDelete(`profile_${userId}`)
    profile.value = null
  }

  return { profile, loading, isAdmin, plan, displayName, load, clear }
})
