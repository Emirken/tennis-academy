<template>
  <div class="login-form-component">
    <v-card class="login-card" elevation="8">
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
            Welcome Back
          </h1>
          <p class="text-subtitle-1 text-grey-darken-1">
            Sign in to your Urla Tennis Academy account
          </p>
        </div>

        <!-- Login Form -->
        <v-form
            ref="loginForm"
            v-model="valid"
            @submit.prevent="handleLogin"
        >
          <!-- Email Field -->
          <v-text-field
              v-model="loginData.email"
              label="Email Address"
              type="email"
              variant="outlined"
              :rules="emailRules"
              :error-messages="emailError"
              prepend-inner-icon="mdi-email-outline"
              class="mb-4"
              required
              autofocus
              @keyup.enter="handleLogin"
          />

          <!-- Password Field -->
          <v-text-field
              v-model="loginData.password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              :rules="passwordRules"
              :error-messages="passwordError"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              class="mb-4"
              required
              @keyup.enter="handleLogin"
          />

          <!-- Remember Me & Forgot Password -->
          <div class="d-flex justify-space-between align-center mb-6">
            <v-checkbox
                v-model="rememberMe"
                label="Remember me"
                color="primary"
                density="compact"
                hide-details
            />

            <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="showForgotPasswordDialog = true"
            >
              Forgot Password?
            </v-btn>
          </div>

          <!-- Sign In Button -->
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
            <v-icon icon="mdi-login" class="mr-2" />
            Sign In
          </v-btn>
        </v-form>

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

        <!-- Divider -->
        <v-divider class="my-6" />

        <!-- Quick Login Section for Testing -->
        <div class="text-center mb-4">
          <p class="text-caption text-grey-darken-1 mb-3">
            Quick Login for Testing:
          </p>
          <div class="d-flex flex-column gap-2">
            <v-btn
                variant="outlined"
                size="small"
                color="primary"
                @click="quickLogin('admin')"
                :loading="authStore.loading"
            >
              <v-icon icon="mdi-shield-account" class="mr-2" />
              Login as Admin
            </v-btn>
            <v-btn
                variant="outlined"
                size="small"
                color="secondary"
                @click="quickLogin('student')"
                :loading="authStore.loading"
            >
              <v-icon icon="mdi-account-school" class="mr-2" />
              Login as Student
            </v-btn>
          </div>
        </div>

        <!-- Sign Up Link -->
        <div class="text-center">
          <p class="text-body-2">
            Don't have an account?
            <v-btn
                variant="text"
                color="primary"
                class="pa-0"
                @click="$emit('switch-to-register')"
            >
              Sign up here
            </v-btn>
          </p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Forgot Password Dialog -->
    <v-dialog v-model="showForgotPasswordDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-6">
          <v-icon icon="mdi-lock-reset" class="mr-2" />
          Reset Password
        </v-card-title>

        <v-card-text class="pa-6">
          <p class="text-body-2 mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <v-form ref="forgotForm" v-model="forgotValid">
            <v-text-field
                v-model="forgotEmail"
                label="Email Address"
                type="email"
                variant="outlined"
                :rules="emailRules"
                prepend-inner-icon="mdi-email-outline"
                required
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn @click="showForgotPasswordDialog = false">Cancel</v-btn>
          <v-btn
              color="primary"
              :disabled="!forgotValid"
              :loading="resetLoading"
              @click="sendResetEmail"
          >
            Send Reset Link
          </v-btn>
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
        <v-btn
            variant="text"
            @click="successSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

// Emits
defineEmits(['switch-to-register'])

const router = useRouter()
const authStore = useAuthStore()

// Form data
const loginData = reactive({
  email: '',
  password: ''
})

const forgotEmail = ref('')
const rememberMe = ref(false)

// Form validation
const valid = ref(false)
const forgotValid = ref(false)
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')

// Dialog states
const showForgotPasswordDialog = ref(false)
const resetLoading = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')

// Validation rules
const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters'
]

