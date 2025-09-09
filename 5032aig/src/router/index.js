import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/components/Profile.vue'
import Admin from '@/views/Admin.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:"/", redirect:"/login"
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
      path: '/profile',
      name: 'Profile',
      component: Profile,
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
    }
  ],
})

router.beforeEach((to, from, next) => {
  const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "null");

  if (!loggedIn && to.path !== "/login" && to.path !== "/register") {
    alert("Please login first!");
    return next("/login");
  }

  if (to.path === "/admin" && loggedIn?.role !== "admin") {
    alert("Access denied: Admins only!");
    return next("/login");
  }

  if (to.path === "/profile" && loggedIn?.role !== "user") {
    alert("Access denied: Users only!");
    return next("/login");
  }

  next();
});

export default router
