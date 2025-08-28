<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Admin Dashboard</h2>

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
