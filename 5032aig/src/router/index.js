import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Admin from '@/views/Admin.vue'
import BookingPage from '@/views/BookingPage.vue'
import UserMainPage from '@/views/UserMainPage.vue'
import MapPage from '@/views/MapPage.vue'
import SelfAssessmentPage from '@/views/SelfAssessmentPage.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:"/", redirect:"/usermain"
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
    },
    {
      path: '/booking',
      name: 'booking',
      component: BookingPage,
    },
    {
      path: '/selfassessment',
      name: 'selfassessment',
      component: SelfAssessmentPage,
    },
    {
      path: '/usermain',
      name: 'usermain',
      component: UserMainPage,
    },
    {
      path: '/map',
      name: 'map',
      component: MapPage,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const publicPaths = ["/login", "/register", "/usermain"];

  if (!loggedIn && !publicPaths.includes(to.path)) {
    alert("Please log in first.");
    return next({path:"/login",replace: true});
  }

  if (to.path === "/admin" && loggedIn?.role !== "admin") {
    alert("Please log in first.");
    return next({path:"/login", replace: true});
  }

  if (to.path === "/profile" && loggedIn?.role !== "user") {
    alert("Please log in first.");
    return next({path:"/login", replace: true});
  }

  if (to.path === "/selfassessment" && loggedIn?.role !== "user") {
    alert("Please log in first.");
    return next({path:"/login", replace: true});
  }

  if (to.path === "/map" && loggedIn?.role !== "user") {
    alert("Please log in first.");
    return next({path:"/login", replace: true});
  }

  next();
});

export default router
