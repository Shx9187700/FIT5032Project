<template>
  <div class="booking-page">
    <h1 class="title">🩺 Appointment Booking</h1>
    <p class="subtitle">Book your doctor within the next 2 weeks</p>
    <div id="calendar"></div>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>Confirm Booking</h3>
        <p>
          Doctor: {{ selectedDoctor.name }}<br />
          Time: {{ selectedSlot.start.toLocaleString() }}
        </p>
        <button @click="confirmBooking">Confirm</button>
        <button @click="cancelBooking">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { Calendar } from "@fullcalendar/core"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"
import { db } from "@/firebase"
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore"

const doctors = [
  { id: 1, name: "Dr. Smith", day: 1 },
  { id: 2, name: "Dr. Johnson", day: 2 },
  { id: 3, name: "Dr. Williams", day: 3 },
  { id: 4, name: "Dr. Brown", day: 4 },
  { id: 5, name: "Dr. Davis", day: 5 },
]

const events = ref([])
const showModal = ref(false)
const selectedSlot = ref(null)
const selectedDoctor = ref(null)
let calendar = null
let unsubscribe = null

const generateSlots = () => {
  const slots = []
  const now = new Date()
  const twoWeeksLater = new Date()
  twoWeeksLater.setDate(now.getDate() + 14)

  for (let d = new Date(now); d <= twoWeeksLater; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    const doctor = doctors.find((doc) => doc.day === day)
    if (doctor) {
      for (let hour = 9; hour < 12; hour += 0.5) {
        const start = new Date(d)
        start.setHours(Math.floor(hour), hour % 1 ? 30 : 0)
        const end = new Date(start)
        end.setMinutes(start.getMinutes() + 30)

        slots.push({
          title: `Available - ${doctor.name}`,
          start,
          end,
          doctorId: doctor.id,
          backgroundColor: "#b3ffb3",
        })
      }
    }
  }
  return slots
}

const loadAppointments = () => {
  const q = query(collection(db, "appointments"))
  unsubscribe = onSnapshot(q, (snapshot) => {
    const booked = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      booked.push({
        title: `Booked with ${data.doctorName}`,
        start: data.start,
        end: data.end,
        backgroundColor: "#ffcccc",
      })
    })
    events.value = booked
    refreshCalendar()
  })
}

const refreshCalendar = () => {
  if (!calendar) return
  calendar.removeAllEvents()
  calendar.addEventSource([...generateSlots(), ...events.value])
}

const handleSlotClick = (info) => {
  const clickedEvent = info.event
  const doctor = doctors.find((d) =>
    clickedEvent.title.includes(d.name)
  )
  selectedSlot.value = {
    start: clickedEvent.start,
    end: clickedEvent.end,
  }
  selectedDoctor.value = doctor
  showModal.value = true
}

const confirmBooking = async () => {
  const overlap = events.value.find(
    (e) =>
      new Date(e.start).getTime() === selectedSlot.value.start.getTime() &&
      e.title.includes(selectedDoctor.value.name)
  )

  if (overlap) {
    alert("This time slot is already booked.")
    showModal.value = false
    return
  }

  await addDoc(collection(db, "appointments"), {
    doctorId: selectedDoctor.value.id,
    doctorName: selectedDoctor.value.name,
    start: selectedSlot.value.start.toISOString(),
    end: selectedSlot.value.end.toISOString(),
    userEmail: "testuser@example.com",
    createdAt: new Date().toISOString(),
  })

  alert("Booking confirmed!")
  showModal.value = false
}

const cancelBooking = () => (showModal.value = false)

onMounted(() => {
  const el = document.getElementById("calendar")
  calendar = new Calendar(el, {
    plugins: [timeGridPlugin, interactionPlugin, dayGridPlugin],
    initialView: "timeGridWeek",
    slotDuration: "00:30:00",
    allDaySlot: false,
    businessHours: { startTime: "09:00", endTime: "12:00", daysOfWeek: [1,2,3,4,5] },
    selectable: true,
    editable: false,
    events: [...generateSlots()],
    eventClick: handleSlotClick,
  })
  calendar.render()
  loadAppointments()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.booking-page {
  width: 80%;
  margin: 0 auto;
  text-align: center;
}
.modal {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
}
</style>
