<template>
  <v-app-bar
      app
      color="white"
      elevation="2"
      height="70"
  >
    <v-container fluid class="d-flex align-center">
      <!-- Logo -->
      <router-link to="/" class="text-decoration-none">
        <div class="d-flex align-center">
          <v-icon
              icon="mdi-tennis"
              size="32"
              color="primary"
              class="mr-2"
          />
          <h2 class="text-primary font-weight-bold">
            Urla Tenis Akademi
          </h2>
        </div>
      </router-link>

      <v-spacer />

      <!-- Desktop Navigation -->
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
            variant="text"
            :to="{ name: 'Home' }"
            :class="{ 'text-primary': route.name === 'Home' }"
        >
          Ana Sayfa
        </v-btn>

        <v-btn
            variant="text"
            :to="{ name: 'Courts' }"
            :class="{ 'text-primary': route.name === 'Courts' }"
        >
          Kortlar
        </v-btn>

        <v-btn
            variant="text"
            :to="{ name: 'Pricing' }"
            :class="{ 'text-primary': route.name === 'Pricing' }"
        >
          Fiyatlar
        </v-btn>

        <v-btn
            variant="text"
            :to="{ name: 'Contact' }"
            :class="{ 'text-primary': route.name === 'Contact' }"
        >
          İletişim
        </v-btn>

        <!-- Authenticated User Menu -->
        <template v-if="authStore.isAuthenticated">
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                  variant="text"
                  v-bind="props"
                  :prepend-icon="authStore.isAdmin ? 'mdi-account-cog' : 'mdi-account'"
              >
                {{ authStore.user?.firstName }}
                <v-icon icon="mdi-chevron-down" />
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                  v-if="authStore.isStudent"
                  :to="{ name: 'StudentDashboard' }"
              >
                <v-list-item-title>Panel</v-list-item-title>
              </v-list-item>

              <v-list-item
                  v-if="authStore.isAdmin"
                  :to="{ name: 'AdminDashboard' }"
              >
                <v-list-item-title>Admin Panel</v-list-item-title>
              </v-list-item>

              <v-list-item
                  v-if="authStore.isStudent"
                  :to="{ name: 'Reservations' }"
              >
                <v-list-item-title>Rezervasyonlar</v-list-item-title>
              </v-list-item>

              <v-list-item
                  v-if="authStore.isStudent"
                  :to="{ name: 'Payments' }"
              >
                <v-list-item-title>Ödemeler</v-list-item-title>
              </v-list-item>

              <v-list-item
                  v-if="authStore.isAdmin"
                  :to="{ name: 'Attendance' }"
              >
                <v-list-item-title>Yoklama</v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="logout">
                <v-list-item-title>Çıkış Yap</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <!-- Guest Menu -->
        <template v-else>
          <v-btn
              variant="outlined"
              color="primary"
              :to="{ name: 'Login' }"
              class="mr-2"
          >
            Giriş Yap
          </v-btn>

          <v-btn
              variant="flat"
              color="primary"
              :to="{ name: 'Register' }"
          >
            Kayıt Ol
          </v-btn>
        </template>
      </v-toolbar-items>

      <!-- Mobile Menu -->
      <v-app-bar-nav-icon
          class="hidden-md-and-up"
          @click="drawer = !drawer"
      />
    </v-container>
  </v-app-bar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
      v-model="drawer"
      temporary
      location="right"
      width="280"
  >
    <v-list>
      <v-list-item :to="{ name: 'Home' }">
        <v-list-item-title>Ana Sayfa</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'Courts' }">
        <v-list-item-title>Kortlar</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'Pricing' }">
        <v-list-item-title>Fiyatlar</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'Contact' }">
        <v-list-item-title>İletişim</v-list-item-title>
      </v-list-item>

      <v-divider v-if="authStore.isAuthenticated" />

      <template v-if="authStore.isAuthenticated">
        <v-list-item
            v-if="authStore.isStudent"
            :to="{ name: 'StudentDashboard' }"
        >
          <v-list-item-title>Panel</v-list-item-title>
        </v-list-item>

        <v-list-item
            v-if="authStore.isAdmin"
            :to="{ name: 'AdminDashboard' }"
        >
          <v-list-item-title>Admin Panel</v-list-item-title>
        </v-list-item>

        <v-list-item @click="logout">
          <v-list-item-title>Çıkış Yap</v-list-item-title>
        </v-list-item>
      </template>

      <template v-else>
        <v-divider />
        <v-list-item :to="{ name: 'Login' }">
          <v-list-item-title>Giriş Yap</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ name: 'Register' }">
          <v-list-item-title>Kayıt Ol</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const drawer = ref(false)

const logout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>