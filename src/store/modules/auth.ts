import { defineStore } from 'pinia'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import type { User } from '@/types/user'

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    initialized: boolean // Auth state'in hazır olup olmadığını takip eder
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: false
    }),

    getters: {
        isAdmin: (state) => state.user?.role === 'admin',
        isStudent: (state) => state.user?.role === 'student'
    },

    actions: {
        async login(email: string, password: string) {
            this.loading = true
            this.error = null

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password)
                await this.fetchUserData(userCredential.user.uid)
                return true
            } catch (error: any) {
                this.error = this.getErrorMessage(error)
                return false
            } finally {
                this.loading = false
            }
        },

        async register(userData: {
            email: string
            password: string
            firstName: string
            lastName: string
            role: 'admin' | 'student'
        }) {
            this.loading = true
            this.error = null

            try {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    userData.email,
                    userData.password
                )

                const user: User = {
                    id: userCredential.user.uid,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }

                await setDoc(doc(db, 'users', user.id), user)
                this.user = user
                this.isAuthenticated = true
                return true
            } catch (error: any) {
                this.error = this.getErrorMessage(error)
                return false
            } finally {
                this.loading = false
            }
        },

        async logout() {
            try {
                await signOut(auth)
                this.user = null
                this.isAuthenticated = false
            } catch (error: any) {
                this.error = this.getErrorMessage(error)
            }
        },

        // Şifre sıfırlama e-postası gönder
        async sendPasswordResetEmail(email: string) {
            this.loading = true
            this.error = null

            try {
                await sendPasswordResetEmail(auth, email)
                return true
            } catch (error: any) {
                this.error = this.getErrorMessage(error)
                throw new Error(this.error)
            } finally {
                this.loading = false
            }
        },

        async fetchUserData(uid: string) {
            try {
                console.log('🔍 Kullanıcı verisi getiriliyor, UID:', uid)
                const userDoc = await getDoc(doc(db, 'users', uid))
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User
                    console.log('✅ Kullanıcı verisi bulundu:', userData)
                    this.user = userData
                    this.isAuthenticated = true
                } else {
                    console.log('❌ Kullanıcı verisi bulunamadı')
                    this.user = null
                    this.isAuthenticated = false
                }
            } catch (error: any) {
                console.error('❌ Kullanıcı verisi getirme hatası:', error)
                this.error = this.getErrorMessage(error)
            }
        },

        initializeAuth() {
            console.log('🚀 Auth state başlatılıyor...')

            return new Promise<void>((resolve) => {
                onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
                    console.log('🔄 Auth state değişti:', firebaseUser ? 'Giriş yapılmış' : 'Çıkış yapılmış')

                    if (firebaseUser) {
                        console.log('👤 Firebase kullanıcısı:', firebaseUser.uid)
                        await this.fetchUserData(firebaseUser.uid)
                    } else {
                        console.log('👤 Kullanıcı çıkış yapmış')
                        this.user = null
                        this.isAuthenticated = false
                    }

                    this.initialized = true
                    console.log('✅ Auth state hazır, kullanıcı:', this.user?.firstName || 'Yok')
                    resolve()
                })
            })
        },

        // Auth state'in hazır olmasını beklemek için helper fonksiyon
        async waitForAuth(): Promise<void> {
            if (this.initialized) {
                return Promise.resolve()
            }

            return new Promise<void>((resolve) => {
                const unwatch = this.$subscribe((mutation, state) => {
                    if (state.initialized) {
                        unwatch()
                        resolve()
                    }
                })
            })
        },

        // Hata mesajlarını Türkçe'ye çevir
        getErrorMessage(error: any): string {
            const code = error.code || error.message

            switch (code) {
                case 'auth/user-not-found':
                    return 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı'
                case 'auth/wrong-password':
                    return 'Yanlış şifre girdiniz'
                case 'auth/email-already-in-use':
                    return 'Bu e-posta adresi zaten kullanımda'
                case 'auth/weak-password':
                    return 'Şifre çok zayıf. Daha güçlü bir şifre seçin'
                case 'auth/invalid-email':
                    return 'Geçersiz e-posta adresi'
                case 'auth/user-disabled':
                    return 'Bu hesap devre dışı bırakılmış'
                case 'auth/too-many-requests':
                    return 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin'
                case 'auth/network-request-failed':
                    return 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin'
                case 'auth/requires-recent-login':
                    return 'Bu işlem için tekrar giriş yapmanız gerekiyor'
                case 'auth/invalid-credential':
                    return 'Geçersiz kimlik bilgileri'
                default:
                    return error.message || 'Bilinmeyen bir hata oluştu'
            }
        },

        // Hata mesajını temizle
        clearError() {
            this.error = null
        }
    }
})