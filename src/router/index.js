import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/running-power',
    name: 'RunningPower',
    component: () => import('../views/RunningPower.vue')
  },
  {
    path: '/performance-prediction',
    name: 'PerformancePrediction',
    component: () => import('../views/PerformancePrediction.vue')
  },
  {
    path: '/heart-rate',
    name: 'HeartRate',
    component: () => import('../views/HeartRate.vue')
  },
  {
    path: '/training-schedule',
    name: 'TrainingSchedule',
    component: () => import('../views/TrainingSchedule.vue')
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('../views/Forum.vue')
  },
  {
    path: '/achievement',
    name: 'Achievement',
    component: () => import('../views/Achievement.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router