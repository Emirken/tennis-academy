<template>
  <div class="register-page">
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
                  Tenis serüveninize başlayın - Hesabınızı oluşturun
                </p>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container class="auth-container">
        <v-row justify="center">
          <v-col cols="12" sm="8" md="6" lg="5">
            <v-card class="auth-card register-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="pa-8">
                <!-- Form Header -->
                <div class="auth-form-header mb-8">
                  <div class="auth-form-icon-wrapper success-gradient">
                    <v-icon icon="mdi-account-plus" size="28" color="white" />
                  </div>
                  <div class="auth-form-content">
                    <h2 class="auth-form-title">Hesap Oluştur</h2>
                    <p class="auth-form-subtitle">Ücretsiz hesabınızı hemen oluşturun</p>
                  </div>
                </div>

                <!-- Register Form -->
                <v-form
                    ref="registerForm"
                    v-model="valid"
                    @submit.prevent="handleRegister"
                >
                  <!-- Name Fields -->
                  <v-row class="mb-4">
                    <v-col cols="6">
                      <v-text-field
                          v-model="registerData.firstName"
                          label="Ad"
                          variant="outlined"
                          :rules="nameRules"
                          prepend-inner-icon="mdi-account"
                          class="auth-input"
                          required
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                          v-model="registerData.lastName"
                          label="Soyad"
                          variant="outlined"
                          :rules="nameRules"
                          class="auth-input"
                          required
                      />
                    </v-col>
                  </v-row>

                  <!-- Email Field -->
                  <v-text-field
                      v-model="registerData.email"
                      label="E-posta"
                      type="email"
                      variant="outlined"
                      :rules="emailRules"
                      prepend-inner-icon="mdi-email"
                      class="mb-4 auth-input"
                      required
                  />

                  <!-- Password Fields -->
                  <v-text-field
                      v-model="registerData.password"
                      label="Şifre"
                      :type="showPassword ? 'text' : 'password'"
                      variant="outlined"
                      :rules="passwordRules"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showPassword = !showPassword"
                      class="mb-4 auth-input"
                      required
                  />

                  <v-text-field
                      v-model="registerData.confirmPassword"
                      label="Şifre Tekrar"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      variant="outlined"
                      :rules="confirmPasswordRules"
                      prepend-inner-icon="mdi-lock-check"
                      :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showConfirmPassword = !showConfirmPassword"
                      class="mb-6 auth-input"
                      required
                  />

                  <!-- Submit Button -->
                  <v-btn
                      type="submit"
                      color="success"
                      variant="flat"
                      size="large"
                      :loading="authStore.loading"
                      :disabled="!valid"
                      block
                      class="auth-submit-btn register-submit-btn mb-4"
                  >
                    <v-icon icon="mdi-account-plus" class="mr-2" />
                    Hesap Oluştur
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
                  <!-- Login Link -->
                  <div class="auth-link-card">
                    <div class="auth-link-content">
                      <div class="auth-link-info">
                        <h4 class="auth-link-title">Zaten hesabınız var mı?</h4>
                        <p class="auth-link-description">Hemen giriş yapın ve derslerinize başlayın</p>
                      </div>
                      <v-btn
                          :to="{ name: 'Login' }"
                          color="primary"
                          variant="outlined"
                          size="small"
                          class="auth-link-btn"
                      >
                        Giriş Yap
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Benefits Section -->
        <v-row justify="center" class="mt-8">
          <v-col cols="12" md="10">
            <div class="benefits-section">
              <h3 class="benefits-title mb-6">Üye Olmanın Avantajları</h3>
              <v-row>
                <v-col cols="12" sm="6" md="3" v-for="(benefit, index) in benefits" :key="index">
                  <div class="benefit-item">
                    <div class="benefit-icon-wrapper" :class="benefit.gradient">
                      <v-icon :icon="benefit.icon" size="32" color="white" />
                    </div>
                    <h4 class="benefit-title">{{ benefit.title }}</h4>
                    <p class="benefit-description">{{ benefit.description }}</p>
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

// Form data - role sabit olarak student
const registerData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student' as const
})

// Form validation
const valid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation rules - Türkçe hata mesajları
const nameRules = [
  (v: string) => !!v || 'Ad/Soyad gereklidir',
  (v: string) => v.length >= 2 || 'Ad/Soyad en az 2 karakter olmalıdır'
]

const emailRules = [
  (v: string) => !!v || 'E-posta gereklidir',
  (v: string) => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
]

const passwordRules = [
  (v: string) => !!v || 'Şifre gereklidir',
  (v: string) => v.length >= 6 || 'Şifre en az 6 karakter olmalıdır',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Şifre tekrarı gereklidir',
  (v: string) => v === registerData.password || 'Şifreler eşleşmiyor'
]

// Benefits data
const benefits = [
  {
    title: 'Esnek Ders Saatleri',
    description: 'Size uygun zamanlarda ders alın',
    icon: 'mdi-clock-outline',
    gradient: 'primary-gradient'
  },
  {
    title: 'Profesyonel Antrenörler',
    description: 'Uzman eğitmenlerden öğrenin',
    icon: 'mdi-account-tie',
    gradient: 'success-gradient'
  },
  {
    title: 'Modern Tesisler',
    description: 'En iyi ekipmanlarla antrenman',
    icon: 'mdi-tennis-ball',
    gradient: 'info-gradient'
  },
  {
    title: 'Online Takip',
    description: 'Gelişiminizi dijital olarak izleyin',
    icon: 'mdi-chart-line',
    gradient: 'warning-gradient'
  }
]

// Registration steps
const registrationSteps = [
  {
    title: 'Hesap Oluştur',
    description: 'Kişisel bilgilerinizi girin ve hesabınızı oluşturun',
    color: 'step-primary'
  },
  {
    title: 'Paket Seç',
    description: 'Size uygun ders paketini seçin',
    color: 'step-success'
  },
  {
    title: 'Derslere Başla',
    description: 'Rezervasyon yapın ve tenise başlayın',
    color: 'step-info'
  }
]

// Handle register
const handleRegister = async () => {
  if (!valid.value) return

  const success = await authStore.register({
    email: registerData.email,
    password: registerData.password,
    firstName: registerData.firstName,
    lastName: registerData.lastName,
    role: registerData.role
  })

  if (success) {
    // Sadece student olarak kayıt olduğu için Student Dashboard'a yönlendir
    router.push({ name: 'StudentDashboard' })
  }
}
</script>

<style scoped>
/* Styles are handled in main.css */
</style>