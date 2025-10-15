<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>AIG Login</h2>

      <form @submit.prevent="handleLogin" role="form" aria-label="Login Form">
        <div class="mb-3 text-start">
          <label for="email" class="form-label">Email</label>
          <input 
            id="email"
            v-model="email"
            type="email"
            class="form-control"
            required
            aria-required="true"
          />
        </div>

        <div class="mb-3 text-start">
          <label for="password" class="form-label">Password</label>
          <input 
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            required
            aria-required="true"
          />
        </div>

        <div class="d-flex justify-content-center gap-3">
          <button type="submit" class="btn btn-primary" aria-label="Login">Login</button>
          <router-link to="/register" class="btn btn-secondary" aria-label="Go to Register">Register</router-link>
        </div>
      </form>
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
      router.push("/usermain")
    } else {
      alert("No user data found.")
    }
  } catch (error) {
    alert(`Login failed: ${error.message} . Please enter correct email or password`);
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
}

.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #c7e9ff 0%, #f7faff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Poppins", sans-serif;
}

.auth-card {
  background: #fff;
  padding: 40px 50px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
  animation: fadeIn 0.4s ease;
}

.auth-card h2 {
  color: #3a86ff;
  font-weight: 700;
  margin-bottom: 25px;
}

.form-label {
  font-weight: 600;
  color: #333;
}

.form-control {
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #d0d7e2;
}

.form-control:focus {
  border-color: #3a86ff;
  box-shadow: 0 0 0 0.2rem rgba(58, 134, 255, 0.2);
}

.btn-primary {
  background-color: #3a86ff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: 0.3s;
}

.btn-primary:hover {
  background-color: #2f6fe0;
}

.btn-secondary {
  background-color: #ffd166;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  color: #333;
  transition: 0.3s;
}

.btn-secondary:hover {
  background-color: #fbb13c;
}

p {
  margin-top: 15px;
  color: #444;
}

a.btn-link {
  color: #3a86ff;
  text-decoration: none;
  font-weight: 600;
}

a.btn-link:hover {
  text-decoration: underline;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
