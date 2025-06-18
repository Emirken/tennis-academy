<template>
  <div class="register-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="5">
          <v-card class="register-card" elevation="8">
            <v-card-text class="pa-8">
              <!-- Logo and Title -->
              <div class="text-center mb-8">
                <v-icon
                    icon="mdi-tennis"
                    size="48"
                    color="primary"
                    class="mb-4"
                />
                <h1 class="text-h4 font-weight-bold text-primary mb-2">
                  Urla Tenis Akademisi
                </h1>
                <p class="text-subtitle-1 text-grey-darken-1">
                  Hesabınızı oluşturun
                </p>
              </div>

              <!-- Register Form -->
              <v-form
                  ref="registerForm"
                  v-model="valid"
                  @submit.prevent="handleRegister"
              >
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                        v-model="registerData.firstName"
                        label="Ad"
                        variant="outlined"
                        :rules="nameRules"
                        prepend-inner-icon="mdi-account"
                        required
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                        v-model="registerData.lastName"
                        label="Soyad"
                        variant="outlined"
                        :rules="nameRules"
                        required
                    />
                  </v-col>
                </v-row>

                <v-text-field
                    v-model="registerData.email"
                    label="E-posta"
                    type="email"
                    variant="outlined"
                    :rules="emailRules"
                    prepend-inner-icon="mdi-email"
                    class="mb-4"
                    required
                />

                <v-text-field
                    v-model="registerData.password"
                    label="Şifre"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    :rules="passwordRules"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    class="mb-4"
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
                    class="mb-6"
                    required
                />

                <v-btn
                    type="submit"
                    color="primary"
                    variant="flat"
                    size="large"
                    :loading="authStore.loading"
                    :disabled="!valid"
                    block
                    class="mb-4"
                >
                  Hesap Oluştur
                </v-btn>
              </v-form>

              <!-- Error Alert -->
              <v-alert
                  v-if="authStore.error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  :text="authStore.error"
              />

              <!-- Login Link -->
              <div class="text-center">
                <p class="text-body-2">
                  Zaten hesabınız var mı?
                  <router-link
                      :to="{ name: 'Login' }"
                      class="text-primary text-decoration-none font-weight-medium"
                  >
                    Buradan giriş yapın
                  </router-link>
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
.register-page {
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
  min-height: 100vh;
}

.register-card {
  border-radius: 16px;
  background: white;
}

:deep(.v-field--outlined) {
  border-radius: 8px;
}

:deep(.v-field--focused .v-field__outline) {
  border-color: #2E7D32;
}

@media (max-width: 600px) {
  .register-card {
    margin: 16px;
  }

  .pa-8 {
    padding: 24px !important;
  }
}
</style>