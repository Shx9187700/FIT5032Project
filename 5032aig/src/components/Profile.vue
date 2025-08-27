<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">User Profile</h2>
    
    <DataTable v-if = "user" :value="[user]" responsiveLayout = "scroll" style="width: 100%;">
      <Column field="username" header="Username"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="age" header="Age"></Column>
    </DataTable>
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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