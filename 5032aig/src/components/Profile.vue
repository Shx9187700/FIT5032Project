<template>
  <div class="container mt-5" v-if="userData">
    <h2 class="text-center mb-4">👤 User Profile</h2>

    <div class="card p-4 shadow-sm">
      <p><strong>Username:</strong> {{ userData.username }}</p>
      <p><strong>Email:</strong> {{ userData.email }}</p>
      <p><strong>Age:</strong> {{ userData.age }}</p>
      <p><strong>Role:</strong> {{ userData.role }}</p>

      <!-- rating part -->
      <Rating />

      <button class="btn btn-danger mt-3" @click="logout">Logout</button>
    </div>
  </div>

  <div v-else class="text-center mt-5">
    <p>Loading user data...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/init.js"
import { onAuthStateChanged, signOut } from "firebase/auth"
import Rating from "../components/rating.vue"

const router = useRouter()
const userData = ref({})

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        userData.value = docSnap.data()
      } else {
        console.error("No such document in Firestore!")
      }
    } else {
      alert("You must log in to access your profile.")
      router.push("/login")
    }
  })
})

async function logout() {
  await signOut(auth)
  localStorage.removeItem("loggedInUser")
  alert("You have been logged out.")
  router.push("/login")
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
.card {
  border-radius: 10px;
  background-color: #f8f9fa;
}
</style>
