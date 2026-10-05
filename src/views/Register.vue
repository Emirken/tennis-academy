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
          <v-col cols="12" sm="10" md="8" lg="6">
            <v-card class="auth-card register-card modern-card" elevation="0">
              <div class="stat-card-overlay"></div>
              <v-card-text class="pa-4 pa-sm-6">
                <!-- Form Header -->
                <div class="auth-form-header mb-4">
                  <div class="auth-form-icon-wrapper success-gradient">
                    <v-icon icon="mdi-account-plus" size="28" color="white" />
                  </div>
                  <div class="auth-form-content">
                    <h2 class="auth-form-title">Üye Kayıt Formu</h2>
                    <p class="auth-form-subtitle">Bilgilerinizi 4 kısa adımda doldurun</p>
                  </div>
                </div>

                <!-- Kayıt sihirbazı: adımlar arası geçiş yalnız alttaki Geri/İleri ile -->
                <v-stepper
                    v-model="step"
                    :items="stepTitles"
                    alt-labels
                    flat
                    hide-actions
                    mobile-breakpoint="sm"
                    class="register-stepper"
                >
                  <!-- 1. Hesap -->
                  <template #item.1>
                    <h3 class="register-section-title">Hesap Bilgileri</h3>
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="form.firstName"
                            label="Ad *"
                            variant="outlined"
                            prepend-inner-icon="mdi-account"
                            autocomplete="given-name"
                            class="auth-input"
                            :error-messages="err('firstName')"
                        />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                            v-model="form.lastName"
                            label="Soyad *"
                            variant="outlined"
                            autocomplete="family-name"
                            class="auth-input"
                            :error-messages="err('lastName')"
                        />
                      </v-col>
                    </v-row>
                    <v-text-field
                        v-model="form.phone_number"
                        label="Telefon Numarası *"
                        type="tel"
                        inputmode="numeric"
                        maxlength="11"
                        placeholder="05XXXXXXXXX"
                        variant="outlined"
                        prepend-inner-icon="mdi-phone"
                        autocomplete="tel"
                        class="mb-1 auth-input"
                        hint="Giriş yaparken bu numarayı kullanacaksınız"
                        persistent-hint
                        :error-messages="err('phone_number')"
                    />
                    <v-text-field
                        v-model="form.email"
                        label="E-posta *"
                        type="email"
                        variant="outlined"
                        prepend-inner-icon="mdi-email"
                        placeholder="ornek@mail.com"
                        autocomplete="email"
                        class="mt-2 auth-input"
                        :error-messages="err('email')"
                    />
                    <v-text-field
                        v-model="form.password"
                        label="Şifre *"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock"
                        :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        autocomplete="new-password"
                        class="auth-input"
                        :error-messages="err('password')"
                        @click:append-inner="showPassword = !showPassword"
                    />
                    <v-text-field
                        v-model="form.confirmPassword"
                        label="Şifre Tekrar *"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        autocomplete="new-password"
                        class="auth-input"
                        :error-messages="err('confirmPassword')"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>

                  <!-- 2. Kişisel / Veli -->
                  <template #item.2>
                    <h3 class="register-section-title">Öğrenci Bilgileri</h3>
                    <v-text-field
                        v-model="form.birthDate"
                        label="Doğum Tarihi *"
                        type="date"
                        :max="todayYmd"
                        variant="outlined"
                        prepend-inner-icon="mdi-cake-variant"
                        class="auth-input"
                        :error-messages="err('birthDate')"
                    />
                    <v-row dense>
                      <v-col cols="6">
                        <v-text-field
                            v-model="form.heightCm"
                            label="Boy (cm)"
                            type="number"
                            inputmode="numeric"
                            variant="outlined"
                            prepend-inner-icon="mdi-human-male-height"
                            class="auth-input"
                            :error-messages="err('heightCm')"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                            v-model="form.weightKg"
                            label="Kilo (kg)"
                            type="number"
                            inputmode="numeric"
                            variant="outlined"
                            prepend-inner-icon="mdi-weight-kilogram"
                            class="auth-input"
                            :error-messages="err('weightKg')"
                        />
                      </v-col>
                    </v-row>
                    <v-textarea
                        v-model="form.address"
                        label="Adres"
                        rows="2"
                        auto-grow
                        counter="300"
                        variant="outlined"
                        prepend-inner-icon="mdi-map-marker"
                        autocomplete="street-address"
                        class="auth-input"
                        :error-messages="err('address')"
                    />
                    <v-text-field
                        v-model="form.occupation"
                        label="Meslek"
                        variant="outlined"
                        prepend-inner-icon="mdi-briefcase"
                        class="auth-input"
                        :error-messages="err('occupation')"
                    />

                    <div class="register-question__label">Öğrenci 18 yaşından küçük mü? *</div>
                    <v-radio-group
                        v-model="form.isMinor"
                        inline
                        :error-messages="err('isMinor')"
                        @update:model-value="isMinorTouched = true"
                    >
                      <v-radio label="Evet" :value="true" />
                      <v-radio label="Hayır" :value="false" />
                    </v-radio-group>

                    <v-expand-transition>
                      <div v-if="form.isMinor === true" class="register-subsection">
                        <div class="register-subsection__title">
                          <v-icon icon="mdi-account-child" size="20" />
                          Veli Bilgileri
                        </div>
                        <v-row dense>
                          <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="form.parentFirstName"
                                label="Veli Adı *"
                                variant="outlined"
                                class="auth-input"
                                :error-messages="err('parentFirstName')"
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field
                                v-model="form.parentLastName"
                                label="Veli Soyadı *"
                                variant="outlined"
                                class="auth-input"
                                :error-messages="err('parentLastName')"
                            />
                          </v-col>
                        </v-row>
                        <v-text-field
                            v-model="form.parentPhone"
                            label="Veli Telefon *"
                            type="tel"
                            inputmode="numeric"
                            maxlength="11"
                            placeholder="05XXXXXXXXX"
                            variant="outlined"
                            prepend-inner-icon="mdi-phone"
                            class="auth-input"
                            :error-messages="err('parentPhone')"
                        />
                        <v-text-field
                            v-model="form.parentEmail"
                            label="Veli E-posta"
                            type="email"
                            variant="outlined"
                            prepend-inner-icon="mdi-email"
                            class="auth-input"
                            :error-messages="err('parentEmail')"
                        />
                        <div class="register-question__label">Öğrenci ile yakınlık derecesi</div>
                        <v-radio-group v-model="form.parentRelation" inline hide-details class="mb-2">
                          <v-radio
                              v-for="opt in PARENT_RELATION_OPTIONS"
                              :key="opt.value"
                              :label="opt.title"
                              :value="opt.value"
                          />
                        </v-radio-group>
                      </div>
                    </v-expand-transition>
                  </template>

                  <!-- 3. Başvuru ve Sağlık -->
                  <template #item.3>
                    <h3 class="register-section-title">Başvuru Tercihleri</h3>
                    <div class="register-question__label">
                      Almak istediğiniz eğitim türü *
                      <span class="register-question__hint">(birden fazla seçebilirsiniz)</span>
                    </div>
                    <div class="register-options">
                      <v-checkbox
                          v-for="opt in TRAINING_TYPE_OPTIONS"
                          :key="opt.value"
                          v-model="form.trainingTypes"
                          :value="opt.value"
                          :label="opt.title"
                          density="compact"
                          hide-details
                      />
                    </div>
                    <div v-if="errors.trainingTypes" class="register-error">{{ errors.trainingTypes }}</div>
                    <v-expand-transition>
                      <v-text-field
                          v-if="form.trainingTypes.includes('other')"
                          v-model="form.trainingTypeOther"
                          label="Diğer eğitim türü *"
                          variant="outlined"
                          class="mt-2 auth-input"
                          :error-messages="err('trainingTypeOther')"
                      />
                    </v-expand-transition>
                    <v-select
                        v-model="form.level"
                        label="Seviye *"
                        :items="LEVEL_OPTIONS"
                        item-title="title"
                        item-value="value"
                        variant="outlined"
                        prepend-inner-icon="mdi-tennis-ball"
                        class="mt-3 auth-input"
                        :error-messages="err('level')"
                    />

                    <v-divider class="my-4" />

                    <h3 class="register-section-title">Sağlık ve Özel Durumlar</h3>
                    <div class="register-question__label">
                      Derslere katılımı etkileyebilecek bir sağlık durumu / fiziksel kısıtlılık var mı? *
                    </div>
                    <v-radio-group v-model="form.hasHealthCondition" inline :error-messages="err('hasHealthCondition')">
                      <v-radio label="Hayır" :value="false" />
                      <v-radio label="Evet" :value="true" />
                    </v-radio-group>
                    <v-expand-transition>
                      <v-textarea
                          v-if="form.hasHealthCondition === true"
                          v-model="form.healthConditionNote"
                          label="Açıklama *"
                          rows="2"
                          auto-grow
                          counter="1000"
                          variant="outlined"
                          class="auth-input"
                          :error-messages="err('healthConditionNote')"
                      />
                    </v-expand-transition>
                    <v-textarea
                        v-model="form.specialCareNote"
                        label="Düzenli dikkat edilmesi gereken bir durum var mı? (açıklama)"
                        rows="2"
                        auto-grow
                        counter="1000"
                        variant="outlined"
                        class="auth-input"
                        :error-messages="err('specialCareNote')"
                    />
                    <v-textarea
                        v-model="form.coachNote"
                        label="Antrenörün bilmesini istediğiniz özel bir bilgi var mı? (açıklama)"
                        rows="2"
                        auto-grow
                        counter="1000"
                        variant="outlined"
                        class="auth-input"
                        :error-messages="err('coachNote')"
                    />
                  </template>

                  <!-- 4. Nereden duydunuz + Onaylar -->
                  <template #item.4>
                    <h3 class="register-section-title">Bize Nasıl Ulaştınız?</h3>
                    <div class="register-question__label">Urla Tenis Akademisi'ne nasıl ulaştınız? *</div>
                    <v-radio-group v-model="form.referralSource" :error-messages="err('referralSource')">
                      <v-radio
                          v-for="opt in REFERRAL_SOURCE_OPTIONS"
                          :key="opt.value"
                          :label="opt.title"
                          :value="opt.value"
                      />
                    </v-radio-group>
                    <v-expand-transition>
                      <v-text-field
                          v-if="needsReferralDetail"
                          v-model="form.referralDetail"
                          :label="referralDetailLabel"
                          variant="outlined"
                          class="auth-input"
                          :error-messages="err('referralDetail')"
                      />
                    </v-expand-transition>

                    <v-divider class="my-4" />

                    <h3 class="register-section-title">Onaylar</h3>
                    <div class="consent-box" :class="{ 'consent-box--error': !!errors.waiverAccepted }">
                      <p class="consent-box__text">{{ WAIVER_TEXT }}</p>
                      <v-checkbox
                          v-model="form.waiverAccepted"
                          label="Okudum, kabul ediyorum *"
                          density="compact"
                          :error-messages="err('waiverAccepted')"
                      />
                    </div>
                    <div class="consent-box" :class="{ 'consent-box--error': !!errors.dataConsentAccepted }">
                      <p class="consent-box__text">{{ DATA_CONSENT_TEXT }}</p>
                      <v-checkbox
                          v-model="form.dataConsentAccepted"
                          label="Okudum, kabul ediyorum *"
                          density="compact"
                          :error-messages="err('dataConsentAccepted')"
                      />
                    </div>
                    <div class="consent-box consent-box--optional">
                      <v-checkbox
                          v-model="form.marketingConsent"
                          :label="MARKETING_CONSENT_TEXT"
                          density="compact"
                          hide-details
                      />
                      <p class="consent-box__hint">İsteğe bağlıdır; kaydınızı etkilemez.</p>
                    </div>
                  </template>
                </v-stepper>

                <!-- Error Alert -->
                <v-alert
                    v-if="authStore.error"
                    type="error"
                    variant="tonal"
                    class="mb-4 auth-alert"
                    :text="authStore.error"
                />

                <!-- Adım gezinme -->
                <div class="register-nav mb-4">
                  <v-btn
                      v-if="step > 1"
                      variant="outlined"
                      size="large"
                      :disabled="authStore.loading"
                      @click="goBack"
                  >
                    <v-icon icon="mdi-chevron-left" class="mr-1" />
                    Geri
                  </v-btn>
                  <v-spacer />
                  <v-btn
                      v-if="step < lastStep"
                      color="primary"
                      variant="flat"
                      size="large"
                      @click="goNext"
                  >
                    İleri
                    <v-icon icon="mdi-chevron-right" class="ml-1" />
                  </v-btn>
                  <v-btn
                      v-else
                      color="success"
                      variant="flat"
                      size="large"
                      :loading="authStore.loading"
                      class="auth-submit-btn register-submit-btn"
                      @click="handleRegister"
                  >
                    <v-icon icon="mdi-account-plus" class="mr-2" />
                    Kayıt Ol
                  </v-btn>
                </div>

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
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import type { PlayerLevel } from '@/types/user'
import {
  DATA_CONSENT_TEXT,
  LEVEL_OPTIONS,
  MARKETING_CONSENT_TEXT,
  PARENT_RELATION_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  REGISTRATION_STEPS,
  TRAINING_TYPE_OPTIONS,
  WAIVER_TEXT,
  buildRegistrationProfile,
  emptyRegistrationForm,
  isUnder18,
  toYmd,
  validateRegistrationForm,
  validateRegistrationStep,
  type RegistrationErrors,
  type RegistrationFormState,
  type RegistrationStep,
} from '@/utils/registrationForm'

