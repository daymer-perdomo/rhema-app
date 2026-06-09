<script setup>
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, BookMarked, GitBranch, CircleUser, ShieldCheck } from '@lucide/vue'
import AuthPanel from './AuthPanel.vue'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'

const route  = useRoute()
const router = useRouter()
const { user } = useAuth()
const { isAdmin } = useProfile()

const initials = () => user.value?.email?.[0]?.toUpperCase() ?? '?'

const SECTIONS = [
  {
    label: 'LA PALABRA',
    items: [{ to: '/', label: 'Consultar', shortLabel: 'Palabra', icon: BookOpen }],
  },
  {
    label: 'MI CAMINO',
    items: [
      { to: '/diario',           label: 'Mi Diario',   shortLabel: 'Diario', icon: BookMarked },
      { to: '/diario/timeline',  label: 'Mi Historia', shortLabel: 'Camino', icon: GitBranch },
    ],
  },
]

const ALL_ITEMS = SECTIONS.flatMap(s => s.items)

function isActive(to) {
  if (to === '/') return route.path === '/'
  if (to === '/diario') return route.path.startsWith('/diario') && !route.path.startsWith('/diario/timeline')
  return route.path === to
}
</script>

<template>

  <!-- ══ MOBILE HEADER ══════════════════════════════════════════════════════ -->
  <header class="mobile-header">
    <RouterLink to="/" class="mobile-header-logo">
      <span>✦</span>
      Rhema
    </RouterLink>
    <button class="mobile-profile-btn" @click="router.push('/perfil')">
      <span v-if="user" class="mh-initials">{{ initials() }}</span>
      <CircleUser v-else :size="18" />
    </button>
  </header>

  <!-- ══ DESKTOP SIDEBAR ════════════════════════════════════════════════════ -->
  <aside class="sidebar">

    <RouterLink to="/" class="logo">
      <span class="logo-ornament">✦</span>
      <span class="logo-text">Rhema</span>
    </RouterLink>

    <div class="divider" />

    <nav class="nav">
      <template v-for="(section, si) in SECTIONS" :key="section.label">
        <div class="section-label">{{ section.label }}</div>

        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <component :is="item.icon" class="item-icon" :size="16" :stroke-width="1.5" />
          {{ item.label }}
        </RouterLink>

        <div v-if="si < SECTIONS.length - 1" class="divider nav-divider" />
      </template>
    </nav>

    <div class="spacer" />

    <!-- Admin link (admins only) -->
    <RouterLink v-if="isAdmin" to="/admin" class="nav-item admin-link" :class="{ active: route.path === '/admin' }">
      <ShieldCheck class="item-icon" :size="16" :stroke-width="1.5" />
      Admin
    </RouterLink>

    <!-- Profile link -->
    <RouterLink to="/perfil" class="nav-item profile-link" :class="{ active: route.path === '/perfil' }">
      <CircleUser class="item-icon" :size="16" :stroke-width="1.5" />
      Mi Perfil
    </RouterLink>

    <div class="auth-wrap">
      <AuthPanel />
    </div>

    <div class="footer">Rhema · 2026</div>
  </aside>

  <!-- ══ MOBILE BOTTOM NAV (hidden on homepage — writing bar handles that slot) -->
  <nav v-if="route.path !== '/'" class="mobile-nav">
    <RouterLink
      v-for="item in ALL_ITEMS"
      :key="item.to"
      :to="item.to"
      class="mobile-item"
      :class="{ active: isActive(item.to) }"
    >
      <component :is="item.icon" class="mobile-icon" :size="22" :stroke-width="1.5" />
      <span class="mobile-label">{{ item.shortLabel }}</span>
    </RouterLink>
  </nav>

</template>

<style scoped>
/* ─── Mobile Header ─────────────────────────────────────────────────────── */
.mobile-header { display: none; }

@media (max-width: 1023px) {
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    height: 52px;
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: var(--z-sidebar);
    background: rgba(14, 14, 14, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--color-border);
  }
}

