<template>
  <v-app>
    <AppHeader />

    <v-main>
      <router-view />
    </v-main>

    <AppFooter />
  </v-app>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
</script>

<style>
.v-application {
  font-family: 'Roboto', sans-serif;
}

.tennis-gradient {
  background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
}

.court-pattern {
  background-image:
      linear-gradient(90deg, rgba(255,255,255,0.1) 50%, transparent 50%),
      linear-gradient(rgba(255,255,255,0.1) 50%, transparent 50%);
  background-size: 20px 20px;
}
</style>