<script setup>
import { useRoute } from 'vue-router'
import AuthPanel from './AuthPanel.vue'

const route = useRoute()

const LINKS = [
  { to: '/',               label: 'Consultar' },
  { to: '/diario',         label: 'Mi Diario' },
  { to: '/diario/timeline',label: 'Mi Camino' },
]

function isActive(to) {
  if (to === '/') return route.path === '/'
  if (to === '/diario') return route.path.startsWith('/diario') && !route.path.startsWith('/diario/timeline')
  return route.path === to
}
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="brand">Rhema</RouterLink>
    <div class="links">
      <RouterLink v-for="l in LINKS" :key="l.to" :to="l.to"
                  class="link" :class="{ active: isActive(l.to) }">
        {{ l.label }}
      </RouterLink>
    </div>
    <AuthPanel />
  </nav>
</template>

<style scoped>
.navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2rem; height: 60px;
  background: var(--color-rhema-surface);
  border-bottom: 1px solid var(--color-rhema-border);
  position: sticky; top: 0; z-index: 50;
}
.brand { font-size: 1.125rem; font-weight: 600; letter-spacing: 0.03em; color: var(--color-rhema-gold); text-decoration: none; }
.links { display: flex; gap: 2rem; }
.link {
  font-size: 0.8125rem; font-weight: 500; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--color-rhema-muted); text-decoration: none;
  transition: color 0.15s;
}
.link:hover { color: var(--color-rhema-text); }
.link.active { color: var(--color-rhema-gold); }
</style>
