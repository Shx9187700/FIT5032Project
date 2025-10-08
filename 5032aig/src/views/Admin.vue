<template>
  <div class="admin-wrapper">
    <header class="admin-header">
      <h1>💙 Admin Dashboard</h1>
      <p>Monitor users and their emotional well-being insights</p>
    </header>

    <!-- 未授权 -->
    <div v-if="!isAdmin" class="unauthorized">
      <div class="unauth-card">
        <h3>🚫 Access Denied</h3>
        <p>This page is restricted to administrators only.</p>
        <button class="btn-main" @click="goBackLogin">Back to Login</button>
      </div>
    </div>

    <!-- 授权后 Dashboard -->
    <div v-else class="dashboard fade-in">
      <div class="card shadow">
        <div class="section-header">
          <h2 class="section-title">🌿 User Overview</h2>
        </div>
        <p class="subtitle">
          Tip: use the top search to search across all columns; or click filter button beside a column to filter that column only.
        </p>

        <div class="table-container">
          <!-- 全局搜索 -->
          <div class="mb-3 flex justify-end gap-1">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="globalFilter"
                class="global-search"
                placeholder="Search username, email, age, role or rating... e.g. 123@gmail.com"
              />
            </span>
            <button class="reset-btn" @click="resetFilters">Reset</button>
            <span class="tip-text">Tip: use Reset button to clear all search.</span>
          </div>

          <!-- 数据表 -->
          <DataTable
            :value="pagedData"
            dataKey="email"
            paginator
            lazy
            :rows="rowsPerPage"
            :totalRecords="filteredUserData.length"
            :first="first"
            @page="onPage"
            @sort="onSort"
            :sortField="sortField"
            :sortOrder="sortOrder"
            responsiveLayout="scroll"
            class="soft-table"
            paginatorTemplate="PrevPageLink PageLinks NextPageLink"
          >
            <!-- Username -->
            <Column field="username" sortable>
              <template #header = "{ sortIcon }">
                <TableHeaderFilter
                  label="Username"
                  field="username"
                  v-model:filterValue="columnFilters.username"
                  v-model:visible="showFilterBox.username"
                  @toggle="toggleFilter"
                  @apply="applyFilter"
                >
                  <span v-html="sortIcon"></span>
              </TableHeaderFilter>
              </template>
            </Column>

            <!-- Email -->
            <Column field="email" sortable>
              <template #header = "{ sortIcon }">
                <TableHeaderFilter
                  label="Email"
                  field="email"
                  v-model:filterValue="columnFilters.email"
                  v-model:visible="showFilterBox.email"
                  @toggle="toggleFilter"
                  @apply="applyFilter"
                >
                  <span v-html="sortIcon"></span>
                </TableHeaderFilter>
              </template>
            </Column>

            <!-- Age -->
            <Column field="age" sortable>
              <template #header = "{ sortIcon }">
                <TableHeaderFilter
                  label="age"
                  field="age"
                  v-model:filterValue="columnFilters.age"
                  v-model:visible="showFilterBox.age"
                  @toggle="toggleFilter"
                  @apply="applyFilter"
                >
                  <span v-html="sortIcon"></span>
                </TableHeaderFilter>
              </template>
            </Column>

            <!-- Role -->
            <Column field="role" sortable>
              <template #header = "{ sortIcon }">
                <TableHeaderFilter
                  label="role"
                  field="role"
                  v-model:filterValue="columnFilters.role"
                  v-model:visible="showFilterBox.role"
                  @toggle="toggleFilter"
                  @apply="applyFilter"
                >
                  <span v-html="sortIcon"></span>
                </TableHeaderFilter>
              </template>
            </Column>

            <!-- Rating -->
            <Column field="rating" sortable>
              <template #header = "{ sortIcon }">
                <TableHeaderFilter
                  label="rating"
                  field="rating"
                  v-model:filterValue="columnFilters.rating"
                  v-model:visible="showFilterBox.rating"
                  @toggle="toggleFilter"
                  @apply="applyFilter"
                >
                  <span v-html="sortIcon"></span>
                </TableHeaderFilter>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <button class="btn-logout" @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db, auth } from "../firebase/init.js"
import { onAuthStateChanged, signOut } from "firebase/auth"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import InputText from "primevue/inputtext"
import TableHeaderFilter from "@/components/TableHeaderFilter.vue"

const router = useRouter()
const isAdmin = ref(false)
const userData = ref([])

// For 10 rows per page
const first = ref(0)
const rowsPerPage = ref(10)

