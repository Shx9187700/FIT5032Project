<template>
  <div class="admin-wrapper">
    <header class="admin-header">
      <h1>💙 Admin Dashboard</h1>
      <button class="btn-logout" @click="logout">Logout</button>
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
        <!-- 📊 Summary cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <h3>{{ totalUsers }}</h3>
            <p>Total Users</p>
          </div>
          <div class="summary-card">
            <h3>{{ ratedUsers }}</h3>
            <p>Rated Users</p>
          </div>
          <div class="summary-card">
            <h3>{{ activeAppointments }}</h3>
            <p>Active Appointments</p>
          </div>
        </div>

        <!-- 🧾 User Table -->
        <div class="section-header">
          <h2 class="section-title">🌿 User Overview</h2>
        </div>
        <p class="subtitle">
          Tip: use the top search to search across all columns; or click filter button beside a column to filter that column only.
        </p>

        <div class="table-container">
          <div class="mb-3 flex justify-end gap-1">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="globalFilter"
                class="global-search"
                placeholder="Search username, email, age, role or rating..."
              />
            </span>
            <button class="reset-btn" @click="resetFilters">Reset</button>
            <button class="export-btn" @click="exportCSV">⬇️ Export CSV</button>
            <button class="export-btn pdf-btn" @click="exportPDF">📄 Export PDF</button>
          </div>

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
            <Column field="username" header="Username" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="age" header="Age" sortable />
            <Column field="role" header="Role" sortable />
            <Column field="rating" header="Rating" sortable />
          </DataTable>
        </div>

        <!-- 📈 Appointment Chart -->
        <div class="chart-section">
          <h3 class="chart-title">📈 Appointment Activity (Past 7 Days + Next 7 Days)</h3>
          <ApexChart
            v-if="chartReady"
            type="line"
            height="300"
            width="100%"
            :options="chartOptions"
            :series="chartSeries"
          />
          <p v-else class="chart-loading">Loading chart...</p>
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
import { onAuthStateChanged, signOut } from "firebase/auth"
import DataTable from "primevue/datatable"
import Column from "primevue/column"
import InputText from "primevue/inputtext"
import ApexChart from "vue3-apexcharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const router = useRouter()
const isAdmin = ref(false)
const userData = ref([])
const totalUsers = ref(0)
const ratedUsers = ref(0)
const activeAppointments = ref(0)

const first = ref(0)
const rowsPerPage = ref(10)
const globalFilter = ref("")
const sortField = ref(null)
const sortOrder = ref(null)

const filteredUserData = computed(() => {
  return userData.value.filter((u) => {
    const g = globalFilter.value.trim().toLowerCase()
    if (!g) return true
    return (
      u.username?.toLowerCase().includes(g) ||
      u.email?.toLowerCase().includes(g) ||
      u.role?.toLowerCase().includes(g) ||
      u.rating?.toString().includes(g)
    )
  })
})

const pagedData = computed(() => {
  const start = first.value
  const end = start + rowsPerPage.value
  return filteredUserData.value.slice(start, end)
})
function onPage(e) { first.value = e.first }
function onSort(e) { sortField.value = e.sortField; sortOrder.value = e.sortOrder }
function resetFilters() { globalFilter.value = "" }

const chartSeries = ref([])
const chartOptions = ref({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  xaxis: { categories: [] },
  stroke: { curve: "smooth", width: 3 },
  colors: ["#4b7ebc"],
  dataLabels: { enabled: false },
  grid: { borderColor: "#e7eaf3" },
  tooltip: { theme: "light" }
})
const chartReady = ref(false)

async function logout() {
  await signOut(auth)
  router.push("/usermain")
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push("/usermain")
      return
    }
    const adminRef = doc(db, "admins", user.uid)
    const adminSnap = await getDoc(adminRef)
    if (adminSnap.exists() && adminSnap.data().role === "admin") {
      isAdmin.value = true
      await loadDashboardData()
      await loadChartData()
    }
  })
})

