<template>
  <div class="container mt-5">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister" class="w-50">
      <!-- Username -->
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input v-model="username" type="text" class="form-control" required />
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>

      <!-- Password -->
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" minlength="6" required />
      </div>

      <!-- Age (12-25) -->
      <div class="mb-3">
        <label class="form-label">Age</label>
        <input v-model.number="age" type="number" class="form-control" min="12" max="25" required />
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
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const email = ref("");
const password = ref("");
const age = ref(null);
const router = useRouter();

function handleRegister() {
  if (age.value < 12 || age.value > 25) {
    alert("Age must be between 12 and 25");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  users.push({ username: username.value, email: email.value, password: password.value, age: age.value });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! Redirecting to login...");
  router.push("/login"); // automatically go back to login
}
</script>

<style>
.container {
  max-width: 600px;
}
</style>
