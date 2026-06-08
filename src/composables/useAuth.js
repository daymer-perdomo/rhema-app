import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

const user = ref(null)
let subscription = null

export function useAuth() {
  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    subscription = data.subscription
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function register(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  function cleanup() {
    subscription?.unsubscribe()
  }

  return { user, init, login, register, logout, cleanup }
}
