<script setup>
import { ref, computed } from 'vue'
import { Lock, Eye, EyeOff } from '@lucide/vue'

const props = defineProps({
  mode:       { type: String, default: 'write' },
  entryTitle: { type: String, default: '' },
})
const emit = defineEmits(['confirmed', 'cancelled'])

const password   = ref('')
const confirmPwd = ref('')
const errorMsg   = ref('')
const showPwd    = ref(false)

const isCreate = computed(() => props.mode === 'create')

const label = computed(() => ({
  read:   'Desbloquear entrada',
  write:  'Confirmar identidad',
  create: 'Crear contraseña',
}[props.mode] ?? 'Contraseña'))

const sublabel = computed(() => ({
  read:   'Ingresa tu contraseña para leer esta entrada',
  write:  'Ingresa tu contraseña para guardar',
  create: 'Esta contraseña cifra todo tu diario',
}[props.mode] ?? ''))

function submit() {
  errorMsg.value = ''
  if (!password.value) { errorMsg.value = 'Ingresa tu contraseña.'; return }
  if (isCreate.value) {
    if (password.value.length < 6) { errorMsg.value = 'Mínimo 6 caracteres.'; return }
    if (password.value !== confirmPwd.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }
  }
  const pwd = password.value
  password.value   = ''
  confirmPwd.value = ''
  emit('confirmed', pwd)
}
</script>

<template>
  <div class="pg-overlay" @click.self="$emit('cancelled')">
    <Transition name="pg-card" appear>
      <div class="pg-card">

        <!-- Icon -->
        <div class="pg-icon-wrap">
          <div class="pg-icon-ring" />
          <Lock :size="20" class="pg-icon" />
        </div>

        <!-- Header -->
        <div class="pg-header">
          <h3 class="pg-title">{{ label }}</h3>
          <p class="pg-sub">
            <template v-if="entryTitle">
              <span class="pg-entry-name">{{ entryTitle }}</span>
            </template>
            <template v-else>{{ sublabel }}</template>
          </p>
        </div>

        <!-- Form -->
        <form class="pg-form" @submit.prevent="submit">

          <!-- Password input -->
          <div class="pg-input-wrap">
            <input
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Contraseña"
              autocomplete="current-password"
              class="pg-input"
              autofocus
            />
            <button type="button" class="pg-eye" tabindex="-1" @click="showPwd = !showPwd">
              <EyeOff v-if="showPwd" :size="15" />
              <Eye    v-else         :size="15" />
            </button>
          </div>

          <!-- Confirm input (create mode) -->
          <div v-if="isCreate" class="pg-input-wrap">
            <input
              v-model="confirmPwd"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Confirmar contraseña"
              autocomplete="new-password"
              class="pg-input"
            />
          </div>

          <!-- Error -->
          <p v-if="errorMsg" class="pg-error">{{ errorMsg }}</p>

          <!-- Warning (create mode) -->
          <p v-if="isCreate" class="pg-warning">
            Si pierdes tu contraseña no podremos recuperar tus entradas. Guárdala en un lugar seguro.
          </p>

          <!-- Actions -->
          <button type="submit" class="pg-btn-primary">
            {{ isCreate ? 'Crear diario' : 'Confirmar' }}
          </button>
          <button type="button" class="pg-btn-ghost" @click="$emit('cancelled')">
            Cancelar
          </button>

        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Overlay ────────────────────────────────────────────────────────────────── */
.pg-overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) + 10);
  background: rgba(4, 4, 4, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* ─── Card ───────────────────────────────────────────────────────────────────── */
.pg-card {
  width: min(360px, 92vw);
  background: #0d0d0d;
  border: 1px solid rgba(225, 237, 224, 0.1);
  border-top: 2px solid rgba(225, 237, 224, 0.22);
  border-radius: 6px;
  padding: 2rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(225, 237, 224, 0.03);
}

/* ─── Icon ───────────────────────────────────────────────────────────────────── */
.pg-icon-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pg-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(225, 237, 224, 0.14);
  background: rgba(225, 237, 224, 0.05);
  animation: ring-pulse 3s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0   rgba(225, 237, 224, 0.08); }
  50%       { box-shadow: 0 0 0 6px rgba(225, 237, 224, 0);    }
}

.pg-icon {
  position: relative;
  color: var(--color-accent);
  opacity: 0.85;
}

/* ─── Header ─────────────────────────────────────────────────────────────────── */
.pg-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
}

.pg-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.2;
}

.pg-sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.pg-entry-name {
  color: var(--color-accent-mid);
  font-style: italic;
}

/* ─── Form ───────────────────────────────────────────────────────────────────── */
.pg-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.pg-input-wrap {
  position: relative;
  width: 100%;
}

.pg-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(225, 237, 224, 0.1);
  border-radius: var(--r-md);
  padding: 0.75rem 2.75rem 0.75rem 1rem;
  font-size: 16px;
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-base), background var(--transition-base);
  letter-spacing: 0.04em;
}

.pg-input:focus {
  border-color: rgba(225, 237, 224, 0.28);
  background: rgba(255, 255, 255, 0.05);
}

.pg-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.5;
  letter-spacing: 0;
}

.pg-eye {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  opacity: 0.5;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  transition: opacity var(--transition-fast);
  touch-action: manipulation;
}
.pg-eye:hover { opacity: 1; }

/* ─── Messages ───────────────────────────────────────────────────────────────── */
.pg-error {
  font-size: 0.8125rem;
  color: var(--color-error);
  line-height: 1.4;
}

.pg-warning {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  line-height: 1.6;
  padding: 0.625rem 0.75rem;
  border-left: 2px solid rgba(225, 237, 224, 0.12);
  background: rgba(225, 237, 224, 0.02);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

/* ─── Buttons ────────────────────────────────────────────────────────────────── */
.pg-btn-primary {
  width: 100%;
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: var(--fw-medium);
  font-size: 0.9375rem;
  padding: 0.75rem;
  border-radius: var(--r-md);
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast), box-shadow var(--transition-fast);
  touch-action: manipulation;
  margin-top: 0.25rem;
}
.pg-btn-primary:hover {
  opacity: 0.88;
  box-shadow: 0 4px 20px rgba(225, 237, 224, 0.12);
}

.pg-btn-ghost {
  width: 100%;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  padding: 0.375rem;
  cursor: pointer;
  transition: color var(--transition-fast);
  touch-action: manipulation;
  text-align: center;
}
.pg-btn-ghost:hover { color: var(--color-text); }

/* ─── Card transition ────────────────────────────────────────────────────────── */
.pg-card-enter-active { transition: opacity 220ms ease, transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.pg-card-leave-active { transition: opacity 180ms ease, transform 180ms ease-in; }
.pg-card-enter-from   { opacity: 0; transform: scale(0.94) translateY(8px); }
.pg-card-leave-to     { opacity: 0; transform: scale(0.97) translateY(4px); }
</style>
