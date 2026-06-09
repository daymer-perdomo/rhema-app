import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const ready = ref(false)

  async function init() {
    if (ready.value) return

    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    ready.value = true
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

  return { user, ready, init, login, register, logout }
})
