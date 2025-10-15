<template>
  <div class="main-page">
    <section class="hero-section" role="region" aria-label="Website introduction">
      <div class="hero-content">
        <h1>Welcome to <span class="highlight">AIG Mental Wellness</span></h1>
        <p>
          Empower your mind and take control of your wellbeing.<br />
          Get personalized self-assessments, book sessions, and explore local clinics near you.
        </p>
        <div class="hero-buttons">
          <button 
            class="btn btn-primary"
            @click="goToSelfAssessment"
            aria-label="Go to self assessment page"
          >
            🧠 Start Self Assessment
          </button>
          <button 
            class="btn btn-secondary"
            @click="goToBooking"
            aria-label="Go to booking page"
          >
            📅 Book a Session
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
const router = useRouter()
function goToSelfAssessment() { router.push("/selfassessment") }
function goToBooking() { router.push("/booking") }
</script>

<style scoped>
.main-page { width: 100%; height: 100%; }

.hero-section {
  height: 100vh;
  background: linear-gradient(120deg, #c7e9ff, #f7faff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 20px;
}

.hero-content h1 {
  font-size: 2.5rem;
  color: #1d3557;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 1.1rem;
  color: #333;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 30px;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn {
  padding: 12px 25px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s;
}

.btn:focus {
  outline: 3px solid #3a86ff;
}

.btn-primary { background: #3a86ff; color: white; }
.btn-primary:hover { background: #2f6fe0; }

.btn-secondary { background: #ffd166; color: #333; }
.btn-secondary:hover { background: #fbb13c; }

.highlight {
  color: #3a86ff;
  font-weight: bold;
}
</style>
