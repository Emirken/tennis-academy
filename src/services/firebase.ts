import { initializeApp, FirebaseApp, getApps, deleteApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import {
    getFirestore,
    Firestore,
    connectFirestoreEmulator,
    enableNetwork,
    disableNetwork
} from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'

// Environment-based configuration
const firebaseConfig = {
    // Production config - Firebase projenizin gerçek config bilgilerini buraya ekleyin
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY || "AIzaSyCgAu7nHl0LribarO-SJymPqcKmiKUUnS0",
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || "urla-tenis.firebaseapp.com",
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || "urla-tenis",
    storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || "urla-tenis.firebasestorage.app",
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || "257632351926",
    appId: process.env.VUE_APP_FIREBASE_APP_ID || "1:257632351926:web:6143c39473447ba5865817",
    measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID || "G-YTV4VCJNCR"
}

// Development/Test config (isteğe bağlı)
const devConfig = {
    apiKey: "AIzaSyCgAu7nHl0LribarO-SJymPqcKmiKUUnS0",
    authDomain: "urla-tenis.firebaseapp.com",
    projectId: "urla-tenis",
    storageBucket: "urla-tenis.firebasestorage.app",
    messagingSenderId: "257632351926",
    appId: "1:257632351926:web:6143c39473447ba5865817"
}

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const useEmulators = process.env.VUE_APP_USE_FIREBASE_EMULATORS === 'true'

// Use appropriate config based on environment
const config = (isDevelopment && useEmulators) ? devConfig : firebaseConfig

// Firebase app initialization
let app: FirebaseApp

// Emulator connection tracking
let emulatorsConnected = false

// Initialize Firebase app (singleton pattern)
const initializeFirebase = (): FirebaseApp => {
    if (getApps().length === 0) {
        app = initializeApp(config)
        console.log('🔥 Firebase initialized successfully')

        if (isDevelopment) {
            console.log('🔧 Firebase running in development mode')
            if (useEmulators) {
                console.log('🧪 Firebase emulators will be used')
            }
        }
    } else {
        app = getApps()[0]
    }
    return app
}

// Initialize the app
app = initializeFirebase()

// Initialize services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const functions: Functions = getFunctions(app)

// Analytics (only in browser and if supported)
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
    isSupported().then(supported => {
        if (supported && !isDevelopment) {
            analytics = getAnalytics(app)
            console.log('📊 Firebase Analytics enabled')
        }
    }).catch(error => {
        console.warn('Firebase Analytics not supported:', error)
    })
}

export { analytics }

// Emulator setup for development
const connectToEmulators = () => {
    if (!useEmulators || isTest || emulatorsConnected) return

    try {
        // Auth Emulator
        if (typeof window !== 'undefined') {
            // Check if auth emulator is already connected by looking at config
            const authConfig = (auth as any).config
            if (!authConfig?.emulator?.url) {
                connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
                console.log('🔐 Connected to Auth Emulator')
            }
        }

        // Firestore Emulator
        try {
            connectFirestoreEmulator(db, 'localhost', 8080)
            console.log('📚 Connected to Firestore Emulator')
        } catch (error) {
            // Emulator might already be connected
            console.log('📚 Firestore Emulator connection skipped (already connected)')
        }

        // Storage Emulator
        try {
            connectStorageEmulator(storage, 'localhost', 9199)
            console.log('💾 Connected to Storage Emulator')
        } catch (error) {
            console.log('💾 Storage Emulator connection skipped (already connected)')
        }

        // Functions Emulator
        try {
            connectFunctionsEmulator(functions, 'localhost', 5001)
            console.log('⚡ Connected to Functions Emulator')
        } catch (error) {
            console.log('⚡ Functions Emulator connection skipped (already connected)')
        }

        emulatorsConnected = true

    } catch (error) {
        console.warn('Failed to connect to some emulators:', error)
    }
}

// Connect to emulators in development
if (isDevelopment && useEmulators) {
    connectToEmulators()
}

