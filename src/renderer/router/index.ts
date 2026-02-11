import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/review/:projectId',
      name: 'review',
      component: () => import('@/views/ReviewView.vue'),
      props: true
    },
    {
      path: '/history/:projectId',
      name: 'review-history',
      component: () => import('@/views/ReviewHistoryView.vue'),
      props: true
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
