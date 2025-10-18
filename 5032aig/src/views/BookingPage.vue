<template>
  <div class="booking-page">
    <div class="hero">
      <h1 class="page-title">📅 Book a Session</h1>
      <p class="page-subtitle">
        Select your preferred time slot — only one appointment per slot allowed.
      </p>
    </div>

    <div class="calendar-container card-glass">
      <div id="calendar"></div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Booking</h3>
        <p>
          <strong>Doctor:</strong> {{ selectedDoctor.name }} <br />
          <strong>Time:</strong> {{ selectedSlot.start.toLocaleString() }}
        </p>
        <div class="btn-group">
          <button class="btn-confirm" @click="confirmBooking">Confirm</button>
          <button class="btn-cancel" @click="cancelBooking">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="myAppointments.length" class="card-glass booking-table">
      <div class="section-header">
        <h2 class="section-title">🩺 My Appointments</h2>
      </div>

      <p class="subtitle">
        Search or sort your existing bookings. Click "Cancel" to remove a booking.
      </p>

      <div class="table-container">
        <div class="mb-3 flex justify-end gap-1">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model="globalFilter"
              class="global-search"
              placeholder="Search time or doctor..."
              aria-label="Search booking table"
            />
          </span>
          <button class="reset-btn" @click="resetFilters">Reset</button>
        </div>

        <DataTable
          :value="pagedData"
          dataKey="id"
          paginator
          lazy
          :rows="rowsPerPage"
          :totalRecords="filteredAppointments.length"
          :first="first"
          @page="onPage"
          @sort="onSort"
          :sortField="sortField"
          :sortOrder="sortOrder"
          responsiveLayout="scroll"
          class="soft-table"
          paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        >
          <Column field="start" sortable>
            <template #header="{ sortIcon }">
              <TableHeaderFilter
                label="Time"
                field="start"
                v-model:filterValue="columnFilters.start"
                v-model:visible="showFilterBox.start"
                @toggle="toggleFilter"
                @apply="applyFilter"
              >
                <span v-html="sortIcon"></span>
              </TableHeaderFilter>
            </template>
            <template #body="slotProps">
              {{ slotProps.data.start ? new Date(slotProps.data.start).toLocaleString() : "" }}
            </template>
          </Column>

          <Column field="doctorName" sortable>
            <template #header="{ sortIcon }">
              <TableHeaderFilter
                label="Doctor"
                field="doctorName"
                v-model:filterValue="columnFilters.doctorName"
                v-model:visible="showFilterBox.doctorName"
                @toggle="toggleFilter"
                @apply="applyFilter"
              >
                <span v-html="sortIcon"></span>
              </TableHeaderFilter>
            </template>
          </Column>

          <Column header="Action">
            <template #body="slotProps">
                <button
                    v-if="slotProps.data.start && slotProps.data.doctorName"
                    class="cancel-btn"
                    @click="confirmCancel(slotProps.data)"
                >
                    Cancel
                </button>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Calendar } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import axios from "axios";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import TableHeaderFilter from "@/components/TableHeaderFilter.vue";
import { db, auth } from "../firebase/init.js";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  addDoc,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const currentUser = ref(null);
onAuthStateChanged(auth, (user) => (currentUser.value = user));

const doctors = ref([]);
const events = ref([]);
const showModal = ref(false);
const selectedSlot = ref(null);
const selectedDoctor = ref(null);
const myAppointments = ref([]);

let calendar = null;
let unsubscribe = null;

