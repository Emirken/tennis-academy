<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form verileri
const resetData = reactive({
  email: ''
})

// Form durumu
const valid = ref(false)
const loading = ref(false)
const emailSent = ref(false)
const error = ref('')

// Doğrulama kuralları
const emailRules = [
  (v: string) => !!v || 'E-posta gereklidir',
  (v: string) => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
]

// Şifre sıfırlama işlemini yönet
const handleResetPassword = async () => {
  if (!valid.value) return

  loading.value = true
  error.value = ''

  try {
    // AuthStore'dan sendPasswordResetEmail fonksiyonunu kullan
    await authStore.sendPasswordResetEmail(resetData.email)

    emailSent.value = true
  } catch (err: any) {
    error.value = err.message || 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu'
  } finally {
    loading.value = false
  }
}

// Giriş sayfasına dön
const goToLogin = () => {
  router.push({ name: 'Login' })
}

// E-postayı tekrar gönder
const resendEmail = async () => {
  emailSent.value = false
  await handleResetPassword()
}
</script>

<template>
  <div class="forgot-password-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="reset-card" elevation="8">
            <v-card-text class="pa-8">
              <!-- Logo ve Başlık -->
              <div class="text-center mb-8">
                <v-icon
                    icon="mdi-lock-reset"
                    size="48"
                    color="primary"
                    class="mb-4"
                />
                <h1 class="text-h4 font-weight-bold text-primary mb-2">
                  Şifre Sıfırlama
                </h1>
                <p class="text-subtitle-1 text-grey-darken-1">
                  {{ emailSent ? 'E-posta gönderildi' : 'E-posta adresinizi girin' }}
                </p>
              </div>

              <!-- Başarı Mesajı -->
              <div v-if="emailSent" class="text-center">
                <v-icon
                    icon="mdi-email-check"
                    size="64"
                    color="success"
                    class="mb-4"
                />
                <h2 class="text-h5 font-weight-medium mb-4">
                  E-posta Gönderildi!
                </h2>
                <p class="text-body-1 text-grey-darken-1 mb-6">
                  {{ resetData.email }} adresine şifre sıfırlama talimatları gönderildi.
                  E-posta kutunuzu kontrol edin.
                </p>

                <div class="d-flex flex-column gap-3">
                  <v-btn
                      color="primary"
                      variant="flat"
                      size="large"
                      @click="goToLogin"
                      block
                  >
                    Giriş Sayfasına Dön
                  </v-btn>

                  <v-btn
                      color="grey-darken-1"
                      variant="outlined"
                      size="large"
                      @click="resendEmail"
                      :loading="loading"
                      block
                  >
                    E-postayı Tekrar Gönder
                  </v-btn>
                </div>

                <!-- E-posta bulunamadı uyarısı -->
                <v-alert
                    type="info"
                    variant="tonal"
                    class="mt-6 text-start"
                >
                  <strong>E-postayı bulamıyor musunuz?</strong><br>
                  • Spam/önemsiz klasörünü kontrol edin<br>
                  • E-posta adresinin doğru olduğundan emin olun<br>
                  • Birkaç dakika bekleyin, e-posta gecikmeli gelebilir
                </v-alert>
              </div>

              <!-- Şifre Sıfırlama Formu -->
              <div v-else>
                <p class="text-body-1 text-grey-darken-1 mb-6 text-center">
                  Kayıtlı e-posta adresinizi girin. Size şifre sıfırlama bağlantısı göndereceğiz.
                </p>

                <v-form
                    ref="resetForm"
                    v-model="valid"
                    @submit.prevent="handleResetPassword"
                >
                  <v-text-field
                      v-model="resetData.email"
                      label="E-posta Adresi"
                      type="email"
                      variant="outlined"
                      :rules="emailRules"
                      prepend-inner-icon="mdi-email"
                      class="mb-6"
                      required
                      autofocus
                  />

                  <v-btn
                      type="submit"
                      color="primary"
                      variant="flat"
                      size="large"
                      :loading="loading"
                      :disabled="!valid"
                      block
                      class="mb-4"
                  >
                    Şifre Sıfırlama E-postası Gönder
                  </v-btn>
                </v-form>

                <!-- Hata Uyarısı -->
                <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    :text="error"
                />

                <!-- Geri Dön Linki -->
                <div class="text-center">
                  <router-link
                      :to="{ name: 'Login' }"
                      class="text-grey-darken-1 text-decoration-none"
                  >
                    <v-icon icon="mdi-arrow-left" size="small" class="me-1" />
                    Giriş sayfasına dön
                  </router-link>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.forgot-password-page {
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
  min-height: 100vh;
}

.reset-card {
  border-radius: 16px;
  background: white;
}

.gap-3 > * {
  margin-bottom: 12px;
}

.gap-3 > *:last-child {
  margin-bottom: 0;
}

:deep(.v-field--outlined) {
  border-radius: 8px;
}

:deep(.v-field--focused .v-field__outline) {
  border-color: #2E7D32;
}

:deep(.v-alert) {
  border-radius: 8px;
}

@media (max-width: 600px) {
  .reset-card {
    margin: 16px;
  }

  .pa-8 {
    padding: 24px !important;
  }

  .text-h4 {
    font-size: 1.75rem !important;
  }

  .text-h5 {
    font-size: 1.5rem !important;
  }
}

/* Animasyonlar */
.v-card {
  transition: all 0.3s ease;
}

.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}

.v-alert {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Özel ikonlar için stil */
.mdi-email-check {
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 20%, 60%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  80% {
    transform: translateY(-5px);
  }
}
</style>