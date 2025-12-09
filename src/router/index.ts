import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'social-login',
      component: () => import('../views/SocialLoginView.vue'),
    },
    {
      path: '/motion-asset',
      name: 'motion-asset',
      component: () => import('../views/MotionAssetView.vue'),
    },
    {
      path: '/motion-preset',
      name: 'motion-preset',
      component: () => import('../views/MotionPresetView.vue'),
    },
    {
      path: '/motion-task',
      name: 'motion-task',
      component: () => import('../views/MotionTaskView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
