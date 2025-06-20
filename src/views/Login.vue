<template>
  <div class="login-page">
    <v-container fluid class="pa-0">
      <!-- Enhanced Welcome Section -->
      <div class="auth-welcome-section">
        <v-container>
          <v-row align="center" justify="center" class="py-12">
            <v-col cols="12" class="text-center">
              <div class="auth-welcome-content">
                <div class="auth-logo-wrapper mb-6">
                  <v-icon
                      icon="mdi-tennis"
                      size="80"
                      color="white"
                  />
                </div>
                <h1 class="auth-welcome-title mb-3">
                  Urla Tenis Akademisi
                </h1>
                <p class="auth-welcome-subtitle">
                  Tenis akademisine hoş geldiniz - Hesabınıza giriş yapın
                </p>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container class="auth-container">
        <v-row justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-card class="auth-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="pa-8">
                <!-- Form Header -->
                <div class="auth-form-header mb-8">
                  <div class="auth-form-icon-wrapper primary-gradient">
                    <v-icon icon="mdi-login" size="28" color="white" />
                  </div>
                  <div class="auth-form-content">
                    <h2 class="auth-form-title">Giriş Yap</h2>
                    <p class="auth-form-subtitle">Hesabınıza erişim sağlayın</p>
                  </div>
                </div>

                <!-- Login Form -->
                <v-form
                    ref="loginForm"
                    v-model="valid"
                    @submit.prevent="handleLogin"
                >
                  <v-text-field
                      v-model="loginData.email"
                      label="E-posta"
                      type="email"
                      variant="outlined"
                      :rules="emailRules"
                      :error-messages="emailError"
                      prepend-inner-icon="mdi-email"
                      class="mb-4 auth-input"
                      required
                  />

                  <v-text-field
                      v-model="loginData.password"
                      label="Şifre"
                      :type="showPassword ? 'text' : 'password'"
                      variant="outlined"
                      :rules="passwordRules"
                      :error-messages="passwordError"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showPassword = !showPassword"
                      class="mb-6 auth-input"
                      required
                  />

                  <v-btn
                      type="submit"
                      variant="flat"
                      size="large"
                      :loading="authStore.loading"
                      :disabled="!valid"
                      block
                      class="view-color auth-submit-btn mb-4"
                  >
                    <v-icon icon="mdi-login" class="mr-2" />
                    Giriş Yap
                  </v-btn>
                </v-form>

                <!-- Error Alert -->
                <v-alert
                    v-if="authStore.error"
                    type="error"
                    variant="tonal"
                    class="mb-4 auth-alert"
                    :text="authStore.error"
                />

                <!-- Auth Links -->
                <div class="auth-links">
                  <!-- Register Link -->
                  <div class="auth-link-card mb-3">
                    <div class="auth-link-content">
                      <div class="auth-link-info">
                        <h4 class="auth-link-title">Hesabınız yok mu?</h4>
                        <p class="auth-link-description">Hemen ücretsiz hesap oluşturun</p>
                      </div>
                      <v-btn
                          :to="{ name: 'Register' }"
                          color="success"
                          variant="outlined"
                          size="small"
                          class="auth-link-btn"
                      >
                        Kayıt Ol
                      </v-btn>
                    </div>
                  </div>

                  <!-- Forgot Password Link -->
                  <div class="auth-link-card">
                    <div class="auth-link-content">
                      <div class="auth-link-info">
                        <h4 class="auth-link-title">Şifrenizi mi unuttunuz?</h4>
                        <p class="auth-link-description">Şifre sıfırlama talimatları alın</p>
                      </div>
                      <v-btn
                          :to="{ name: 'ForgotPassword' }"
                          color="info"
                          variant="outlined"
                          size="small"
                          class="auth-link-btn"
                      >
                        Sıfırla
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Features Section -->
        <v-row justify="center" class="mt-8">
          <v-col cols="12" md="10">
            <div class="features-section">
              <h3 class="features-title mb-6">Neden Urla Tenis Akademisi?</h3>
              <v-row>
                <v-col cols="12" sm="6" md="3" v-for="(feature, index) in features" :key="index">
                  <div class="feature-item">
                    <div class="feature-icon-wrapper" :class="feature.gradient">
                      <v-icon :icon="feature.icon" size="32" color="white" />
                    </div>
                    <h4 class="feature-title">{{ feature.title }}</h4>
                    <p class="feature-description">{{ feature.description }}</p>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form verileri
const loginData = reactive({
  email: '',
  password: ''
})

// Form doğrulama
const valid = ref(false)
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')

// Doğrulama kuralları
const emailRules = [
  (v: string) => !!v || 'E-posta gereklidir',
  (v: string) => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
]

const passwordRules = [
  (v: string) => !!v || 'Şifre gereklidir',
  (v: string) => v.length >= 6 || 'Şifre en az 6 karakter olmalıdır'
]

// Features data
const features = [
  {
    title: 'Profesyonel Antrenörler',
    description: 'Deneyimli ve sertifikalı antrenörler',
    icon: 'mdi-account-tie',
    gradient: 'primary-gradient'
  },
  {
    title: 'Modern Tesisler',
    description: 'Son teknoloji kortlar ve ekipmanlar',
    icon: 'mdi-tennis-ball',
    gradient: 'success-gradient'
  },
  {
    title: 'Esnek Programlar',
    description: 'Size uygun ders saatleri',
    icon: 'mdi-calendar-clock',
    gradient: 'info-gradient'
  },
  {
    title: 'Online Takip',
    description: 'Gelişiminizi dijital olarak izleyin',
    icon: 'mdi-chart-line',
    gradient: 'warning-gradient'
  }
]

// Giriş işlemini yönet
const handleLogin = async () => {
  if (!valid.value) return

  const success = await authStore.login(loginData.email, loginData.password)

  if (success) {
    // Kullanıcı rolüne göre yönlendir
    if (authStore.isAdmin) {
      router.push({ name: 'AdminDashboard' })
    } else {
      router.push({ name: 'StudentDashboard' })
    }
  }
}
</script>

<style scoped>
/* Styles are handled in main.css */
</style>