.mobile-header-logo {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.25rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
}

.mobile-header-logo span {
  color: var(--color-accent);
  font-size: 0.8rem;
  font-style: normal;
  animation: pulse-ornament 3s ease-in-out infinite;
}

.mobile-profile-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--transition-base), color var(--transition-base);
  color: var(--color-text-muted);
}

.mobile-profile-btn:hover {
  border-color: rgba(225, 237, 224, 0.4);
  color: var(--color-accent);
}

.mh-initials {
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 0.875rem;
  color: var(--color-accent);
  line-height: 1;
}

/* ─── Desktop Sidebar ────────────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: var(--z-sidebar);
  overflow: visible;
}

@media (max-width: 1023px) {
  .sidebar { display: none; }
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem 1.25rem;
  text-decoration: none;
}

.logo-ornament {
  color: var(--color-accent);
  font-size: 0.9rem;
  animation: pulse-ornament 3s ease-in-out infinite;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: var(--fw-semibold, 600);
  font-style: italic;
  color: var(--color-text);
  letter-spacing: 0.04em;
}

@keyframes pulse-ornament {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%       { opacity: 0.8;  transform: scale(1.15); }
}

/* Dividers */
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-border) 25%,
    var(--color-border) 75%,
    transparent 100%
  );
  margin: 0.75rem 1.25rem;
  flex-shrink: 0;
}

.nav-divider { margin: 0.5rem 1.25rem; }

/* Section labels */
.nav { display: flex; flex-direction: column; }

.section-label {
  font-family: var(--font-body, var(--font-sans));
  font-size: 0.6rem;
  font-weight: var(--fw-semibold, 600);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.45;
  padding: 0.5rem 1.25rem 0.25rem;
}

/* Nav items */
.nav-item {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
  padding: 0.5rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  position: relative;
  transition: color 200ms ease, background 200ms ease, border-color 200ms ease;
  text-decoration: none;
  border-left: 2px solid transparent;
}

.nav-item:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  color: var(--color-accent);
  border-left-color: var(--color-accent);
  font-style: italic;
  background: linear-gradient(90deg, rgba(225, 237, 224, 0.07) 0%, transparent 100%);
}

.item-icon {
  opacity: 0.45;
  flex-shrink: 0;
  transition: opacity 200ms ease;
}

.nav-item:hover .item-icon,
.nav-item.active .item-icon {
  opacity: 1;
}

/* Spacer */
.spacer { flex: 1; }

/* Auth */
.auth-wrap {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  position: relative;
}

/* Dropdown opens upward from the auth button, aligned left */
.auth-wrap :deep(.absolute) {
  top: auto !important;
  bottom: calc(100% + 0.5rem);
  left: 0;
  right: auto;
}

/* Footer */
.footer {
  font-family: var(--font-body, var(--font-sans));
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.3;
  padding: 0.75rem 1.25rem;
}

/* ─── Mobile Bottom Nav ──────────────────────────────────────────────────── */
.mobile-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: calc(64px + env(safe-area-inset-bottom, 0px));
  background: rgba(14, 14, 14, 0.97);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  z-index: var(--z-sidebar);
}

@media (min-width: 1024px) {
  .mobile-nav { display: none; }
}

.mobile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  height: 64px;
  padding: 8px 4px;
  color: var(--color-text-muted);
  transition: color 200ms ease;
  text-decoration: none;
  position: relative;
}

.mobile-item.active {
  color: var(--color-accent);
}

.mobile-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 22%;
  right: 22%;
  height: 1.5px;
  background: var(--color-accent);
  border-radius: 0 0 2px 2px;
  box-shadow: 0 0 8px rgba(225, 237, 224, 0.5);
}

.mobile-icon {
  transition: transform 200ms ease;
}

.mobile-item.active .mobile-icon {
  transform: translateY(-1px);
}

.mobile-label {
  font-family: var(--font-body, var(--font-sans));
  font-size: 0.6rem;
  font-weight: var(--fw-medium, 500);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
