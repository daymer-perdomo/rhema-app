<script setup>
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/ui/AppSidebar.vue'

const route = useRoute()
</script>

<template>
  <div class="app-root">
    <AppSidebar />
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-root {
  display: flex;
  min-height: 100dvh;
  background: var(--color-rhema-dark);
  color: var(--color-rhema-text);
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .main-content {
    margin-left: 220px;
  }
}

@media (max-width: 1023px) {
  .main-content {
    padding-top: calc(52px + 0.5rem);
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 0.5rem);
  }
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
