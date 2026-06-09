<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, X, Share } from '@lucide/vue'

const STORAGE_KEY = 'rhema-pwa-install-dismissed'
const DISMISS_DAYS = 14

const visible    = ref(false)
const isIos      = ref(false)
let   deferredPrompt = null

function isDismissed() {
  const ts = localStorage.getItem(STORAGE_KEY)
  if (!ts) return false
  return Date.now() - Number(ts) < DISMISS_DAYS * 86400_000
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()))
  visible.value = false
}

async function install() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  if (outcome === 'accepted') visible.value = false
  else dismiss()
}

function onBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt = e
  if (!isDismissed()) visible.value = true
}

onMounted(() => {
  // Already installed as standalone — don't show
  if (window.matchMedia('(display-mode: standalone)').matches) return
  if (isDismissed()) return

  // iOS detection — no beforeinstallprompt on iOS
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)) {
    isIos.value = true
    visible.value = true
    return
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstall)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
})
</script>

<template>
  <Transition name="pwa-slide">
    <div v-if="visible" class="pwa-banner" role="complementary" aria-label="Instalar aplicación">

      <div class="pwa-content">
        <span class="pwa-ornament">✦</span>
        <div class="pwa-text">
          <span class="pwa-title">Instalar Rhema</span>
          <span v-if="isIos" class="pwa-sub">
            Toca <Share class="inline-icon" :size="13" /> → <em>Añadir a pantalla de inicio</em>
          </span>
          <span v-else class="pwa-sub">Accede sin navegador, incluso sin conexión</span>
        </div>
      </div>

      <div class="pwa-actions">
        <button v-if="!isIos" class="pwa-install-btn" @click="install">
          <Download :size="14" />
          Instalar
        </button>
        <button class="pwa-dismiss-btn" @click="dismiss" aria-label="Cerrar">
          <X :size="16" />
        </button>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.pwa-banner {
  position: fixed;
  bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: calc(var(--z-modal) - 1);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  width: calc(100% - 2rem);
  max-width: 420px;

  background: var(--color-surface-2);
  border: 1px solid var(--color-border-light);
  border-radius: var(--r-lg);
  padding: 0.75rem 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(225, 237, 224, 0.06);
}

@media (min-width: 1024px) {
  .pwa-banner {
    bottom: 1.5rem;
    left: calc(220px + 1.5rem);
    transform: none;
    max-width: 380px;
  }
}

.pwa-content {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.pwa-ornament {
  color: var(--color-accent);
  font-size: 0.85rem;
  flex-shrink: 0;
  opacity: 0.75;
}

.pwa-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.pwa-title {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: var(--fw-medium);
  color: var(--color-text);
  line-height: 1.2;
}

.pwa-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: wrap;
}

.pwa-sub em {
  font-style: normal;
  color: var(--color-accent-mid);
}

.inline-icon {
  display: inline-block;
  vertical-align: middle;
  color: var(--color-accent-mid);
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pwa-install-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.8125rem;
  font-weight: var(--fw-medium);
  padding: 0.4rem 0.85rem;
  border-radius: var(--r-md);
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  white-space: nowrap;
}

.pwa-install-btn:hover { opacity: 0.85; }

.pwa-dismiss-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.pwa-dismiss-btn:hover {
  border-color: var(--color-border-light);
  color: var(--color-text);
}

/* Entrada desde abajo */
.pwa-slide-enter-active { transition: opacity 300ms ease, transform 300ms ease; }
.pwa-slide-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.pwa-slide-enter-from   { opacity: 0; transform: translateX(-50%) translateY(12px); }
.pwa-slide-leave-to     { opacity: 0; transform: translateX(-50%) translateY(8px); }

@media (min-width: 1024px) {
  .pwa-slide-enter-from { transform: translateY(12px); }
  .pwa-slide-leave-to   { transform: translateY(8px); }
}
</style>