const loadDoctors = async () => {
  const snapshot = await getDocs(collection(db, "doctors"));
  doctors.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const generateSlots = (bookedEvents = []) => {
  const slots = [];
  const now = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(now.getDate() + 14);

  for (let d = new Date(now); d <= twoWeeksLater; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    const doctor = doctors.value.find((doc) => doc.dayOfWeek === day);
    if (doctor) {
      for (let hour = 9; hour < 12; hour += 0.5) {
        const start = new Date(d);
        start.setHours(Math.floor(hour), hour % 1 ? 30 : 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 30);

        const isBooked = bookedEvents.some(
          (e) =>
            e.doctorId === doctor.id &&
            new Date(e.start).getTime() === start.getTime()
        );

        slots.push({
          title: isBooked
            ? `Booked with ${doctor.name}`
            : `Available - ${doctor.name}`,
          start,
          end,
          doctorId: doctor.id,
          backgroundColor: isBooked ? "#F8BBD0" : "#B3E5FC",
          borderColor: isBooked ? "#F48FB1" : "#81D4FA",
        });
      }
    }
  }
  return slots;
};

const loadAppointments = () => {
  const q = query(collection(db, "appointments"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const booked = [];
    snapshot.forEach((doc) => booked.push({ id: doc.id, ...doc.data() }));
    events.value = booked;
    myAppointments.value = booked.filter(
      (b) => b.userEmail === currentUser.value?.email
    );
    refreshCalendar();
  });
};

const refreshCalendar = () => {
  if (!calendar) return;
  calendar.removeAllEvents();
  calendar.addEventSource(generateSlots(events.value));
};

const handleSlotClick = (info) => {
  const clickedEvent = info.event;
  const doctor = doctors.value.find((d) =>
    clickedEvent.title.includes(d.name)
  );
  if (clickedEvent.title.startsWith("Booked")) {
    alert("This slot is already booked by someone else.");
    return;
  }
  selectedSlot.value = { start: clickedEvent.start, end: clickedEvent.end };
  selectedDoctor.value = doctor;
  showModal.value = true;
};

const confirmBooking = async () => {
  if (!currentUser.value) {
    alert("Please log in first.");
    showModal.value = false;
    return;
  }

  const startISO = selectedSlot.value.start.toLocaleString("sv-SE");
  const endISO = selectedSlot.value.end.toLocaleString("sv-SE");
  const email = currentUser.value.email;

  await addDoc(collection(db, "appointments"), {
    doctorId: selectedDoctor.value.id,
    doctorName: selectedDoctor.value.name,
    start: startISO,
    end: endISO,
    userEmail: email,
    createdAt: new Date().toISOString(),
  });

  const timeText = `${selectedDoctor.value.name} on ${selectedSlot.value.start.toLocaleString()}`;

  const payload = {
    bulk: [
      { to: email, subject: "Booking Confirmation", text: `Your appointment with ${timeText} has been successfully booked.` },
      { to: selectedDoctor.value.email, subject: "New Appointment Booked", text: `User ${email} booked your session at ${timeText}.` },
      { to: "hsha0055@student.monash.edu", subject: `New Booking from ${email}`, text: `User ${email} booked ${timeText}.` },
    ],
  };

  try {
    await axios.post(
      "https://us-central1-week7-hongxiang.cloudfunctions.net/sendEmail",
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );
  } catch (err) {
    console.error("❌ Email failed:", err);
  }

  alert("✅ Booking confirmed!");
  showModal.value = false;
  refreshCalendar();
};

async function confirmCancel(appt) {
  const confirmed = confirm(`Cancel your booking with ${appt.doctorName} on ${new Date(appt.start).toLocaleString()}?`);
  if (!confirmed) return;

  await deleteDoc(doc(db, "appointments", appt.id));

  const payload = {
    bulk: [
      { to: appt.userEmail, subject: "Booking Cancelled", text: `Your booking with ${appt.doctorName} on ${new Date(appt.start).toLocaleString()} has been cancelled.` },
      { to: appt.doctorEmail || "doctor@example.com", subject: "Booking Cancelled", text: `User ${appt.userEmail} cancelled their booking on ${new Date(appt.start).toLocaleString()}.` },
      { to: "hsha0055@student.monash.edu", subject: `Booking Cancelled by ${appt.userEmail}`, text: `User ${appt.userEmail} cancelled their booking with ${appt.doctorName}.` },
    ],
  };

  try {
    await axios.post(
      "https://us-central1-week7-hongxiang.cloudfunctions.net/sendEmail",
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );
  } catch (err) {
    console.error("❌ Cancel email failed:", err);
  }

  alert("🗑️ Booking cancelled successfully.");
  refreshCalendar();
}

const first = ref(0);
const rowsPerPage = ref(10);
const sortField = ref(null);
const sortOrder = ref(null);
const globalFilter = ref("");
const columnFilters = ref({ start: "", doctorName: "" });
const showFilterBox = ref({ start: false, doctorName: false });

function toggleFilter(key) {
  Object.keys(showFilterBox.value).forEach((k) => (showFilterBox.value[k] = false));
  showFilterBox.value[key] = true;
}
function applyFilter(key) {
  showFilterBox.value[key] = false;
}
function resetFilters() {
  globalFilter.value = "";
  Object.keys(columnFilters.value).forEach((k) => (columnFilters.value[k] = ""));
}

function onPage(e) {
  first.value = e.first;
}
function onSort(e) {
  sortField.value = e.sortField;
  sortOrder.value = e.sortOrder;
}

const filteredAppointments = computed(() => {
  let filtered = myAppointments.value.filter((a) => {
    const g = globalFilter.value.trim().toLowerCase();
    if (!g) return true;
    return (
      a.doctorName?.toLowerCase().includes(g) ||
      a.start?.toLowerCase().includes(g)
    );
  });
  filtered = filtered.filter((a) => {
    return Object.keys(columnFilters.value).every((k) => {
      const val = columnFilters.value[k].trim().toLowerCase();
      if (!val) return true;
      return (a[k] || "").toLowerCase().includes(val);
    });
  });
  if (sortField.value) {
    filtered.sort((a, b) => {
      const A = a[sortField.value] || "";
      const B = b[sortField.value] || "";
      return sortOrder.value === 1 ? A.localeCompare(B) : B.localeCompare(A);
    });
  }
  return filtered;
});

const pagedData = computed(() => {
  const start = first.value;
  const end = start + rowsPerPage.value;
  const data = filteredAppointments.value.slice(start, end);
  const filled = [...data];
  while (filled.length < rowsPerPage.value)
    filled.push({ start: "", doctorName: "", empty: true });
  return filled;
});

onMounted(async () => {
  await loadDoctors();
  const el = document.getElementById("calendar");
  calendar = new Calendar(el, {
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin],
    initialView: "timeGridWeek",
    slotDuration: "00:30:00",
    slotMinTime: "09:00:00",
    slotMaxTime: "12:00:00",
    allDaySlot: false,
    height: "auto",
    businessHours: { startTime: "09:00", endTime: "12:00", daysOfWeek: [1, 2, 3, 4, 5] },
    events: generateSlots(),
    eventClick: handleSlotClick,
  });
  calendar.render();
  loadAppointments();
});

