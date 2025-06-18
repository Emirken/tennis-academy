import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import type { User } from '@/types/user'

// Interface for login credentials
export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

// Interface for registration data
export interface RegisterData {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phone?: string
    role?: 'admin' | 'student'
    agreeToTerms: boolean
}

// Interface for password reset
export interface PasswordResetData {
    email: string
}

// Interface for profile update
export interface ProfileUpdateData {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
}

// Interface for password change
export interface PasswordChangeData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export function useAuth() {
    const authStore = useAuthStore()
    const router = useRouter()

    // Local reactive state
    const isLoggingIn = ref(false)
    const isRegistering = ref(false)
    const isResettingPassword = ref(false)
    const isUpdatingProfile = ref(false)
    const isChangingPassword = ref(false)

    // Validation errors
    const validationErrors = ref<Record<string, string>>({})

    // Success messages
    const successMessage = ref('')

    // Computed properties from store
    const user = computed<User | null>(() => authStore.user)
    const isAuthenticated = computed<boolean>(() => authStore.isAuthenticated)
    const isAdmin = computed<boolean>(() => authStore.isAdmin)
    const isStudent = computed<boolean>(() => authStore.isStudent)
    const loading = computed<boolean>(() => authStore.loading)
    const error = computed<string | null>(() => authStore.error)

    // User display information
    const userFullName = computed<string>(() => {
        if (!user.value) return ''
        return `${user.value.firstName} ${user.value.lastName}`.trim()
    })

    const userInitials = computed<string>(() => {
        if (!user.value) return ''
        const firstInitial = user.value.firstName.charAt(0).toUpperCase()
        const lastInitial = user.value.lastName.charAt(0).toUpperCase()
        return `${firstInitial}${lastInitial}`
    })

    // Authentication status helpers
    const hasRole = (role: 'admin' | 'student'): boolean => {
        return user.value?.role === role
    }

    const canAccess = (requiredRole: 'admin' | 'student' | 'any' = 'any'): boolean => {
        if (!isAuthenticated.value) return false
        if (requiredRole === 'any') return true
        return hasRole(requiredRole)
    }

    // Validation helpers
    const validateEmail = (email: string): string | null => {
        if (!email) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return 'Please enter a valid email address'
        return null
    }

    const validatePassword = (password: string): string | null => {
        if (!password) return 'Password is required'
        if (password.length < 6) return 'Password must be at least 6 characters long'
        return null
    }

    const validateName = (name: string, fieldName: string): string | null => {
        if (!name) return `${fieldName} is required`
        if (name.length < 2) return `${fieldName} must be at least 2 characters long`
        return null
    }

    const validatePhone = (phone: string): string | null => {
        if (!phone) return null // Phone is optional
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/
        if (!phoneRegex.test(phone)) return 'Please enter a valid phone number'
        return null
    }

    // Clear validation errors
    const clearValidationErrors = () => {
        validationErrors.value = {}
    }

    const clearMessages = () => {
        successMessage.value = ''
        authStore.error = null
    }

    // Validate form data
    const validateLoginForm = (credentials: LoginCredentials): boolean => {
        clearValidationErrors()

        const emailError = validateEmail(credentials.email)
        const passwordError = validatePassword(credentials.password)

        if (emailError) validationErrors.value.email = emailError
        if (passwordError) validationErrors.value.password = passwordError

        return !emailError && !passwordError
    }

