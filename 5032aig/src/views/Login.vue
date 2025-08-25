<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <h1 class="text-center">Login</h1>
        <form @submit.prevent="handleLogin">
          <!-- Username -->
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" id="username"
              v-model="formData.username"
              @blur="() => validateName(true)"
              @input="() => validateName(false)">
            <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
          </div>

          <!-- Password -->
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password"
              v-model="formData.password"
              @blur="() => validatePassword(true)"
              @input="() => validatePassword(false)">
            <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
          </div>

          <!-- Buttons -->
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Login</button>
            <button type="button" class="btn btn-secondary" @click="goToRegister">Register</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const formData = ref({
  username: '',
  password: ''
});

const errors = ref({
  username: null,
  password: null
});

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = "Username must be at least 3 characters.";
  } else {
    errors.value.username = null;
  }
};

const validatePassword = (blur) => {
  const password = formData.value.password;
  const minLength = 6;
  if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`;
  } else {
    errors.value.password = null;
  }
};

const handleLogin = () => {
  validateName(true);
  validatePassword(true);
  if (!errors.value.username && !errors.value.password) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find(u => u.username === formData.value.username && u.password === formData.value.password);

    if (found) {
      alert(`Welcome back, ${found.username}!`);
      localStorage.setItem("loggedInUser", JSON.stringify(found));
    } else {
      alert("Invalid username or password.");
    }
  }
};

const goToRegister = () => {
  router.push("/register");
};
</script>


<style scoped>
   .card {
   border: 1px solid #ccc;
   border-radius: 10px;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
   }
   .card-header {
   background-color: #275FDA;
   color: white;
   padding: 10px;
   border-radius: 10px 10px 0 0;
   }
   .list-group-item {
   padding: 10px;
   }
</style>