import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/services/supabase'
import { getMyProfile } from '@/services/profile.service'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                     component: HomePage },
    { path: '/diario',               component: () => import('@/views/DiaryPage.vue'),      meta: { requiresAuth: true } },
    { path: '/diario/timeline',      component: () => import('@/views/TimelinePage.vue'),   meta: { requiresAuth: true } },
    { path: '/diario/entrada/:id',   component: () => import('@/views/EntryDetailPage.vue'), meta: { requiresAuth: true } },
    { path: '/perfil',               component: () => import('@/views/ProfilePage.vue') },
    { path: '/admin',                component: () => import('@/views/AdminPage.vue'),       meta: { requiresAuth: true, requiresAdmin: true } },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { path: '/perfil', query: { redirect: to.fullPath } }

  if (to.meta.requiresAdmin) {
    try {
      const profile = await getMyProfile()
      if (profile?.role !== 'admin') return { path: '/' }
    } catch {
      return { path: '/' }
    }
  }

  return true
})

export default router
