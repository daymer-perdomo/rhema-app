import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/services/supabase'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                     component: HomePage },
    { path: '/diario',               component: () => import('@/views/DiaryPage.vue'),      meta: { requiresAuth: true } },
    { path: '/diario/timeline',      component: () => import('@/views/TimelinePage.vue'),   meta: { requiresAuth: true } },
    { path: '/diario/entrada/:id',   component: () => import('@/views/EntryDetailPage.vue'), meta: { requiresAuth: true } },
    { path: '/perfil',               component: () => import('@/views/ProfilePage.vue') },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return true

  return { path: '/perfil', query: { redirect: to.fullPath } }
})

export default router
