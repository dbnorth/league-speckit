import { createRouter, createWebHistory } from "vue-router";
import Utils from "./config/utils.js";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Home from "./views/Home.vue";
import Seasons from "./views/SeasonList.vue";
import Leagues from "./views/LeagueList.vue";
import People from "./views/PeopleList.vue";
import Teams from "./views/TeamList.vue";
import Team from "./views/Team.vue";
import Games from "./views/Games.vue";

const publicRouteNames = new Set(["login", "register"]);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/seasons",
      name: "seasons",
      component: Seasons,
    },
    {
      path: "/leagues",
      name: "leagues",
      component: Leagues,
    },
    {
      path: "/people",
      name: "people",
      component: People,
    },
    {
      path: "/teams",
      name: "teams",
      component: Teams,
    },
    {
      path: "/teams/:teamId",
      name: "team",
      component: Team,
    },
    {
      path: "/games",
      name: "games",
      component: Games,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const user = Utils.getStore("user");
  const isPublicRoute = publicRouteNames.has(to.name);

  if (!user && !isPublicRoute) {
    next({ name: "login" });
    return;
  }

  if (user && isPublicRoute) {
    next({ name: "home" });
    return;
  }

  next();
});

export default router;
