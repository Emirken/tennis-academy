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
    initialized: boolean
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
                console.log('🔐 Giriş yapılıyor:', email)
                const userCredential = await signInWithEmailAndPassword(auth, email, password)
                console.log('✅ Firebase auth başarılı, UID:', userCredential.user.uid)

                await this.fetchUserData(userCredential.user.uid)
                console.log('✅ Kullanıcı verisi yüklendi:', this.user)

                return true
            } catch (error: any) {
                console.error('❌ Giriş hatası:', error)
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
                console.log('📝 Kullanıcı kaydediliyor:', userData.email)
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

                console.log('💾 Firestore\'a kullanıcı verisi yazılıyor...')
                await setDoc(doc(db, 'users', user.id), user)

                this.user = user
                this.isAuthenticated = true
                console.log('✅ Kayıt başarılı:', user)

                return true
            } catch (error: any) {
                console.error('❌ Kayıt hatası:', error)
                this.error = this.getErrorMessage(error)
                return false
            } finally {
                this.loading = false
            }
        },

        async logout() {
            try {
                console.log('🚪 Çıkış yapılıyor...')
                await signOut(auth)
                this.user = null
                this.isAuthenticated = false
                console.log('✅ Çıkış başarılı')
            } catch (error: any) {
                console.error('❌ Çıkış hatası:', error)
                this.error = this.getErrorMessage(error)
            }
        },

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
                console.log('🔍 Firestore\'dan kullanıcı verisi getiriliyor, UID:', uid)
                const userDoc = await getDoc(doc(db, 'users', uid))

                if (userDoc.exists()) {
                    const userData = userDoc.data() as User
                    console.log('✅ Kullanıcı verisi bulundu:', {
                        id: userData.id,
                        email: userData.email,
                        firstName: userData.firstName,
                        role: userData.role
                    })

                    this.user = {
                        ...userData,
                        id: uid // Ensure ID is always set
                    }
                    this.isAuthenticated = true
                } else {
                    console.error('❌ Firestore\'da kullanıcı verisi bulunamadı, UID:', uid)
                    // Try to create a basic user profile if none exists
                    const currentUser = auth.currentUser
                    if (currentUser) {
                        console.log('🔧 Temel kullanıcı profili oluşturuluyor...')
                        const basicUser: User = {
                            id: uid,
                            email: currentUser.email || '',
                            firstName: 'Kullanıcı',
                            lastName: '',
                            role: 'student', // Default role
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }

                        // Create the user document
                        await setDoc(doc(db, 'users', uid), basicUser)
                        this.user = basicUser
                        this.isAuthenticated = true
                        console.log('✅ Temel kullanıcı profili oluşturuldu')
                    } else {
                        this.user = null
                        this.isAuthenticated = false
                    }
                }
            } catch (error: any) {
                console.error('❌ Kullanıcı verisi getirme hatası:', error)
                this.error = this.getErrorMessage(error)
                this.user = null
                this.isAuthenticated = false
            }
        },

        initializeAuth() {
            console.log('🚀 Auth state başlatılıyor...')

            return new Promise<void>((resolve) => {
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
                    console.log('🔄 Auth state değişti:', firebaseUser ? `Kullanıcı: ${firebaseUser.email}` : 'Çıkış yapılmış')

                    if (firebaseUser) {
                        console.log('👤 Firebase kullanıcısı mevcut:', {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email
                        })

                        try {
                            await this.fetchUserData(firebaseUser.uid)
                            console.log('✅ Kullanıcı verisi başarıyla yüklendi')
                        } catch (error) {
                            console.error('❌ Kullanıcı verisi yüklenemedi:', error)
                        }
                    } else {
                        console.log('👤 Kullanıcı oturumu kapalı')
                        this.user = null
                        this.isAuthenticated = false
                    }

                    // Mark as initialized regardless of auth state
                    this.initialized = true
                    console.log('✅ Auth state hazır. Kullanıcı:', this.user ? `${this.user.firstName} ${this.user.lastName}` : 'Yok')
                    resolve()
                }, (error) => {
                    console.error('❌ Auth state listener hatası:', error)
                    this.initialized = true
                    resolve()
                })
            })
        },

        async waitForAuth(): Promise<void> {
            console.log('⏳ Auth state bekleniyor, initialized:', this.initialized)

            if (this.initialized) {
                console.log('✅ Auth state zaten hazır')
                return Promise.resolve()
            }

            return new Promise<void>((resolve) => {
                console.log('🔄 Auth state değişimi bekleniyor...')
                const unwatch = this.$subscribe((mutation, state) => {
                    if (state.initialized) {
                        console.log('✅ Auth state hazır oldu')
                        unwatch()
                        resolve()
                    }
                })

                // Add timeout to prevent infinite waiting
                setTimeout(() => {
                    if (!this.initialized) {
                        console.warn('⚠️ Auth state timeout, forcing initialization')
                        this.initialized = true
                        unwatch()
                        resolve()
                    }
                }, 5000) // 5 second timeout
            })
        },

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

        clearError() {
            this.error = null
        }
    }
})