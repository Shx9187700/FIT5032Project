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

    <!-- Rating Section -->
    <div v-if="user" class="rating-section mt-4">
      <!-- before submit -->
      <div v-if="!hasSubmitted">
        <h4>Rate this App</h4>
        <Rating v-model="userRating" :cancel="false" />
        <button class="btn btn-success mt-2" @click="submitRating">Submit Rating</button>
      </div>

      <!-- after submit -->
      <div v-else>
        <p class="mt-2">Your Rating: {{ userRating }} / 5</p>
        <button class="btn btn-warning mt-2" @click="enableReRate">Re-rate</button>
      </div>
    </div>

    <div class="text-center mt-4">
      <button class="btn btn-danger" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Rating from "primevue/rating";

const router = useRouter();
const user = ref(null);
const userRating = ref(0);
const hasSubmitted = ref(false);

onMounted(() => {
  const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  if (!loggedIn) {
    alert("Please login first!");
    router.push("/login");
  } else {
    user.value = loggedIn;

    // read the last score
    const ratings = JSON.parse(localStorage.getItem("ratings") || "[]");
    const found = ratings.find(r => r.username === loggedIn.username);
    if (found) {
      userRating.value = found.score;
      hasSubmitted.value = true; // if already rate, just go after submit
    }
  }
});

function submitRating() {
  if (!user.value) return;

  const ratings = JSON.parse(localStorage.getItem("ratings") || "[]");

  // add or update the score
  const existingIndex = ratings.findIndex(r => r.username === user.value.username);
  if (existingIndex !== -1) {
    ratings[existingIndex].score = userRating.value;
  } else {
    ratings.push({ username: user.value.username, score: userRating.value });
  }

  localStorage.setItem("ratings", JSON.stringify(ratings));
  hasSubmitted.value = true; // change to already submit
}

function enableReRate() {
  hasSubmitted.value = false; // show the rate scetion
}

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
.rating-section {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}
</style>
