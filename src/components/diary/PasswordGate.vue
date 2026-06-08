<script setup>
import { ref, computed } from 'vue'
import { Lock } from '@lucide/vue'

const props = defineProps({
  mode: { type: String, default: 'write' },
  entryTitle: { type: String, default: '' },
})
const emit = defineEmits(['confirmed', 'cancelled'])

const password = ref('')
const confirm = ref('')
const errorMsg = ref('')

const isCreate = computed(() => props.mode === 'create')

const label = computed(() => ({
  read:   'Ingresa tu contraseña para leer esta entrada',
  write:  'Ingresa tu contraseña para guardar',
  create: 'Crea la contraseña de tu diario',
}[props.mode] ?? 'Ingresa tu contraseña'))

function submit() {
  errorMsg.value = ''
  if (!password.value) { errorMsg.value = 'Ingresa tu contraseña.'; return }
  if (isCreate.value) {
    if (password.value.length < 6) { errorMsg.value = 'Mínimo 6 caracteres.'; return }
    if (password.value !== confirm.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }
  }
  const pwd = password.value
  password.value = ''
  confirm.value = ''
  emit('confirmed', pwd)
}
</script>

<template>
  <div class="overlay" @click.self="$emit('cancelled')">
    <div class="gate-card">
      <div class="gate-icon"><Lock class="w-5 h-5" /></div>
      <h3 class="gate-title">{{ label }}</h3>
      <p v-if="entryTitle" class="gate-sub">{{ entryTitle }}</p>

      <form class="gate-form" @submit.prevent="submit">
        <input v-model="password" type="password" placeholder="Contraseña"
               autocomplete="current-password" class="gate-input" autofocus />
        <input v-if="isCreate" v-model="confirm" type="password"
               placeholder="Confirmar contraseña" autocomplete="new-password" class="gate-input" />

        <p v-if="errorMsg" class="gate-error">{{ errorMsg }}</p>
        <p v-if="isCreate" class="gate-warning">
          Si pierdes tu contraseña, no podremos recuperar tus entradas.
        </p>

        <button type="submit" class="btn-primary">
          {{ isCreate ? 'Crear diario' : 'Confirmar' }}
        </button>
        <button type="button" class="btn-ghost" @click="$emit('cancelled')">Cancelar</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: var(--z-modal);
}
.gate-card {
  background: linear-gradient(135deg, rgba(201,168,76,0.10) 0%, transparent 50%), var(--color-rhema-surface);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-lg);
  padding: 2rem;
  width: min(360px, 92vw);
  display: flex; flex-direction: column; gap: 1rem;
}
.gate-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: rgba(201,168,76,0.12);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-rhema-gold);
}
.gate-title { font-size: 1rem; font-weight: var(--fw-semibold); color: var(--color-rhema-text); }
.gate-sub { font-size: 0.875rem; color: var(--color-rhema-muted); margin-top: -0.5rem; }
.gate-form { display: flex; flex-direction: column; gap: 0.75rem; }
.gate-input {
  background: var(--color-rhema-dark);
  border: 1px solid var(--color-rhema-border);
  border-radius: var(--rhema-radius-sm);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: var(--color-rhema-text);
  outline: none;
  transition: border-color var(--transition-base);
  width: 100%;
}
.gate-input:focus { border-color: var(--color-rhema-gold); }
.gate-error { font-size: 0.8125rem; color: var(--color-error); }
.gate-warning { font-size: 0.75rem; color: var(--color-rhema-muted); line-height: 1.5; }
.btn-primary {
  width: 100%; background: var(--color-rhema-gold); color: var(--color-rhema-dark);
  font-weight: var(--fw-medium); font-size: 0.875rem; padding: 0.625rem;
  border-radius: var(--rhema-radius-sm); border: none; cursor: pointer;
  transition: background var(--transition-base);
}
.btn-primary:hover { background: var(--color-rhema-gold-light); }
.btn-ghost {
  width: 100%; background: none; color: var(--color-rhema-muted);
  font-size: 0.875rem; padding: 0.5rem; border: none; cursor: pointer;
  transition: color var(--transition-base);
}
.btn-ghost:hover { color: var(--color-rhema-text); }
</style>
