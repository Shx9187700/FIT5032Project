<template>
  <div class="rating-container mt-5">
    <h3 class="text-center mb-3">🌟 Rate This Web</h3>

    <!-- if not rate -->
    <div v-if="!hasRated" class="star-group text-center">
      <p>Click to rate:</p>
      <div>
        <span 
          v-for="star in 5" 
          :key="star" 
          class="star" 
          :class="{ active: star <= userRating }"
          @click="setRating(star)"
        >★</span>
      </div>
    </div>

    <!-- if rated -->
    <div v-else class="text-center mt-3">
      <p><strong>Your Last Rating:</strong> {{ userRating }} ⭐</p>
      <button class="btn btn-warning mt-2" @click="allowRerate">Re-rate</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { auth, db } from "../firebase/init.js"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

//  v-model
const props = defineProps({
  modelValue: { type: Number, default: 0 }
})
const emit = defineEmits(["update:modelValue"])

const userRating = ref(props.modelValue)
const hasRated = ref(false)
let currentUser = null

// get last score
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user
      await fetchUserRating()
    }
  })
})

async function fetchUserRating() {
  const docRef = doc(db, "ratings", currentUser.uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    userRating.value = docSnap.data().rating
    hasRated.value = true
  }
}

async function setRating(star) {
  userRating.value = star
  emit("update:modelValue", star) 
  await setDoc(doc(db, "ratings", currentUser.uid), {
    userId: currentUser.uid,
    email: currentUser.email,
    rating: star,
    timestamp: new Date()
  })
  alert(`Thanks for rating ${star} stars!`)
  hasRated.value = true
}

function allowRerate() {
  hasRated.value = false
}
</script>

<style scoped>
.rating-container {
  max-width: 400px;
  margin: auto;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.star {
  font-size: 32px;
  color: #ccc;
  cursor: pointer;
  margin: 0 5px;
  transition: color 0.2s;
}
.star.active {
  color: #ffcc00;
}
.star:hover {
  color: #ffcc00;
}
</style>
