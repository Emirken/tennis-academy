import { defineStore } from 'pinia'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, type Unsubscribe } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import type { User, PlayerLevel, UserRole } from '@/types/user'
import { notificationService } from '@/services/notificationService'
import { pushNotificationService } from '@/services/pushNotificationService'

// Pinia state'inde function tutulamaz; listener'ı modül seviyesinde saklıyoruz
let userDocUnsubscribe: Unsubscribe | null = null

function stopUserDocListener() {
    if (userDocUnsubscribe) {
        userDocUnsubscribe()
        userDocUnsubscribe = null
    }
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    initialized: boolean
    // Geçici şifreyle giriş yapıldığında true olur; kullanıcı kalıcı şifresini
    // belirleyene kadar zorunlu şifre değiştirme ekranı gösterilir.
    mustResetPassword: boolean
    // Geçici şifreyle giriş yapan kullanıcının telefonu (kaydı temizlemek için)
    resetPhone: string | null
}

// Helper: telefon numarasından dummy email oluştur
function phoneToEmail(phoneNumber: string): string {
    return `${phoneNumber}@tennis.local`
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: false,
        mustResetPassword: false,
        resetPhone: null
    }),

    getters: {
        isAdmin: (state) => state.user?.role === 'admin',
        isStudent: (state) => state.user?.role === 'student',
        isBoss: (state) => state.user?.role === 'boss'
    },

    actions: {
        async login(phoneNumber: string, password: string) {
            this.loading = true
            this.error = null
            this.mustResetPassword = false
            this.resetPhone = null

            const dummyEmail = phoneToEmail(phoneNumber)
            console.log('🔐 Giriş yapılıyor:', phoneNumber)

            try {
                // Geçici şifre artık admin tarafından (setTempPassword Cloud Function ile)
                // doğrudan gerçek Auth şifresine yazılıyor; bu yüzden geçici şifreyle de
                // normal giriş çalışır. Kalıcı şifre belirleme zorunluluğu, kullanıcı
                // dokümanındaki mustResetPassword bayrağıyla yönetilir (ForcePasswordReset.vue).
                const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, password)
                console.log('✅ Firebase auth başarılı, UID:', userCredential.user.uid)

                await this.fetchUserData(userCredential.user.uid)
                console.log('✅ Kullanıcı verisi yüklendi:', this.user)

                // Firestore'daki kalıcı bayrağı login akışına da yansıt
                if (this.user?.mustResetPassword === true) {
                    this.mustResetPassword = true
                    this.resetPhone = phoneNumber
                }

                return true
            } catch (error: any) {
                console.error('❌ Giriş hatası:', error)
                this.error = this.getErrorMessage(error)
                return false
            } finally {
                this.loading = false
            }
        },

        // Geçici şifreyle giriş yapan kullanıcı kalıcı şifresini belirler.
        // Gerçek Firebase Auth şifresi burada güncellenir, geçici kayıt silinir.
        async completePasswordReset(newPassword: string) {
            const { updatePassword } = await import('firebase/auth')
            const { clearMustResetPassword } = await import('@/services/passwordResetService')

            const currentUser = auth.currentUser
            if (!currentUser) {
                throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın.')
            }

            try {
                // Gerçek Auth şifresini güncelle. Geçici şifreyle yeni giriş yapıldıysa
                // reauthenticate gerekmez; ancak sayfa yenilenip oturum eskidiyse Firebase
                // 'requires-recent-login' döndürebilir — bunu kullanıcıya açıkça bildiriyoruz.
                await updatePassword(currentUser, newPassword)
            } catch (error: any) {
                if (error?.code === 'auth/requires-recent-login') {
                    throw new Error('Güvenlik nedeniyle lütfen çıkış yapıp geçici şifrenizle tekrar giriş yapın, ardından yeni şifrenizi belirleyin.')
                }
                throw new Error(this.getErrorMessage(error))
            }

            // mustResetPassword bayrağını kaldır
            await clearMustResetPassword(currentUser.uid)

            this.mustResetPassword = false
            this.resetPhone = null
        },

        async register(userData: {
            phone_number: string
            password: string
            firstName: string
            lastName: string
            role: UserRole
            email?: string
            birthDate?: string
            level?: PlayerLevel
        }) {
            this.loading = true
            this.error = null

            try {
                // Önce: aynı telefon numarasıyla soft-deleted bir doc var mı kontrol et.
                // Spark planda Firebase Auth user'ı client SDK'dan silinemediği için
                // silinen kullanıcılar Firestore'da deleted=true olarak işaretli kalır;
                // burada net bir hata mesajı vererek kullanıcıyı yönlendiriyoruz.
                const existingDeletedQuery = query(
                    collection(db, 'users'),
                    where('phone_number', '==', userData.phone_number),
                    where('deleted', '==', true),
                )
                const existingDeletedSnap = await getDocs(existingDeletedQuery)
                if (!existingDeletedSnap.empty) {
                    this.error = 'Bu telefon numarası daha önce sistemde kayıtlıydı ve silindi. Yeniden kayıt için lütfen yöneticiyle iletişime geçin (Firebase Console üzerinden auth kaydının kaldırılması gerekiyor).'
                    return false
                }

                const dummyEmail = phoneToEmail(userData.phone_number)
                console.log('📝 Kullanıcı kaydediliyor:', userData.phone_number)
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    dummyEmail,
                    userData.password
                )

                const user: User = {
                    id: userCredential.user.uid,
                    phone_number: userData.phone_number,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    status: userData.role === 'admin' ? 'approved' : 'pending',
                    ...(userData.email ? { email: userData.email } : {}),
                    ...(userData.birthDate ? { birthDate: userData.birthDate } : {}),
                    ...(userData.level ? { level: userData.level } : {}),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }

                console.log('💾 Firestore\'a kullanıcı verisi yazılıyor...')
                await setDoc(doc(db, 'users', user.id), user)

                if (user.role === 'student' && user.status === 'pending') {
                    await notificationService.createAdminNotification(
                        'Yeni Öğrenci Kaydı',
                        `${user.firstName} ${user.lastName} kayıt oldu, onayınızı bekliyor.`,
                        'approval_pending',
                        user.id
                    )

                    // Yeni kayıt eden öğrenciye hoş geldin maili (mail varsa, EmailJS yapılandırılmışsa)
                    if (userData.email) {
                        try {
                        } catch (mailErr) {
                            console.warn('Welcome email gönderilemedi:', mailErr)
                        }
                    }
                }

                this.user = user
                this.isAuthenticated = true
                console.log('✅ Kayıt başarılı:', user)

                return true
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log('🔄 Telefon numarası zaten kullanımda hatası. Acaba Firestore dokümanı silinmiş mi kontrol ediliyor...')
                    try {
                        const dummyEmail = phoneToEmail(userData.phone_number)
                        // Kendi önceden girdiği şifreyle girmeyi dener
                        const signinCredential = await signInWithEmailAndPassword(auth, dummyEmail, userData.password)

                        const userDoc = await getDoc(doc(db, 'users', signinCredential.user.uid))
                        if (!userDoc.exists()) {
                            console.log('📝 Firestore üzerinde kullanıcı bulunamadı (Önceden reddedilmiş). Yeniden Firestore dokümanı oluşturuluyor...')
                            const user: User = {
                                id: signinCredential.user.uid,
                                phone_number: userData.phone_number,
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                role: userData.role,
                                status: userData.role === 'admin' ? 'approved' : 'pending',
                                ...(userData.email ? { email: userData.email } : {}),
                                ...(userData.birthDate ? { birthDate: userData.birthDate } : {}),
                                ...(userData.level ? { level: userData.level } : {}),
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                            await setDoc(doc(db, 'users', user.id), user)

                            if (user.role === 'student' && user.status === 'pending') {
                                await notificationService.createAdminNotification(
                                    'Yeni Öğrenci Kaydı',
                                    `${user.firstName} ${user.lastName} kayıt oldu, onayınızı bekliyor.`,
                                    'approval_pending',
                                    user.id
                                )
                            }

                            this.user = user
                            this.isAuthenticated = true
                            console.log('✅ Kurtarma başarılı:', user)
                            return true
                        }
                    } catch (recoveryError) {
                        console.error('❌ Kurtarma başarısız (Yanlış şifre girilmiş olabilir):', recoveryError)
                    }
                }

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
                stopUserDocListener()
                await signOut(auth)
                this.user = null
                this.isAuthenticated = false
                console.log('✅ Çıkış başarılı')
            } catch (error: any) {
                console.error('❌ Çıkış hatası:', error)
                this.error = this.getErrorMessage(error)
            }
        },

        async sendPasswordResetEmail(phoneNumber: string) {
            this.loading = true
            this.error = null

            try {
                const dummyEmail = phoneToEmail(phoneNumber)
                await sendPasswordResetEmail(auth, dummyEmail)
                return true
            } catch (error: any) {
                this.error = this.getErrorMessage(error)
                throw new Error(this.error)
            } finally {
                this.loading = false
            }
        },

        async fetchUserData(uid: string) {
            // Önceki listener varsa kapat (kullanıcı değiştiyse)
            stopUserDocListener()

            console.log('🔍 Firestore\'da kullanıcı verisi için canlı dinleyici kuruluyor, UID:', uid)

            return new Promise<void>((resolve) => {
                let resolved = false

                userDocUnsubscribe = onSnapshot(
                    doc(db, 'users', uid),
                    async (userDoc) => {
                        try {
                            if (userDoc.exists()) {
                                const userData = userDoc.data() as User
                                console.log('🔄 Kullanıcı verisi güncellendi (snapshot):', {
                                    id: userData.id,
                                    phone_number: userData.phone_number,
                                    firstName: userData.firstName,
                                    role: userData.role,
                                    membershipType: (userData as any).membershipType,
                                    groupAssignment: (userData as any).groupAssignment
                                })

                                if (userData.role === 'student' && userData.status === 'pending') {
                                    console.log('⚠️ Kullanıcı onay bekliyor, ancak sisteme girişine izin veriliyor (dashboard kilitli).', uid)
                                }

                                this.user = {
                                    ...userData,
                                    id: uid
                                }
                                this.isAuthenticated = true
                            } else {
                                console.error('❌ Firestore\'da kullanıcı verisi bulunamadı, UID:', uid)
                                const currentUser = auth.currentUser
                                if (currentUser && !resolved) {
                                    console.log('🔧 Temel kullanıcı profili oluşturuluyor...')
                                    const phoneFromEmail = currentUser.email?.replace('@tennis.local', '') || ''
                                    const basicUser: User = {
                                        id: uid,
                                        phone_number: phoneFromEmail,
                                        firstName: 'Kullanıcı',
                                        lastName: '',
                                        role: 'student',
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                    }

                                    await setDoc(doc(db, 'users', uid), basicUser)
                                    // setDoc sonrası snapshot tekrar tetiklenip this.user'ı güncelleyecek
                                    console.log('✅ Temel kullanıcı profili oluşturuldu')
                                } else if (!currentUser) {
                                    this.user = null
                                    this.isAuthenticated = false
                                }
                            }
                        } catch (error: any) {
                            console.error('❌ Kullanıcı snapshot işleme hatası:', error)
                            this.error = this.getErrorMessage(error)
                        } finally {
                            if (!resolved) {
                                resolved = true
                                resolve()
                            }
                        }
                    },
                    (error) => {
                        console.error('❌ Kullanıcı verisi dinleyici hatası:', error)
                        this.error = this.getErrorMessage(error)
                        this.user = null
                        this.isAuthenticated = false
                        if (!resolved) {
                            resolved = true
                            resolve()
                        }
                    }
                )
            })
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

                            pushNotificationService.registerDeviceToken(firebaseUser.uid).catch(() => {})
                        } catch (error) {
                            console.error('❌ Kullanıcı verisi yüklenemedi:', error)
                        }
                    } else {
                        console.log('👤 Kullanıcı oturumu kapalı')
                        stopUserDocListener()
                        if (this.user?.id) { pushNotificationService.unregisterDeviceToken(this.user.id).catch(() => {}) }
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
                    return 'Bu telefon numarasıyla kayıtlı kullanıcı bulunamadı'
                case 'auth/wrong-password':
                    return 'Yanlış şifre girdiniz'
                case 'auth/email-already-in-use':
                    return 'Bu telefon numarası zaten kullanımda'
                case 'auth/weak-password':
                    return 'Şifre çok zayıf. Daha güçlü bir şifre seçin'
                case 'auth/invalid-email':
                    return 'Geçersiz telefon numarası'
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
                case 'pending_approval':
                    return 'Hesabınız onay bekliyor. Yöneticinin hesabınızı onaylaması gerekmektedir.'
                default:
                    return error.message || 'Bilinmeyen bir hata oluştu'
            }
        },

        clearError() {
            this.error = null
        }
    }
})