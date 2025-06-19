<template>
  <div class="login-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="login-card" elevation="8">
            <v-card-text class="pa-8">
              <!-- Logo ve Başlık -->
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
                  Hesabınıza giriş yapın
                </p>
              </div>

              <!-- Giriş Formu -->
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
                    class="mb-4"
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
                  Giriş Yap
                </v-btn>
              </v-form>

              <!-- Hata Uyarısı -->
              <v-alert
                  v-if="authStore.error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  :text="authStore.error"
              />

              <!-- Kayıt Ol Linki -->
              <div class="text-center">
                <p class="text-body-2">
                  Hesabınız yok mu?
                  <router-link
                      :to="{ name: 'Register' }"
                      class="text-primary text-decoration-none font-weight-medium"
                  >
                    Buradan kayıt olun
                  </router-link>
                </p>
              </div>

              <!-- Şifre Sıfırlama Linki -->
              <div class="text-center mt-3">
                <router-link
                    :to="{ name: 'ForgotPassword' }"
                    class="text-grey-darken-1 text-decoration-none text-caption"
                >
                  Şifrenizi mi unuttunuz?
                </router-link>
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

</style>