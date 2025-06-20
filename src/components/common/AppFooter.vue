<template>
  <v-footer
      app
      class="modern-footer"
  >
    <div class="footer-background"></div>
    <v-container style="justify-items: center" class=" footer-container">
      <div class="footer-content">
          <div class="credit-wrapper">
            <div class="credit-icon-wrapper">
              <v-icon icon="mdi-code-tags" size="20" color="white" />
            </div>
            <span class="credit-text">Created by Emircan Adak</span>
          </div>
      </div>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Styles are handled in main.css */
</style>