    const validateRegisterForm = (data: RegisterData): boolean => {
        clearValidationErrors()

        const firstNameError = validateName(data.firstName, 'First name')
        const lastNameError = validateName(data.lastName, 'Last name')
        const emailError = validateEmail(data.email)
        const passwordError = validatePassword(data.password)
        const phoneError = data.phone ? validatePhone(data.phone) : null

        let confirmPasswordError = null
        if (data.password !== data.confirmPassword) {
            confirmPasswordError = 'Passwords do not match'
        }

        let termsError = null
        if (!data.agreeToTerms) {
            termsError = 'You must agree to the terms and conditions'
        }

        if (firstNameError) validationErrors.value.firstName = firstNameError
        if (lastNameError) validationErrors.value.lastName = lastNameError
        if (emailError) validationErrors.value.email = emailError
        if (passwordError) validationErrors.value.password = passwordError
        if (confirmPasswordError) validationErrors.value.confirmPassword = confirmPasswordError
        if (phoneError) validationErrors.value.phone = phoneError
        if (termsError) validationErrors.value.agreeToTerms = termsError

        return !firstNameError && !lastNameError && !emailError &&
            !passwordError && !confirmPasswordError && !phoneError && !termsError
    }

    // Authentication actions
    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        clearMessages()

        if (!validateLoginForm(credentials)) {
            return false
        }

        isLoggingIn.value = true

