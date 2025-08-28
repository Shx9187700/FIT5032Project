<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">User Profile</h2>

    <div v-if="user" class="profile-info">
      <p><strong>Username:</strong> {{ user.username }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Age:</strong> {{ user.age }}</p>
    </div>

    <div v-else class="text-center">
      <p>No user logged in.</p>
    </div>

    <div class="text-center mt-4">
      <button class="btn btn-danger" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const user = ref(null);

onMounted(() => {
  const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  if (!loggedIn) {
    alert("Please login first!");
    router.push("/login");
  } else {
    user.value = loggedIn;
  }
});

function logout() {
  localStorage.removeItem("loggedInUser");
  router.push("/login");
}
</script>

<style scoped>
.profile-info {
  font-size: 1.2rem;
  line-height: 2;
  max-width: 500px;
  margin: 0 auto;
}
</style>