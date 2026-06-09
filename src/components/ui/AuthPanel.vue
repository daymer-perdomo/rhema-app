<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { UserCircle, LogOut, Loader } from '@lucide/vue'
import { useAuth } from '@/composables/useAuth'

const { user, init, login, register, logout, cleanup } = useAuth()

const open = ref(false)
const mode = ref('login') // 'login' | 'register'
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const isLogin = computed(() => mode.value === 'login')
const initials = computed(() => {
  if (!user.value?.email) return '?'
  return user.value.email[0].toUpperCase()
})

onMounted(() => { init() })
onUnmounted(() => { cleanup() })

function toggle() {
  open.value = !open.value
  errorMsg.value = ''
  successMsg.value = ''
}

function switchMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  errorMsg.value = ''
  successMsg.value = ''
  email.value = ''
  password.value = ''
}

async function submit() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = 'Completa todos los campos.'
    return
  }
  loading.value = true
  try {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await register(email.value, password.value)
    }
    open.value = false
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  await logout()
  open.value = false
}

function onClickOutside(e) {
  if (!e.target.closest('[data-auth-panel]')) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="relative" data-auth-panel>
    <!-- Trigger icon -->
    <button
      class="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
      :class="open
        ? 'ring-2 ring-rhema-gold text-rhema-gold'
        : 'text-rhema-muted hover:text-rhema-text'"
      @click.stop="toggle"
    >
      <!-- Logged in: initials avatar -->
      <span
        v-if="user"
        class="w-8 h-8 rounded-full bg-gradient-to-br from-rhema-gold to-amber-700 flex items-center justify-center text-rhema-dark text-sm font-bold select-none"
      >
        {{ initials }}
      </span>
      <!-- Logged out: user icon -->
      <UserCircle v-else class="w-6 h-6" />
    </button>

    <!-- Panel -->
    <Transition name="panel">
      <div
        v-if="open"
        class="auth-panel-dropdown absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl"
      >
        <!-- Logged in view -->
        <div v-if="user" class="p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-full bg-gradient-to-br from-rhema-gold to-amber-700 flex items-center justify-center text-rhema-dark font-bold text-base select-none">
              {{ initials }}
            </span>
            <div class="min-w-0">
              <p class="text-rhema-text text-sm font-medium truncate">{{ user.email }}</p>
              <p class="text-rhema-muted text-xs">Sesión activa</p>
            </div>
          </div>
          <button
            class="flex items-center gap-2 text-sm text-rhema-muted hover:text-red-400 transition-colors duration-200 mt-1"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>

        <!-- Auth form view -->
        <div v-else class="p-6 flex flex-col gap-5">
          <div>
            <h3 class="text-white font-semibold text-base">
              {{ isLogin ? 'Inicia sesión' : 'Crea tu cuenta' }}
            </h3>
            <p class="text-rhema-muted text-xs mt-0.5">
              {{ isLogin ? 'Accede a tu historial de palabras' : 'Guarda tus palabras recibidas' }}
            </p>
          </div>

          <form class="flex flex-col gap-3" @submit.prevent="submit">
            <input
              v-model="email"
              type="email"
              placeholder="Correo electrónico"
              autocomplete="email"
              class="w-full bg-rhema-dark border border-rhema-border rounded-xl px-4 py-2.5 text-sm text-rhema-text placeholder-rhema-muted focus:outline-none focus:border-rhema-gold transition-colors duration-200"
            />
            <input
              v-model="password"
              type="password"
              placeholder="Contraseña"
              autocomplete="current-password"
              class="w-full bg-rhema-dark border border-rhema-border rounded-xl px-4 py-2.5 text-sm text-rhema-text placeholder-rhema-muted focus:outline-none focus:border-rhema-gold transition-colors duration-200"
            />

            <p v-if="errorMsg" class="text-red-400 text-xs">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-green-400 text-xs">{{ successMsg }}</p>

            <button
              type="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-2 bg-rhema-gold text-rhema-dark font-medium text-sm py-2.5 rounded-xl hover:bg-rhema-gold-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <span>{{ isLogin ? 'Entrar' : 'Registrarme' }}</span>
            </button>
          </form>

          <p class="text-center text-xs text-rhema-muted">
            {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
            <button
              class="text-rhema-gold hover:text-rhema-gold-light transition-colors ml-1"
              @click="switchMode"
            >
              {{ isLogin ? 'Regístrate' : 'Inicia sesión' }}
            </button>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.auth-panel-dropdown {
  background: linear-gradient(135deg, rgba(225, 237, 224, 0.10) 0%, transparent 50%),
              var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
