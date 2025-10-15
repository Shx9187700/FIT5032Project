<template>
  <div class="self-assessment-page">
    <main v-if="userData" class="main-content">
      <DASS :userData="userData" />
    </main>
    <p v-else class="text-center mt-5">Loading user data...</p>
  </div>
</template>


<script setup>
import DASS from "../components/DASS.vue"
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase/init.js"
import { doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

const userData = ref(null)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        userData.value = snap.data()
      } else {
        console.warn("User record not found in Firestore")
      }
    } else {
      console.warn("User not logged in")
    }
  })
})
</script>