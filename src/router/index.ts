import { createRouter, createWebHistory } from "vue-router";

import IndexPage from "../pages/index.vue";
import ResultsPage from "../pages/results.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: IndexPage,
    },
    {
      path: "/results",
      component: ResultsPage,
    },
  ],
});

export default router;