onUnmounted(() => unsubscribe && unsubscribe());
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd, #f8fbff);
  padding: 60px 20px;
}

.hero {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 2.2rem;
  color: #1d3557;
  font-weight: bold;
}

.page-subtitle {
  color: #444;
  margin-top: 10px;
}

.calendar-container {
  width: 85%;
  margin: 0 auto;
  padding: 25px;
}

.card-glass {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex; justify-content: center; align-items: center;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 6px 25px rgba(0,0,0,0.3);
  width: 300px;
  text-align: center;
}

.modal-content h3 {
  margin-bottom: 10px;
  color: #1d3557;
}

.btn-group {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn-confirm {
  background: #3a86ff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel {
  background: #ccc;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
}

:deep(.fc-timegrid-event-harness) {
  height: auto !important;
  min-height: 38px !important;
}

:deep(.fc-event) {
  white-space: normal !important;
  line-height: 1.2 !important;
  font-size: 0.85rem !important;
  padding: 4px 6px !important;
  border-radius: 8px !important;
  text-align: center !important;
  overflow: visible !important;
  position: relative !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

:deep(.fc-timegrid-slot) {
  height: 3em !important;
}

:deep(.fc-timegrid-event) {
  margin-top: 2px !important;
  margin-bottom: 2px !important;
}

:deep(.fc-event-title) {
  color: #0d3b66 !important;
  font-weight: 500 !important;
}

.booking-table {
  margin: 50px auto;
  padding: 35px;
  width: 90%;
  max-width: 1100px;
}

.section-title {
  font-weight: 600;
  color: #4b7ebc;
}

.subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  text-align: left;
}

.table-container {
  width: 100%;
}

.p-input-icon-left .global-search {
  background: #f2f7fd;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  padding-left: 2rem;
  font-size: 0.95rem;
}

.global-search {
  width: 300px;
  max-width: 100%;
  background: #f8fbff;
  border: none;
  outline: none;
  color: #4b5563;
}

.global-search::placeholder {
  color: #9aa5b1;
}

.reset-btn {
  background: #4676b5;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.45rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.reset-btn:hover {
  background: #365a8c;
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

.soft-table :deep(.p-datatable-thead > tr > th),
.soft-table :deep(.p-datatable-tbody > tr > td) {
  text-align: left;
  vertical-align: middle;
}

.soft-table :deep(.p-datatable-thead > tr > th:nth-child(1)),
.soft-table :deep(.p-datatable-tbody > tr > td:nth-child(1)) {
  width: 45% !important;
}

.soft-table :deep(.p-datatable-thead > tr > th:nth-child(2)),
.soft-table :deep(.p-datatable-tbody > tr > td:nth-child(2)) {
  width: 35% !important;
}

.soft-table :deep(.p-datatable-thead > tr > th:nth-child(3)),
.soft-table :deep(.p-datatable-tbody > tr > td:nth-child(3)) {
  width: 20% !important;
  text-align: right;
  padding-right: 2rem;
}

.soft-table :deep(.p-datatable-table) {
  table-layout: fixed !important;
  width: 100% !important;
}

.cancel-btn {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}
.cancel-btn:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}
</style>
