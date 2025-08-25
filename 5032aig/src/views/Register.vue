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

      <!-- Age (Validation: 12-25) -->
      <div class="mb-3">
        <label class="form-label">Age</label>
        <input v-model.number="age" type="number" class="form-control" min="12" max="25" required />
      </div>

      <button type="submit" class="btn btn-primary">Register</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const username = ref("");
const email = ref("");
const password = ref("");
const age = ref(null);

function handleRegister() {
  // Age validation
  if (age.value < 12 || age.value > 25) {
    alert("Age must be between 12 and 25");
    return;
  }

  // Save to localStorage (simulate database)
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  users.push({ username: username.value, email: email.value, password: password.value, age: age.value });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");
}
</script>

<style>
.container {
  max-width: 600px;
}
</style>
