<template>
  <div class="register-form-component">
    <v-card class="register-card" elevation="8">
      <v-card-text class="pa-8">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <v-icon
              icon="mdi-tennis"
              size="64"
              color="primary"
              class="mb-4"
          />
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            Join the Academy
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1">
            Create your Urla Tennis Academy account
          </p>
        </div>

        <!-- Registration Steps -->
        <v-stepper
            v-model="currentStep"
            :items="steps"
            hide-actions
            class="mb-6"
        >
          <template #item.1>
            <div class="step-content">
              <h3 class="text-h6 mb-4">Personal Information</h3>

              <v-row>
                <v-col cols="6">
                  <v-text-field
                      v-model="registerData.firstName"
                      label="First Name"
                      variant="outlined"
                      :rules="nameRules"
                      :error-messages="fieldErrors.firstName"
                      prepend-inner-icon="mdi-account-outline"
                      required
                      @input="clearFieldError('firstName')"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                      v-model="registerData.lastName"
                      label="Last Name"
                      variant="outlined"
                      :rules="nameRules"
                      :error-messages="fieldErrors.lastName"
                      required
                      @input="clearFieldError('lastName')"
                  />
                </v-col>
              </v-row>

              <v-text-field
                  v-model="registerData.email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  :rules="emailRules"
                  :error-messages="fieldErrors.email"
                  prepend-inner-icon="mdi-email-outline"
                  class="mb-4"
                  required
                  @input="clearFieldError('email')"
              />

              <v-text-field
                  v-model="registerData.phone"
                  label="Phone Number"
                  variant="outlined"
                  :rules="phoneRules"
                  :error-messages="fieldErrors.phone"
                  prepend-inner-icon="mdi-phone-outline"
                  placeholder="+90 555 123 4567"
                  required
                  @input="clearFieldError('phone')"
              />
            </div>
          </template>

          <template #item.2>
            <div class="step-content">
              <h3 class="text-h6 mb-4">Account Security</h3>

              <v-text-field
                  v-model="registerData.password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="passwordRules"
                  :error-messages="fieldErrors.password"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  class="mb-4"
                  required
                  @input="clearFieldError('password')"
              />

              <v-text-field
                  v-model="registerData.confirmPassword"
                  label="Confirm Password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  variant="outlined"
                  :rules="confirmPasswordRules"
                  :error-messages="fieldErrors.confirmPassword"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  class="mb-4"
                  required
                  @input="clearFieldError('confirmPassword')"
              />

              <!-- Password Strength Indicator -->
              <div class="password-strength mb-4">
                <p class="text-caption mb-2">Password Strength:</p>
                <v-progress-linear
                    :model-value="passwordStrength.score * 25"
                    :color="passwordStrength.color"
                    height="6"
                    rounded
                />
                <p class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
                  {{ passwordStrength.text }}
                </p>
              </div>

              <!-- Password Requirements -->
              <v-card variant="outlined" class="requirements-card">
                <v-card-text class="pa-4">
                  <p class="text-caption font-weight-medium mb-2">Password Requirements:</p>
                  <div class="requirements-list">
                    <div
                        v-for="req in passwordRequirements"
                        :key="req.text"
                        class="requirement-item d-flex align-center"
                    >
                      <v-icon
                          :icon="req.met ? 'mdi-check-circle' : 'mdi-circle-outline'"
                          :color="req.met ? 'success' : 'grey'"
                          size="16"
                          class="mr-2"
                      />
                      <span
                          class="text-caption"
                          :class="req.met ? 'text-success' : 'text-grey'"
                      >
                        {{ req.text }}
                      </span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </template>

          <template #item.3>
            <div class="step-content">
              <h3 class="text-h6 mb-4">Account Preferences</h3>

              <v-select
                  v-model="registerData.role"
                  label="Account Type"
                  :items="roleOptions"
                  variant="outlined"
                  :rules="roleRules"
                  prepend-inner-icon="mdi-account-group-outline"
                  class="mb-4"
                  required
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" />
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <v-select
                  v-model="registerData.membershipType"
                  label="Membership Plan"
                  :items="membershipOptions"
                  variant="outlined"
                  prepend-inner-icon="mdi-star-outline"
                  class="mb-4"
                  hint="You can change this later"
                  persistent-hint
              />

              <!-- Terms and Conditions -->
              <v-card variant="outlined" class="terms-card mb-4">
                <v-card-text class="pa-4">
                  <v-checkbox
                      v-model="registerData.agreeTerms"
                      :rules="termsRules"
                      color="primary"
                      density="compact"
                  >
                    <template #label>
                      <span class="text-body-2">
                        I agree to the
                        <v-btn
                            variant="text"
                            color="primary"
                            class="pa-0 text-decoration-underline"
                            @click="showTermsDialog = true"
                        >
                          Terms and Conditions
                        </v-btn>
                        and
                        <v-btn
                            variant="text"
                            color="primary"
                            class="pa-0 text-decoration-underline"
                            @click="showPrivacyDialog = true"
                        >
                          Privacy Policy
                        </v-btn>
                      </span>
                    </template>
                  </v-checkbox>

                  <v-checkbox
                      v-model="registerData.agreeMarketing"
                      color="primary"
                      density="compact"
                      class="mt-2"
                  >
                    <template #label>
                      <span class="text-body-2">
                        I would like to receive updates and promotional emails
                      </span>
                    </template>
                  </v-checkbox>
                </v-card-text>
              </v-card>
            </div>
          </template>
        </v-stepper>

        <!-- Navigation Buttons -->
        <div class="d-flex justify-space-between align-center mb-4">
          <v-btn
              v-if="currentStep > 1"
              variant="outlined"
              color="primary"
              @click="previousStep"
          >
            <v-icon icon="mdi-arrow-left" class="mr-2" />
            Previous
          </v-btn>
          <v-spacer v-else />

          <v-btn
              v-if="currentStep < 3"
              color="primary"
              variant="flat"
              :disabled="!canProceed"
              @click="nextStep"
          >
            Next
            <v-icon icon="mdi-arrow-right" class="ml-2" />
          </v-btn>

          <v-btn
              v-else
              color="primary"
              variant="flat"
              size="large"
              :loading="authStore.loading"
              :disabled="!isFormValid"
              @click="handleRegister"
          >
            <v-icon icon="mdi-account-plus" class="mr-2" />
            Create Account
          </v-btn>
        </div>

        <!-- Error Alert -->
        <v-alert
            v-if="authStore.error"
            type="error"
            variant="tonal"
            class="mb-4"
            :text="getErrorMessage(authStore.error)"
            closable
            @click:close="clearError"
        />

        <!-- Sign In Link -->
        <div class="text-center">
          <p class="text-body-2">
            Already have an account?
            <v-btn
                variant="text"
                color="primary"
                class="pa-0"
                @click="$emit('switch-to-login')"
            >
              Sign in here
            </v-btn>
          </p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Terms and Conditions Dialog -->
    <v-dialog v-model="showTermsDialog" max-width="600" scrollable>
      <v-card>
        <v-card-title class="text-h5 pa-6">
          Terms and Conditions
        </v-card-title>
        <v-card-text class="pa-6">
          <div class="terms-content">
            <h3>1. Acceptance of Terms</h3>
            <p>By using Urla Tennis Academy services, you agree to these terms...</p>

            <h3>2. Membership Rules</h3>
            <p>All members must follow academy rules and regulations...</p>

            <h3>3. Payment Policy</h3>
            <p>Monthly fees are due by the first of each month...</p>

            <h3>4. Cancellation Policy</h3>
            <p>Membership can be cancelled with 30 days notice...</p>

            <!-- Add more terms as needed -->
          </div>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showTermsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Privacy Policy Dialog -->
    <v-dialog v-model="showPrivacyDialog" max-width="600" scrollable>
      <v-card>
        <v-card-title class="text-h5 pa-6">
          Privacy Policy
        </v-card-title>
        <v-card-text class="pa-6">
          <div class="privacy-content">
            <h3>Information We Collect</h3>
            <p>We collect information you provide when registering...</p>

            <h3>How We Use Your Information</h3>
            <p>Your information is used to provide tennis academy services...</p>

            <h3>Data Security</h3>
            <p>We implement security measures to protect your data...</p>

            <!-- Add more privacy content as needed -->
          </div>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showPrivacyDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
        v-model="successSnackbar"
        color="success"
        :timeout="4000"
        location="top"
    >
      {{ successMessage }}
      <template #actions>
        <v-btn variant="text" @click="successSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