const router = useRouter()
const authStore = useAuthStore()

// Formun tamamı tek nesnede; adımlar arası geçişte değerler korunur.
const form = reactive<RegistrationFormState>(emptyRegistrationForm())
const step = ref<RegistrationStep>(1)
const stepTitles = REGISTRATION_STEPS.map((s) => s.title)
const lastStep = REGISTRATION_STEPS[REGISTRATION_STEPS.length - 1].step
const todayYmd = toYmd(new Date())

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Hatalar, kullanıcı o adımda "İleri"ye ya da "Kayıt Ol"a bastıktan sonra görünür;
// boş form açılır açılmaz kırmızıya boyanmaz.
const attemptedSteps = ref<RegistrationStep[]>([])
const errors = computed<RegistrationErrors>(() =>
  attemptedSteps.value.reduce<RegistrationErrors>(
    (all, s) => ({ ...all, ...validateRegistrationStep(s, form) }),
    {},
  ),
)
const err = (field: keyof RegistrationFormState): string | string[] => errors.value[field] ?? []
const markAttempted = (...steps: RegistrationStep[]) => {
  attemptedSteps.value = Array.from(new Set([...attemptedSteps.value, ...steps]))
}

// Doğum tarihi girilince "18 yaşından küçük mü?" sorusu, kullanıcı elle seçmediyse
// otomatik işaretlenir; çelişki yine de 2. adım doğrulamasında yakalanır.
const isMinorTouched = ref(false)
watch(
  () => form.birthDate,
  (value) => {
    if (isMinorTouched.value) return
    const under = isUnder18(value)
    if (under !== null) form.isMinor = under
  },
)

