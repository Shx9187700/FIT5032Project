<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>AIG Register</h2>

      <form @submit.prevent="handleRegister">
        <!-- Username -->
        <div class="mb-3 text-start">
          <label for="username" class="form-label">Username</label>
          <input 
            id="username"
            v-model="username" 
            type="text" 
            class="form-control" 
            aria-required="true"
            required
            @blur="() => validateName(true)"   
            @input="() => validateName(false)"
          />
          <div v-if="errors.username" class="text-danger mt-1">{{ errors.username }}</div>
        </div>

        <!-- Email -->
        <div class="mb-3 text-start">
          <label class="form-label">Email</label>
          <input 
            v-model="email" 
            type="email" 
            class="form-control"
            aria-required="true" 
            required
            @blur="() => validateEmail(true)"
            @input="() => validateEmail(false)"
          />
          <div v-if="errors.email" class="text-danger mt-1">{{ errors.email }}</div>
        </div>

        <!-- Password -->
        <div class="mb-3 text-start">
          <label class="form-label">Password</label>
          <input 
            v-model="password" 
            type="password" 
            class="form-control"
            aria-required="true" 
            minlength="6" 
            required
            @blur="() => validatePassword(true)"
            @input="() => validatePassword(false)"
          />
          <div v-if="errors.password" class="text-danger mt-1">{{ errors.password }}</div>
        </div>

        <!-- Age -->
        <div class="mb-3 text-start">
          <label class="form-label">Age</label>
          <input 
            v-model.number="age" 
            type="number" 
            class="form-control" 
            min="15" max="35" 
            required 
          />
        </div>

        <button type="submit" class="btn btn-primary w-100 mt-3">Register</button>
      </form>

      <p class="mt-3">
        Already have an account? 
        <router-link to="/login" class="btn btn-link">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore"
import { auth, db } from "../firebase/init.js"

const username = ref("")                                            
const email = ref("")
const password = ref("")
const age = ref(null)
const errors = ref({
  username: null,
  email: null,
  password: null
})
const router = useRouter()

function sanitizeInput(str) {
  // Replace special characters to prevent script injection
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}


// Username must be at least 3 chars
const validateName = (blur) => {
  if (username.value.length < 3) {
    if (blur) errors.value.username = "Username must be at least 3 characters."
  } else {
    errors.value.username = null
  }
}

// Email format check
const validateEmail = (blur) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    if (blur) errors.value.email = "Invalid email format."
  } else {
    errors.value.email = null
  }
}

// Password strength check
const validatePassword = (blur) => {
  const minLength = 6
  const strongPattern = /^(?=.*[A-Z])(?=.*\d).+$/
  if (password.value.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`
  } else if (!strongPattern.test(password.value)) {
    if (blur) errors.value.password = "Password must include at least 1 uppercase letter and 1 number."
  } else {
    errors.value.password = null
  }
}

//  Registration Logic
async function handleRegister() {
  // Step 1: Local input validation
  validateName(true)
  validateEmail(true)
  validatePassword(true)

  if (errors.value.username || errors.value.email || errors.value.password) {
    alert("Please fix the errors before submitting.")
    return
  }

  // Step 2: Age check
  if (age.value < 15 || age.value > 35) {
    alert("Age must be between 15 and 35.")
    return
  }

  // Step 3: Prevent 'admin' registration
  if (username.value.toLowerCase() === "admin") {
    alert("The username 'admin' is reserved and cannot be used.")
    return
  }

  try {
    // Step 4: Register user via Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // Step 5: Save extra user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: sanitizeInput(username.value),
      email: sanitizeInput(email.value),
      age: age.value,
      role: "user"
    })

    alert(`Registration successful! Welcome, ${user.email}`)
    router.push("/login")
  } catch (error) {
    // Firebase automatically returns descriptive error messages
    alert(`Registration failed: ${error.message}`)
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
