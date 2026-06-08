import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/diario', component: () => import('@/views/DiaryPage.vue') },
    { path: '/diario/timeline', component: () => import('@/views/TimelinePage.vue') },
    { path: '/diario/entrada/:id', component: () => import('@/views/EntryDetailPage.vue') },
    { path: '/perfil',            component: () => import('@/views/ProfilePage.vue') },
  ],
})

export default router
