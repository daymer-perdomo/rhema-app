import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { getMyProfile, updateFullName } from '@/services/profile.service'

const profile = ref(null)
const loading  = ref(false)

export function useProfile() {
  const isAdmin     = computed(() => profile.value?.role === 'admin')
  const plan        = computed(() => profile.value?.plan ?? 'free')
  const displayName = computed(() => {
    if (!profile.value) return null
    if (profile.value.full_name?.trim()) return profile.value.full_name.trim()
    // fallback: email prefix before @ or first dot
    const prefix = profile.value.email?.split('@')[0] ?? ''
    return prefix.split('.')[0] || null
  })

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { profile.value = null; return }
    loading.value = true
    try {
      profile.value = await getMyProfile()

      // Si el perfil no tiene nombre y el usuario había dado su nombre como invitado,
      // guardarlo en la DB y limpiar el localStorage
      const guestName = localStorage.getItem('rhema_guest_name')
      if (guestName && guestName !== '_skip' && !profile.value?.full_name?.trim()) {
        await updateFullName(guestName)
        profile.value.full_name = guestName
        localStorage.removeItem('rhema_guest_name')
      }
    } catch {
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') profile.value = null
    if (event === 'SIGNED_IN')  loadProfile()
  })

  return { profile, isAdmin, plan, displayName, loading, loadProfile }
}
