<template>
  <div class="container mt-5">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister" class="w-50">
      <!-- Username -->
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input 
          v-model="username" 
          type="text" 
          class="form-control" 
          required
          @blur="() => validateName(true)"   
          @input="() => validateName(false)"
        />
        <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
      </div>

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
          minlength="6" 
          required
          @blur="() => validatePassword(true)"
          @input="() => validatePassword(false)"
        />
        <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
      </div>

      <!-- Age -->
      <div class="mb-3">
        <label class="form-label">Age</label>
        <input 
          v-model.number="age" 
          type="number" 
          class="form-control" 
          min="12" max="35" 
          required 
        />
      </div>

      <button type="submit" class="btn btn-primary">Register</button>
    </form>

    <!-- Link back to login -->
    <p class="mt-3">
      Already have an account? 
      <router-link to="/login" class="btn btn-link">Login here</router-link>
    </p>
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
  if (age.value < 12 || age.value > 35) {
    alert("Age must be between 12 and 35.")
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

<style>
.container {
  max-width: 600px;
}
</style>