const pagedData = computed(() => {
  const start = first.value
  const end = start + rowsPerPage.value
  const pagedData = filteredUserData.value.slice(start, end)

  const filled = [...pagedData]
  while (filled.length < rowsPerPage.value){
    filled.push({ username:"", email:"", age:"", role:"", rating:""})
  }
  return filled
})

function onPage(event) {
  first.value = event.first
}

//for filter box
const globalFilter = ref("")
const columnFilters = ref({
  username: "",
  email: "",
  age: "",
  role: "",
  rating: ""
})
const showFilterBox = ref({
  username: false,
  email: false,
  age: false,
  role: false,
  rating: false
})

function toggleFilter(key) {
  Object.keys(showFilterBox.value).forEach(k => showFilterBox.value[k] = false)
  showFilterBox.value[key] = true
}
function applyFilter(key) {
  showFilterBox.value[key] = false
}
function resetFilters() {
  globalFilter.value = ""
  Object.keys(columnFilters.value).forEach(k => (columnFilters.value[k] = ""))
  Object.keys(showFilterBox.value).forEach(k => (showFilterBox.value[k] = false))
}

const sortField = ref(null)
const sortOrder = ref(null)

function onSort(event){
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
}


async function logout() {
  await signOut(auth)
  alert("You have been logged out.")
  router.push("/login")
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
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

const filteredUserData = computed(() => {
  let filtered = userData.value.filter((u) => {
    const g = globalFilter.value.trim().toLowerCase()
    if (!g) return true
    return (
      u.username?.toLowerCase().includes(g) ||
      u.email?.toLowerCase().includes(g) ||
      u.age?.toString().includes(g) ||
      u.role?.toLowerCase().includes(g) ||
      u.rating?.toString().includes(g)
    )
  })

  filtered = filtered.filter((u) => {
    return Object.keys(columnFilters.value).every((key) => {
      const val = columnFilters.value[key].trim().toLowerCase()
      if (!val) return true
      return (u[key] || "").toString().toLowerCase().includes(val)
    })
  })

  // order logic
  if (sortField.value) {
    filtered.sort((a, b) => {
      const valA = a[sortField.value] ?? ""
      const valB = b[sortField.value] ?? ""
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder.value === 1 ? valA - valB : valB - valA
      }
      return sortOrder.value === 1
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString())
    })
  }

  return filtered
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
  max-width: 80%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
.section-title {
  font-weight: 600;
  color: #4b7ebc;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.subtitle-reset {
  text-align: center;
  color: #94a3b8;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

/* search and button */
.p-input-icon-left .global-search {
  background: #f2f7fd;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  padding-left: 1rem;
}

.global-search {
  width: 520px;
  max-width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #4b5563;
  font-size: 0.95rem;
}
.global-search::placeholder {
  color: #9aa5b1;
  opacity: 0.6;
}

.tip-text {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  white-space: nowrap;
}

.reset-btn {
  background: #4676b5;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.45rem 1rem;
  cursor: pointer;
}
.reset-btn:hover {
  background: #365a8c;
}

/* table style */
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
  padding: 0.85rem 1.2rem;
  height: 3rem;
}
.soft-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #f8fbff !important;
  transition: all 0.3s ease;
}

.soft-table :deep(.p-paginator) {
  justify-content: center;
  border: none;
  background: transparent;
  margin-top: 1rem;
}

.soft-table :deep(.p-paginator .p-paginator-page) {
  color: #4676b5;
  border-radius: 8px;
  margin: 0 3px;
  transition: all 0.2s ease;
  border: 1px solid #d6e4ff;
}

.soft-table :deep(.p-paginator .p-paginator-page.p-highlight) {
  background-color: #4676b5;
  color: white;
  border: none;
  font-weight: 600;
  box-shadow: 0 0 4px rgba(70, 118, 181, 0.4);
}

.soft-table :deep(.p-paginator .p-paginator-icon) {
  color: #4676b5;
}

/* filter btn */
.filter-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.filter-btn svg {
  transition: all 0.25s ease;
}
.filter-btn:hover svg {
  fill: #1d4ed8;
  transform: scale(1.1);
}
.filter-box {
  margin-top: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.filter-box input {
  width: 120px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
.apply-btn {
  background: #4676b5;
  border: none;
  color: #fff;
  border-radius: 6px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
}
.apply-btn:hover {
  background: #3a5c8e;
}

/* noauth and logout */
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
.btn-logout {
  background-color: #dc3545;
  display: block;
  margin: 2rem auto;
  border: none;
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
}
.btn-logout:hover {
  background-color: #c82333;
}

/* 动画 */
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
