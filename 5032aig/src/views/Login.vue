<template>
  <div class="container mt-5">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin" class="w-50">
      <!-- Email -->
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>

      <!-- Password -->
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" required />
      </div>

      <button type="submit" class="btn btn-success">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");

function handleLogin() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const found = users.find(u => u.email === email.value && u.password === password.value);

  if (found) {
    alert(`Welcome back, ${found.username}!`);
    localStorage.setItem("loggedInUser", JSON.stringify(found));
  } else {
    alert("Invalid email or password");
  }
}
</script>

<style>
.container {
  max-width: 600px;
}
</style>
