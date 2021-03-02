import { createWebHistory, createRouter } from "vue-router";
import Download from '@/pages/Download'
import Submit from '@/pages/Submit'
import Jobs from '@/pages/Jobs'
import Job from '@/pages/Job'
import Info from '@/pages/Info'

import NotFound from '@/pages/NotFound'

const routes = [
  {
    path: "/",
    name: "Home",
    component: Submit,
  },
  {
    path: "/download",
    name: "Download",
    component: Download,
  },
  {
    path: "/info",
    name: "Info",
    component: Info,
  },
  {
    path: "/jobs",
    name: "Jobs",
    component: Jobs,
  },
  {
    path: "/job/:id",
    name: "Job",
    component: Job,
  },
  {
    path: "/submit",
    name: "Submit",
    component: Submit,
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;