<template>
  <div class="admin-wrapper">
    <header class="admin-header">
      <h1>💙 Admin Dashboard</h1>
      <p>Monitor users and their emotional well-being insights</p>
    </header>

    <div v-if="!isAdmin" class="unauthorized">
      <div class="unauth-card">
        <h3>🚫 Access Denied</h3>
        <p>This page is restricted to administrators only.</p>
        <button class="btn-main" @click="goBackLogin">Back to Login</button>
      </div>
    </div>

    <div v-else class="dashboard fade-in">
      <div class="card shadow">
        <h2 class="section-title">🌿 User Overview</h2>
        <p class="subtitle">A calm and clear view of all users and their feedback</p>

        <div class="table-container">
          <DataTable
            :value="filledRows"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10]"
            responsiveLayout="scroll"
            class="soft-table"
          >
            <Column field="username" header="Username" />
            <Column field="email" header="Email" />
            <Column field="age" header="Age" />
            <Column field="role" header="Role" />
            <Column field="rating" header="Rating" />
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db, auth } from "../firebase/init.js"
import { onAuthStateChanged } from "firebase/auth"
import DataTable from "primevue/datatable"
import Column from "primevue/column"

const router = useRouter()
const isAdmin = ref(false)
const userData = ref([])

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please log in first.")
      router.push("/login")
      return
    }

    const adminRef = doc(db, "admins", user.uid)
    const adminSnap = await getDoc(adminRef)

    if (adminSnap.exists() && adminSnap.data().role === "admin") {
      isAdmin.value = true
      await loadUserData()
    } else {
      isAdmin.value = false
    }
  })
})

async function loadUserData() {
  const usersSnapshot = await getDocs(collection(db, "users"))
  const ratingsSnapshot = await getDocs(collection(db, "ratings"))

  const ratingsMap = {}
  ratingsSnapshot.forEach((doc) => {
    const data = doc.data()
    ratingsMap[data.userId] = data.rating
  })

  userData.value = usersSnapshot.docs.map((doc) => {
    const user = doc.data()
    return {
      username: user.username,
      email: user.email,
      age: user.age,
      role: user.role,
      rating: ratingsMap[doc.id] || "N/A",
    }
  })
}

// 保持 10 行显示
const filledRows = computed(() => {
  const rows = [...userData.value]
  while (rows.length < 10) {
    rows.push({ username: "", email: "", age: "", role: "", rating: "" })
  }
  return rows
})

function goBackLogin() {
  router.push("/login")
}
</script>

<style scoped>
.admin-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6fbff 0%, #e8f2fa 100%);
  padding: 3rem 1rem;
  font-family: "Inter", "Poppins", sans-serif;
  color: #374151;
}

.admin-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.admin-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #4676b5;
}
.admin-header p {
  color: #7a8fa6;
  font-size: 1rem;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  padding: 2rem;
  margin: 0 auto;
  max-width: 950px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
.section-title {
  font-weight: 600;
  color: #4b7ebc;
}
.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 🌸 Soft Table (no lines, left-aligned) */
.soft-table :deep(.p-datatable) {
  border: none;
  background-color: transparent;
}
.soft-table :deep(.p-datatable-thead > tr > th) {
  background-color: #f2f7fd;
  color: #3f6fa0;
  font-weight: 600;
  text-align: left;
  border: none;
  padding: 0.9rem 1.2rem;
}
.soft-table :deep(.p-datatable-tbody > tr > td) {
  border: none;
  text-align: left;
  color: #475569;
  background-color: #ffffff;
  padding: 0.9rem 1.2rem;
  min-height: 3.5rem;
}
.soft-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f8fbff !important;
  box-shadow: inset 0 0 4px rgba(100, 150, 255, 0.15);
  transition: all 0.3s ease;
}
.soft-table :deep(.p-paginator) {
  background-color: transparent;
  border: none;
  justify-content: center;
  margin-top: 0.5rem;
}

/* Unauthorized card */
.unauthorized {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 75vh;
}
.unauth-card {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  text-align: center;
}
.btn-main {
  background-color: #4676b5;
  border: none;
  color: white;
  padding: 0.6rem 1.3rem;
  border-radius: 12px;
  margin-top: 1rem;
  cursor: pointer;
  font-weight: 500;
}
.btn-main:hover {
  background-color: #3a5c8e;
}

.fade-in {
  animation: fadeIn 0.7s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
