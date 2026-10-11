import About from '@/pages/AboutPage.vue'
import Citation from '@/pages/CitationPage.vue'
import Info from '@/pages/InfoPage.vue'
import NotFound from '@/pages/NotFoundPage.vue'
import Submit from '@/pages/submit-job/SubmitJobPage.vue'
import ShowOwnResultPage from '@/pages/show-own-result-file/ShowOwnResultPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ListJobsPage from './pages/show-job-list/ListJobsPage.vue'
import RedirectJobPage from './pages/show-results/RedirectJobPage.vue'
import ShowBaktaProteinsResultPage from './pages/show-results/ShowBaktaProteinsResultPage.vue'
import ShowResultPage from './pages/show-results/ShowResultPage.vue'

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
    component: ListJobsPage,
  },
  {
    path: '/job/:id',
    name: 'Job',
    component: RedirectJobPage,
  },
  {
    path: '/job/:id/bakta',
    name: 'JobBakta',
    component: ShowResultPage,
  },
  {
    path: '/job/:id/proteins',
    name: 'JobProteins',
    component: ShowBaktaProteinsResultPage,
  },
  {
    path: '/viewer',
    name: 'Viewer',
    component: ShowOwnResultPage,
  },
  {
    path: '/submit',
    name: 'Submit',
    component: Submit,
  },
  // the hidden admin area, loaded only when opened
  {
    path: '/admin/callback',
    name: 'AdminCallback',
    component: () => import('@/admin/pages/AdminCallbackPage.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/admin/pages/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminOverview',
        component: () => import('@/admin/pages/AdminOverviewPage.vue'),
      },
      {
        path: 'jobs',
        name: 'AdminJobs',
        component: () => import('@/admin/pages/AdminJobsPage.vue'),
      },
      {
        path: 'jobs/:id',
        name: 'AdminJob',
        component: () => import('@/admin/pages/AdminJobPage.vue'),
      },
    ],
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
