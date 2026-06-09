<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CircleUser, LogOut, Loader } from '@lucide/vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route  = useRoute()
const { user, login, register, logout } = useAuth()

const mode     = ref('login') // 'login' | 'register'
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const isLogin   = computed(() => mode.value === 'login')
const initials  = computed(() => user.value?.email?.[0]?.toUpperCase() ?? '?')

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
      const dest = route.query.redirect
      if (dest) router.push(dest)
    } else {
      await register(email.value, password.value)
      successMsg.value = 'Revisa tu correo para confirmar tu cuenta.'
    }
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div class="profile-page">

    <!-- ══ LOGGED IN ═══════════════════════════════════════════════════════ -->
    <div v-if="user" class="profile-card">
      <span class="ornament">✦</span>

      <div class="avatar-wrap">
        <span class="avatar-initials">{{ initials }}</span>
      </div>

      <h1 class="profile-title">Mi Perfil</h1>
      <p class="profile-email">{{ user.email }}</p>

      <div class="divider" />

      <p class="coming-soon">Próximamente más opciones aquí.</p>

      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="16" />
        Cerrar sesión
      </button>
    </div>

    <!-- ══ LOGGED OUT ══════════════════════════════════════════════════════ -->
    <div v-else class="profile-card">
      <span class="ornament">✦</span>

      <div class="avatar-wrap">
        <CircleUser class="avatar-icon" :size="48" :stroke-width="1" />
      </div>

      <div class="auth-header">
        <h1 class="profile-title">
          {{ isLogin ? 'Bienvenido' : 'Crear cuenta' }}
        </h1>
        <p class="auth-subtitle">
          {{ isLogin
            ? 'Accede para guardar tu camino espiritual'
            : 'Guarda tus palabras recibidas' }}
        </p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field-wrap">
          <input
            v-model="email"
            type="email"
            placeholder="Correo electrónico"
            autocomplete="email"
            class="field"
          />
        </div>
        <div class="field-wrap">
          <input
            v-model="password"
            type="password"
            placeholder="Contraseña"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            class="field"
          />
        </div>

        <p v-if="errorMsg"   class="msg-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="msg-success">{{ successMsg }}</p>

        <button type="submit" class="submit-btn" :disabled="loading">
          <Loader v-if="loading" class="spin" :size="16" />
          <span>{{ isLogin ? 'Entrar' : 'Registrarme' }}</span>
        </button>
      </form>

      <div class="divider" />

      <p class="switch-text">
        {{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
        <button class="switch-btn" @click="switchMode">
          {{ isLogin ? 'Regístrate' : 'Inicia sesión' }}
        </button>
      </p>
    </div>

  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 340px;
  text-align: center;
}

/* Ornament */
.ornament {
  font-size: 1rem;
  color: var(--color-rhema-gold);
  opacity: 0.45;
  animation: pulse-ornament 3s ease-in-out infinite;
}

@keyframes pulse-ornament {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%       { opacity: 0.8;  transform: scale(1.15); }
}

/* Avatar */
.avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(225,237,224,0.14) 0%, transparent 100%);
  border: 1px solid var(--color-rhema-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-initials {
  font-family: var(--font-display);
  font-size: 1.875rem;
  font-weight: var(--fw-semibold);
  color: var(--color-rhema-gold);
  line-height: 1;
}

.avatar-icon {
  color: var(--color-rhema-gold);
  opacity: 0.75;
}

/* Titles */
.profile-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.875rem;
  font-weight: var(--fw-semibold);
  color: var(--color-rhema-text);
  line-height: 1;
}

.profile-email {
  font-size: 0.875rem;
  color: var(--color-rhema-muted);
  margin-top: -0.5rem;
}

.auth-header {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.auth-subtitle {
  font-size: 0.8125rem;
  color: var(--color-rhema-muted);
  line-height: 1.5;
  margin-top: -0.5rem;
}

/* Divider */
.divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-rhema-border), transparent);
}

/* Coming soon */
.coming-soon {
  font-size: 0.8125rem;
  color: var(--color-rhema-muted);
  opacity: 0.55;
  line-height: 1.6;
}

/* Auth form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.field-wrap { width: 100%; }

.field {
  width: 100%;
  background: var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-rhema-text);
  outline: none;
  transition: border-color var(--transition-base);
  text-align: left;
}

.field:focus { border-color: var(--color-rhema-gold); }
.field::placeholder { color: var(--color-rhema-muted); }

/* Messages */
.msg-error   { font-size: 0.8125rem; color: var(--color-error); text-align: left; width: 100%; }
.msg-success { font-size: 0.8125rem; color: #6ab58b; text-align: left; width: 100%; }

/* Submit */
.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-rhema-gold);
  color: var(--color-rhema-dark);
  font-weight: var(--fw-medium);
  font-size: 0.9375rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--rhema-radius-sm);
  border: none;
  cursor: pointer;
  transition: background var(--transition-base), transform var(--transition-fast);
}

.submit-btn:hover:not(:disabled) { background: var(--color-rhema-gold-light); }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Switch mode */
.switch-text {
  font-size: 0.8125rem;
  color: var(--color-rhema-muted);
}

.switch-btn {
  background: none;
  border: none;
  color: var(--color-rhema-gold);
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  transition: color var(--transition-fast);
}

.switch-btn:hover { color: var(--color-rhema-gold-light); }

/* Logout */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  color: var(--color-rhema-muted);
  font-size: 0.875rem;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.logout-btn:hover {
  border-color: #f87171;
  color: #f87171;
}
</style>