async function loadDashboardData() {
  const usersSnapshot = await getDocs(collection(db, "users"))
  const ratingsSnapshot = await getDocs(collection(db, "ratings"))
  const appointmentsSnapshot = await getDocs(collection(db, "appointments"))

  const ratingsMap = {}
  ratingsSnapshot.forEach((doc) => {
    const data = doc.data()
    if (data.userId && data.rating) {
      ratingsMap[data.userId] = data.rating
    }
  })

  const appointmentsMap = {}
  appointmentsSnapshot.forEach((doc) => {
    const data = doc.data()
    if (data.userEmail) {
      appointmentsMap[data.userEmail] = true
    }
  })

  userData.value = usersSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      username: data.username || "Unknown",
      email: data.email || "",
      age: data.age || "",
      role: data.role || "",
      rating: ratingsMap[doc.id] || "N/A"
    }
  })

  totalUsers.value = userData.value.filter((u) => u.role === "user").length
  ratedUsers.value = Object.keys(ratingsMap).length
  activeAppointments.value = Object.keys(appointmentsMap).length
}

function exportCSV() {
  const rows = filteredUserData.value
  if (!rows.length) {
    alert("No data to export.")
    return
  }
  const headers = ["Username", "Email", "Age", "Role", "Rating"]
  const csvContent = [
    headers.join(","),
    ...rows.map((u) => [u.username, u.email, u.age, u.role, u.rating].join(","))
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.setAttribute("download", "user_data.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportPDF() {
  if (!filteredUserData.value.length) {
    alert("No data to export.")
    return
  }

  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text("Admin User Data Report", 14, 20)
  doc.setFontSize(11)
  doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 28)

  const headers = ["Username", "Email", "Age", "Role", "Rating"]
  const rows = filteredUserData.value.map((u) => [
    u.username || "",
    u.email || "",
    u.age || "",
    u.role || "",
    u.rating || "N/A"
  ])

  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [70, 118, 181] },
  })
  doc.save("user_data.pdf")
}

async function loadChartData() {
  const snapshot = await getDocs(collection(db, "appointments"))
  const all = snapshot.docs.map((doc) => doc.data())
  const today = new Date()
  const days = []
  const counts = []

  for (let i = -7; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]

    const count = all.filter((a) => {
      const t = a.start || a.date || a.time || ""
      return typeof t === "string" && t.startsWith(dateStr)
    }).length

    days.push(dateStr)
    counts.push(count)
  }

  chartOptions.value.xaxis.categories = days
  chartSeries.value = [{ name: "Appointments", data: counts }]
  chartReady.value = true
}

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

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-logout {
  background-color: #dc3545;
  border: none;
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}
.btn-logout:hover {
  background-color: #b02a37;
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

.summary-cards {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
  gap: 1.5rem;
}
.summary-card {
  flex: 1;
  background: #f2f7fd;
  border-radius: 14px;
  text-align: center;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.summary-card h3 {
  color: #4b7ebc;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.summary-card p {
  color: #64748b;
  font-size: 0.95rem;
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

/* export btn */
.export-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.45rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.export-btn:hover {
  background: #0d946b;
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

.soft-table :deep(.p-datatable-table) {
  table-layout: fixed !important;
  width: 100% !important;
}
.table-container {
  width: 100%;
  margin: 0 auto;
  max-width: none;
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

.chart-section {
  margin-top: 2.5rem;
  background: #ffffff;
  border-radius: 18px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
}
.chart-title {
  font-size: 1.2rem;
  color: #3f6fa0;
  font-weight: 600;
  margin-bottom: 1rem;
}

.admin-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6fbff 0%, #e8f2fa 100%);
  padding: 3rem 1rem;
  font-family: "Inter", "Poppins", sans-serif;
  color: #374151;
  position: relative;
}

/* 标题居中 + logout固定右上角 */
.admin-header {
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
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
.btn-logout {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #dc3545;
  border: none;
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}
.btn-logout:hover {
  background-color: #b02a37;
}

/* 卡片样式 */
.summary-cards {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
  gap: 1.5rem;
}
.summary-card {
  flex: 1;
  background: #f2f7fd;
  border-radius: 14px;
  text-align: center;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.summary-card h3 {
  color: #4b7ebc;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.summary-card p {
  color: #64748b;
  font-size: 0.95rem;
}

/* 图表部分 */
.chart-section {
  margin-top: 2.5rem;
  background: #ffffff;
  border-radius: 18px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
}
.chart-title {
  font-size: 1.2rem;
  color: #3f6fa0;
  font-weight: 600;
  margin-bottom: 1rem;
}
.chart-loading {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}
</style>
