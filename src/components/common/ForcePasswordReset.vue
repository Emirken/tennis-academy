<template>
  <!-- Zorunlu şifre belirleme: geçici şifreyle giriş yapan kullanıcı, kalıcı
       şifresini belirlemeden başka hiçbir şeye erişemez. Dialog kapatılamaz,
       dışına tıklanamaz, ESC ile çıkılamaz. -->
  <v-dialog
      :model-value="show"
      persistent
      no-click-animation
      :scrim="true"
      max-width="480"
      :retain-focus="true"
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-4 bg-warning text-white">
        <v-icon icon="mdi-lock-alert" class="mr-2" />
        Şifrenizi Belirleyin
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Kullanıcının görebileceği net uyarı -->
        <v-alert
            type="warning"
            variant="tonal"
            density="comfortable"
            class="mb-4"
        >
          <div class="font-weight-bold mb-1">Geçici şifreyle giriş yaptınız</div>
          <div class="text-body-2">
            Güvenliğiniz için devam etmeden önce yeni (kalıcı) bir şifre belirlemeniz
            gerekiyor. Şifrenizi belirlemeden bu pencereyi kapatamaz veya uygulamayı
            kullanamazsınız.
          </div>
        </v-alert>

        <v-form ref="resetForm" v-model="resetValid">
          <v-text-field
              v-model="newPassword"
              label="Yeni Şifre"
              :type="showNewPassword ? 'text' : 'password'"
              variant="outlined"
              :rules="passwordRules"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
              autofocus
              @click:append-inner="showNewPassword = !showNewPassword"
              class="mb-3"
          />
          <v-text-field
              v-model="confirmNewPassword"
              label="Yeni Şifre (Tekrar)"
              :type="showNewPassword ? 'text' : 'password'"
              variant="outlined"
              :rules="confirmPasswordRules"
              prepend-inner-icon="mdi-lock-check"
              @keyup.enter="handleSubmit"
          />
        </v-form>

        <v-alert
            v-if="resetError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
            :text="resetError"
        />
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
            color="warning"
            variant="flat"
            :loading="resetting"
            :disabled="!resetValid"
            @click="handleSubmit"
        >
          <v-icon icon="mdi-check" class="mr-1" />
          Şifreyi Kaydet ve Devam Et
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()

const newPassword = ref('')
const confirmNewPassword = ref('')
const showNewPassword = ref(false)
const resetValid = ref(false)
const resetting = ref(false)
const resetError = ref('')

// Dialog; oturum açık VE (login akışı bayrağı VEYA Firestore'daki kalıcı bayrak)
// true olduğunda görünür. Firestore bayrağı sayfa yenilense bile korunur.
const show = computed(() =>
    authStore.isAuthenticated &&
    (authStore.mustResetPassword || authStore.user?.mustResetPassword === true)
)

const passwordRules = [
  (v: string) => !!v || 'Şifre gereklidir',
  (v: string) => v.length >= 6 || 'Şifre en az 6 karakter olmalıdır'
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Şifre tekrarı gereklidir',
  (v: string) => v === newPassword.value || 'Şifreler eşleşmiyor'
]

const handleSubmit = async () => {
  if (!resetValid.value || resetting.value) return

  resetting.value = true
  resetError.value = ''
  try {
    await authStore.completePasswordReset(newPassword.value)
    // Başarılı: bayraklar temizlendi, dialog otomatik kapanır
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (error: any) {
    console.error('Şifre belirleme hatası:', error)
    resetError.value = error?.message || 'Şifre belirlenirken bir hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    resetting.value = false
  }
}
</script>
