<template>
  <div class="header-wrap">
    <div class="header-main">
      <span class="header-label">{{ label }}</span>
      <div class="header-icons">
        <slot></slot>
        <button class="filter-btn" @click="$emit('toggle', field)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 16 16" fill="#4676b5">
            <path d="M1.5 1.5h13a.5.5 0 0 1 .39.812L10 8.5V13a.5.5 0 0 1-.757.429l-2-1.2A.5.5 0 0 1 7 11.8V8.5L1.11 2.312A.5.5 0 0 1 1.5 1.5z"/>
          </svg>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="visible" class="filter-box">
        <InputText :placeholder="`Filter ${label.toLowerCase()}...`" v-model="innerValue" />
        <button class="apply-btn" @click="apply">Ok</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps({
  label: String,
  field: String,
  visible: Boolean,
  filterValue: String
})

const emits = defineEmits(['update:visible', 'update:filterValue', 'toggle', 'apply'])

const innerValue = ref(props.filterValue)
watch(() => props.filterValue, (v) => { innerValue.value = v })

function apply() {
  emits('update:filterValue', innerValue.value)
  emits('update:visible', false)
  emits('apply', props.field)
}
</script>

<style scoped>
.header-wrap {
  display: inline-block;
  position: relative;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  min-width: 130px;
}

.header-label {
  font-weight: 600;
  color: #3f6fa0;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.filter-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}
.filter-btn:hover svg {
  fill: #1d4ed8;
  transform: scale(1.1);
}

.filter-box {
  position: absolute;  
  top: 100%;      
  left: 0;       
  z-index: 50;  
  background: #ffffff;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
  animation: fadeIn 0.15s ease-in-out;
}
.filter-box input {
  width: 130px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
.apply-btn {
  background: #4676b5;
  border: none;
  color: #fff;
  border-radius: 6px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
  transition: background 0.2s;
}
.apply-btn:hover {
  background: #3a5c8e;
}



@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
