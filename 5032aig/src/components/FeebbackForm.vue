<template>
  <div class="feedback-card p-4 shadow-sm">
    <div class="text-center mb-3">
      <Rating v-model="userRating" :cancel="false" />
      <p v-if="rated" class="mt-2 text-success">Thank you for your rating!</p>
    </div>

    <div v-if="rated" class="feedback-box mt-3">
      <h6>We'd love to hear more from you</h6>

      <ckeditor
        :editor="ClassicEditor"
        v-model="feedback"
        :config="{ toolbar: ['bold','italic','underline','link','bulletedList','numberedList','undo','redo'] }"
      />

      <input type="file" class="form-control mb-3" @change="onFileChange" />

      <button class="btn btn-primary w-100" @click="sendFeedback" :disabled="sending">
        {{ sending ? "Sending..." : "Send Feedback" }}
      </button>

      <p v-if="sent" class="mt-2 text-success text-center">Feedback sent successfully!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import Rating from "./Rating.vue";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import axios from "axios";

const props = defineProps({ userData: Object });
const emit = defineEmits(["done"]);

const userRating = ref(0);
const rated = ref(false);
const feedback = ref("");
const sending = ref(false);
const sent = ref(false);
const pendingAttachment = ref(null);

watch(userRating, (v) => { if (v > 0) rated.value = true });

function stripHtmlTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

async function sendFeedback() {
  if (!feedback.value.trim()) return;
  sending.value = true;
  sent.value = false;

  const cleanFeedback = stripHtmlTags(feedback.value);

  const payload = {
    bulk: [
      {
        to: props.userData.email,
        subject: "Thank you for your feedback!",
        text: "We have received your feedback and appreciate your time."
      },
      {
        to: "hsha0055@student.monash.edu",
        subject: "New Feedback from " + props.userData.username,
        text: `
          User Feedback
          User: ${props.userData.username}
          Email: ${props.userData.email}
          Rating: ${userRating.value} ⭐
          Feedback:
          ${cleanFeedback}
        `,
        replyTo: props.userData.email,
        attachment: pendingAttachment.value
      }
    ]
  };

  try {
    const res = await axios.post(
      "https://us-central1-week7-hongxiang.cloudfunctions.net/sendEmail",
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    if (res.data?.success) {
      sent.value = true;
      feedback.value = "";
      setTimeout(() => {
        sent.value = false;
        emit("done");
      }, 3000);
    } else {
      alert("Send failed: " + (res.data?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Send failed:", err);
    alert("Send failed. Please try again.");
  } finally {
    sending.value = false;
  }
}

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return (pendingAttachment.value = null);
  const r = new FileReader();
  r.onload = () => {
    const [p, c] = r.result.split("base64,");
    const mime = (p.match(/^data:(.+);base64,/) || [])[1] || "application/octet-stream";
    pendingAttachment.value = { filename: file.name, contentBase64: c, mimeType: mime };
  };
  r.readAsDataURL(file);
}
</script>

<style scoped>
.feedback-card {
  background: #f8f9fa;
  border-radius: 14px;
}
.feedback-box {
  background: #f0f4ff;
  padding: 20px;
  border-radius: 12px;
}
:deep(.ck-editor__editable_inline) {
  min-height: 250px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #cfd8dc;
  padding: 12px;
}
</style>
