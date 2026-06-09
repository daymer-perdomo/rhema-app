import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }    from '@/stores/useAuthStore'
import { useProfileStore } from '@/stores/useProfileStore'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                     component: HomePage },
    { path: '/diario',               component: () => import('@/views/DiaryPage.vue'),       meta: { requiresAuth: true } },
    { path: '/diario/timeline',      component: () => import('@/views/TimelinePage.vue'),    meta: { requiresAuth: true } },
    { path: '/diario/entrada/:id',   component: () => import('@/views/EntryDetailPage.vue'), meta: { requiresAuth: true } },
    { path: '/perfil',               component: () => import('@/views/ProfilePage.vue') },
    { path: '/admin',                component: () => import('@/views/AdminPage.vue'),        meta: { requiresAuth: true, requiresAdmin: true } },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()

  // First navigation: auth store not yet initialized → initialize it once
  if (!authStore.ready) await authStore.init()

  if (!authStore.user) return { path: '/perfil', query: { redirect: to.fullPath } }

  if (to.meta.requiresAdmin) {
    const profileStore = useProfileStore()
    if (!profileStore.profile) await profileStore.load(authStore.user.id)
    if (profileStore.profile?.role !== 'admin') return { path: '/' }
  }

  return true
})

export default router
