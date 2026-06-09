<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppSidebar        from '@/components/ui/AppSidebar.vue'
import AppLoader         from '@/components/ui/AppLoader.vue'
import PwaInstallPrompt  from '@/components/ui/PwaInstallPrompt.vue'

const route  = useRoute()
const { init } = useAuth()

const appReady  = ref(false)

onMounted(async () => {
  try {
    await Promise.all([
      document.fonts.ready,
      init(),
      new Promise(resolve => setTimeout(resolve, 1200)),
    ])
  } catch (err) {
    console.warn('[Rhema] Init warning:', err)
    await new Promise(resolve => setTimeout(resolve, 3000))
  } finally {
    appReady.value = true
  }
})
</script>

<template>
  <Transition name="loader">
    <AppLoader v-if="!appReady" />
  </Transition>

  <Transition name="app-fade">
    <div v-if="appReady" class="app-root">
      <AppSidebar />
      <PwaInstallPrompt />
      <main class="main-content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </Transition>
</template>

<style scoped>
.app-root {
  display: flex;
  min-height: 100dvh;
  background: var(--color-bg);
  color: var(--color-text);
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .main-content { margin-left: 220px; }
}

@media (max-width: 1023px) {
  .main-content {
    padding-top: calc(52px + 0.5rem);
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 0.5rem);
  }
}

/* ── Loader sale ── */
.loader-leave-active {
  transition: opacity 600ms ease, transform 600ms ease;
}
.loader-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* ── App entra ── */
.app-fade-enter-active {
  transition: opacity 500ms ease 100ms;
}
.app-fade-enter-from {
  opacity: 0;
}

/* ── Transición entre páginas ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 200ms ease;
}
.page-enter-from { opacity: 0; }
.page-leave-to   { opacity: 0; }
</style>
