<template>
  <div class="dass-wrapper">
    <h2 class="page-title">🧠 DASS-21 Self Assessment</h2>
    <div v-if="!submitted" class="questionnaire">
      <p class="intro">
        Please read each statement and select the option that best describes how much it applied to you over the past week.
      </p>

      <div v-for="(q, i) in questions" :key="i" class="question-block">
        <p class="question-text"><strong>{{ i + 1 }}.</strong> {{ q.text }}</p>

        <div class="options">
          <label v-for="opt in options" :key="opt.value" class="option-item">
            <input 
              type="radio" 
              :name="'q' + i"
              :value="opt.value"
              v-model.number="answers[i]"
            />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <button class="btn-submit" @click="submitAnswers">Submit</button>
    </div>
    <div v-else class="result-card">
      <h3>📊 Your DASS-21 Results</h3>
      <div class="score-box">
        <div class="score-item stress">
          <h4>Stress</h4>
          <p class="score">{{ result.stress }}</p>
          <span class="level">{{ getLevel(result.stress, "S") }}</span>
        </div>
        <div class="score-item anxiety">
          <h4>Anxiety</h4>
          <p class="score">{{ result.anxiety }}</p>
          <span class="level">{{ getLevel(result.anxiety, "A") }}</span>
        </div>
        <div class="score-item depression">
          <h4>Depression</h4>
          <p class="score">{{ result.depression }}</p>
          <span class="level">{{ getLevel(result.depression, "D") }}</span>
        </div>
      </div>

      <p class="thanks mt-3">Thank you for completing the assessment 💙</p>
      <button class="btn-again" @click="restart">🔁 Take Again</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { db } from "../firebase/init.js"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

const props = defineProps({
  userData: { type: Object, required: true }
})

const options = [
  { value: 0, label: "Did not apply to me at all" },
  { value: 1, label: "Applied to me to some degree, or some of the time" },
  { value: 2, label: "Applied to me to a considerable degree, or a good part of time" },
  { value: 3, label: "Applied to me very much, or most of the time" },
]

const questions = [
  { text: "I found it hard to wind down", type: "S" },
  { text: "I was aware of dryness of my mouth", type: "A" },
  { text: "I couldn't seem to experience any positive feeling at all", type: "D" },
  { text: "I experienced breathing difficulty", type: "A" },
  { text: "I found it difficult to work up the initiative to do things", type: "D" },
  { text: "I tended to over-react to situations", type: "S" },
  { text: "I experienced trembling (e.g., in the hands)", type: "A" },
  { text: "I felt that I was using a lot of nervous energy", type: "S" },
  { text: "I was worried about situations in which I might panic and make a fool of myself", type: "A" },
  { text: "I felt that I had nothing to look forward to", type: "D" },
  { text: "I found myself getting agitated", type: "S" },
  { text: "I found it difficult to relax", type: "S" },
  { text: "I felt down-hearted and blue", type: "D" },
  { text: "I was intolerant of anything that kept me from getting on with what I was doing", type: "S" },
  { text: "I felt I was close to panic", type: "A" },
  { text: "I was unable to become enthusiastic about anything", type: "D" },
  { text: "I felt I wasn't worth much as a person", type: "D" },
  { text: "I felt that I was rather touchy", type: "S" },
  { text: "I was aware of the action of my heart in the absence of physical exertion", type: "A" },
  { text: "I felt scared without any good reason", type: "A" },
  { text: "I felt that life was meaningless", type: "D" },
]

const answers = ref(Array(questions.length).fill(null))
const result = ref(null)
const submitted = ref(false)

function getLevel(score, type) {
  const tables = {
    S: [0, 14, 18, 25, 33], // Stress
    A: [0, 7, 10, 14, 19],  // Anxiety
    D: [0, 9, 13, 20, 27],  // Depression
  }
  const levels = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"]
  const scale = tables[type]
  const idx = scale.findIndex((limit) => score <= limit)
  return levels[idx >= 0 ? idx : 4]
}

async function submitAnswers() {
  if (answers.value.some(v => v === null)) {
    alert("Please complete all questions before submitting.")
    return
  }

  let stress = 0, anxiety = 0, depression = 0
  questions.forEach((q, i) => {
    if (q.type === "S") stress += answers.value[i]
    else if (q.type === "A") anxiety += answers.value[i]
    else if (q.type === "D") depression += answers.value[i]
  })

  result.value = {
    stress: stress * 2,
    anxiety: anxiety * 2,
    depression: depression * 2,
  }

  submitted.value = true
  try {
    await addDoc(collection(db, "dass_results"), {
      user: props.userData.username,
      email: props.userData.email,
      stress: result.value.stress,
      anxiety: result.value.anxiety,
      depression: result.value.depression,
      timestamp: serverTimestamp(),
    })
    console.log("✅ DASS result saved to Firestore")
  } catch (e) {
    console.error("❌ Firestore save error:", e)
  }
}

// 再做一次
function restart() {
  answers.value = Array(questions.length).fill(null)
  result.value = null
  submitted.value = false
}
</script>

<style scoped>
.dass-wrapper {
  max-width: 850px;
  margin: 30px auto;
  background: #ffffff;
  border-radius: 16px;
  padding: 30px 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  animation: fadeIn 0.5s ease;
}

.page-title {
  text-align: center;
  color: #3a86ff;
  font-weight: 700;
  margin-bottom: 20px;
}

.intro {
  text-align: center;
  font-size: 1rem;
  color: #555;
  margin-bottom: 25px;
}

.question-block {
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
  padding-bottom: 10px;
}

.question-text {
  font-weight: 500;
  margin-bottom: 8px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.btn-submit {
  display: block;
  margin: 25px auto;
  background-color: #3a86ff;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  padding: 10px 25px;
  transition: 0.3s;
}
.btn-submit:hover { background-color: #2f6ed6; }

.result-card {
  text-align: center;
  padding: 20px;
}

.score-box {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  gap: 10px;
}

.score-item {
  flex: 1;
  background: #f7faff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.score-item h4 {
  color: #3a86ff;
}
.score {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 5px 0;
}
.level {
  font-size: 1rem;
  color: #444;
  font-weight: 500;
}
.btn-again {
  margin-top: 15px;
  background: #3a86ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
}
.btn-again:hover {
  background: #2f6ed6;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