const needsReferralDetail = computed(() => form.referralSource === 'friend' || form.referralSource === 'other')
const referralDetailLabel = computed(() => (form.referralSource === 'friend' ? 'Referans ismi *' : 'Açıklama *'))

const scrollToStepper = () => {
  document.querySelector('.register-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const scrollToFirstError = async () => {
  await nextTick()
  document
    .querySelector('.register-page .v-input--error, .register-page .register-error')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const goNext = async () => {
  markAttempted(step.value)
  if (Object.keys(validateRegistrationStep(step.value, form)).length > 0) {
    await scrollToFirstError()
    return
  }
  authStore.clearError()
  step.value = (step.value + 1) as RegistrationStep
  scrollToStepper()
}

const goBack = () => {
  if (step.value === 1) return
  step.value = (step.value - 1) as RegistrationStep
  scrollToStepper()
}

const handleRegister = async () => {
  markAttempted(...REGISTRATION_STEPS.map((s) => s.step))
  const { firstInvalidStep } = validateRegistrationForm(form)
  if (firstInvalidStep !== null) {
    step.value = firstInvalidStep
    await scrollToFirstError()
    return
  }

  const success = await authStore.register({
    phone_number: form.phone_number,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    role: 'student',
    email: form.email.trim(),
    birthDate: form.birthDate,
    level: form.level as PlayerLevel,
    profile: buildRegistrationProfile(form, new Date()),
  })

  // Kayıt oturumu açık bırakır; öğrenci panelde "Hesap Onayı Bekleniyor" uyarısını görür.
  if (success) {
    router.push({ name: 'StudentDashboard' })
    return
  }
  // Telefonla ilgili hata (zaten kayıtlı / silinmiş hesap) 1. adımda düzeltilir.
  if (authStore.error && /telefon/i.test(authStore.error)) {
    step.value = 1
    scrollToStepper()
  }
}

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
</script>

<style scoped>
.register-stepper {
  background: transparent;
}
.register-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}
.register-stepper :deep(.v-stepper-window) {
  margin: 16px 0 8px;
}
.register-section-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0 0 12px;
  color: rgb(var(--v-theme-primary));
}
.register-question__label {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 4px 0;
  color: rgba(var(--v-theme-on-surface), 0.87);
}
.register-question__hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.register-subsection {
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  border-radius: 12px;
  padding: 16px 16px 4px;
  margin-bottom: 16px;
  background: rgba(var(--v-theme-primary), 0.04);
}
.register-subsection__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}
.register-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  column-gap: 8px;
}
.register-error {
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
  margin: 4px 0 8px 16px;
}
.consent-box {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 14px 16px 0;
  margin-bottom: 12px;
}
.consent-box--error {
  border-color: rgb(var(--v-theme-error));
}
.consent-box--optional {
  background: rgba(var(--v-theme-on-surface), 0.02);
  padding-bottom: 12px;
}
.consent-box__text {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 4px;
}
.consent-box__hint {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 0 40px;
}
.register-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
