import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory("/admin/"),
  routes: [
    { path: "/", redirect: "/statistics" },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
      meta: { hideLayout: true },
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { hideLayout: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/AdminLayout.vue"),
      children: [
        {
          path: "draw-tickets",
          name: "DrawTickets",
          component: () =>
            import("@/views/draw-tickets/DrawTicketListView.vue"),
          meta: { title: "摇奖管理", icon: "ticket" },
        },
        {
          path: "draw-tickets/generate",
          name: "GenerateTickets",
          component: () => import("@/views/draw-tickets/GenerateView.vue"),
          meta: { title: "号码生成", icon: "random" },
        },
        {
          path: "scratch-tickets",
          name: "ScratchTickets",
          component: () =>
            import("@/views/scratch-tickets/ScratchTicketListView.vue"),
          meta: { title: "刮刮乐管理", icon: "money-circle" },
        },
        {
          path: "draw-results",
          name: "DrawResults",
          component: () =>
            import("@/views/draw-results/DrawResultListView.vue"),
          meta: { title: "开奖记录", icon: "award" },
        },
        {
          path: "draw-results/official-sync",
          name: "OfficialDrawSync",
          component: () =>
            import("@/views/draw-results/OfficialDrawSyncView.vue"),
          meta: { title: "历史数据同步", icon: "cloud-download" },
        },
        {
          path: "statistics",
          name: "Statistics",
          component: () => import("@/views/statistics/StatisticsView.vue"),
          meta: { title: "统计分析" },
        },
        {
          path: "settings",
          name: "Settings",
          component: () => import("@/views/settings/SettingsView.vue"),
          meta: { title: "系统设置", icon: "setting" },
        },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  if (to.name !== "Login" && to.name !== "Register" && !token) {
    next({ name: "Login" });
  } else if ((to.name === "Login" || to.name === "Register") && token) {
    next({ name: "Statistics" });
  } else {
    next();
  }
});

export default router;
