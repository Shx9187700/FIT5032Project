<template>
  <div id="app">
    <Header v-if = "!hideHeader" />
    <main id = "main-content" tabindex = "-1">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Header from "./components/Header.vue"
import { useRoute } from "vue-router";

const route = useRoute()

const hideHeader = computed(() => route.path === "/admin")

</script>

<style>
:focus {
  outline: 3px solid #3a86ff;
  outline-offset: 2px;
}

body {
  color: #222;
  background-color: #fff;
  font-family: Arial, sans-serif;
}
</style>