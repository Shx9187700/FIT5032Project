<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <h2 class="text-center mb-4">AIG Login</h2>

        <form @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input 
              v-model="email" 
              type="email" 
              class="form-control" 
              required
              @blur="() => validateEmail(true)"
              @input="() => validateEmail(false)"
            />
            <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
          </div>

          <!-- Password -->
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input 
              v-model="password" 
              type="password" 
              class="form-control" 
              required
              @blur="() => validatePassword(true)"
              @input="() => validatePassword(false)"
            />
            <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
          </div>

          <!-- Buttons -->
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Login</button>
            <router-link to="/register" class="btn btn-secondary">Register</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/init.js";

const email = ref("");
const password = ref("");
const errors = ref({
  email: null,
  password: null
});
const router = useRouter();

// Email validation
const validateEmail = (blur) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value)) {
    if (blur) errors.value.email = "Invalid email format.";
  } else {
    errors.value.email = null;
  }
};

// Password validation
const validatePassword = (blur) => {
  const minLength = 6;
  if (password.value.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters.`;
  } else {
    errors.value.password = null;
  }
};

async function handleLogin() {
  validateEmail(true);
  validatePassword(true);

  if (errors.value.email || errors.value.password) {
    alert("Please correct the errors before submitting.");
    return;
  }

  try {
    // Step 1: Authenticate user with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;

    const adminRef = doc(db, "admins", user.uid)
    const adminSnap = await getDoc(adminRef)

    if (adminSnap.exists() && adminSnap.data().role === "admin"){
      localStorage.setItem("loggedInUser", JSON.stringify({ email: user.email, role: "admin"}))
      alert("Welcome, Admin!")
      router.push("/admin")
      return
    }

    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      localStorage.setItem("loggedInUser", JSON.stringify(userSnap.data()))
      alert(`Welcome, ${userSnap.data().username}!`)
      router.push("/profile")
    } else {
      alert("No user data found.")
    }
  } catch (error) {
    // Step 5: Handle login errors
    alert(`Login failed: ${error.message}`);
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
