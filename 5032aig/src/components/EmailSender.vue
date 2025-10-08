<template>
  <div v-if="showStatus" class="alert mt-3" :class="alertClass">
    {{ statusMessage }}
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const emit = defineEmits(["done"]);

const functionURL = "https://us-central1-week7-hongxiang.cloudfunctions.net/sendEmail";

const props = defineProps({
  userTo: { type: String, required: true },
  adminTo: { type: String, required: true },
  userSubject: { type: String, required: true },
  userText: { type: String, required: true },
  adminSubject: { type: String, required: true },
  adminText: { type: String, required: true },
  replyTo: { type: String, default: "" },
  attachment: { type: Object, default: null },
  trigger: { type: Boolean, default: false },
});

const statusMessage = ref("");
const showStatus = ref(false);
const alertClass = ref("alert-info");

// ✅ 提前定义（用 ref 最稳）
const inflight = ref(false);

// 挂载时立刻检查一次；之后 trigger 变 true 也会触发
watch(
  () => props.trigger,
  async (newVal) => {
    if (newVal) await sendEmail();
  },
  { immediate: true }
);

async function sendEmail() {
  if (inflight.value) return;
  inflight.value = true;
  const TIMEOUT_MS = 15000;

  try {
    showStatus.value = true;
    alertClass.value = "alert-info";
    statusMessage.value = "Sending email...";

    console.log("[EmailSender] POST /sendEmail", {
      userTo: props.userTo,
      adminTo: props.adminTo,
      hasAttachment: !!props.attachment,
    });

    const res = await axios.post(
      functionURL,
      {
        userTo: props.userTo,
        adminTo: props.adminTo,
        userSubject: props.userSubject,
        userText: props.userText,
        adminSubject: props.adminSubject,
        adminText: props.adminText,
        replyTo: props.replyTo,
        attachment: props.attachment || undefined,
      },
      { headers: { "Content-Type": "application/json" }, timeout: TIMEOUT_MS }
    );

    if (res.data?.success) {
      statusMessage.value = "Email(s) sent successfully!";
      alertClass.value = "alert-success";
      emit("done", { ok: true });
    } else {
      const err = res.data?.error || "Unknown";
      statusMessage.value = "Failed to send email.";
      alertClass.value = "alert-warning";
      emit("done", { ok: false, error: err });
    }
  } catch (error) {
    const msg = error?.response?.data?.error || error?.message || "Network error";
    statusMessage.value = "Error: " + msg;
    alertClass.value = "alert-danger";
    emit("done", { ok: false, error: msg });
  } finally {
    inflight.value = false;
  }
}
</script>

<style scoped>
.alert {
  text-align: center;
  transition: all 0.3s ease;
  border-radius: 10px;
  padding: 10px 15px;
}
</style>
