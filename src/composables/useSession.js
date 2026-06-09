import { ref } from 'vue'

// Persiste mientras la pestaña está abierta; se borra al recargar
const sessionPassword = ref(null)

export function useSession() {
  function setPassword(pwd) {
    sessionPassword.value = pwd
  }

  function clearSession() {
    sessionPassword.value = null
  }

  return { sessionPassword, setPassword, clearSession }
}
