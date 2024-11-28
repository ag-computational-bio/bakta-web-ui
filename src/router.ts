import { createWebHistory, createRouter } from 'vue-router'
import Citation from '@/pages/Citation.vue'
import About from '@/pages/About.vue'
import Submit from '@/pages/Submit.vue'
import Jobs from '@/pages/Jobs.vue'
import Job from '@/pages/Job.vue'
import Viewer from '@/pages/Viewer.vue'
import Info from '@/pages/Info.vue'

import NotFound from '@/pages/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Submit,
  },
  {
    path: '/citation',
    name: 'Citation',
    component: Citation,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/info',
    name: 'Info',
    component: Info,
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs,
  },
  {
    path: '/job/:id',
    name: 'Job',
    component: Job,
  },
  {
    path: '/viewer',
    name: 'Viewer',
    component: Viewer,
  },
  {
    path: '/submit',
    name: 'Submit',
    component: Submit,
  },
  {
    path: '/:catchAll(.*)',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