// Emits
defineEmits(['switch-to-login'])

const router = useRouter()
const authStore = useAuthStore()

// Stepper data
const currentStep = ref(1)
const steps = [
  { title: 'Personal Info', value: 1 },
  { title: 'Security', value: 2 },
  { title: 'Preferences', value: 3 }
]

// Form data
const registerData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'student' as 'admin' | 'student',
  membershipType: 'basic',
  agreeTerms: false,
  agreeMarketing: false
})

// Form validation states
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const fieldErrors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// Dialog states
const showTermsDialog = ref(false)
const showPrivacyDialog = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')

// Options
const roleOptions = [
  {
    title: 'Student',
    value: 'student',
    description: 'Learn and play tennis',
    icon: 'mdi-account-school'
  },
  {
    title: 'Admin',
    value: 'admin',
    description: 'Manage academy operations',
    icon: 'mdi-shield-account'
  }
]

const membershipOptions = [
  { title: 'Basic - $99/month', value: 'basic' },
  { title: 'Premium - $199/month', value: 'premium' },
  { title: 'VIP - $299/month', value: 'vip' }
]

// Validation rules
const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters',
  (v: string) => /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(v) || 'Name can only contain letters'
]

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const phoneRules = [
  (v: string) => !!v || 'Phone number is required',
  (v: string) => /^(\+90|0)?[5][0-9]{9}$/.test(v.replace(/\s/g, '')) || 'Please enter a valid Turkish phone number'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
  (v: string) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  (v: string) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
  (v: string) => /[0-9]/.test(v) || 'Password must contain at least one number',
  (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Password must contain at least one special character'
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === registerData.password || 'Passwords do not match'
]

const roleRules = [
  (v: string) => !!v || 'Please select an account type'
]

const termsRules = [
  (v: boolean) => v || 'You must agree to the terms and conditions'
]

// Computed properties
const passwordStrength = computed(() => {
  const password = registerData.password
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

  const strengthLevels = [
    { score: 0, text: 'Very Weak', color: 'error' },
    { score: 1, text: 'Weak', color: 'error' },
    { score: 2, text: 'Fair', color: 'warning' },
    { score: 3, text: 'Good', color: 'info' },
    { score: 4, text: 'Strong', color: 'success' },
    { score: 5, text: 'Very Strong', color: 'success' }
  ]

  return strengthLevels[score] || strengthLevels[0]
})

const passwordRequirements = computed(() => [
  { text: 'At least 8 characters', met: registerData.password.length >= 8 },
  { text: 'One uppercase letter', met: /[A-Z]/.test(registerData.password) },
  { text: 'One lowercase letter', met: /[a-z]/.test(registerData.password) },
  { text: 'One number', met: /[0-9]/.test(registerData.password) },
  { text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) }
])

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return registerData.firstName &&
          registerData.lastName &&
          registerData.email &&
          registerData.phone &&
          nameRules.every(rule => rule(registerData.firstName) === true) &&
          nameRules.every(rule => rule(registerData.lastName) === true) &&
          emailRules.every(rule => rule(registerData.email) === true) &&
          phoneRules.every(rule => rule(registerData.phone) === true)
    case 2:
      return registerData.password &&
          registerData.confirmPassword &&
          passwordRules.every(rule => rule(registerData.password) === true) &&
          confirmPasswordRules.every(rule => rule(registerData.confirmPassword) === true)
    case 3:
      return registerData.role && registerData.agreeTerms
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return canProceed.value && currentStep.value === 3
})

