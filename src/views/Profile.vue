<template>
  <v-container class="profile-page py-6">
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center">
          <v-btn
              icon
              variant="text"
              class="mr-4"
              @click="router.back()"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold section-title">Profilim</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Kişisel bilgilerinizi ve şifrenizi güncelleyebilirsiniz.</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Profil Bilgileri Formu -->
      <v-col cols="12" md="6">
        <v-card class="modern-card h-100" elevation="2">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon icon="mdi-account-details" color="primary" class="mr-2" />
            Kişisel Bilgiler
          </v-card-title>
          
          <v-divider />

          <v-card-text class="pa-4">
            <v-form ref="profileForm" @submit.prevent="handleProfileUpdate" v-model="isProfileFormValid">
              <v-text-field
                  v-model="profileData.firstName"
                  label="Ad"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :rules="[v => !!v || 'Ad zorunludur']"
                  :error-messages="validationErrors.firstName"
                  class="mb-2"
              />

              <v-text-field
                  v-model="profileData.lastName"
                  label="Soyad"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-outline"
                  :rules="[v => !!v || 'Soyad zorunludur']"
                  :error-messages="validationErrors.lastName"
                  class="mb-2"
              />

              <v-text-field
                  v-model="profileData.phone"
                  label="Telefon Numarası"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone"
                  hint="05xx xxx xx xx formatında"
                  :rules="[
                    v => !!v || 'Telefon numarası zorunludur',
                    v => /^0[0-9]{10}$/.test(v) || 'Geçerli bir telefon numarası giriniz (Örn: 05xxxxxxxxx)'
                  ]"
                  :error-messages="validationErrors.phone"
                  class="mb-2"
              />
              
              <v-text-field
                  label="Rol"
                  :model-value="userRoleText"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-shield-account"
                  readonly
                  disabled
                  class="mb-4"
              />

              <v-alert
                  v-if="profileSuccess"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                  closable
              >
                {{ profileSuccess }}
              </v-alert>

              <v-alert
                  v-if="profileError"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
              >
                {{ profileError }}
              </v-alert>

              <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  :loading="isUpdatingProfile"
                  :disabled="!isProfileFormValid"
              >
                Bilgileri Güncelle
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Şifre Değiştirme Formu -->
      <v-col cols="12" md="6">
        <v-card class="modern-card h-100" elevation="2">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon icon="mdi-lock-reset" color="warning" class="mr-2" />
            Şifre Değiştir
          </v-card-title>
          
          <v-divider />

          <v-card-text class="pa-4">
            <v-form ref="passwordForm" @submit.prevent="handlePasswordChange" v-model="isPasswordFormValid">
              <v-text-field
                  v-model="passwordData.currentPassword"
                  label="Mevcut Şifre"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  @click:append-inner="showCurrentPassword = !showCurrentPassword"
                  :rules="[v => !!v || 'Mevcut şifre zorunludur']"
                  :error-messages="validationErrors.currentPassword"
                  class="mb-2"
              />

              <v-text-field
                  v-model="passwordData.newPassword"
                  label="Yeni Şifre"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock-plus"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showNewPassword ? 'text' : 'password'"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  :rules="[
                    v => !!v || 'Yeni şifre zorunludur',
                    v => v.length >= 6 || 'Şifre en az 6 karakter olmalıdır'
                  ]"
                  :error-messages="validationErrors.newPassword"
                  class="mb-2"
              />

              <v-text-field
                  v-model="passwordData.confirmPassword"
                  label="Yeni Şifre (Tekrar)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock-check"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  :rules="[
                    v => !!v || 'Şifre tekrarı zorunludur',
                    v => v === passwordData.newPassword || 'Şifreler eşleşmiyor'
                  ]"
                  :error-messages="validationErrors.confirmPassword"
                  class="mb-4"
              />

              <v-alert
                  v-if="passwordSuccess"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                  closable
              >
                {{ passwordSuccess }}
              </v-alert>

              <v-alert
                  v-if="passwordError"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
              >
                {{ passwordError }}
              </v-alert>

              <v-btn
                  type="submit"
                  color="warning"
                  block
                  size="large"
                  :loading="isChangingPassword"
                  :disabled="!isPasswordFormValid"
              >
                Şifreyi Değiştir
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { ProfileUpdateData, PasswordChangeData } from '@/composables/useAuth'

const router = useRouter()
const { 
  user, 
  userFullName, 
  updateProfile, 
  changePassword, 
  isUpdatingProfile, 
  isChangingPassword,
  validationErrors,
  clearValidationErrors,
  successMessage,
  error: authError,
  isAdmin
} = useAuth()

// Form References
const profileForm = ref<any>(null)
const passwordForm = ref<any>(null)

// Form Validation States
const isProfileFormValid = ref(false)
const isPasswordFormValid = ref(false)

// Messages
const profileSuccess = ref('')
const profileError = ref('')
const passwordSuccess = ref('')
const passwordError = ref('')

// Password Visibility States
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Form Data Models
const profileData = ref<ProfileUpdateData>({
  firstName: '',
  lastName: '',
  phone: ''
})

const passwordData = ref<PasswordChangeData>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userRoleText = computed(() => {
  if (!user.value) return ''
  return isAdmin.value ? 'Yönetici (Admin)' : 'Öğrenci'
})

// Initialize Data
onMounted(() => {
  if (user.value) {
    profileData.value = {
      firstName: user.value.firstName || '',
      lastName: user.value.lastName || '',
      // Ensure phone_number is displayed in phone field if available
      phone: user.value.phone_number || user.value.phone || ''
    }
  } else {
    // Profil bilgileri yoksa anasayfaya yönlendir
    router.push('/')
  }
})

// Handlers
const handleProfileUpdate = async () => {
  // Reset messages
  profileSuccess.value = ''
  profileError.value = ''
  clearValidationErrors()
  
  if (!profileForm.value) return
  
  const { valid } = await profileForm.value.validate()
  if (!valid) return
  
  const success = await updateProfile(profileData.value)
  
  if (success) {
    profileSuccess.value = 'Profil bilgileriniz başarıyla güncellendi.'
    // Mesajı belli süre sonra kaldır
    setTimeout(() => { profileSuccess.value = '' }, 5000)
  } else {
    profileError.value = authError.value || 'Profil güncellenirken bir hata oluştu.'
  }
}

const handlePasswordChange = async () => {
  // Reset messages
  passwordSuccess.value = ''
  passwordError.value = ''
  clearValidationErrors()
  
  if (!passwordForm.value) return
  
  const { valid } = await passwordForm.value.validate()
  if (!valid) return
  
  const success = await changePassword(passwordData.value)
  
  if (success) {
    passwordSuccess.value = 'Şifreniz başarıyla değiştirildi.'
    // Şifre formunu temizle
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    passwordForm.value.resetValidation()
    // Mesajı belli süre sonra kaldır
    setTimeout(() => { passwordSuccess.value = '' }, 5000)
  } else {
    passwordError.value = authError.value || 'Şifre değiştirilirken bir hata oluştu.'
  }
}

</script>

<style scoped>
.modern-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

.modern-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}

.section-title {
  color: #2E7D32;
  letter-spacing: -0.5px;
}
</style>
