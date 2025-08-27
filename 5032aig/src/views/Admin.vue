<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Admin Dashboard</h2>

    <DataTable :value="users" style="width: 100%">
      <Column field="username" header="Username"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="age" header="Age"></Column>
    </DataTable>

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

onMounted(() => {
  const data = JSON.parse(localStorage.getItem("users") || "[]");
  users.value = data;
});

function logout() {
  router.push("/login");
}
</script>
