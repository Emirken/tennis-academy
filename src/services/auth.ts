// Firebase Authentication Service
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword,
    updateEmail,
    updateProfile as firebaseUpdateProfile,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User as FirebaseUser,
    UserCredential,
    AuthError,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth'
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    DocumentData
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { User } from '@/types/user'

// Interface for user registration data
export interface RegisterUserData {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'admin' | 'student'
}

// Interface for user profile update
export interface UpdateProfileData {
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
    emergencyContact?: string
}

// Interface for password change
export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
}

// Authentication service class
export class AuthService {
    // Sign in with email and password
    static async signIn(email: string, password: string): Promise<UserCredential> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)

            // Update last login time
            if (userCredential.user) {
                await this.updateLastLogin(userCredential.user.uid)
            }

            return userCredential
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Register new user
    static async register(userData: RegisterUserData): Promise<UserCredential> {
        try {
            // Create Firebase auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            )

            // Update Firebase Auth profile
            await firebaseUpdateProfile(userCredential.user, {
                displayName: `${userData.firstName} ${userData.lastName}`
            })

            // Create user document in Firestore
            const user: Omit<User, 'createdAt' | 'updatedAt'> & {
                createdAt: Date
                updatedAt: Date
            } = {
                id: userCredential.user.uid,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            await this.createUserDocument(user as User)

            return userCredential
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Sign out
    static async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth)
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Send password reset email
    static async sendPasswordResetEmail(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email)
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Change password
    static async changePassword(data: ChangePasswordData): Promise<void> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser || !currentUser.email) {
                throw new Error('No authenticated user')
            }

            // Re-authenticate user first
            const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword)
            await reauthenticateWithCredential(currentUser, credential)

            // Update password
            await updatePassword(currentUser, data.newPassword)
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Update email
    static async changeEmail(newEmail: string, currentPassword: string): Promise<void> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser || !currentUser.email) {
                throw new Error('No authenticated user')
            }

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
            await reauthenticateWithCredential(currentUser, credential)

            // Update email in Firebase Auth
            await updateEmail(currentUser, newEmail)

            // Update email in Firestore
            await this.updateUserDocument(currentUser.uid, { email: newEmail })
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Update user profile
    static async updateProfile(userId: string, data: UpdateProfileData): Promise<void> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) {
                throw new Error('No authenticated user')
            }

            // Update Firebase Auth profile if name changed
            if (data.firstName || data.lastName) {
                const userDoc = await this.getUserDocument(userId)
                const currentFirstName = userDoc?.firstName || ''
                const currentLastName = userDoc?.lastName || ''

                const newFirstName = data.firstName || currentFirstName
                const newLastName = data.lastName || currentLastName

                await firebaseUpdateProfile(currentUser, {
                    displayName: `${newFirstName} ${newLastName}`
                })
            }

            // Update Firestore document
            await this.updateUserDocument(userId, data)
        } catch (error) {
            throw this.handleAuthError(error as AuthError)
        }
    }

    // Get current user data from Firestore
    static async getCurrentUserData(): Promise<User | null> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) {
                return null
            }

            return await this.getUserDocument(currentUser.uid)
        } catch (error) {
            console.error('Error getting current user data:', error)
            return null
        }
    }

    // Check if user exists in Firestore
    static async userExists(userId: string): Promise<boolean> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId))
            return userDoc.exists()
        } catch (error) {
            console.error('Error checking if user exists:', error)
            return false
        }
    }

    // Get user document from Firestore
    static async getUserDocument(userId: string): Promise<User | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId))

            if (userDoc.exists()) {
                const data = userDoc.data() as DocumentData
                return {
                    id: userDoc.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    phone: data.phone,
                    address: data.address,
                    emergencyContact: data.emergencyContact,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    lastLoginAt: data.lastLoginAt?.toDate()
                } as User
            }

            return null
        } catch (error) {
            console.error('Error getting user document:', error)
            return null
        }
    }

    // Create user document in Firestore
    static async createUserDocument(user: User): Promise<void> {
        try {
            const userDoc = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone || '',
                address: user.address || '',
                emergencyContact: user.emergencyContact || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            }

            await setDoc(doc(db, 'users', user.id), userDoc)
        } catch (error) {
            console.error('Error creating user document:', error)
            throw error
        }
    }

    // Update user document in Firestore
    static async updateUserDocument(userId: string, data: Partial<User | UpdateProfileData>): Promise<void> {
        try {
            const updateData: any = {
                ...data,
                updatedAt: serverTimestamp()
            }

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key]
                }
            })

            await updateDoc(doc(db, 'users', userId), updateData)
        } catch (error) {
            console.error('Error updating user document:', error)
            throw error
        }
    }

    // Update last login time
    static async updateLastLogin(userId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'users', userId), {
                lastLoginAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error updating last login:', error)
            // Don't throw error here as it's not critical
        }
    }

    // Set up auth state listener
    static onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
        return firebaseOnAuthStateChanged(auth, callback)
    }

    // Get current Firebase user
    static getCurrentUser(): FirebaseUser | null {
        return auth.currentUser
    }

    // Check if user is authenticated
    static isAuthenticated(): boolean {
        return !!auth.currentUser
    }

    // Wait for auth state to be ready
    static async waitForAuthReady(): Promise<FirebaseUser | null> {
        return new Promise((resolve) => {
            const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
                unsubscribe()
                resolve(user)
            })
        })
    }

    // Handle authentication errors
    private static handleAuthError(error: AuthError): Error {
        let message: string

        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address'
                break
            case 'auth/wrong-password':
                message = 'Incorrect password'
                break
            case 'auth/email-already-in-use':
                message = 'An account with this email already exists'
                break
            case 'auth/weak-password':
                message = 'Password is too weak. Please choose a stronger password'
                break
            case 'auth/invalid-email':
                message = 'Please enter a valid email address'
                break
            case 'auth/user-disabled':
                message = 'This account has been disabled'
                break
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later'
                break
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection'
                break
            case 'auth/requires-recent-login':
                message = 'Please sign in again to complete this action'
                break
            case 'auth/email-already-exists':
                message = 'An account with this email already exists'
                break
            case 'auth/invalid-credential':
                message = 'Invalid credentials provided'
                break
            case 'auth/credential-already-in-use':
                message = 'This credential is already associated with another account'
                break
            default:
                message = error.message || 'An authentication error occurred'
                break
        }

        const customError = new Error(message) as Error & { code?: string }
        customError.code = error.code
        return customError
    }

    // Validate email format
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Validate password strength
    static validatePassword(password: string): {
        isValid: boolean
        errors: string[]
        strength: 'weak' | 'medium' | 'strong'
    } {
        const errors: string[] = []
        let score = 0

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long')
        } else {
            score += 1
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
        } else {
            score += 1
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
        } else {
            score += 1
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number')
        } else {
            score += 1
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character')
        } else {
            score += 1
        }

        let strength: 'weak' | 'medium' | 'strong'
        if (score < 3) {
            strength = 'weak'
        } else if (score < 5) {
            strength = 'medium'
        } else {
            strength = 'strong'
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength
        }
    }

    // Generate secure password
    static generateSecurePassword(length: number = 12): string {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const lowercase = 'abcdefghijklmnopqrstuvwxyz'
        const numbers = '0123456789'
        const symbols = '!@#$%^&*(),.?":{}|<>'

        const allChars = uppercase + lowercase + numbers + symbols
        let password = ''

        // Ensure at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)]
        password += lowercase[Math.floor(Math.random() * lowercase.length)]
        password += numbers[Math.floor(Math.random() * numbers.length)]
        password += symbols[Math.floor(Math.random() * symbols.length)]

        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)]
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    // Delete user account (admin only)
    static async deleteUserAccount(userId: string): Promise<void> {
        try {
            // Note: Deleting Firebase Auth user requires admin SDK
            // This would typically be done through a cloud function

            // For now, just delete the Firestore document
            // In production, you'd call a cloud function that uses admin SDK

            // Delete user document
            await updateDoc(doc(db, 'users', userId), {
                deleted: true,
                deletedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            })

            console.warn('User marked as deleted in Firestore. Firebase Auth deletion requires admin SDK.')
        } catch (error) {
            console.error('Error deleting user account:', error)
            throw error
        }
    }

    // Get user role
    static async getUserRole(userId: string): Promise<string | null> {
        try {
            const userDoc = await this.getUserDocument(userId)
            return userDoc?.role || null
        } catch (error) {
            console.error('Error getting user role:', error)
            return null
        }
    }

    // Check if user has specific role
    static async hasRole(userId: string, role: 'admin' | 'student'): Promise<boolean> {
        try {
            const userRole = await this.getUserRole(userId)
            return userRole === role
        } catch (error) {
            console.error('Error checking user role:', error)
            return false
        }
    }

    // Check if current user is admin
    static async isCurrentUserAdmin(): Promise<boolean> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) return false

            return await this.hasRole(currentUser.uid, 'admin')
        } catch (error) {
            console.error('Error checking admin status:', error)
            return false
        }
    }

    // Refresh auth token
    static async refreshToken(): Promise<string | null> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) return null

            return await currentUser.getIdToken(true)
        } catch (error) {
            console.error('Error refreshing token:', error)
            return null
        }
    }

    // Get auth token
    static async getAuthToken(): Promise<string | null> {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) return null

            return await currentUser.getIdToken()
        } catch (error) {
            console.error('Error getting auth token:', error)
            return null
        }
    }
}

