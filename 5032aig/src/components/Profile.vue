<template>
  <div class="container mt-5" v-if="userData">
    <h2 class="text-center mb-4">User Profile</h2>

    <div class="card p-4 shadow-sm">
      <p><strong>Username:</strong> {{ userData.username }}</p>
      <p><strong>Email:</strong> {{ userData.email }}</p>
      <p><strong>Age:</strong> {{ userData.age }}</p>
      <p><strong>Role:</strong> {{ userData.role }}</p>

      <!-- Rating Section -->
      <div class="rating-section mt-3 text-center">
        <h5>Rate this App</h5>
        <Rating v-model="userRating" :cancel="false" />
        <p v-if="rated" class="mt-2 text-success">Thank you for your rating!</p>
      </div>

      <!-- Feedback Section (shows only after rating) -->
      <div v-if="rated" class="feedback-box mt-4">
        <h6>We'd love to hear more from you</h6>

        <CKEditor 
          :editor="ClassicEditor"
          v-model="feedback"
          :config="{
            toolbar: ['bold', 'italic', 'underline', 'link', 'bulletedList', 'numberedList', 'undo', 'redo']
          }"
        />

        <input type="file" class="form-control mb-3" @change="onFileChange" />

        <button class="btn btn-primary w-100" @click="sendFeedback" :disabled="sending">
          {{ sending ? "Sending..." : "Send Feedback" }}
        </button>

        <p v-if="sent" class="mt-2 text-success text-center">Feedback sent successfully!</p>
      </div>

      <!-- EmailSender (hidden, triggered programmatically) -->
      <EmailSender
        v-if="triggerEmail"
        :user-to="userData.email" 
        :admin-to="'hsha0055@student.monash.edu'"   
        :user-subject="'Thanks for your feedback!'"  
        :user-text="'Thanks for your feedback!'"   
        :admin-subject="'New Feedback from ' + userData.username" 
        :admin-text="feedbackEmailContent"         
        :reply-to="userData.email"                
        :attachment="pendingAttachment"     
        :trigger="triggerEmail"
        @done="onEmailDone"
      />

      <button class="btn btn-danger mt-4 w-100" @click="logout">Logout</button>
    </div>
  </div>

  <div v-else class="text-center mt-5">
    <p>Loading user data...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/init.js"
import { onAuthStateChanged, signOut } from "firebase/auth"
import Rating from "../components/Rating.vue"
import EmailSender from "../components/EmailSender.vue"

import CKEditorComponent from '@ckeditor/ckeditor5-vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

const CKEditor = CKEditorComponent.component


const router = useRouter()
const userData = ref(null)
const userRating = ref(0)
const rated = ref(false)

const feedback = ref("") 
const sending = ref(false)
const sent = ref(false)     
const triggerEmail = ref(false) 
const feedbackEmailContent = ref("")

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docSnap = await getDoc(doc(db, "users", user.uid))
      if (docSnap.exists()) {
        userData.value = docSnap.data()
      } else {
        console.error("No such user document found.")
      }
    } else {
      router.push("/login")
    }
  })
})

watch(userRating, (newValue) => {
  if (newValue > 0) {
    rated.value = true
  }
})

async function sendFeedback() {
  if (!feedback.value.trim()) {
    return;
  }
  sending.value = true;
  sent.value = false;

  feedbackEmailContent.value =
    `User: ${userData.value.username}\n` +
    `Email: ${userData.value.email}\n` +
    `Rating: ${userRating.value} stars\n\n` +
    `Feedback:\n${feedback.value}`;

  triggerEmail.value = true;
}

function onEmailDone(result) {
  sending.value = false;
  triggerEmail.value = false;
  if (result.ok) {
    sent.value = true;
    feedback.value = "";
  } else {
    alert("Send failed: " + (result.error || ""));
  }
}

const pendingAttachment = ref(null);

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) { pendingAttachment.value = null; return; }

  readFileAsBase64(file).then((base64) => {
    const [prefix, content] = base64.split('base64,');
    const mime = (prefix.match(/^data:(.+);base64,/) || [])[1] || 'application/octet-stream';
    pendingAttachment.value = {
      filename: file.name,
      contentBase64: content,
      mimeType: mime
    };
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function logout() {
  await signOut(auth)
  alert("You have been logged out.")
  router.push("/login")
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
.card {
  border-radius: 14px;
  background-color: #f8f9fa;
}
.rating-section h5 {
  color: #444;
  margin-bottom: 10px;
}
.feedback-box {
  background-color: #f0f4ff;
  padding: 20px;
  border-radius: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.feedback-box textarea {
  resize: none;
  font-size: 0.95rem;
  border-radius: 8px;
}

:deep(.ck-editor__editable_inline) {
  min-height: 300px;
  max-height: 500px;
  font-size: 1rem;
  line-height: 1.6;
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #cfd8dc;
  padding: 14px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

:deep(.ck.ck-editor) {
  width: 100%;
  margin-bottom: 15px;
}

.ck-editor__editable_inline {
  min-height: 250px;
  max-height: 400px;
  font-size: 1.5;
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #cfd8dc;
  padding: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

.ck.ck-editor {
  width: 100%;
  margin-bottom: 15px;
}

button {
  font-weight: 500;
}
</style>