// Methods
const nextStep = () => {
  if (canProceed.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const clearFieldError = (field: keyof typeof fieldErrors) => {
  fieldErrors[field] = ''
}

const clearError = () => {
  authStore.error = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key as keyof typeof fieldErrors] = ''
  })
}

const getErrorMessage = (error: string): string => {
  const errorMap: { [key: string]: string } = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many requests. Please try again later.'
  }

  return errorMap[error] || 'An error occurred during registration. Please try again.'
}

const handleRegister = async () => {
  if (!isFormValid.value) return

  const success = await authStore.register({
    email: registerData.email,
    password: registerData.password,
    firstName: registerData.firstName,
    lastName: registerData.lastName,
    role: registerData.role
  })

  if (success) {
    successMessage.value = 'Account created successfully! Welcome to Urla Tennis Academy.'
    successSnackbar.value = true

    // Redirect based on user role
    setTimeout(() => {
      if (authStore.isAdmin) {
        router.push({ name: 'AdminDashboard' })
      } else {
        router.push({ name: 'StudentDashboard' })
      }
    }, 2000)
  } else {
    // Handle specific error types
    handleRegistrationError(authStore.error)
  }
}

const handleRegistrationError = (error: string | null) => {
  if (!error) return

  // Map specific errors to form fields
  if (error.includes('email-already-in-use')) {
    fieldErrors.email = 'An account with this email already exists'
    currentStep.value = 1
  } else if (error.includes('invalid-email')) {
    fieldErrors.email = 'Please enter a valid email address'
    currentStep.value = 1
  } else if (error.includes('weak-password')) {
    fieldErrors.password = 'Password is too weak'
    currentStep.value = 2
  }
}
</script>

<style scoped>
.register-form-component {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.register-card {
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.step-content {
  padding: 16px 0;
  min-height: 400px;
}

.password-strength {
  margin-bottom: 16px;
}

.requirements-card {
  border-radius: 8px;
}

.requirement-item {
  margin-bottom: 4px;
}

.requirement-item:last-child {
  margin-bottom: 0;
}

.terms-card {
  border-radius: 8px;
}

.terms-content h3,
.privacy-content h3 {
  color: #2E7D32;
  margin-top: 16px;
  margin-bottom: 8px;
}

.terms-content h3:first-child,
.privacy-content h3:first-child {
  margin-top: 0;
}

:deep(.v-field--outlined) {
  border-radius: 8px;
}

:deep(.v-field--focused .v-field__outline) {
  border-color: #2E7D32;
}

:deep(.v-stepper) {
  box-shadow: none;
  background: transparent;
}

:deep(.v-stepper-header) {
  box-shadow: none;
}

:deep(.v-checkbox .v-selection-control__input) {
  transform: scale(0.9);
}

/* Animation for card */
.register-card {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .register-form-component {
    padding: 16px;
  }

  .register-card .pa-8 {
    padding: 24px !important;
  }

  .text-h4 {
    font-size: 1.75rem !important;
  }

  .step-content {
    min-height: 350px;
  }
}
</style>