// Methods
const handleLogin = async () => {
  if (!valid.value) return

  // Clear previous errors
  emailError.value = ''
  passwordError.value = ''

  const success = await authStore.login(loginData.email, loginData.password)

  if (success) {
    // Save remember me preference
    if (rememberMe.value) {
      localStorage.setItem('tennis_academy_remember', 'true')
      localStorage.setItem('tennis_academy_email', loginData.email)
    } else {
      localStorage.removeItem('tennis_academy_remember')
      localStorage.removeItem('tennis_academy_email')
    }

    // Redirect based on user role
    if (authStore.isAdmin) {
      router.push({ name: 'AdminDashboard' })
    } else {
      router.push({ name: 'StudentDashboard' })
    }
  } else {
    // Handle specific error types
    handleLoginError(authStore.error)
  }
}

const quickLogin = async (role: 'admin' | 'student') => {
  const credentials = {
    admin: {
      email: 'admin1@urlatennis.com',
      password: 'Admin123!'
    },
    student: {
      email: 'ogrenci1@test.com',
      password: 'Student123!'
    }
  }

  loginData.email = credentials[role].email
  loginData.password = credentials[role].password

  await handleLogin()
}

const handleLoginError = (error: string | null) => {
  if (!error) return

  // Map Firebase errors to user-friendly messages
  if (error.includes('user-not-found')) {
    emailError.value = 'No account found with this email address'
  } else if (error.includes('wrong-password')) {
    passwordError.value = 'Incorrect password'
  } else if (error.includes('invalid-email')) {
    emailError.value = 'Invalid email address'
  } else if (error.includes('too-many-requests')) {
    emailError.value = 'Too many failed attempts. Please try again later.'
  }
}

const getErrorMessage = (error: string): string => {
  // Convert Firebase errors to user-friendly messages
  const errorMap: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/internal-error': 'An internal error occurred. Please try again.'
  }

  return errorMap[error] || 'An error occurred during login. Please try again.'
}

const clearError = () => {
  authStore.error = null
  emailError.value = ''
  passwordError.value = ''
}

const sendResetEmail = async () => {
  if (!forgotValid.value) return

  resetLoading.value = true

  try {
    // Simulate password reset email
    await new Promise(resolve => setTimeout(resolve, 2000))

    showForgotPasswordDialog.value = false
    forgotEmail.value = ''

    successMessage.value = 'Password reset link sent to your email address'
    successSnackbar.value = true

  } catch (error) {
    console.error('Password reset failed:', error)
  } finally {
    resetLoading.value = false
  }
}

// Load remembered email on component mount
const loadRememberedEmail = () => {
  if (localStorage.getItem('tennis_academy_remember') === 'true') {
    const savedEmail = localStorage.getItem('tennis_academy_email')
    if (savedEmail) {
      loginData.email = savedEmail
      rememberMe.value = true
    }
  }
}

// Initialize component
loadRememberedEmail()
</script>

<style scoped>
.login-form-component {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.login-card {
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.gap-2 > * {
  margin-bottom: 8px;
}

.gap-2 > *:last-child {
  margin-bottom: 0;
}

:deep(.v-field--outlined) {
  border-radius: 8px;
}

:deep(.v-field--focused .v-field__outline) {
  border-color: #2E7D32;
}

:deep(.v-btn--size-large) {
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
}

:deep(.v-checkbox .v-selection-control__input) {
  transform: scale(0.9);
}

/* Animation for form elements */
.login-card {
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

/* Loading state styles */
:deep(.v-btn--loading) {
  pointer-events: none;
}

/* Quick login buttons spacing */
.d-flex.flex-column.gap-2 {
  gap: 8px;
}

/* Remember me checkbox styling */
:deep(.v-checkbox) {
  flex: none;
}

@media (max-width: 600px) {
  .login-form-component {
    padding: 16px;
  }

  .login-card .pa-8 {
    padding: 24px !important;
  }

  .text-h4 {
    font-size: 1.75rem !important;
  }
}
</style>