        try {
            const success = await authStore.login(credentials.email, credentials.password)

            if (success) {
                // Handle remember me
                if (credentials.rememberMe) {
                    localStorage.setItem('tennis_academy_remember', 'true')
                    localStorage.setItem('tennis_academy_email', credentials.email)
                } else {
                    localStorage.removeItem('tennis_academy_remember')
                    localStorage.removeItem('tennis_academy_email')
                }

                successMessage.value = 'Login successful!'

                // Redirect based on role
                await redirectAfterLogin()
            }

            return success
        } catch (error: any) {
            console.error('Login error:', error)
            return false
        } finally {
            isLoggingIn.value = false
        }
    }

    const register = async (data: RegisterData): Promise<boolean> => {
        clearMessages()

        if (!validateRegisterForm(data)) {
            return false
        }

        isRegistering.value = true

        try {
            const success = await authStore.register({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'student'
            })

            if (success) {
                successMessage.value = 'Registration successful! Welcome to Urla Tennis Academy.'

                // Redirect based on role
                setTimeout(async () => {
                    await redirectAfterLogin()
                }, 1500)
            }

            return success
        } catch (error: any) {
            console.error('Registration error:', error)
            return false
        } finally {
            isRegistering.value = false
        }
    }

    const logout = async (): Promise<void> => {
        try {
            await authStore.logout()

            // Clear any stored auth data
            localStorage.removeItem('tennis_academy_remember')
            localStorage.removeItem('tennis_academy_email')

            successMessage.value = 'Logged out successfully'

            // Redirect to home page
            await router.push('/')
        } catch (error: any) {
            console.error('Logout error:', error)
        }
    }

    const resetPassword = async (data: PasswordResetData): Promise<boolean> => {
        clearMessages()

        const emailError = validateEmail(data.email)
        if (emailError) {
            validationErrors.value.email = emailError
            return false
        }

        isResettingPassword.value = true

        try {
            // In a real app, this would call Firebase auth
            await new Promise(resolve => setTimeout(resolve, 2000))

            successMessage.value = 'Password reset link has been sent to your email address'
            return true
        } catch (error: any) {
            console.error('Password reset error:', error)
            return false
        } finally {
            isResettingPassword.value = false
        }
    }

    const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
        clearMessages()

        if (!user.value) return false

        isUpdatingProfile.value = true

        try {
            // Validate data
            const errors: Record<string, string> = {}

            if (data.firstName) {
                const firstNameError = validateName(data.firstName, 'First name')
                if (firstNameError) errors.firstName = firstNameError
            }

            if (data.lastName) {
                const lastNameError = validateName(data.lastName, 'Last name')
                if (lastNameError) errors.lastName = lastNameError
            }

            if (data.email) {
                const emailError = validateEmail(data.email)
                if (emailError) errors.email = emailError
            }

            if (data.phone) {
                const phoneError = validatePhone(data.phone)
                if (phoneError) errors.phone = phoneError
            }

            if (Object.keys(errors).length > 0) {
                validationErrors.value = errors
                return false
            }

            // Update user in store (in a real app, this would update Firebase and Firestore)
            const updatedUser = {
                ...user.value,
                ...data,
                updatedAt: new Date()
            }

            authStore.user = updatedUser

            successMessage.value = 'Profile updated successfully'
            return true
        } catch (error: any) {
            console.error('Profile update error:', error)
            return false
        } finally {
            isUpdatingProfile.value = false
        }
    }

    const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
        clearMessages()

        if (!user.value) return false

        isChangingPassword.value = true

        try {
            // Validate data
            const errors: Record<string, string> = {}

            if (!data.currentPassword) {
                errors.currentPassword = 'Current password is required'
            }

            const newPasswordError = validatePassword(data.newPassword)
            if (newPasswordError) {
                errors.newPassword = newPasswordError
            }

            if (data.newPassword !== data.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match'
            }

            if (data.currentPassword === data.newPassword) {
                errors.newPassword = 'New password must be different from current password'
            }

            if (Object.keys(errors).length > 0) {
                validationErrors.value = errors
                return false
            }

            // In a real app, this would validate current password and update it
            await new Promise(resolve => setTimeout(resolve, 1500))

            successMessage.value = 'Password changed successfully'
            return true
        } catch (error: any) {
            console.error('Password change error:', error)
            return false
        } finally {
            isChangingPassword.value = false
        }
    }

    // Navigation helpers
    const redirectAfterLogin = async (): Promise<void> => {
        if (isAdmin.value) {
            await router.push({ name: 'AdminDashboard' })
        } else if (isStudent.value) {
            await router.push({ name: 'StudentDashboard' })
        } else {
            await router.push('/')
        }
    }

    const requireAuth = (): boolean => {
        if (!isAuthenticated.value) {
            router.push({ name: 'Login' })
            return false
        }
        return true
    }

    const requireRole = (role: 'admin' | 'student'): boolean => {
        if (!requireAuth()) return false

        if (!hasRole(role)) {
            router.push({ name: 'Home' })
            return false
        }
        return true
    }

    // Auto-login from remembered credentials
    const loadRememberedCredentials = (): { email: string; rememberMe: boolean } => {
        const rememberMe = localStorage.getItem('tennis_academy_remember') === 'true'
        const email = localStorage.getItem('tennis_academy_email') || ''

        return { email, rememberMe }
    }

    // Session management
    const checkSession = (): boolean => {
        // In a real app, this would check if the Firebase auth token is still valid
        return isAuthenticated.value
    }

    const refreshSession = async (): Promise<boolean> => {
        // In a real app, this would refresh the Firebase auth token
        try {
            if (!user.value) return false

            // Simulate token refresh
            await new Promise(resolve => setTimeout(resolve, 500))

            return true
        } catch (error) {
            console.error('Session refresh failed:', error)
            await logout()
            return false
        }
    }

    // Cleanup function
    const cleanup = () => {
        clearValidationErrors()
        clearMessages()
        isLoggingIn.value = false
        isRegistering.value = false
        isResettingPassword.value = false
        isUpdatingProfile.value = false
        isChangingPassword.value = false
    }

    // Watch for auth state changes
    watch(isAuthenticated, (newValue) => {
        if (!newValue) {
            // User logged out, cleanup any cached data
            cleanup()
        }
    })

    // Initialize auth state on mount
    onMounted(() => {
        authStore.initializeAuth()
    })

    return {
        // State
        user,
        isAuthenticated,
        isAdmin,
        isStudent,
        loading,
        error,
        validationErrors,
        successMessage,
        isLoggingIn,
        isRegistering,
        isResettingPassword,
        isUpdatingProfile,
        isChangingPassword,

        // Computed
        userFullName,
        userInitials,

        // Methods
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        changePassword,

        // Validation
        validateEmail,
        validatePassword,
        validateName,
        validatePhone,
        clearValidationErrors,
        clearMessages,

        // Navigation
        redirectAfterLogin,
        requireAuth,
        requireRole,
        hasRole,
        canAccess,

        // Session
        loadRememberedCredentials,
        checkSession,
        refreshSession,

        // Cleanup
        cleanup
    }
}