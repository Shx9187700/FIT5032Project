<template>
  <header class="header" role="banner">
    <div class="logo" @click="goHome" tabindex="0">AIG</div>

    <nav class="nav" role="navigation">
      <router-link to="/selfassessment" class="nav-item" active-class="active">Self Assessment</router-link>
      <router-link to="/booking" class="nav-item" active-class="active">Booking</router-link>
      <router-link to="/map" class="nav-item" active-class="active">Map</router-link>
    </nav>

    <div v-if="!userData" class="auth-buttons">
      <router-link to ="/login" class = "btn-login">Login</router-link>
      <router-link to ="/register" class="btn-register">Register</router-link>
    </div>

    <div v-else class="user-section" @click.stop="toggleDropdown">
      <span class="username">{{ userData.username }}</span>
      <i class="pi pi-user"></i>

      <div v-if="showDropdown" class="dropdown">
        <p><strong>Email:</strong> {{ userData.email }}</p>
        <p><strong>Age:</strong> {{ userData.age }}</p>
        <button @click="openRating" class="rate-btn">Rate this web</button>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>
  </header>

  <div v-if="showRatingModal" class="modal-overlay">
    <div class="modal-content feedback-content">
      <FeedbackForm :userData="userData" @done="showRatingModal=false" />
      <button class="close-btn mt-3" @click="showRatingModal=false">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebase/init.js"
import { doc, getDoc } from "firebase/firestore"
import FeedbackForm from "../components/FeebbackForm.vue"

const router = useRouter()
const showDropdown = ref(false)
const ratingValue = ref(0)
const showRatingModal = ref(false)
const showFeedbackButton = ref(false)
const triggerSend = ref(false)

// feedback dialog
const feedbackModal = ref(false)
const feedbackText = ref("")
const feedbackAttachment = ref(null)
const feedbackEmailContent = ref("")
const feedbackSending = ref(false)
const feedbackSent = ref(false)

const userData = ref(null)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleClickOutside(event) {
  const dropdown = document.querySelector(".user-section")
  if (dropdown && !dropdown.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) userData.value = snap.data()
    } else {
      userData.value = null
    }
  })
  document.addEventListener("click", handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
})

function goHome() {
  router.push("/usermain")
}

async function logout() {
  await signOut(auth)
  localStorage.removeItem("loggedInUser")
  alert("You have been logged out.")
  router.push("/usermain")
}

function openRating() {
  showDropdown.value = false
  showRatingModal.value = true
}

function onRated() {
  showFeedbackButton.value = true
}

function sendFeedback() {
  feedbackModal.value = true
}

function confirmSendFeedback() {
  if (!feedbackText.value.trim()) {
    alert("Please write some feedback before sending.")
    return
  }

  feedbackEmailContent.value =
    `User: ${userData.value.username}\n` +
    `Email: ${userData.value.email}\n` +
    `Rating: ${ratingValue.value} stars\n\n` +
    `Feedback:\n${feedbackText.value}`

  feedbackSending.value = true
  triggerSend.value = true
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) { feedbackAttachment.value = null; return }

  const reader = new FileReader()
  reader.onload = () => {
    const [prefix, content] = reader.result.split('base64,')
    const mime = (prefix.match(/^data:(.+);base64,/) || [])[1] || 'application/octet-stream'
    feedbackAttachment.value = {
      filename: file.name,
      contentBase64: content,
      mimeType: mime
    }
  }
  reader.readAsDataURL(file)
}

function onEmailDone(result) {
  feedbackSending.value = false
  triggerSend.value = false
  if (result.ok) {
    feedbackSent.value = true
    feedbackText.value = ""
    setTimeout(() => {
      feedbackSent.value = false
      feedbackAttachment.value = null
    }, 5000)
  } else {
    alert("Send failed: " + (result.error || ""))
  }
}
</script>

<style scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 40px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  top: 0;
  z-index: 100;
}

.logo {
  font-weight: 700;
  font-size: 1.6rem;
  color: #3a86ff;
  cursor: pointer;
}

.nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 35px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: 0.2s;
}

.nav-item:hover,
.nav-item.active {
  color: #3a86ff;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.btn-login, .btn-register {
  text-decoration: none;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  transition: 0.2s;
}

.btn-login {
  color: #3a86ff;
  border: 1px solid #3a86ff;
}
.btn-login:hover {
  background: #3a86ff;
  color: white;
}

.btn-register {
  color: white;
  background: #3a86ff;
}
.btn-register:hover {
  background: #2f6ed6;
}

.user-section {
  position: relative;
  cursor: pointer;
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 40px;
  width: 320px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 12px;
  animation: fadeIn 0.2s ease-in-out;
}

.rate-btn {
  width: 100%;
  background: #3a86ff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 0;
  margin-top: 10px;
  cursor: pointer;
}

.rate-btn:hover {
  background: #2c6cd6;
}

.logout-btn {
  width: 100%;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 0;
  margin-top: 10px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.25s ease;
}

.rating-content {
  width: 400px;
  text-align: center;
}

.feedback-content {
  width: 600px;
  max-width: 90%;
  text-align: left;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.ck-editor__editable_inline) {
  min-height: 200px;
  max-height: 400px;
  font-size: 1rem;
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #cfd8dc;
  padding: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

.feedback-content input[type="file"] {
  width: 100%;
  margin-top: 10px;
}

.feedback-content button {
  font-weight: 500;
}
</style>