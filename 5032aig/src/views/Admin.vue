<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Admin Dashboard</h2>

    <!-- user table -->
    <DataTable 
      :value="users" 
      responsiveLayout="stack"   
      breakpoint="576px"       
      style="min-width: 20rem" 
      class="p-datatable-striped p-datatable-gridlines shadow-sm rounded"
    >
      <Column field="username" header="Username"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="age" header="Age"></Column>
      <Column field="role" header="Role"></Column>
      <Column field="score" header="Rating"></Column>
    </DataTable>

    <!-- avergy score -->
    <div class="text-center mt-4">
      <h5>Average Rating: {{ averageRatingText }}</h5>
    </div>

    <div class="text-center mt-4">
      <button class="btn btn-danger" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useRouter } from "vue-router";

const router = useRouter();
const users = ref([]);
const averageRatingText = ref("N/A");

onMounted(() => {
  const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  if (!loggedIn || loggedIn.role !== "admin") {
    alert("Access denied!");
    router.push("/login");
    return;
  }

  // get all user
  const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");

  // get all score
  const ratings = JSON.parse(localStorage.getItem("ratings") || "[]");

  // combined the user and score
  users.value = storedUsers.map(u => {
    const rating = ratings.find(r => r.username === u.username);
    return { ...u, score: rating ? rating.score : "N/A" };
  });

  // caculate the score
  const validRatings = ratings.filter(r => typeof r.score === "number");
  if (validRatings.length > 0) {
    const total = validRatings.reduce((sum, r) => sum + r.score, 0);
    averageRatingText.value = (total / validRatings.length).toFixed(1) + " / 5";
  }
});

function logout() {
  localStorage.removeItem("loggedInUser");
  router.push("/login");
}
</script>

<style>
.p-datatable {
  font-size: 1rem;
  background: #fff;
}

.p-datatable .p-datatable-thead > tr > th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  padding: 1rem;
}

.p-datatable .p-datatable-tbody > tr > td {
  padding: 0.75rem 1rem;
}

.p-datatable .p-datatable-tbody > tr:hover {
  background-color: #f3f4f6;
}
</style>
