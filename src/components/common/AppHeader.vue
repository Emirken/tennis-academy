<template>
  <v-app-bar
      app
      elevation="0"
      height="80"
      class="modern-header"
  >
    <!-- Modern gradient background -->
    <div class="header-background"></div>

    <v-container class="d-flex align-center" style="height: 100%; position: relative; z-index: 2;">
      <!-- Logo/Brand -->
      <router-link
          :to="{ name: 'Home' }"
          class="brand-link d-flex align-center mr-8"
      >
        <div class="brand-logo">
          <v-icon
              icon="mdi-tennis"
              size="36"
              color="white"
          />
        </div>
        <div class="brand-text ml-3 hidden-sm-and-down">
          <h2 class="brand-title">Urla Tenis Akademi</h2>
        </div>
      </router-link>

      <v-spacer />

      <!-- Desktop Navigation -->
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
            variant="text"
            color="white"
            :to="{ name: 'Home' }"
            class="nav-btn mx-1"
        >
          <v-icon start icon="mdi-home" />
          Ana Sayfa
        </v-btn>

        <v-btn
            variant="text"
            color="white"
            :to="{ name: 'Courts' }"
            class="nav-btn mx-1"
        >
          <v-icon start icon="mdi-tennis-ball" />
          Kortlar
        </v-btn>

        <v-btn
            variant="text"
            color="white"
            :to="{ name: 'Pricing' }"
            class="nav-btn mx-1"
        >
          <v-icon start icon="mdi-currency-usd" />
          Fiyatlar
        </v-btn>

        <v-btn
            variant="text"
            color="white"
            :to="{ name: 'Contact' }"
            class="nav-btn mx-1"
        >
          <v-icon start icon="mdi-phone" />
          İletişim
        </v-btn>

        <!-- Auth Section -->
        <template v-if="authStore.isAuthenticated">
          <v-menu
              offset-y
              transition="slide-y-transition"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                  v-bind="props"
                  variant="text"
                  color="white"
                  class="user-menu-btn ml-3"
              >
                <v-avatar
                    size="32"
                    :color="authStore.isAdmin ? 'amber' : 'success'"
                    class="mr-2"
                >
                  <span class="white--text font-weight-bold">
                    {{ authStore.user?.firstName?.charAt(0) }}
                  </span>
                </v-avatar>
                <span class="mr-2">{{ authStore.user?.firstName }}</span>
                <v-icon
                    :icon="authStore.isAdmin ? 'mdi-account-cog' : 'mdi-account'"
                    size="20"
                    class="mr-1"
                />
                <v-icon icon="mdi-chevron-down" size="16" />
              </v-btn>
            </template>

            <v-list class="user-dropdown" elevation="8">
              <v-list-item
                  v-if="authStore.isStudent"
                  :to="{ name: 'StudentDashboard' }"
                  class="dropdown-item"
              >
                <v-list-item-title>
                  <v-icon icon="mdi-view-dashboard" class="mr-2" />
                  Panel
                </v-list-item-title>
              </v-list-item>

              <v-list-item
                  v-if="authStore.isAdmin"
                  :to="{ name: 'AdminDashboard' }"
                  class="dropdown-item"
              >
                <v-list-item-title>
                  <v-icon icon="mdi-shield-crown" class="mr-2" />
                  Admin Panel
                </v-list-item-title>
              </v-list-item>

              <!-- Rezervasyon modülü geçici olarak öğrencilerden kaldırıldı - İleride tekrar aktif edilebilir -->
              <!-- <v-list-item
                  v-if="authStore.isStudent"
                  :to="{ name: 'Reservations' }"
                  class="dropdown-item"
              >
                <v-list-item-title>
                  <v-icon icon="mdi-calendar-clock" class="mr-2" />
                  Rezervasyonlar
                </v-list-item-title>
              </v-list-item> -->

              <v-list-item
                  v-if="authStore.isAdmin"
                  :to="{ name: 'Attendance' }"
                  class="dropdown-item"
              >
                <v-list-item-title>
                  <v-icon icon="mdi-clipboard-check" class="mr-2" />
                  Yoklama
                </v-list-item-title>
              </v-list-item>

              <v-divider class="my-2" />

              <v-list-item @click="logout" class="dropdown-item logout-item">
                <v-list-item-title>
                  <v-icon icon="mdi-logout" class="mr-2" />
                  Çıkış Yap
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <!-- Guest Buttons -->
        <template v-else>
          <v-btn
              variant="outlined"
              color="white"
              :to="{ name: 'Login' }"
              class="auth-btn mr-2"
          >
            <v-icon start icon="mdi-login" />
            Giriş Yap
          </v-btn>

          <v-btn
              variant="flat"
              color="white"
              :to="{ name: 'Register' }"
              class="auth-btn register-btn"
          >
            <v-icon start icon="mdi-account-plus" />
            Kayıt Ol
          </v-btn>
        </template>
      </v-toolbar-items>

      <!-- Mobile Menu Button -->
      <v-btn
          icon
          color="white"
          class="hidden-md-and-up ml-3"
          @click="drawer = !drawer"
      >
        <v-icon icon="mdi-menu" size="28" />
      </v-btn>
    </v-container>
  </v-app-bar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
      v-model="drawer"
      temporary
      location="right"
      width="320"
      class="mobile-drawer"
  >
    <!-- Drawer Header -->
    <div class="drawer-header">
      <div class="drawer-brand">
        <v-icon icon="mdi-tennis" size="32" color="white" />
        <h3 class="drawer-title">Tenis Akademi</h3>
      </div>
      <v-btn
          icon
          color="white"
          size="small"
          @click="drawer = false"
      >
        <v-icon icon="mdi-close" />
      </v-btn>
    </div>

    <!-- Navigation Items -->
    <v-list class="drawer-list">
      <v-list-item
          :to="{ name: 'Home' }"
          class="drawer-item"
          @click="drawer = false"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-home" />
        </template>
        <v-list-item-title>Ana Sayfa</v-list-item-title>
      </v-list-item>

      <v-list-item
          :to="{ name: 'Courts' }"
          class="drawer-item"
          @click="drawer = false"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-tennis-ball" />
        </template>
        <v-list-item-title>Kortlar</v-list-item-title>
      </v-list-item>

      <v-list-item
          :to="{ name: 'Pricing' }"
          class="drawer-item"
          @click="drawer = false"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-currency-usd" />
        </template>
        <v-list-item-title>Fiyatlar</v-list-item-title>
      </v-list-item>

      <v-list-item
          :to="{ name: 'Contact' }"
          class="drawer-item"
          @click="drawer = false"
      >
        <template v-slot:prepend>
          <v-icon icon="mdi-phone" />
        </template>
        <v-list-item-title>İletişim</v-list-item-title>
      </v-list-item>

      <v-divider v-if="authStore.isAuthenticated" class="my-4" />

      <!-- Authenticated User Menu -->
      <template v-if="authStore.isAuthenticated">
        <!-- User Info -->
        <div class="user-info">
          <v-avatar
              size="48"
              :color="authStore.isAdmin ? 'amber' : 'success'"
              class="mb-3"
          >
            <span class="white--text text-h6 font-weight-bold">
              {{ authStore.user?.firstName?.charAt(0) }}
            </span>
          </v-avatar>
          <h4 class="user-name">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</h4>
          <p class="user-role">
            {{ authStore.isAdmin ? 'Yönetici' : 'Öğrenci' }}
          </p>
        </div>

        <v-list-item
            v-if="authStore.isStudent"
            :to="{ name: 'StudentDashboard' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-view-dashboard" />
          </template>
          <v-list-item-title>Panel</v-list-item-title>
        </v-list-item>

        <v-list-item
            v-if="authStore.isAdmin"
            :to="{ name: 'AdminDashboard' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-shield-crown" />
          </template>
          <v-list-item-title>Admin Panel</v-list-item-title>
        </v-list-item>

        <!-- Rezervasyon modülü geçici olarak öğrencilerden kaldırıldı - İleride tekrar aktif edilebilir -->
        <!-- <v-list-item
            v-if="authStore.isStudent"
            :to="{ name: 'Reservations' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-calendar-clock" />
          </template>
          <v-list-item-title>Rezervasyonlar</v-list-item-title>
        </v-list-item> -->
        <v-list-item
            v-if="authStore.isAdmin"
            :to="{ name: 'Attendance' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-clipboard-check" />
          </template>
          <v-list-item-title>Yoklama</v-list-item-title>
        </v-list-item>

        <v-divider class="my-4" />

        <v-list-item @click="logout" class="drawer-item logout-item">
          <template v-slot:prepend>
            <v-icon icon="mdi-logout" />
          </template>
          <v-list-item-title>Çıkış Yap</v-list-item-title>
        </v-list-item>
      </template>

      <!-- Guest Menu -->
      <template v-else>
        <v-divider class="my-4" />

        <v-list-item
            :to="{ name: 'Login' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-login" />
          </template>
          <v-list-item-title>Giriş Yap</v-list-item-title>
        </v-list-item>

        <v-list-item
            :to="{ name: 'Register' }"
            class="drawer-item"
            @click="drawer = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-plus" />
          </template>
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
  drawer.value = false
}
</script>

<style scoped>

</style>