// Firebase configuration validation
const validateConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
    const missingFields = requiredFields.filter(field => {
        const value = config[field as keyof typeof config]
        return !value || value.toString().startsWith('your-')
    })

    if (missingFields.length > 0 && !isDevelopment) {
        console.error('❌ Firebase configuration missing required fields:', missingFields)
        throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`)
    }

    if (missingFields.length > 0 && isDevelopment) {
        console.warn('⚠️ Firebase configuration incomplete (development mode):', missingFields)
    }
}

// Validate configuration
validateConfig()

// Firebase connection test
export const testFirebaseConnection = async (): Promise<boolean> => {
    try {
        // Test Firestore connection using enableNetwork function
        await enableNetwork(db)
        console.log('✅ Firebase connection test passed')
        return true
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error)
        return false
    }
}

// Firebase performance monitoring setup
export const setupPerformanceMonitoring = async () => {
    if (isDevelopment || isTest || typeof window === 'undefined') return

    try {
        const { getPerformance } = await import('firebase/performance')
        const perf = getPerformance(app)
        console.log('⚡ Firebase Performance Monitoring enabled')
        return perf
    } catch (error) {
        console.warn('Performance monitoring not available:', error)
        return null
    }
}

// Cleanup function for testing
export const cleanupFirebase = async (): Promise<void> => {
    if (isTest && app) {
        try {
            // Disable network first
            await disableNetwork(db)
            // Delete the app
            await deleteApp(app)
            console.log('🧹 Firebase app cleaned up')
        } catch (error) {
            console.warn('Failed to cleanup Firebase app:', error)
        }
    }
}

// Firebase app health check
export const checkFirebaseHealth = async (): Promise<{
    auth: boolean
    firestore: boolean
    storage: boolean
    functions: boolean
    overall: boolean
}> => {
    const health = {
        auth: false,
        firestore: false,
        storage: false,
        functions: false,
        overall: false
    }

    try {
        // Test Auth
        health.auth = !!auth && !!auth.app

        // Test Firestore
        try {
            await enableNetwork(db)
            health.firestore = true
        } catch (error) {
            console.warn('Firestore health check failed:', error)
            health.firestore = false
        }

        // Test Storage
        health.storage = !!storage && !!storage.app

        // Test Functions
        health.functions = !!functions && !!functions.app

        health.overall = health.auth && health.firestore && health.storage && health.functions

    } catch (error) {
        console.error('Firebase health check failed:', error)
    }

    return health
}

// Firebase service status check
export const getServiceStatus = () => {
    return {
        auth: {
            initialized: !!auth,
            currentUser: auth?.currentUser !== undefined,
            emulator: useEmulators && isDevelopment
        },
        firestore: {
            initialized: !!db,
            emulator: useEmulators && isDevelopment
        },
        storage: {
            initialized: !!storage,
            emulator: useEmulators && isDevelopment
        },
        functions: {
            initialized: !!functions,
            emulator: useEmulators && isDevelopment
        },
        analytics: {
            initialized: !!analytics,
            enabled: !!analytics && !isDevelopment
        }
    }
}

// Graceful disconnect function
export const disconnectFirebase = async (): Promise<void> => {
    try {
        await disableNetwork(db)
        console.log('🔌 Firebase disconnected gracefully')
    } catch (error) {
        console.warn('Failed to disconnect Firebase gracefully:', error)
    }
}

// Reconnect function
export const reconnectFirebase = async (): Promise<void> => {
    try {
        await enableNetwork(db)
        console.log('🔌 Firebase reconnected successfully')
    } catch (error) {
        console.error('Failed to reconnect Firebase:', error)
        throw error
    }
}

// Network state management
export const enableFirebaseNetwork = async (): Promise<void> => {
    try {
        await enableNetwork(db)
    } catch (error) {
        console.error('Failed to enable Firebase network:', error)
        throw error
    }
}

export const disableFirebaseNetwork = async (): Promise<void> => {
    try {
        await disableNetwork(db)
    } catch (error) {
        console.error('Failed to disable Firebase network:', error)
        throw error
    }
}

// Export configuration info (without sensitive data)
export const getFirebaseInfo = () => ({
    projectId: config.projectId,
    authDomain: config.authDomain,
    environment: isDevelopment ? 'development' : 'production',
    emulators: useEmulators,
    hasAnalytics: !!analytics,
    services: getServiceStatus()
})

// Enhanced error handling wrapper
export const withFirebaseErrorHandling = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string
) => {
    return async (...args: T): Promise<R> => {
        try {
            return await fn(...args)
        } catch (error: any) {
            console.error(`Firebase error in ${context}:`, error)

            // Re-throw with additional context
            const enhancedError = new Error(`${context}: ${error.message}`)
            enhancedError.cause = error
            throw enhancedError
        }
    }
}

// Firebase initialization promise for components that need to wait
export const firebaseReady = Promise.resolve(app)

// Log Firebase initialization info
console.log('Firebase Info:', getFirebaseInfo())

// Default export
export default app

// Type exports for better TypeScript support
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions, Analytics }

// Additional utility types
export interface FirebaseConfig {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId?: string
}

export interface FirebaseHealth {
    auth: boolean
    firestore: boolean
    storage: boolean
    functions: boolean
    overall: boolean
}

export interface ServiceStatus {
    auth: {
        initialized: boolean
        currentUser: boolean
        emulator: boolean
    }
    firestore: {
        initialized: boolean
        emulator: boolean
    }
    storage: {
        initialized: boolean
        emulator: boolean
    }
    functions: {
        initialized: boolean
        emulator: boolean
    }
    analytics: {
        initialized: boolean
        enabled: boolean
    }
}