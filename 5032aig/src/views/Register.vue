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

      <!-- Age range -->
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

    <!-- Back to Login -->
    <p class="mt-3">
      Already have an account? 
      <router-link to="/login" class="btn btn-link">Login here</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const email = ref('')
const password = ref('')
const age = ref(null)
const errors = ref({
  username: null,
  email: null,
  password: null
})
const router = useRouter()

// sanitizeInput: for XSS attack prevention
function sanitizeInput(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
}

// validateName: user at least need 3 Character
const validateName = (blur) => {
  if (username.value.length < 3) {
    if (blur) errors.value.username = 'Username must be at least 3 characters.'
  } else {
    errors.value.username = null
  }
}

// validateEmail: check the email structure
const validateEmail = (blur) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    if (blur) errors.value.email = 'Invalid email format.'
  } else {
    errors.value.email = null
  }
}

function hashPassword(pwd) {
  return btoa(pwd)
}

// validatePassword: password at least need 6 Character and one upper one number
const validatePassword = (blur) => {
  const minLength = 6
  const strongPattern = /^(?=.*[A-Z])(?=.*\d).+$/
  if (password.value.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`
  } else if (!strongPattern.test(password.value)) {
    if (blur) errors.value.password = 'Password must include at least 1 uppercase letter and 1 number.'
  } else {
    errors.value.password = null
  }
}

// handleRegister: check enter, check username and email, store to localStorage
function handleRegister() {
  validateName(true)
  validateEmail(true)
  validatePassword(true)

  if (errors.value.username || errors.value.email || errors.value.password) {
    return
  }

  if (age.value < 12 || age.value > 35) {
    alert('Age must be between 12 and 35')
    return
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]')

  // check if exist same user or email
  const exists = users.find(u => u.username === username.value || u.email === email.value)
  if (exists) {
    alert('Username or Email already exists.')
    return
  }

  // new user for role = "user"
  users.push({ 
    username: sanitizeInput(username.value), 
    email: sanitizeInput(email.value), 
    password: hashPassword(password.value),
    age: age.value, 
    role: 'user'
  })

  localStorage.setItem('users', JSON.stringify(users))

  alert('Registration successful! Redirecting to login...')
  router.push('/login')
}
</script>

<style>
.container {
  max-width: 600px;
}
</style>