// Export individual functions for convenience
export const signIn = AuthService.signIn
export const register = AuthService.register
export const signOut = AuthService.signOut
export const sendResetEmail = AuthService.sendPasswordResetEmail
export const changePassword = AuthService.changePassword
export const changeEmail = AuthService.changeEmail
export const updateProfile = AuthService.updateProfile
export const getCurrentUserData = AuthService.getCurrentUserData
export const userExists = AuthService.userExists
export const getUserDocument = AuthService.getUserDocument
export const createUserDocument = AuthService.createUserDocument
export const updateUserDocument = AuthService.updateUserDocument
export const onAuthStateChanged = AuthService.onAuthStateChanged
export const getCurrentUser = AuthService.getCurrentUser
export const isAuthenticated = AuthService.isAuthenticated
export const waitForAuthReady = AuthService.waitForAuthReady
export const isValidEmail = AuthService.isValidEmail
export const validatePassword = AuthService.validatePassword
export const generateSecurePassword = AuthService.generateSecurePassword
export const deleteUserAccount = AuthService.deleteUserAccount
export const getUserRole = AuthService.getUserRole
export const hasRole = AuthService.hasRole
export const isCurrentUserAdmin = AuthService.isCurrentUserAdmin
export const refreshToken = AuthService.refreshToken
export const getAuthToken = AuthService.getAuthToken

// Default export
export default AuthService