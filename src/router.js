import { createWebHistory, createRouter } from "vue-router";
import Citation from "@/pages/Citation";
import About from "@/pages/About";
import Submit from "@/pages/Submit";
import Jobs from "@/pages/Jobs";
import Job from "@/pages/Job";
import Viewer from "@/pages/Viewer";
import Info from "@/pages/Info";

import NotFound from "@/pages/NotFound";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Submit,
  },
  {
    path: "/citation",
    name: "Citation",
    component: Citation,
  },
  {
    path: "/about",
    name: "About",
    component: About,
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
    path: "/viewer",
    name: "Viewer",
    component: Viewer,
  },
  {
    path: "/submit",
    name: "Submit",
    component: Submit,
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
